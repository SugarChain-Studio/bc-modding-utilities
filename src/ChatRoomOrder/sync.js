import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { ChatRoomEvents } from "@sugarch/bc-event-handler";
import { fetchState, Pick, validDrawOrderState } from "./checks";

export const syncMsgKey = `Luzi_XCharacterDrawState`;

/** @type {undefined | number | true} */
let doSync = undefined;
function syncRun() {
    if (!doSync) return;
    const pl = /** @type {XCharacter}*/ (Player);
    if (!pl || !pl.MemberNumber || !pl.XCharacterDrawOrder) return;
    ServerSend("ChatRoomChat", {
        Content: syncMsgKey,
        Type: "Hidden",
        ...(typeof doSync === "number" ? { Target: doSync } : undefined),
        Dictionary: [{ ...pl.XCharacterDrawOrder, drawState: undefined }],
    });
    doSync = undefined;
}

setInterval(() => syncRun(), 400);

/**
 * @param {number | true} arg
 */
export function setSync(arg = true) {
    if (!doSync) doSync = arg;
    else doSync = true;
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

    HookManager.hookFunction("ChatRoomSyncMemberJoin", 10, (args, next) => {
        setSync(args[0].SourceMemberNumber);
        next(args);
    });

    ChatRoomEvents.on("Hidden", ({ Content, Sender, Dictionary }) => {
        if (Content === syncMsgKey) {
            /** @type {XCharacter}*/
            const target = ChatRoomCharacter.find(
                (c) => c.MemberNumber === Sender
            );
            if (target) {
                const oldDrawState = target.XCharacterDrawOrder?.drawState;
                target.XCharacterDrawOrder = validDrawOrderState(
                    /** @type {unknown}*/ (Dictionary[0])
                );
                if (target.XCharacterDrawOrder && oldDrawState)
                    target.XCharacterDrawOrder.drawState = oldDrawState;
            }
            return;
        }
    });

    //#region 牵引同步
    HookManager.hookFunction("ChatRoomPingLeashedPlayers", 0, (args, next) => {
        const prevLeash = ChatRoomLeashList;
        if (fetchState(Player)?.leash === "lead") {
            ChatRoomLeashList = [
                ...ChatRoomLeashList,
                Pick.other(Player),
            ].filter((id) => typeof id === "number");
        }
        next(args);
        ChatRoomLeashList = prevLeash;
    });

    const insideLeashFuncs = [
        HookManager.insideFlag("ChatRoomDoPingLeashedPlayers"),
        HookManager.insideFlag("ServerAccountBeep"),
    ];

    HookManager.hookFunction("ServerAccountBeep", 0, (args, next) => {
        const oldLeashPlayer = ChatRoomLeashPlayer;
        if (
            args[0].MemberNumber === Pick.other(Player) &&
            fetchState(Player)?.leash === "follow" &&
            !ChatRoomLeashPlayer
        ) {
            ChatRoomLeashPlayer = args[0].MemberNumber;
        }
        next(args);
        ChatRoomLeashPlayer = oldLeashPlayer;
    });

    HookManager.hookFunction("ChatRoomCanBeLeashedBy", 0, (args, next) => {
        if (insideLeashFuncs.some((f) => f.inside) && args[1].IsPlayer()) {
            const state = fetchState(args[1]);
            if (
                state?.leash === "follow" &&
                Pick.other(args[1]) === Player.MemberNumber
            ) {
                return true;
            }
        }

        return next(args);
    });
    //#endregion
}
