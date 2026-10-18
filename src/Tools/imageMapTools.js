/**
 * 收集姿势映射中所有可用的姿势目录片段。
 *
 * 遍历游戏的全部姿势，取出该映射中未设置为 Hide 的目标姿势并去重；
 * 结果固定以 "" 开头，表示不带姿势子目录的图片路径。
 * @param {AssetPoseMapping} poseMapping
 * @returns {string[]} 目录片段列表，例如 ["", "Kneel/", "KneelingSpread/"]
 */
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
 * 获取图层类型后缀，用于拼接不同 LayerType 对应的图片文件名。
 *
 * `CreateLayerTypes` 只声明了类型字段名（如 "typed"）：优先从图层的 AllowTypes
 * 中收集实际取值，得到 "typed0"、"typed1" 之类的后缀；若没有 AllowTypes，
 * 则回退到物品配置（模块化 / 类型化）中的全部选项。
 * @param {NonNullable<CustomAssetDefinition["Layer"]>[0]} layer
 * @param {ExtendedItemConfig<TypedItemOption> | undefined} config
 * @returns {string[]} 类型后缀列表，例如 ["typed0", "typed1"]
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
     * 生成图层的图片路径。
     *
     * 结果为 `Assets/Female3DCG/{group}/[pose/]{layerName}.png`，
     * 传入 pose 时会在组名与文件名之间插入姿势子目录。
     * @param {CustomGroupName} group
     * @param {string} layerName
     * @param {AssetPoseName} [pose]
     * @returns {string}
     */
    static assetLayer(group, layerName, pose) {
        return `Assets/Female3DCG/${group}/${
            pose ? `${pose}/` : ""
        }${layerName}.png`;
    }

    /**
     * 生成物品预览图的路径：`Assets/Female3DCG/{group}/Preview/{assetName}.png`
     * @param {CustomGroupName} group
     * @param {string} assetName
     * @returns {string}
     */
    static assetPreview(group, assetName) {
        return `Assets/Female3DCG/${group}/Preview/${assetName}.png`;
    }

    /**
     * 生成物品选项图标的路径：`Screens/Inventory/{group}/{assetName}/{optionName}.png`
     * @param {CustomGroupName} group
     * @param {string} assetName
     * @param {string} optionName
     * @returns {string}
     */
    static assetOption(group, assetName, optionName) {
        return `Screens/Inventory/${group}/${assetName}/${optionName}.png`;
    }

    /**
     * 生成一条 ImageMapping：让 `to` 描述的图片位置改用 `from` 描述的图片。
     *
     * 返回对象形如 `{ [to 路径]: from 路径 }`：键是游戏请求的路径，
     * 值是实际加载的路径。
     * @param {ImageMapType} from 实际图片所在位置
     * @param {ImageMapType} to 需要被替换的图片位置
     * @returns { Record<string,string> }
     */
    static mappingPath(from, to) {
        /** @type {(im: ImageMapType) => string} */
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
     * 产生一个可以用于ImageMapping的映射对象，用于将某个BodyType的图片映射到其他的BodyType。
     *
     * 返回值形如 `{ [目标体型的图片路径]: 来源体型的图片路径 }`，即让目标体型的图层复用来源体型的图片。
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
                : (layer.PoseMapping ?? asset.PoseMapping ?? {});

            const poseSegs = poseMappingSegments(poseMapping);

            const layerTypeSegs = layerTypesSegs(layer, config);
            if (layerTypeSegs.length === 0) layerTypeSegs.push("");

            /** @type {(g: CustomGroupName, poseSeg: string, file: string, layerType: string) => string} */
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
