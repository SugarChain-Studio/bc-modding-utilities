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
     * 调整TopLeft数据工具函数，注意这个函数不会修改原始数据
     * @param {TopLeft.Data} data 原始数据
     * @param {number | Partial<Record<AssetPoseName | PoseTypeDefault, number>>} diff 偏差值
     * @returns {TopLeft.Data} 调整后的数据
     */
    static topLeftAdjust(data, diff) {
        if (typeof diff === "number") {
            return /** @type {TopLeft.Data}*/ (
                Object.fromEntries(
                    Object.entries(data).map(([key, value]) => [
                        key,
                        value + diff,
                    ])
                )
            );
        } else {
            return /** @type {TopLeft.Data}*/ (
                Object.fromEntries(
                    Object.entries(data).map(([key, value]) => [
                        key,
                        value + (diff[key] ?? 0),
                    ])
                )
            );
        }
    }

    /**
     * 覆写TopLeft数据工具函数，注意这个函数不会修改原始数据
     * @param {TopLeft.Data} data 原始数据
     * @param {number | Partial<Record<AssetPoseName | PoseTypeDefault, number>>} over 覆盖值
     * @returns {TopLeft.Data} 覆盖后的数据
     */
    static topLeftOverride(data, over) {
        if (typeof over === "number") {
            return /** @type {TopLeft.Data}*/ (
                Object.fromEntries(
                    Object.entries(data).map(([key, _]) => [key, over])
                )
            );
        } else {
            return /** @type {TopLeft.Data}*/ (
                Object.fromEntries(
                    Object.entries(data).map(([key, value]) => [
                        key,
                        over[key] ?? value,
                    ])
                )
            );
        }
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

/**
 * 姿势映射工具类
 */
export class PoseMapTools {
    /**
     * 合成姿势映射，基础数据是所有姿势都隐藏。根据参数补充显示的姿势。
     *
     * @example
     * // 合成一个姿势映射，在Yoked姿势显示默认图片，在BackBoxTie姿势显示BackBoxTie目录下的图片，其他姿势都隐藏
     * const poseMapping = PoseMapTools.Compose({
     *     "Yoked": "",
     *     "BackBoxTie": "BackBoxTie"
     * });
     *
     * @param {AssetPoseMapping} posem 用于合成的姿势映射
     * @returns {AssetPoseMapping}
     */
    static FromHide(posem) {
        return { ...Constants.PoseHideAll, ...posem };
    }

    /**
     * 合成姿势映射，基础数据是所有上半身姿势都隐藏。根据参数补充显示的姿势。
     *
     * @param {AssetPoseMapping} posem 用于合成的姿势映射
     * @returns {AssetPoseMapping}
     */
    static FromTopHide(posem) {
        return { ...Constants.PoseHideTop, ...posem };
    }

    /**
     * 合成姿势映射，基础数据是所有下半身姿势都隐藏。根据参数补充显示的姿势。
     *
     * @param {AssetPoseMapping} posem 用于合成的姿势映射
     * @returns {AssetPoseMapping}
     */
    static FromBottomHide(posem) {
        return { ...Constants.PoseHideBottom, ...posem };
    }

    /**
     * 合成姿势映射，隐藏AllFours和Hogtied
     *
     * @example
     * // 如同 const poseMapping = { AllFours: "Hide", Hogtied: "Hide" }
     * const poseMapping = PoseMapTools.HideFullBody();
     *
     * // 如同 const poseMapping = { Yoked: "Hide", AllFours: "Hide", Hogtied: "Hide" }
     * const poseMapping = PoseMapTools.HideFullBody({Yoked: "Hide"});
     *
     * @param {AssetPoseMapping} [posem] 用于合成的姿势映射
     * @returns {AssetPoseMapping}
     */
    static HideFullBody(posem) {
        return { AllFours: "Hide", Hogtied: "Hide", ...posem };
    }
}
