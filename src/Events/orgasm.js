import ModManager from "@mod-utils/ModManager";
import EventEmitter from "eventemitter3";

/**
 * @typedef { "orgasmed" | "ruined" | "resisted" } OrgasmType
 */

/**
 * @typedef {EventEmitter<Record<OrgasmType, [{Player: Character}]>>} OrgasmEventEmitter
 */

/**
 * @type {OrgasmEventEmitter | undefined}
 */
let handler = undefined;

export class OrgasmEvents {
    static init() {
        if (handler !== undefined) return;

        handler = new EventEmitter();

        ModManager.hookFunction("ActivityOrgasmStop", 9, (args, next) => {
            const [C, Progress] = args;
            if (C.IsPlayer()) {
                if (ActivityOrgasmRuined) handler.emit("ruined", { Player: C });
                else if (Progress >= 60) handler.emit("resisted", { Player: C });
            }
            next(args);
        });

        ModManager.hookFunction("ActivityOrgasmStart", 9, (args, next) => {
            const [C] = args;
            if (C.IsPlayer() && !ActivityOrgasmRuined) handler.emit("orgasmed", { Player: C });
            next(args);
        });
    }

    /**
     * @param {Parameters<OrgasmEventEmitter["on"]>} args
     */
    static on(...args) {
        this.init();
        handler.on(...args);
    }

    /**
     * @param {Parameters<OrgasmEventEmitter["once"]>} args
     */
    static once(...args) {
        this.init();
        handler.once(...args);
    }

    static get instance() {
        this.init();
        return handler;
    }
}
