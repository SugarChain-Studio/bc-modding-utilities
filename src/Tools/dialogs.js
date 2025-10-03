/**
 * @typedef { (config: ModularItemModuleConfig) => {Select: string, Module: string} } MainDialogGenerator
 * @typedef { (config: ModularItemOptionConfig, optionIndex: number, module: ModularItemModuleConfig) => {Option: string, Set:string} } OptionDialogGenerator
 */

/**
 * @template {string} GroupName
 * @typedef { Object } DialogGeneratorParam
 * @property { GroupName [] } [groups] 需要生成对话的物品组名
 * @property { string[] } [itemNames] 需要生成对话的物品名
 * @property { string } selectBase 主页面标题文本
 * @property { MainDialogGenerator } module 产生主页面按钮文本（Module）和子页面标题（Select）名字的函数
 * @property { OptionDialogGenerator } option 产生选项按钮文本（Option）和选项输出文本（Set）的函数
 */

const CustomDialogPrefix = "Luzi_";

export class DialogTools {
    /**
     * 为 ModularItem 生成对话
     * @template {string} GroupName
     * @param {ModularItemModuleConfig[]} configs 需要生成对话的模块配置
     * @param {DialogGeneratorParam<GroupName>} param 生成对话的参数
     * @param {Record<string,string>} [init] 初始参数，生成过程中会避免覆盖其中的值
     * @returns {Record<string,string>} 生成的对话
     */
    static dialogGenerator(configs, param, init = {}) {
        return configs.reduce((pv, cv) => {
            const { Name, Key, Options } = cv;
            const { groups, itemNames, selectBase, module, option } = param;
            const { Select, Module } = module(cv);

            const groups_ = Array.isArray(groups) ? groups : [""];
            const itemNames_ = Array.isArray(itemNames) ? itemNames : [""];

            /**
             * @param { (group: string, itemName: string) => void } cb
             */
            const foreachGroupItem = (cb) => {
                for (const group of groups_) {
                    for (const itemName of itemNames_) {
                        cb(group, itemName);
                    }
                }
            };

            const tryWrite = (key, value) => {
                if (!pv[key]) pv[key] = value;
            };

            foreachGroupItem((group, itemName) => {
                tryWrite(`${group}${itemName}SelectBase`, selectBase);
            });

            foreachGroupItem((group, itemName) => {
                tryWrite(`${group}${itemName}Select${Name}`, Select);
                tryWrite(`${group}${itemName}Module${Name}`, Module);
            });

            Options.forEach((opt, i) => {
                const { Option, Set } = option(opt, i, cv);
                foreachGroupItem((group, itemName) => {
                    tryWrite(`${group}${itemName}Option${Key}${i}`, Option);
                    tryWrite(`${group}${itemName}Set${Key}${i}`, Set);
                });
            });

            return pv;
        }, init);
    }

    /**
     * 从物品组名、物品名、对话原型复制对话
     *
     * @example
     * ```js
     * const dialog = Tools.replicateTypedItemDialog(["ItemPelvis"],["幸运贞操带"],{CN:{SelectBase:"选择配置"}})
     *
     * // 上面的代码如同这样
     * const dialog = {
     *   CN: {
     *     "ItemPelvis幸运贞操带SelectBase": "选择配置"
     *   }
     * }
     * ```
     * @template {string} GroupName
     * @param {GroupName[]} groupNames 物品组名
     * @param {string[]} assetNames 物品名
     * @param {Translation.Dialog} dialogPrototye
     * @return {Translation.Dialog}
     */
    static replicateGroupedItemDialog(groupNames, assetNames, dialogPrototye) {
        return groupNames.reduce((pv, group) => {
            for (const asset of assetNames) {
                for (const [lang, entry] of Object.entries(dialogPrototye)) {
                    for (const [key, value] of Object.entries(entry)) {
                        const dialogKey = `${group}${asset}${key}`;
                        if (!pv[lang]) pv[lang] = {};
                        pv[lang][dialogKey] = value;
                    }
                }
            }
            return pv;
        }, /** @type {Translation.Dialog} */ ({}));
    }

    /**
     * 生成定制对话，不含有物品组名
     * @param {string[]} assetNames 物品名
     * @param {Translation.Dialog} dialogPrototye
     * @returns {Translation.Dialog}
     */
    static replicateCustomDialog(assetNames, dialogPrototye) {
        return assetNames.reduce((pv, asset) => {
            for (const [lang, entry] of Object.entries(dialogPrototye)) {
                for (const [key, value] of Object.entries(entry)) {
                    const dialogKey = `${CustomDialogPrefix}${asset}${key}`;
                    if (!pv[lang]) pv[lang] = {};
                    pv[lang][dialogKey] = value;
                }
            }
            return pv;
        }, /** @type {Translation.Dialog} */ ({}));
    }

    /**
     * 提供键，从 语言-键-文本 中挑选出对应的 语言-文本
     * @param {Translation.String} translation
     * @param {string} key
     * @returns {Translation.Entry}
     */
    static pickEntry(translation, key) {
        const ret = {};
        for (const lang in translation) {
            ret[lang] = translation[lang][key] || key;
        }
        return ret;
    }

