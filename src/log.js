import { ModInfo } from "@mod-utils/rollupHelper";

export const Logger = {
    info: (message) => {
        console.info(`[${ModInfo.name}] ${message}`);
    },
    warn: (message) => {
        console.warn(`[${ModInfo.name}] ${message}`);
    },
    error: (message) => {
        console.error(`[${ModInfo.name}] ${message}`);
    },
};
