/**
 * @template T
 * @template {Object} [Ctx = {}]
 */
export class Optional {
    /**
     * @param {T | undefined} value
     * @param {Ctx} [ctx]
     */
    constructor(value, ctx = /** @type {Ctx} */ ({})) {
        this.value = value;
        this.ctx = ctx;
    }

    /**
     * A typical monadic `then` method. If the value is undefined, it returns nullOpt.
     * Otherwise, it calls the callback with the value and context, and returns a new Optional
     * with the result. If the callback returns undefined, it returns nullOpt.
     * @template R
     * @overload
     * @param {(value: T, ctx: Ctx) => R | undefined} callback
     * @returns {Optional<R, Ctx>}
     */

    /**
     * An extended version of the `then` method that allows specifying a context name.
     * If the callback is called and returns a value, it is stored in the context under the specified name.
     * @template {string} K
     * @template R
     * @overload
     * @param {K} ctxNameOrCallback
     * @param {(value: T, ctx: Ctx) => R | undefined} [callback]
     * @returns {Optional<R, Ctx & { [key in K]: R }>}
     */

    /**
     * @template {string} K
     * @template R
     * @param {K | ((value: T, ctx: Ctx) => R | undefined)} ctxNameOrCallback
     * @param {(value: T, ctx: Ctx) => R | undefined} [callback]
     */
    then(ctxNameOrCallback, callback) {
        if (this.value === undefined) return nullOpt;
        const cb =
            typeof ctxNameOrCallback === "function"
                ? ctxNameOrCallback
                : callback;
        const result = cb(this.value, this.ctx);
        if (result === undefined) return nullOpt;
        if (typeof ctxNameOrCallback === "string") {
            /** @type {any}*/ (this.ctx)[ctxNameOrCallback] = result;
        }
        return new Optional(result, this.ctx);
    }

    /**
     * @template R
     * @param {() => R} defaultValue
     * @returns {R | T}
     */
    valueOr(defaultValue) {
        if (this.value === undefined) return defaultValue();
        return this.value;
    }
}

const nullOpt = new Optional(undefined);

/**
 * Creates a monadic Optional instance from a value.
 * For the people who hate the `new` keyword.
 * @template T
 * @template {Object} [Ctx = {}]
 * @param { T | undefined } opt
 * @param {Ctx} [ctx]
 * @returns {Optional<T, Ctx>}
 */
export function monadic(opt, ctx = /** @type {Ctx} */ ({})) {
    if (opt === undefined) return /** @type {Optional<T, Ctx>} */ (nullOpt);
    return new Optional(opt, ctx);
}
