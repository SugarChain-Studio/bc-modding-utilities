import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { clearXDrawState } from "./sync";
import { branchXCharacter, isXCharacter, Pick, Test } from "./checks";

/**
 *
 * @param {XCharacter} C
 * @param {XCharacter[]} characters
 * @returns { XCharaPair | undefined }
 */
export function findDrawOrderPair(C, characters) {
    return branchXCharacter(
        C,
        (other, state) => {
            if (!Test.testDrawState(C, state)) {
                if (C.IsPlayer()) clearXDrawState();
                return undefined;
            }

            const otherC = characters.find((c) => c.MemberNumber === other);
            if (!otherC) return undefined;
            const otherNum = Pick.next(otherC);
            if (otherNum) {
                return { prev: otherC, next: C };
            }
            return undefined;
        },
        (other, state) => {
            if (!Test.testDrawState(C, state)) {
                if (C.IsPlayer()) clearXDrawState();
                return undefined;
            }

            const otherC = characters.find((c) => c.MemberNumber === other);
            if (!otherC) return undefined;
            const otherNum = Pick.prev(otherC);
            if (otherNum) {
                return { prev: C, next: otherC };
            }
            return undefined;
        }
    );
}

export function setupXCharacterDrawlist() {
    HookManager.hookFunction("ChatRoomUpdateDisplay", 10, (args, next) => {
        if (!ChatRoomCharacterViewIsActive()) {
            return next(args);
        } else {
            const oldL = ChatRoomCharacter;

            /** @type {(Character)[]} */
            const newL = [];

            // push all characters with nextCharacter to the end of the list
            const cCopy = [...ChatRoomCharacter];

            /** @type {Set<number>} */
            const pairedSet = new Set();

            while (cCopy.length > 0) {
                const chara = cCopy.shift();
                const result = findDrawOrderPair(chara, cCopy);

                if (!result) {
                    newL.push(chara);
                } else if (result.prev.MemberNumber === chara.MemberNumber) {
                    cCopy.push(chara);
                } else if (result.next.MemberNumber === chara.MemberNumber) {
                    newL.push(result.prev, result.next);
                    cCopy.splice(
                        cCopy.findIndex(
                            (c) => c.MemberNumber === result.next.MemberNumber
                        ),
                        1
                    );
                    pairedSet.add(result.prev.MemberNumber);
                    pairedSet.add(result.next.MemberNumber);
                }
            }

            if (newL.length > 10) {
                // a pair of characters is located at page split (e.g. 9 and 10)
                if (
                    pairedSet.has(newL[9].MemberNumber) &&
                    pairedSet.has(newL[10].MemberNumber) &&
                    Pick.prev(newL[10]) === newL[9].MemberNumber
                ) {
                    // there are a odd number of characters before 9th(0-based) character,
                    // so there must be a non-paired character before 9th character
                    // move the last non-paired character to the 10th position
                    for (let i = 9; i >= 0; i--) {
                        if (!pairedSet.has(newL[i].MemberNumber)) {
                            const [single] = newL.splice(i, 1);
                            newL.splice(9, 0, single);
                            break;
                        }
                    }
                }
            }

            ChatRoomCharacter = newL;

            next(args);

            // for focus mode or low vision
            if (
                ChatRoomCharacterDrawlist.length < 5 &&
                ChatRoomCharacter.length !== ChatRoomCharacterDrawlist.length
            ) {
                /** @type {Set<number>} */
                const characters = new Set(
                    ChatRoomCharacterDrawlist.map((c) => c.MemberNumber)
                );

                for (const C of ChatRoomCharacterDrawlist) {
                    if (!pairedSet.has(C.MemberNumber)) {
                        continue;
                    }

                    const other = Pick.other(C);
                    if (other) characters.add(other);
                }

                ChatRoomCharacterDrawlist = ChatRoomCharacter.filter((c) =>
                    characters.has(c.MemberNumber)
                );
            }

            ChatRoomCharacter = oldL;
        }
    });

    HookManager.progressiveHook("PreferenceArousalAtLeast")
        .inside("ChatRoomCharacterViewClickCharacter")
        .override((args, next) => {
            if (isXCharacter(args[0])) return false;
            return next(args);
        });

    const func = HookManager.randomGlobalFunction(
        "CheckXLine",
        /** @type {(characters: Character[], charsPerRow: number) => boolean} */
        (characters, charsPerRow) => {
            if (characters.length <= charsPerRow) return false;

            const l1Char = characters[charsPerRow - 1];
            const l2Char = characters[charsPerRow];

            const result = findDrawOrderPair(l1Char, characters);
            if (!result) return false;

            return (
                result.prev.MemberNumber === l1Char.MemberNumber &&
                result.next.MemberNumber === l2Char.MemberNumber
            );
        }
    );

    const func2 = HookManager.randomGlobalFunction(
        "CheckX",
        /** @type {(xlineFlag: boolean, charsPerRow: number, charIdx: number) => [boolean, number]} */
        (xlineFlag, charsPerRow, charIdx) => {
            if (!xlineFlag) return [charIdx % charsPerRow === 0, charIdx];
            else {
                if (charIdx === 0) return [true, 0];
                if (charIdx === charsPerRow - 1) return [true, charsPerRow];
                return [false, charIdx];
            }
        }
    );

    HookManager.patchFunction("ChatRoomCharacterViewDraw", {
        "ChatRoomCharacterViewLoopCharacters(": `const xlineFlag = ${func}(ChatRoomCharacterDrawlist, charsPerRow); ChatRoomCharacterViewLoopCharacters(`,
        "if (charIdx % charsPerRow === 0) {": `const [pflag, pidx] = ${func2}(xlineFlag, charsPerRow, charIdx); if (pflag) {`,
        "RectMakeRect(0, Y + charIdx * 100, viewWidth, viewHeight * roomZoom);":
            "RectMakeRect(0, Y + pidx * 100, viewWidth, viewHeight * roomZoom);",
    });

    Object.assign(ChatRoomViews.Character, {
        Draw: ChatRoomCharacterViewDraw,
        Click: ChatRoomCharacterViewClick,
    });

    HookManager.progressiveHook("DrawCharacter", 100)
        .inside("ChatRoomCharacterViewLoopCharacters")
        .inject((args) => {
            const [C, X, Y, Zoom] = args;

            const pl = /** @type {XCharacter} */ (C);
            if (!pl || !pl.XCharacterDrawOrder) return;
            pl.XCharacterDrawOrder.drawState = { X, Y, Zoom };
        });
}
