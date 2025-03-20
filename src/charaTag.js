import { ChatRoomEvents } from "@sugarch/bc-event-handler";
import { Globals } from "./globals";
import { HookManager } from "@sugarch/bc-mod-hook-manager";

const ECHO_INFO_TAG = "ECHO_INFO2";

const global_name = "CharacterTag";

/**
 * @typedef {Object}  CharacterTagItem
 * @property {string} version
 * @property {boolean} beta
 */

/**
 * @typedef { Record<string,CharacterTagItem> } CharacterTagInfo
 */

/**
 * @param {CharacterTagInfo} localTag
 * @param {number} [target]
 */
function sendFunc(localTag, target) {
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

export class CharacterTagInstance {
    /** @type {CharacterTagInfo} */
    localTag = {}; // 本地标签
    hooked = false;
    version = 1;

    constructor() {}

    /**
     * @param {CharacterTagInstance} old
     * @returns {boolean} 是否发生了迁移
     */
    migrate(old) {
        if (this.version <= old.version) return false;

        this.localTag = old.localTag;
        this.hooked = old.hooked;

        return true;
    }

    /**
     * @param {string} name
     * @param {CharacterTagItem} tag
     */
    tag(name, tag) {
        this.localTag[name] = tag;

        const tagPlayer = () => {
            Player[ECHO_INFO_TAG] = {
                ...Player[ECHO_INFO_TAG],
                [name]: tag,
            };
        };

        HookManager.afterPlayerLogin(() => {
            tagPlayer();
        });
    }

    /**
     * @param {number} [memberNumber]
     */
    send(memberNumber) {
        sendFunc(this.localTag, memberNumber);
    }

    /**
     * @param {ServerChatRoomMessage} data
     */
    parse(data) {
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

    /**
     * @param {Character} C
     * @param {string} key
     * @returns {CharacterTagItem | undefined}
     */
    get(C, key) {
        return C[ECHO_INFO_TAG]?.[key];
    }
}

export class CharacterTag {
    /**
     * @returns {CharacterTagInstance}
     */
    static get instance() {
        return Globals.getMayOverride(global_name, (old) => {
            const newGlobal = new CharacterTagInstance();
            if (!old) return newGlobal;

            if (newGlobal.migrate(old)) {
                return newGlobal;
            }

            return old;
        });
    }

    /**
     * @param {string} name
     * @param {CharacterTagItem} tag
     */
    static tag(name, tag) {
        this.instance.tag(name, tag);
    }

    static init() {
        const instance = this.instance;
        if (instance.hooked) return;
        instance.hooked = true;

        HookManager.progressiveHook("ChatRoomSyncMemberJoin", 10).inject((args, _) => {
            this.instance.send(args[0].SourceMemberNumber);
        });

        HookManager.progressiveHook("ChatRoomSync", 10).inject(() => {
            this.instance.send();
        });

        ChatRoomEvents.on("Hidden", (data) => this.instance.parse(data));
    }

    /**
     * @param {Character} chara
     * @param {string} key
     * @returns { CharacterTagItem | undefined }
     */
    static get(chara, key) {
        return this.instance.get(chara, key);
    }
}
