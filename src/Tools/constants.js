export const Constants = {
    /**
     * 常用文本标签，包括源角色、目标角色、目标角色（所有格）、物品名称
     * @type {Readonly<CommonChatTags[]>}
     */
    CommonChatTags: [
        CommonChatTags.SOURCE_CHAR,
        CommonChatTags.TARGET_CHAR,
        CommonChatTags.DEST_CHAR,
        CommonChatTags.ASSET_NAME,
    ],

    /**
     * 隐藏所有物品的 PoseMapping
     * @type {Readonly<AssetPoseMapping>}
     */
    PoseHideAll: {
        // "BaseUpper" | "BackBoxTie" | "BackCuffs" | "BackElbowTouch" | "OverTheHead" | "Yoked" | "TapedHands"
        BaseUpper: PoseType.HIDE,
        BackBoxTie: PoseType.HIDE,
        BackCuffs: PoseType.HIDE,
        BackElbowTouch: PoseType.HIDE,
        OverTheHead: PoseType.HIDE,
        Yoked: PoseType.HIDE,

        // "BaseLower" | "Kneel" | "KneelingSpread" | "LegsClosed" | "LegsOpen" | "Spread"
        BaseLower: PoseType.HIDE,
        Kneel: PoseType.HIDE,
        KneelingSpread: PoseType.HIDE,
        LegsClosed: PoseType.HIDE,
        LegsOpen: PoseType.HIDE,
        Spread: PoseType.HIDE,

        // "Hogtied" | "AllFours" | "Suspension"
        Hogtied: PoseType.HIDE,
        AllFours: PoseType.HIDE,
    },
};
