/** @param {AssetPoseMapping} poseMapping */
function poseMappingSegments(poseMapping) {
    return PoseFemale3DCG.reduce(
        (acc, cur) => {
            const map = poseMapping[cur.Name];
            if (map && map !== "Hide") {
                const s = `${map}/`;
                if (!acc.includes(s)) acc.push(s);
            }
            return acc;
        },
        [""]
    );
}

/**
 * @typedef {"Small" | "Normal" | "Large" | "XLarge"} BodyTypes
 * @typedef {"FlatSmall" | "FlatMedium"| "Small" | "Normal" | "Large" | "XLarge"} FullBodyTypes
 */

/**
 * @param {string} layerTypes
 * @param {ExtendedItemConfig<TypedItemOption>} config
 * @returns {string[]}
 */
function layerTypesSegs(layerTypes, config) {
    if (config.Archetype === "modular") {
        return /** @type {ModularItemConfig} */ (
            /** @type {any}*/ (config)
        ).Modules.filter((m) => layerTypes === m.Key).flatMap((m) =>
            m.Options.map((_, i) => `${m.Key}${i}`)
        );
    } else if (config.Archetype === "typed" && layerTypes === "typed") {
        return /** @type {TypedItemConfig} */ (config).Options.map(
            (_, i) => `typed${i}`
        );
    }
    return [];
}

export class ImageMapTools {
    /**
     * @param {CustomGroupName} group
     * @param {string} layerName
     * @returns {string}
     */
    static assetLayer(group, layerName) {
        return `Assets/Female3DCG/${group}/${layerName}.png`;
    }

    /**
     * @param {CustomGroupName} group
     * @param {string} assetName
     * @returns {string}
     */
    static assetPreview(group, assetName) {
        return `Assets/Female3DCG/${group}/Preview/${assetName}.png`;
    }

    /**
     * @param {CustomGroupName} group
     * @param {string} assetName
     * @param {string} optionName
     * @returns {string}
     */
    static assetOption(group, assetName, optionName) {
        return `Screens/Inventory/${group}/${assetName}/${optionName}.png`;
    }

    /**
     * 产生一个可以用于ImageMapping的映射对象，用于将某个BodyType的图片映射到其他的BodyType
     * @param {CustomGroupName| CustomGroupName[]} group 物品所在的组
     * @param {CustomAssetDefinition} asset 物品定义
     * @param {BodyTypes} from 映射的来源类型
     * @param {FullBodyTypes[]} to 映射的目标类型
     * @param {ExtendedItemConfig<TypedItemOption>} [config] 如果包含CreateLayerTypes字段，则需要此参数来获取类型，只支持CreateLayerTypes长度为1的情况
     * @returns { Record<string,string> } 映射对象
     */
    static mirrorBodyTypeLayer(group, asset, from, to, config) {
        const ret = /** @type {Record<string,string>} */ ({});
        for (const layer of asset.Layer ?? []) {
            const parent = layer.ParentGroup || asset.ParentGroup;
            if (parent !== "BodyUpper" && parent !== "BodyLower") continue;

            const poseMapping = layer.InheritPoseMappingFields
                ? { ...asset.PoseMapping, ...(layer.PoseMapping ?? {}) }
                : layer.PoseMapping ?? asset.PoseMapping;

            const poseSegs = poseMappingSegments(poseMapping);

            const layerTypeSegs =
                layer.CreateLayerTypes && config
                    ? layerTypesSegs(layer.CreateLayerTypes[0], config)
                    : [];
            if (layerTypeSegs.length === 0) layerTypeSegs.push("");

            const path = (g, poseSeg, file, layerType) =>
                `Assets/Female3DCG/${g}/${poseSeg}${[
                    asset.Name,
                    file,
                    layerType,
                    layer.Name,
                ]
                    .filter(Boolean)
                    .join("_")}.png`;

            const groups = Array.isArray(group) ? group : [group];

            for (const g of groups) {
                for (const poseSeg of poseSegs) {
                    for (const toType of to) {
                        for (const layerType of layerTypeSegs) {
                            ret[path(g, poseSeg, toType, layerType)] = path(
                                g,
                                poseSeg,
                                from,
                                layerType
                            );
                        }
                    }
                }
            }
        }

        return ret;
    }
}
