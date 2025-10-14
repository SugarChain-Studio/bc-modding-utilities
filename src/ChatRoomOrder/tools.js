import { ChatRoomOrder } from "./roomOrder";
import { Pick } from "./checks";
import { Tools } from "../Tools";

class _ChatRoomOrderTools {
    /**
     * 穿戴物品并设置配对关系
     * @param {PlayerCharacter} player
     * @param {Asset} asset
     * @param {PrevOrNextXCharacter} pair
     * @param {XCharacterDrawOrderBase["leash"]} [leash] 如果提供，则设置牵引状态
     */
    wearAndPair(player, asset, pair, leash) {
        if (
            !player.Appearance.some(
                (i) =>
                    i.Asset.Group.Name === asset.Group.Name &&
                    i.Asset.Name === asset.Name
            )
        ) {
            InventoryWear(player, asset.Name, asset.Group.Name);
            ChatRoomCharacterItemUpdate(player, asset.Group.Name);
        }
        ChatRoomOrder.setDrawOrder({
            ...pair,
            associatedAsset: {
                group: /** @type {AssetGroupItemName}*/ (asset.Group.Name),
                asset: asset.Name,
            },
            leash,
        });
    }

    /**
     * 牵引目标
     * @param {Character} target
     */
    leashTarget(target) {
        const prevOther = Pick.other(Player);
        if (prevOther)
            ChatRoomLeashList = ChatRoomLeashList.filter(
                (id) => id !== prevOther
            );

        if (!ChatRoomLeashList.some((id) => id === target.MemberNumber)) {
            ChatRoomLeashList.push(target.MemberNumber);
        }
    }

    /**
     * 牵引玩家
     * @param {Character} from
     * @param {false} [refresh] 有的时候并不是可牵物品，避免refresh
     */
    leashPlayer(from, refresh) {
        ChatRoomLeashPlayer = from.MemberNumber;
        if (refresh !== false) CharacterRefreshLeash(Player);
    }
}

export const ChatRoomOrderTools = new _ChatRoomOrderTools();
