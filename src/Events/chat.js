import ModManager from "../ModManager";
import EventEmitter from "eventemitter3";

/**
 * @typedef {EventEmitter<Record<ServerChatRoomMessageType, [ServerChatRoomMessage]>>} ChatRoomEventEmitter
 */

/**
 * @type {ChatRoomEventEmitter | undefined}
 */
let handler = undefined;

export class ChatRoomEvents {
    static init() {
        if (handler !== undefined) return;

        handler = new EventEmitter();

        ModManager.hookFunction("ChatRoomMessage", 10, (args, next) => {
            const { Type } = args[0];
            handler.emit(Type, args[0]);
            return next(args);
        });
    }

    /**
     * @param {Parameters<ChatRoomEventEmitter["on"]>} args
     */
    static on(...args) {
        this.init();
        handler.on(...args);
    }

    /**
     * @param {Parameters<ChatRoomEventEmitter["once"]>} args
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
