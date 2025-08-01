import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { globalPipeline } from "@sugarch/bc-mod-utility";

const DrawOffsetInstanceName = "Luzi_DrawOffsetInstance";

/** @type {DrawOffsetPipelineFunction} */
const defaultFunc = (_, from) => from;

const modifierPipeline = globalPipeline(
    DrawOffsetInstanceName,
    defaultFunc,
    (pipeline) => {
        HookManager.progressiveHook("DrawCharacter", 1)
            .inside("ChatRoomCharacterViewLoopCharacters")
            .inject((args) => {
                const [C, X, Y, Zoom] = args;
                const result = pipeline.run(C, { X, Y, Zoom });
                args[1] = result.X;
                args[2] = result.Y;
                args[3] = result.Zoom;
            });
    }
);

/**
 * @template R
 */
class ModifiersWithPrereq {
    /**
     * @typedef { (prereq: R, ...args:Parameters<DrawOffsetFunction>)=> ReturnType<DrawOffsetFunction>} DrawOffsetPrereqFunction
     */

    /**
     * @param {(...args:Parameters<DrawOffsetFunction>)=> R | undefined} prereq
     */
    constructor(prereq) {
        this.prereq = prereq;

        /** @type {DrawOffsetPrereqFunction[]} */
        this.modifiers = [];

        modifierPipeline.register((acc, C, initState) => {
            const check = this.prereq(C, initState);
            if (!check) return acc;

            this.modifiers.reduce((pv, modifier) => {
                const result = modifier(check, C, pv);
                if (result) {
                    return result;
                }
                return pv;
            }, acc);
        });
    }

    /**
     * @param {DrawOffsetPrereqFunction} modifier
     */
    addModifier(modifier) {
        this.modifiers.push(modifier);
    }
}

/**
 * @template R
 * @param {(...args:Parameters<DrawOffsetFunction>)=> R | undefined} prereq
 */
function createPrereq(prereq) {
    return new ModifiersWithPrereq(prereq);
}

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

    createPrereq,
};
