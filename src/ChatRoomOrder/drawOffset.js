import { HookManager } from "@sugarch/bc-mod-hook-manager";

/**
 * @typedef { Object } DrawOffsetParam
 * @property { number } X
 * @property { number } Y
 * @property { number } Zoom
 */

/**
 * @typedef { (C:Character, from:DrawOffsetParam)=> DrawOffsetParam | void } DrawOffsetFunction
 */

const DrawOffsetInstanceName = "ECHODrawOffsetInstance";

/** @type {DrawOffsetFunction[]} */
const modifiers = [];

export class DrawCharacterModifier {
    static init() {
        if (globalThis[DrawOffsetInstanceName]) return;
        globalThis[DrawOffsetInstanceName] = DrawCharacterModifier;

        HookManager.progressiveHook("DrawCharacter", 1)
            .inside("ChatRoomCharacterViewLoopCharacters")
            .inject((args) => {
                const [C, X, Y, Zoom] = args;
                let result = { X, Y, Zoom };
                for (const modifier of modifiers) {
                    const tresult = modifier(C, result);
                    if (tresult) result = tresult;
                }

                args[1] = result.X;
                args[2] = result.Y;
                args[3] = result.Zoom;
            });
    }

    /**
     * @param {DrawOffsetFunction} modifier
     */
    static addModifier(modifier) {
        this.init();
        modifiers.push(modifier);
    }
}
