import { Globals } from "./globals";

const global_name = "LoadFlag";

/** @type {import("./globals").INamespace<boolean>} */
const storage = Globals.createNamespace(global_name);

/**
 * @param {string} tag
 * @param {()=>void} callback
 */
export function once(tag, callback) {
    if (!storage.get(tag, () => false)) {
        storage.set(tag, true);
        callback();
    }
}
