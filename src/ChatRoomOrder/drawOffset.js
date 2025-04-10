import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { globalPipeline } from "@sugarch/bc-mod-utility";

/**
 * @typedef { Object } DrawOffsetParam
 * @property { number } X
 * @property { number } Y
 * @property { number } Zoom
 */

/**
 * @typedef { (C:Character, from:DrawOffsetParam)=> DrawOffsetParam } DrawOffsetPipelineFunction
 */

const DrawOffsetInstanceName = "Luzi_DrawOffsetInstance";

/** @type {DrawOffsetPipelineFunction} */
const defaultFunc = (_, from) => from;

/**
 * @typedef { (C:Character, from:DrawOffsetParam)=> DrawOffsetParam | void} DrawOffsetFunction
 */

const modifierPipeline = globalPipeline(DrawOffsetInstanceName, defaultFunc, (pipeline) => {
    HookManager.progressiveHook("DrawCharacter", 1)
        .inside("ChatRoomCharacterViewLoopCharacters")
        .inject((args) => {
            const [C, X, Y, Zoom] = args;
            const result = pipeline.run(C, { X, Y, Zoom });
            args[1] = result.X;
            args[2] = result.Y;
            args[3] = result.Zoom;
        });
});

export const DrawCharacterModifier = {
    /**
     * @param {DrawOffsetFunction} modifier
     */
    addModifier(modifier) {
        modifierPipeline.register((acc, C, _) => {
            const result = modifier(C, acc);
            if (result) {
                return result;
            }
            return acc;
        });
    },
};
