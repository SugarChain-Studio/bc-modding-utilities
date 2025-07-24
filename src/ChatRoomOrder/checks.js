/**
 * 检查给定的角色是否是 XCharacter。
 * @param {Character | XCharacter} chara
 * @returns {chara is XCharacter}
 */
export function isXCharacter(chara) {
    const dobj = /** @type {any} */ (chara).XCharacterDrawOrder;
    return dobj != null && isDrawOrderState(dobj);
}

/**
 * 检查给定的状态是否是有效的 XCharacterDrawOrderState。
 * @param {any} state
 * @returns {state is XCharacterDrawOrderState}
 */
export function isDrawOrderState(state) {
    if (!state || typeof state !== "object") return false;

    const hasPrev = typeof state.prevCharacter === "number";
    const hasNext = typeof state.nextCharacter === "number";

    if (!hasPrev && !hasNext) return false;
    if (hasPrev && hasNext) return false;

    return isAssetState(state) || isPoseState(state) || isTimerState(state);
}

/**
 * @param {any} state
 * @return { XCharacterDrawOrderState | undefined }
 */
export function validDrawOrderState(state) {
    if (!isDrawOrderState(state)) return undefined;
    return /** @type {XCharacterDrawOrderState} */ (state);
}

/**
 * 检查给定的状态是否是 XCharacterDrawOrderWithAsset。
 * @param {XCharacterDrawOrderState} state
 * @returns {state is XCharacterDrawOrderAssetState}
 */
export function isAssetState(state) {
    const asset = /** @type {any} */ (state).associatedAsset;
    return (
        asset != null &&
        typeof asset === "object" &&
        typeof asset.group === "string" &&
        typeof asset.asset === "string"
    );
}

/**
 * 检查给定的状态是否是 XCharacterDrawOrderWithPose。
 * @param {XCharacterDrawOrderState} state
 * @returns {state is XCharacterDrawOrderPoseState}
 */
export function isPoseState(state) {
    const pose = /** @type {any} */ (state).associatedPose;
    return pose != null && typeof pose === "object" && Array.isArray(pose.pose);
}

/**
 * 检查给定的状态是否是 XCharacterDrawOrderWithTimer。
 * @param {XCharacterDrawOrderState} state
 * @returns {state is XCharacterDrawOrderTimerState}
 */
export function isTimerState(state) {
    return typeof (/** @type {any} */ (state).timer) === "number";
}

/**
 * 从角色中提取 XCharacterDrawOrderState 里面的 nextCharacter。
 * 会检查有效性，无效时返回 undefined。
 * @param {Character} c
 * @returns { number | undefined }
 */
export function pickCharacterNext(c) {
    const dobj = /** @type {any} */ (c)?.XCharacterDrawOrder;
    if (!isDrawOrderState(dobj) && typeof dobj.nextCharacter !== "number")
        return undefined;
    return dobj.nextCharacter;
}

/**
 * 从角色中提取 XCharacterDrawOrderState 里面的 prevCharacter。
 * 会检查有效性，无效时返回 undefined。
 * @param {Character} c
 * @returns { number | undefined }
 */
export function pickCharacterPrev(c) {
    const dobj = /** @type {any} */ (c)?.XCharacterDrawOrder;
    if (!isDrawOrderState(dobj) && typeof dobj.prevCharacter !== "number")
        return undefined;
    return dobj.prevCharacter;
}

export const Pick = {
    next: pickCharacterNext,
    prev: pickCharacterPrev,
};

/**
 * @template T
 * @typedef branchXCharacterCallback
 * @type {(other:number, myState: XCharacterDrawOrderState) => T}
 */

/**
 * 对于给定的角色，检查其 XCharacterDrawOrderState 中的 prevCharacter 或 nextCharacter。
 * 如果 prevCharacter 有效，则调用 onPrev 回调。
 * 如果 nextCharacter 有效，则调用 onNext 回调（如果提供，否则调用 onPrev）。
 * @template T
 * @param {Character} c
 * @param {branchXCharacterCallback<T>} onPrev
 * @param {branchXCharacterCallback<T>} [onNext]
 * @returns {T | undefined}
 */
export function branchXCharacter(c, onPrev, onNext) {
    const dobj = /** @type {any} */ (c)?.XCharacterDrawOrder;
    if (!dobj) return undefined;
    if (
        typeof dobj.prevCharacter === "number" &&
        dobj.prevCharacter !== c.MemberNumber
    ) {
        return onPrev(dobj.prevCharacter, dobj);
    } else if (
        typeof dobj.nextCharacter === "number" &&
        dobj.nextCharacter !== c.MemberNumber
    ) {
        return (onNext ?? onPrev)(dobj.nextCharacter, dobj);
    }
    return undefined;
}

export const Validations = {
    validDrawOrderState,
};

/**
 * 检查 XCharacterDrawOrderWithAsset 是否满足条件
 * @param {XCharacter} C
 * @param {XCharacterDrawOrderAssetState} state
 */
export function testAssetState(C, state) {
    return C.Appearance.some((item) => {
        return (
            item.Asset.Group.Name === state.associatedAsset.group &&
            item.Asset.Name === state.associatedAsset.asset
        );
    });
}

/**
 * 检查 XCharacterDrawOrderStateWithPose 是否满足条件
 * @param {XCharacter} C
 * @param {XCharacterDrawOrderPoseState} state
 */
export function testPoseState(C, state) {
    return C.ActivePose.some((pose) => {
        return state.associatedPose.pose.includes(pose);
    });
}

/**
 * 检查 XCharacterDrawOrderStateWithTimer 是否满足条件
 * @param {XCharacter} C
 * @param {XCharacterDrawOrderTimerState} state
 * returns {boolean}
 */
export function testTimerState(C, state) {
    if (typeof state.timer !== "number") return false;
    return state.timer <= Date.now();
}

/**
 * 检查 XCharacterDrawOrderState 是否满足条件
 * @param {XCharacter} C
 * @param {XCharacterDrawOrderState} state
 */
export function testDrawOrderState(C, state) {
    if (!validDrawOrderState(state)) return false;

    if (isAssetState(state)) {
        return testAssetState(C, state);
    } else if (isPoseState(state)) {
        return testPoseState(C, state);
    } else if (isTimerState(state)) {
        return testTimerState(C, state);
    }

    return false;
}

export const Test = {
    testAssetState,
    testPoseState,
    testTimerState,
    testDrawState: testDrawOrderState,
};
