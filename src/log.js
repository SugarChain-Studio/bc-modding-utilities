import { ModInfo } from "@mod-utils/rollupHelper";

export class Logger {
    static info(message) {
        console.info(`[${ModInfo.name}] ${message}`);
    }
    static warn(message) {
        console.warn(`[${ModInfo.name}] ${message}`);
    }
    static error(message) {
        console.error(`[${ModInfo.name}] ${message}`);
    }
}
