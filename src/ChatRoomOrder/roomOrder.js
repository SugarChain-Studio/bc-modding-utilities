import { isAssetState, isTimerState } from "./checks";
import { clearXDrawState, setupSync, setXDrawState } from "./sync";
import {
    findDrawOrderPair,
    setupXCharacterDrawlist,
} from "./XCharacterDrawlist";

const setupKey = "MODChatRoomOrder";

class ChatRoomOrder_ {
    /**
     * 设置当前玩家的配对绘制状态
     * @param {XCharacterDrawOrderState} state
     */
    setDrawOrder(state) {
        setXDrawState(state);
    }

    /**
     * 清除当前玩家的配对绘制状态
     */
    clearDrawOrder() {
        clearXDrawState();
    }

    /**
     * 初始化配对绘制功能
     */
    setup() {
        if (globalThis[setupKey]) return;
        globalThis[setupKey] = ChatRoomOrder;
        setupXCharacterDrawlist();
        setupSync();
    }

    /**
     * 检查特定配对是否是物品模式
     * @param {XCharaPair} pair 人物配对
     * @param {{prev: string, next: string}[]} [assetList] 如果提供，则检查配对的物品是否在列表中
     * @return {XCharaPairAssetState | undefined} 返回人物的配对绘制状态，如果没有设置则返回 undefined
     */
    requirePairAssetState(pair, assetList) {
        const prevState = pair.prev.XCharacterDrawOrder;
        const nextState = pair.next.XCharacterDrawOrder;
        if (!isAssetState(prevState) || !isAssetState(nextState))
            return undefined;
        if (
            Array.isArray(assetList) &&
            !assetList.some(
                ({ prev, next }) =>
                    prev === prevState.associatedAsset.asset &&
                    next === nextState.associatedAsset.asset
            )
        ) {
            return undefined;
        }
        return { prev: prevState, next: nextState };
    }

    /**
     * @param {XCharaPair} pair
     * @return {XCharaPairTimerState | undefined} 返回人物的配对绘制状态，如果没有设置则返回 undefined
     */
    requirePairTimerState(pair) {
        const prev = pair.prev.XCharacterDrawOrder;
        const next = pair.next.XCharacterDrawOrder;
        if (!isTimerState(prev) || !isTimerState(next)) return undefined;
        return { prev, next };
    }

    /**
     * 如果两个人物被设置为配对绘制，返回两个人物和参考中心
     * @param {Character} C
     * @returns {{prev:XCharacter, next:XCharacter, center:{X:number,Y:number}, where:{prev:XCharacterDrawState, next:XCharacterDrawState}} | undefined} 如果没找到，返回undefined
     */
    requireSharedCenter(C) {
        const pair = findDrawOrderPair(C, ChatRoomCharacterDrawlist);
        if (
            !pair ||
            !pair.prev.XCharacterDrawOrder.drawState ||
            !pair.next.XCharacterDrawOrder.drawState
        )
            return undefined;
        const { prev, next } = {
            prev: pair.prev.XCharacterDrawOrder.drawState,
            next: pair.next.XCharacterDrawOrder.drawState,
        };

        const center = (() => {
            // 如果两个人物的Y坐标差距大于300，说明两个人物不在同一水平线上，直接使用第二个人物为基准位置
            if (Math.abs(prev.Y - next.Y) > 300)
                return { X: next.X, Y: next.Y };
            // 取两个人物的中心点
            return { X: (prev.X + next.X) / 2, Y: (prev.Y + next.Y) / 2 };
        })();

        return { ...pair, center, where: { prev, next } };
    }
}

export const ChatRoomOrder = new ChatRoomOrder_();
