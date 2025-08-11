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
 * Returns an Optional with the value and an empty context.
 * If the value is undefined or null, it returns a nullOpt.
 * @template T
 * @overload
 * @param { T | undefined | null } arg0
 * @returns {Optional<T, {}>} An Optional instance with the value and an empty context.
 */
/**
 * Creates a monadic Optional instance from a value.
 * Returns an Optional with the value and a context containing the specified key.
 * If the value is undefined or null, it returns a nullOpt.
 * @template T
 * @template {string} K
 * @overload
 * @param { K } arg0 - The key to be used in the context.
 * @param { T | undefined | null } arg1 - The value to be wrapped in the Optional.
 * @returns {Optional<T, {[k in K]: T}>} - An Optional instance with the value and context containing the key.
 */
/**
 * @template T
 * @template {string} K
 * @param { K | T | undefined | null } arg0
 * @param { T | undefined | "__dxglhj"} [arg1]
 */
export function monadic(arg0, arg1 = "__dxglhj") {
    const rOpt = arg1 === "__dxglhj" ? arg0 : arg1;
    if (rOpt === undefined || rOpt === null)
        return /** @type {Optional<T, {}>} */ (nullOpt);
    if (typeof arg0 === "string") {
        return /** @type {Optional<T, {[k in K]: T}>} */ (
            new Optional(rOpt, /** @type { {[k in K]: T}} */ ({ [arg0]: rOpt }))
        );
    }
    return /** @type {Optional<T, {}>} */ (new Optional(rOpt, {}));
}
