import { ModInfo } from "@mod-utils/rollupHelper";

export class Logger {
    /** @param {string} message */
    static info(message) {
        console.info(`[${ModInfo.name}] ${message}`);
    }
    /** @param {string} message */
    static warn(message) {
        console.warn(`[${ModInfo.name}] ${message}`);
    }
    /** @param {string} message */
    static error(message) {
        console.error(`[${ModInfo.name}] ${message}`);
    }
}
