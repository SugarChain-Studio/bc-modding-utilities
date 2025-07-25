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

export class XCharacterDrawlist {
    /**
     *
     * @param {XCharacter[]} drawlist
     * @returns
     */
    constructor(drawlist) {
        /** @type {number[]} */
        this.nList = [];

        if (!Array.isArray(drawlist)) return;

        const mMap = new Map(
            Array.from(drawlist, (c, idx) => [c.MemberNumber, idx])
        );

        let cList = Array.from(drawlist, (_, idx) => idx);
        /** @type {number[]} */
        const pList = [];
        while (cList.length > 0) {
            const cIdx = cList.shift();
            const c = drawlist[cIdx];
            const result = findDrawOrderPair(c, drawlist);
            if (result) {
                const idxes = Object.values(result).map((c) =>
                    mMap.get(c.MemberNumber)
                );
                pList.push(...idxes);
                cList = cList.filter((idx) => !idxes.includes(idx));
                continue;
            }
            pList.push(cIdx);
        }

        this.nList = pList;

        this.cur = 0;
    }

    next() {
        const ret = this.nList[this.cur];
        this.cur = (this.cur + 1) % this.nList.length;
        return ret;
    }

    get length() {
        return this.nList.length;
    }
}

export function setupXCharacterDrawlist() {
    HookManager.hookFunction("ChatRoomUpdateDisplay", 10, (args, next) => {
        next(args);

        /** @type {Set<number>} */
        const characters = new Set(
            ChatRoomCharacterDrawlist.map((c) => c.MemberNumber)
        );

        for (const C of ChatRoomCharacterDrawlist) {
            if (isXCharacter(C)) {
                const pair = findDrawOrderPair(C, ChatRoomCharacter);
                if (pair) {
                    characters.add(pair.prev.MemberNumber);
                    characters.add(pair.next.MemberNumber);
                }
            }
        }

        ChatRoomCharacterDrawlist = ChatRoomCharacter.filter((c) =>
            characters.has(c.MemberNumber)
        );
    });

    HookManager.progressiveHook("PreferenceArousalAtLeast")
        .inside("ChatRoomCharacterViewClickCharacter")
        .override((args, next) => {
            if (isXCharacter(args[0])) return false;
            return next(args);
        });

    const func = HookManager.randomGlobalFunction(
        "CreateX",
        () => new XCharacterDrawlist(ChatRoomCharacterDrawlist)
    );

    HookManager.patchFunction("ChatRoomCharacterViewLoopCharacters", {
        "for (let C = 0; C < ChatRoomCharacterDrawlist.length; C++) {": `const XDraws = ${func}(); for (let C = 0; C < ChatRoomCharacterDrawlist.length; C++) { const CN = XDraws.next();`,
        "!ChatRoomCharacterDrawlist[C].IsPlayer()":
            "!ChatRoomCharacterDrawlist[CN].IsPlayer()",
        "const res = callback(C, CharX, CharY, Space, Zoom);":
            "const res = callback(C, CharX, CharY, Space, Zoom, CN);",
    });

    const func2 = HookManager.randomGlobalFunction(
        "CheckX",
        (characters, charsPerRow, drawIdx, idx) => {
            if (drawIdx === 0) return [true, 0];

            if (drawIdx === charsPerRow - 1) {
                return [
                    /** @type {any} */ (characters[idx])?.XCharacterDrawOrder
                        ?.nextCharacter !== undefined,
                    drawIdx + 1,
                ];
            }

            if (drawIdx === charsPerRow) {
                return [
                    /** @type {any} */ (characters[idx])?.XCharacterDrawOrder
                        ?.prevCharacter === undefined,
                    drawIdx,
                ];
            }

            return [false, drawIdx];
        }
    );

    HookManager.patchFunction("ChatRoomCharacterViewDraw", {
        "ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, _space, roomZoom) => {":
            "ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, _space, roomZoom, cIdx) => {",
        "ChatRoomCharacterDrawlist[charIdx]": "ChatRoomCharacterDrawlist[cIdx]",
        "if (charIdx % charsPerRow === 0) {": `const [pflag, pidx] = ${func2}(ChatRoomCharacterDrawlist, charsPerRow, charIdx, cIdx); if (pflag) {`,
        "RectMakeRect(0, Y + charIdx * 100, viewWidth, viewHeight * roomZoom);":
            "RectMakeRect(0, Y + pidx * 100, viewWidth, viewHeight * roomZoom);",
    });

    HookManager.patchFunction("ChatRoomCharacterViewClick", {
        "ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, space, zoom) => {":
            "ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, space, zoom, cIdx) => {",
        "ChatRoomCharacterDrawlist[charIdx]": "ChatRoomCharacterDrawlist[cIdx]",
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
