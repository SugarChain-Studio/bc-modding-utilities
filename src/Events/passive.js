import ModManager from "@mod-utils/ModManager"
import EventEmitter from "eventemitter3"

/**
 * @type {EventEmitter<Record<ServerChatRoomMessageType, [ServerChatRoomMessage]>> | undefined}
 */
let handler = undefined;

export class ChatRoomEvents {
    static init() {
        if(handler !== undefined) return;

        handler = new EventEmitter();

        ModManager.hookFunction("ChatRoomMessage", 10, (args, next) => {
            const { Type } = args[0]
            handler.emit(Type, args[0]);
            return next(args);
        });
    }

    static get instance(){
        return handler;
    }
}

