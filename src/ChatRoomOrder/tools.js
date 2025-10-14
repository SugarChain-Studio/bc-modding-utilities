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

    /**
     * 生成一个跟随与引导的活动执行函数
     * @param {[AssetGroupItemName, string]} followItem
     * @param {[AssetGroupItemName, string]} leadItem
     * @param {"prev"|"next"} leadMode
     * @returns {CustomActivity["run"]}
     */
    createFollowLeadRunner(followItem, leadItem, leadMode) {
        const follow = (C) =>
            /** @type {PrevOrNextXCharacter}*/ ({
                [leadMode === "next" ? "prevCharacter" : "nextCharacter"]:
                    C.MemberNumber,
            });
        const lead = (C) =>
            /** @type {PrevOrNextXCharacter}*/ ({
                [leadMode === "next" ? "nextCharacter" : "prevCharacter"]:
                    C.MemberNumber,
            });

        return (player, sender, { SourceCharacter, TargetCharacter }) => {
            if (TargetCharacter === player.MemberNumber) {
                if (!ServerChatRoomGetAllowItem(sender, player)) return;
                Tools.findCharacter("SourceC", SourceCharacter)
                    .then(() =>
                        AssetGet("Female3DCG", followItem[0], followItem[1])
                    )
                    .then((asset, { SourceC }) =>
                        this.wearAndPair(
                            player,
                            asset,
                            follow(SourceC),
                            "follow"
                        )
                    );
            } else if (SourceCharacter === player.MemberNumber) {
                Tools.findCharacter("TargetC", TargetCharacter)
                    .then(() =>
                        AssetGet("Female3DCG", leadItem[0], leadItem[1])
                    )
                    .then((asset, { TargetC }) =>
                        this.wearAndPair(player, asset, lead(TargetC), "lead")
                    );
            }
        };
    }
}

export const ChatRoomOrderTools = new _ChatRoomOrderTools();
