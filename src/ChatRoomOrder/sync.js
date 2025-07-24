import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { ChatRoomEvents } from "@sugarch/bc-event-handler";
import { validDrawOrderState } from "./checks";

export const syncMsgKey = `Luzi_XCharacterDrawState`;

let doSync = false;
function syncRun() {
    if (!doSync) return;
    const pl = /** @type {XCharacter}*/ (Player);
    if (!pl || !pl?.MemberNumber) return;
    if (!pl?.XCharacterDrawOrder) return;
    const data = /** @type {XCharacterDrawOrderState} */ (
        Object.fromEntries(
            Object.entries(pl.XCharacterDrawOrder).filter(
                ([k]) => k !== "drawState"
            )
        )
    );
    if (!data) return;
    doSync = false;
    ServerSend("ChatRoomChat", {
        Content: syncMsgKey,
        Type: "Hidden",
        Dictionary: [data],
    });
}

setInterval(() => syncRun(), 400);

export function setSync() {
    doSync = true;
}

/**
 * 清除 XCharacterDrawOrder 的状态。
 */
export function clearXDrawState() {
    /** @type {any}*/ (Player).XCharacterDrawOrder = {};
    setSync();
}

/**
 *
 * @param {XCharacterDrawOrderState} data
 */
export function setXDrawState(data) {
    /** @type {XCharacter}*/ (Player).XCharacterDrawOrder = data;
    setSync();
}

export function setupSync() {
    HookManager.hookFunction("ChatRoomSync", 10, (args, next) => {
        setSync();
        next(args);
    });

    HookManager.hookFunction("ChatRoomSyncMemberLeave", 10, (args, next) => {
        setSync();
        next(args);
    });

    ChatRoomEvents.on("Action", ({ Content }) => {
        if (Content === "ServerEnter") setSync();
    });

    ChatRoomEvents.on("Hidden", ({ Content, Sender, Dictionary }) => {
        if (Content === syncMsgKey) {
            /** @type {XCharacter}*/
            const target = ChatRoomCharacter.find(
                (c) => c.MemberNumber === Sender
            );
            if (target) {
                const drawState = target.XCharacterDrawOrder?.drawState;
                target.XCharacterDrawOrder = validDrawOrderState(
                    /** @type {unknown}*/ (Dictionary[0])
                );
                if (target.XCharacterDrawOrder && drawState)
                    target.XCharacterDrawOrder.drawState = drawState;
            }
            return;
        }
    });
}