    /**
     * 自动生成物品对话文本，例如：
     * 已经有 Options1，则自动生成 Sets1 为 `SourceCharacter将DestinationCharacterAssetName设置为${Options1}`
     *
     * @param {Translation.String} assetStrings
     * @param {ModularItemConfig | TypedItemConfig} config
     * @param {Translation.CNRecord<(from: string) => string>} [sets] SetX 文本生成器
     */
    static autoItemStrings(assetStrings, config, sets) {
        /** @type {Translation.String} */
        const ret = {};

        /** @type {{from:string, to:string}[]} */
        const keys = [];
        if (config.Archetype === ExtendedArchetype.MODULAR) {
            config.Modules.forEach((m) => {
                keys.push(
                    ...Array.from({ length: m.Options.length }, (_, i) => ({
                        from: `Set${m.Key}${i}`,
                        to: `Option${m.Key}${i}`,
                    }))
                );
            });
        } else if (config.Archetype === ExtendedArchetype.TYPED) {
            keys.push(
                ...Array.from(config.Options, (t) => ({
                    from: `${t.Name}`,
                    to: `Set${t.Name}`,
                }))
            );
        }

        const krder = sets || {
            CN: (from) =>
                `SourceCharacter将DestinationCharacterAssetName设置为${assetStrings["CN"][from]}`,
            EN: (from) =>
                `SourceCharacter sets DestinationCharacter AssetName to ${assetStrings["EN"][from]}`,
        };

        for (const lang in assetStrings) {
            ret[lang] = { ...assetStrings[lang] };
            if (lang in krder) {
                keys.forEach(({ from, to }) => {
                    ret[lang][to] = krder[lang](from) || krder["CN"](from);
                });
            }
        }
        return ret;
    }

    /**
     * 获取一个生成物品对话键的函数
     * @example
     * const dialogKey = Dialogs.dialogKey(item);
     * const key = dialogKey("some_key");
     * // key = "GroupNameAssetNamesome_key"
     *
     * @overload
     * @param { Item | Asset} arg0
     * @returns {(Key: string) => string}
     */
    /**
     * 获取一个生成物品对话键的函数
     * @example
     * const dialogKey = Dialogs.dialogKey("GroupName", "AssetName");
     * const key = dialogKey("some_key");
     * // key = "GroupNameAssetNamesome_key"
     * @overload
     * @param { CustomGroupBodyName } arg0
     * @param { string } arg1
     * @returns {(Key: string) => string}
     */
    /**
     * @param {CustomGroupBodyName | Item | Asset} arg0
     * @param {string} [arg1]
     * @returns {(Key: string) => string}
     */
    static dialogKey(arg0, arg1) {
        let groupName, assetName;
        if (typeof arg0 === "string") {
            groupName = arg0;
            assetName = arg1;
        } else {
            const Asset = "Asset" in arg0 ? arg0.Asset : arg0;
            groupName = Asset.Group.Name;
            assetName = Asset.Name;
        }
        return (Key) => `${groupName}${assetName}${Key}`;
    }
    /**
     * 生成显示/隐藏的对话文本
     * @param {Object} param0
     * @param {string} param0.moduleName 模块名称
     * @param {string} param0.key 模块键值
     * @param {Translation.Entry} param0.moduleText 模块显示名称
     * @param {Translation.Entry} [param0.fullText] 模块完整显示名称，除了按钮文本只使用moduleText外，其他地方优先使用fullText
     * @param {boolean} [param0.reverse] 是否反转选项
     * @returns
     */
    static showHide({ moduleName, key, moduleText, fullText, reverse }) {
        const showV = reverse ? 1 : 0;
        const hideV = reverse ? 0 : 1;

        const fullText_ = {
            CN: fullText?.CN || moduleText.CN,
            EN: fullText?.EN || moduleText.EN,
        };

        const CN = {
            [`Module${moduleName}`]: `显示/隐藏${moduleText.CN}`,
            [`Select${moduleName}`]: `设置显示/隐藏${fullText_.CN}`,
            [`Option${key}${showV}`]: "显示",
            [`Option${key}${hideV}`]: "隐藏",
            [`Set${key}${showV}`]: `SourceCharacter使DestinationCharacterAssetName会露出${fullText_.CN}`,
            [`Set${key}${hideV}`]: `SourceCharacter使DestinationCharacterAssetName会隐藏${fullText_.CN}`,
        };

        const EN = {
            [`Module${moduleName}`]: `Show/Hide ${moduleText.EN}`,
            [`Select${moduleName}`]: `Set Show/Hide ${fullText_.EN}`,
            [`Option${key}${showV}`]: "Show",
            [`Option${key}${hideV}`]: "Hide",
            [`Set${key}${showV}`]: `SourceCharacter makes DestinationCharacter AssetName reveal the ${fullText_.EN}.`,
            [`Set${key}${hideV}`]: `SourceCharacter makes DestinationCharacter AssetName hide the ${fullText_.EN}.`,
        };

        return { CN, EN };
    }

    /**
     * 将多个物品对话合并
     * @param  {...Translation.Dialog} args
     * @returns {Translation.Dialog}
     */
    static combine(...args) {
        return args.reduce(
            (acc, cur) =>
                Object.fromEntries(
                    Object.entries(cur).map(([lang, entries]) => [
                        lang,
                        { ...(acc[lang] || {}), ...entries },
                    ])
                ),
            { CN: {}, EN: {} }
        );
    }
}
