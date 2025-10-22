import { Optional } from "@mod-utils/monadic";
import { Constants } from "./constants";
import { DialogTools } from "./dialogs";
import { StateTools } from "./state";

export { ImageMapTools } from "./imageMapTools";

/** @type {AssetGroupItemName[]} */
const ItemGroups = [
    "ItemFeet",
    "ItemLegs",
    "ItemVulva",
    "ItemVulvaPiercings",
    "ItemButt",
    "ItemPelvis",
    "ItemTorso",
    "ItemTorso2",
    "ItemNipples",
    "ItemNipplesPiercings",
    "ItemBreast",
    "ItemArms",
    "ItemHands",
    "ItemHandheld",
    "ItemNeck",
    "ItemNeckAccessories",
    "ItemNeckRestraints",
    "ItemMouth",
    "ItemMouth2",
    "ItemMouth3",
    "ItemHead",
    "ItemNose",
    "ItemHood",
    "ItemEars",
    "ItemMisc",
    "ItemDevices",
    "ItemAddon",
    "ItemBoots",
];

export { DialogTools };
export { StateTools };

export class Tools {
    /**
     * 查找角色
     * @template {string} K
     * @param {K} key
     * @param {number} memberNumber
     */
    static findCharacter(key, memberNumber) {
        const c = ChatRoomCharacter.find(
            (c) => c.MemberNumber === memberNumber
        );
        return new Optional(
            c,
            /** @type {{[k in K]: Character}}*/ ({ [key]: c })
        );
    }

    /**
     * 所有物品身体组
     * @param {AssetGroupItemName[]} excepts
     * @returns {AssetGroupItemName[]}
     */
    static AllItemGroups(excepts = []) {
        return ItemGroups.filter((name) => !excepts.includes(name));
    }

    /**
     * 绘制更新函数
     * @param {Character} C 角色
     * @param { any } data 绘制中的持久化数据
     * @param {number} [minFrameTime=30] 最小帧时间
     */
    static drawUpdate(C, data, minFrameTime = 30) {
        const fValue = () =>
            Math.max(
                minFrameTime,
                Player.GraphicsSettings.AnimationQuality * 0.6
            );
        const FrameTime = Player.GraphicsSettings ? fValue() : 30;

        const now = CommonTime();

        if (!data.FrameTimer) data.FrameTimer = now + FrameTime;
        if (data.FrameTimer < now) {
            data.FrameTimer = now + FrameTime;
            AnimationRequestRefreshRate(C, FrameTime);
            AnimationRequestDraw(C);
        }
    }

    /**
     * 支持文本标签，包括源角色、目标角色、目标角色（所有格）、物品名称
     * @returns {CommonChatTags[]}
     */
    static CommonChatTags() {
        return [...Constants.CommonChatTags];
    }

    /**
     * 构建TopLeft数据工具函数
     * @param {{ Top:number, Left:number }} basePos 基础位置
     * @param  {...[AssetPoseName, { Top?:number, Left?:number }]} args
     * @returns {Pick<AssetDefinition, "Left" | "Top">}
     */
    static topLeftBuilder(basePos, ...args) {
        const result = { Left: { "": basePos.Left }, Top: { "": basePos.Top } };
        for (const [pose, pos] of args) {
            if (pos.Left !== undefined) result.Left[pose] = pos.Left;
            if (pos.Top !== undefined) result.Top[pose] = pos.Top;
        }
        return result;
    }

    /**
     * 获取物品图片资源URL
     * @param {DynamicDrawingData<Record<string, unknown>>} drawData 绘制数据
     * @param {string} [OverrideName] 代替图层名，如果不提供则使用 drawData.L
     */
    static getAssetURL(drawData, OverrideName) {
        const { A, L, Pose, G, GroupName, LayerType } = drawData;

        const layer = A.Layer.find((l) => l.Name === L);

        let poseSegment = layer.PoseMapping[Pose];
        switch (poseSegment) {
            case PoseType.HIDE:
            case PoseType.DEFAULT:
            case undefined:
                poseSegment = "";
                break;
            default:
                poseSegment += "/";
                break;
        }

        const urlParts = [A.Name, G, LayerType, OverrideName ?? L].filter(
            (c) => c
        );

        return `Assets/${
            A.Group.Family
        }/${GroupName}/${poseSegment}${urlParts.join("_")}.png`;
    }

    /**
     *
     * @param {number} itemCount
     * @returns {ExtendedItemConfigDrawData<Partial<ElementMetaData.Modular>>}
     */
    static makeButtonGroup(itemCount) {
        const perPage = Math.min(itemCount, 18);
        return {
            elementData: Array.from({ length: itemCount }).map((_, idx) => {
                const idxOnPage = idx % perPage;
                return {
                    position: [
                        1135 + 250 * (idxOnPage % 3),
                        450 + 75 * Math.floor(idxOnPage / 3),
                    ],
                    drawImage: false,
                };
            }),
            itemsPerPage: perPage,
        };
    }
}
