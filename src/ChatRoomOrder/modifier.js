import { Optional } from "../monadic";
import { DrawCharacterModifier } from "./drawOffset";
import { ChatRoomOrder } from "./roomOrder";

/**
 * @typedef {ReturnType<ChatRoomOrder["requireSharedCenter"]>} SharedCenterState
 */

/**
 * @typedef {Object} CtxDrawMods
 * @property {SharedCenterState} sharedC
 * @property {DrawOffsetParam} initState
 * @property {Character} C
 */

export const SharedCenterModifier = DrawCharacterModifier.createPrereq((C) =>
    ChatRoomOrder.requireSharedCenter(C)
);

/**
 * @template R
 * @param {(sharedC: SharedCenterState) => R | undefined} requireState
 * @param {(arg0: R, arg1: CtxDrawMods)=> DrawOffsetParam | undefined} call
 * @returns {(sharedC:SharedCenterState, C: Character, arg: DrawOffsetParam) => DrawOffsetParam}
 */
const drawModBase = (requireState, call) => (sharedC, C, initState) =>
    new Optional(sharedC, { initState, C, sharedC })
        .then(requireState)
        .then(call)
        .valueOr(() => initState);

/**
 * @param {(arg0: XCharaPairTimerState, arg1: CtxDrawMods)=> DrawOffsetParam | undefined} call
 * @returns {(sharedC:SharedCenterState, C: Character, arg: DrawOffsetParam) => DrawOffsetParam}
 */
const timerDrawModFunction = (call) =>
    drawModBase(
        (sharedC) => ChatRoomOrder.requirePairTimerState(sharedC),
        call
    );

/**
 * @param {(arg0: XCharaPairAssetState, arg1: CtxDrawMods)=> DrawOffsetParam | undefined} call
 * @param { Parameters<ChatRoomOrder["requirePairAssetState"]>[1] } items
 * @returns {(sharedC:SharedCenterState, C: Character, arg: DrawOffsetParam) => DrawOffsetParam}
 */
const assetDrawModFunction = (items, call) =>
    drawModBase(
        (sharedC) => ChatRoomOrder.requirePairAssetState(sharedC, items),
        call
    );

export const DrawMods = {
    asset: assetDrawModFunction,
    timer: timerDrawModFunction,
};
