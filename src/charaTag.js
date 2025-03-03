import { ChatRoomEvents } from "./Events";
import ModManager from "./ModManager";

const ECHO_INFO_TAG = "ECHO_INFO";

const GLOBAL_INSTANCE_TAG = "ECHO_CHARA_TAG";

/**
 * @typedef { Record<string,string> } CharacterTagInfo
 */

/**
 * @param {CharacterTagInfo} localTag
 * @param {number} [target]
 */
function sendMyTag(localTag, target) {
    ServerSend("ChatRoomChat", {
        Content: ECHO_INFO_TAG,
        Type: "Hidden",
        ...(target ? { Target: target } : {}),
        Dictionary: [
            {
                Type: ECHO_INFO_TAG,
                Content: localTag,
            },
        ],
    });
}

/**
 * @param {ServerChatRoomMessage} data
 */
function processOtherCharaTag(data) {
    if (data.Type !== "Hidden") return;
    if (data.Content !== ECHO_INFO_TAG) return;
    if (!Array.isArray(data.Dictionary)) return;

    const receivedTag = /** @type {any[]}*/ (data.Dictionary).find((d) => d.Type === ECHO_INFO_TAG);
    if (!receivedTag) return;
    const { Content } = receivedTag;

    const fromChara = ChatRoomCharacter.find((c) => c.MemberNumber === data.Sender);
    if (!fromChara) return;
    fromChara[ECHO_INFO_TAG] = Content;
}

export class CharacterTag {
    /** @type {CharacterTagInfo} */
    localTag = {}; // 本地标签
    hooked = false;

    constructor() { }

    /**
     * @returns {CharacterTag}
     */
    static instance() {
        if (!globalThis[GLOBAL_INSTANCE_TAG]) {
            globalThis[GLOBAL_INSTANCE_TAG] = new CharacterTag();
        }
        return globalThis[GLOBAL_INSTANCE_TAG];
    }

    /**
     * @param {string} name
     * @param {string} version
     */
    static myTag(name, version) {
        this.instance().localTag[name] = version;

        const tagPlayer = () => {
            Player[ECHO_INFO_TAG] = {
                ...Player[ECHO_INFO_TAG],
                [name]: version,
            };
        };

        if (Player && Player.MemberNumber) {
            tagPlayer();
        } else {
            ModManager.progressiveHook("LoginResponse", 10)
                .next()
                .inject((args, next) => {
                    if (typeof args[0] !== "string") tagPlayer();
                });
        }
    }

    static init() {
        const instance = this.instance();
        if (instance.hooked) return;
        instance.hooked = true;

        ModManager.progressiveHook("ChatRoomSyncMemberJoin", 10).inject((args, next) => {
            sendMyTag(this.instance().localTag, args[0].SourceMemberNumber);
        });

        ModManager.progressiveHook("ChatRoomSync", 10).inject((args, next) => {
            sendMyTag(this.instance().localTag);
        });

        ChatRoomEvents.on("Hidden", (data) => processOtherCharaTag(data));
    }

    /**
     * @param {Character} chara
     * @returns { CharacterTagInfo | undefined }
     */
    static getTag(chara) {
        return chara[ECHO_INFO_TAG];
    }
}
