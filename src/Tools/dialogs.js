/**
 * @typedef { (config: ModularItemModuleConfig) => {Select: string, Module: string} } MainDialogGenerator
 * @typedef { (config: ModularItemOptionConfig, optionIndex: number, module: ModularItemModuleConfig) => {Option: string, Set:string} } OptionDialogGenerator
 */

/**
 * @typedef { Object } DialogGeneratorParam
 * @property { CustomGroupName [] } groups 需要生成对话的物品组名
 * @property { string[] } itemNames 需要生成对话的物品名
 * @property { string } selectBase 主页面标题文本
 * @property { MainDialogGenerator } module 产生主页面按钮文本（Module）和子页面标题（Select）名字的函数
 * @property { OptionDialogGenerator } option 产生选项按钮文本（Option）和选项输出文本（Set）的函数
 */

const CustomDialogPrefix = "Luzi_";

export class DialogTools {
    /**
     * 为 ModularItem 生成对话
     * @param {ModularItemModuleConfig[]} configs 需要生成对话的模块配置
     * @param {DialogGeneratorParam} param 生成对话的参数
     * @param {Record<string,string>} [init] 初始参数，生成过程中会避免覆盖其中的值
     * @returns {Record<string,string>} 生成的对话
     */
    static dialogGenerator(configs, param, init = {}) {
        return configs.reduce((pv, cv) => {
            const { Name, Key, Options } = cv;
            const { groups, itemNames, selectBase, module, option } = param;
            const { Select, Module } = module(cv);

            /**
             * @param { (group: CustomGroupName, itemName: string) => void } cb
             */
            const foreachGroupItem = (cb) => {
                for (const group of groups) {
                    for (const itemName of itemNames) {
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
     * @param {CustomGroupName[]} groupNames 物品组名
     * @param {string[]} assetNames 物品名
     * @param {Translation.Dialog} dialogPrototye
     * @return {Translation.Dialog}
     */
    static replicateTypedItemDialog(groupNames, assetNames, dialogPrototye) {
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
     * 生成定制对话生成器
     * @param {string} prefix 前缀
     * @returns { (...details: any[]) => string }
     */
    static makeCustomDialogGenerator(prefix) {
        const fprefix = `${CustomDialogPrefix}${prefix}`;
        return (...details) => `${fprefix}${details.map((v) => v.toString()).join("")}`;
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
}
