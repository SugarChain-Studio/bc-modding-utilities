import { Optional } from "../monadic";
import { DrawCharacterModifier } from "./drawOffset";
import { ChatRoomOrder } from "./roomOrder";

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
 * @template T
 * @param {"prev"| "next" |"center" | "unchanged"} base
 * @param { {X:number, Y:number, Zoom?:number} } [offset]
 * @returns {DrawModifierCallback<T>}
 */
function modifierBuilder(base, offset = { X: 0, Y: 0 }) {
    return (_, { sharedC, initState }) => {
        const zoom = offset.Zoom === undefined ? initState.Zoom : offset.Zoom;
        switch (base) {
            case "prev": {
                return {
                    X: sharedC.where.prev.X + offset.X * zoom,
                    Y: sharedC.where.prev.Y + offset.Y * zoom,
                    Zoom: zoom,
                };
            }
            case "next": {
                return {
                    X: sharedC.where.next.X + offset.X * zoom,
                    Y: sharedC.where.next.Y + offset.Y * zoom,
                    Zoom: zoom,
                };
            }
            case "center": {
                return {
                    X: sharedC.center.X + offset.X * zoom,
                    Y: sharedC.center.Y + offset.Y * zoom,
                    Zoom: zoom,
                };
            }
            case "unchanged": {
                return initState;
            }
        }
    };
}

/**
 * @typedef {Parameters<typeof modifierBuilder>} ModifierCallbackParam
 */

/**
 * @template T
 * @param {DrawModifierCallback<T> | ModifierCallbackParam} bePrev
 * @param {DrawModifierCallback<T> | ModifierCallbackParam} beNext
 * @returns {DrawModifierCallback<T>}
 */
const generalBranchF = (bePrev, beNext) => (state, ctx) => {
    const { sharedC, C } = ctx;
    if (sharedC.prev.MemberNumber === C.MemberNumber)
        return (
            typeof bePrev === "function" ? bePrev : modifierBuilder(...bePrev)
        )(state, ctx);
    else if (sharedC.next.MemberNumber === C.MemberNumber)
        return (
            typeof beNext === "function" ? beNext : modifierBuilder(...beNext)
        )(state, ctx);
};

/**
 * @param { Parameters<ChatRoomOrder["requirePairAssetState"]>[1] } items
 * @param { DrawModifierCallback<XCharaPairAssetState> | ModifierCallbackParam } bePrev
 * @param { DrawModifierCallback<XCharaPairAssetState> | ModifierCallbackParam } beNext
 * @returns {(sharedC:SharedCenterState, C: Character, arg: DrawOffsetParam) => DrawOffsetParam}
 */
const assetDrawMod = (items, bePrev, beNext) =>
    drawModBase(
        (sharedC) => ChatRoomOrder.requirePairAssetState(sharedC, items),
        generalBranchF(bePrev, beNext)
    );

/**
 * @param { DrawModifierCallback<XCharaPairTimerState> | ModifierCallbackParam } bePrev
 * @param { DrawModifierCallback<XCharaPairTimerState> | ModifierCallbackParam } beNext
 * @returns {(sharedC:SharedCenterState, C: Character, arg: DrawOffsetParam) => DrawOffsetParam}
 */
const timerDrawMod = (bePrev, beNext) =>
    drawModBase(
        (sharedC) => ChatRoomOrder.requirePairTimerState(sharedC),
        generalBranchF(bePrev, beNext)
    );

export const DrawMods = {
    asset: assetDrawMod,
    timer: timerDrawMod,
    builder: modifierBuilder,
};
