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
 * @param {CustomAssetDefinition["Layer"][0]} layer
 * @param {ExtendedItemConfig<TypedItemOption> | undefined} config
 * @returns {string[]}
 */
function layerTypesSegs(layer, config) {
    const layerType = layer.CreateLayerTypes?.[0];
    if (!layerType) return [];
    const allowed = layer.AllowTypes;

    if (allowed) {
        const segs = new Set();
        (Array.isArray(allowed) ? allowed : [allowed])
            .map((at) => at[layerType])
            .filter(Boolean)
            .forEach((v) => {
                if (typeof v === "number") {
                    segs.add(v);
                } else if (Array.isArray(v)) {
                    v.forEach((vv) => segs.add(vv));
                }
            });
        return Array.from(segs, (v) => `${layerType}${v}`);
    } else if (config) {
        if (config.Archetype === "modular") {
            return /** @type {ModularItemConfig} */ (
                /** @type {any}*/ (config)
            ).Modules.filter((m) => layerType === m.Key).flatMap((m) =>
                m.Options.map((_, i) => `${m.Key}${i}`)
            );
        } else if (config.Archetype === "typed" && layerType === "typed") {
            return /** @type {TypedItemConfig} */ (config).Options.map(
                (_, i) => `typed${i}`
            );
        }
    }
    return [];
}

/**
 * @typedef {["Preview", CustomGroupName, string]} ImageMapPreview
 * @typedef {["Option", CustomGroupName, string, string]} ImageMapOption
 * @typedef {["Layer", CustomGroupName, string]} ImageMapLayer
 */

/**
 * @typedef {ImageMapPreview | ImageMapOption | ImageMapLayer} ImageMapType
 */

/**
 * 工具类，提供一些静态方法来生成图片路径和ImageMapping对象
 */
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
     * @param {ImageMapType} from
     * @param {ImageMapType} to
     */
    static mappingPath(from, to) {
        const getPath = (im) => {
            switch (im[0]) {
                case "Preview":
                    return ImageMapTools.assetPreview(im[1], im[2]);
                case "Option":
                    return ImageMapTools.assetOption(im[1], im[2], im[3]);
                case "Layer":
                    return ImageMapTools.assetLayer(im[1], im[2]);
            }
        };
        return { [getPath(to)]: getPath(from) };
    }

    /**
     * 产生一个可以用于ImageMapping的映射对象，用于将某个BodyType的图片映射到其他的BodyType
     * 只支持CreateLayerTypes长度为1的情况
     * @param {CustomGroupName| CustomGroupName[]} group 物品所在的组
     * @param {CustomAssetDefinition} asset 物品定义
     * @param {BodyTypes} from 映射的来源类型
     * @param {FullBodyTypes[]} to 映射的目标类型
     * @param {ExtendedItemConfig<TypedItemOption>} [config] 如果包含CreateLayerTypes字段，首先会尝试从AllowTypes中获取类型。如果AllowTypes没有相关描述，则需要此参数来获取类型
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

            const layerTypeSegs = layerTypesSegs(layer, config);
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
