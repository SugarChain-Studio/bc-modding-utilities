/**
 * @template T
 * @typedef {Object} INamespace
 * @property {function(string, function(): T): T} get - 获取全局变量
 * @property {function(string, T): void} set - 设置全局变量
 * @property {function(string): boolean} has - 检查变量是否存在
 * @property {function(string): boolean} delete - 删除变量
 */

export class Globals {
    /**
     * 用于存储全局变量的命名空间
     * @type {string}
     * @private
     */
    static _namespace = "__ECHO_MOD_GLOBALS__";

    /**
     * 如果存储空间不存在，则初始化存储空间
     */
    static _initStorage() {
        if (!globalThis[this._namespace]) {
            globalThis[this._namespace] = {};
        }
    }

    /**
     * 获取全局变量
     * @param {string} name - 变量名
     * @param {()=> any} defaultValue - 默认值
     * @returns {any} 变量值
     */
    static get(name, defaultValue) {
        this._initStorage();
        if (!(name in globalThis[this._namespace])) {
            globalThis[this._namespace][name] = defaultValue();
        }
        return globalThis[this._namespace][name];
    }

    /**
     * 获取全局变量，提供允许覆写的接口
     * @template T
     * @param {string} name - 变量名
     * @param {(old:T | undefined) => T} defaultValue - 默认值
     * @returns {any} 变量值
     */
    static getMayOverride(name, defaultValue) {
        this._initStorage();
        globalThis[this._namespace][name] = defaultValue(globalThis[this._namespace][name]);
        return globalThis[this._namespace][name];
    }

    /**
     * 设置全局变量
     * @param {string} name - 变量名
     * @param {any} value - 变量值
     * @returns {void}
     */
    static set(name, value) {
        this._initStorage();
        globalThis[this._namespace][name] = value;
    }

    /**
     * 检查变量是否存在
     * @param {string} name - 变量名
     * @returns {boolean} True 如果变量存在
     */
    static has(name) {
        this._initStorage();
        return name in globalThis[this._namespace];
    }

    /**
     * 删除变量
     * @param {string} name - 变量名
     * @returns {boolean} True 如果变量存在并被删除
     */
    static delete(name) {
        this._initStorage();
        if (name in globalThis[this._namespace]) {
            return delete globalThis[this._namespace][name];
        }
        return false;
    }

    /**
     * 通过替换方法更改实现
     * @param {Object} implementation - 满足鸭子类型的实现
     */
    static setImplementation(implementation) {
        // 检查实现是否满足要求
        const requiredMethods = ["get", "set", "has", "delete"];

        for (const method of requiredMethods) {
            if (typeof implementation[method] !== "function") {
                throw new Error(`Implementation must provide a '${method}' function`);
            }
            Globals[method] = implementation[method];
        }
    }

    /**
     * 创建一个命名空间
     * @template T
     * @param {string} prefix - 命名空间前缀
     * @returns {INamespace<T>} 命名空间对象
     */
    static createNamespace(prefix) {
        return {
            get: (name, defaultValue) => Globals.get(`${prefix}.${name}`, defaultValue),
            set: (name, value) => Globals.set(`${prefix}.${name}`, value),
            has: (name) => Globals.has(`${prefix}.${name}`),
            delete: (name) => Globals.delete(`${prefix}.${name}`),
        };
    }
}
