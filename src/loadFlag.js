const global_name = "ECHOLoadFlag";

/**
 * @param {string} tag
 * @param {()=>void} callback
 */
export function once(tag, callback) {
    if (!globalThis[global_name]) {
        globalThis[global_name] = {};
    }
    if (!globalThis[global_name][tag]) {
        globalThis[global_name][tag] = true;
        callback();
    }
}
