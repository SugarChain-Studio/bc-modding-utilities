import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { clearXDrawState, setXDrawState } from "./sync";
import { branchXCharacter, Pick, Test } from "./checks";

/**
 *
 * @param {XCharacter} C
 * @param {XCharacter[]} characters
 * @returns { { prev: XCharacter, next: XCharacter } | undefined }
 */
export function findDrawOrderPair(C, characters) {
    return branchXCharacter(
        C,
        (other, state) => {
            const otherC = characters.find((c) => c.MemberNumber === other);
            if (!Test.testDrawState(C, state)) {
                if (C.IsPlayer()) clearXDrawState();
                return undefined;
            }

            const otherNum = Pick.next(otherC);
            if (otherNum && otherNum !== C.MemberNumber) {
                return { prev: otherC, next: C };
            }
            return undefined;
        },
        (other, state) => {
            const otherC = characters.find((c) => c.MemberNumber === other);
            if (!Test.testDrawState(C, state)) {
                if (C.IsPlayer()) clearXDrawState();
                return undefined;
            }

            const otherNum = Pick.prev(otherC);
            if (otherNum && otherNum !== C.MemberNumber) {
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

    HookManager.patchFunction("ChatRoomCharacterViewDraw", {
        "ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, _space, roomZoom) => {":
            "ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, _space, roomZoom, cIdx) => {",
        "ChatRoomCharacterDrawlist[charIdx]": "ChatRoomCharacterDrawlist[cIdx]",
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
