import { ChatRoomEvents } from "./Events";
import ModManager from "./ModManager";

const ECHO_INFO_TAG = "ECHO_INFO";

const GLOBAL_INSTANCE_TAG = "ECHO_CHARA_TAG";

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

    migrate(old) {
        this.localTag = old["localTag"] || {};
        this.hooked = !!old["hooked"];
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

        ModManager.afterPlayerLogin(() => {
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
        const oldGlobal = globalThis[GLOBAL_INSTANCE_TAG];
        const newGlobal = new CharacterTagInstance();

        if (!oldGlobal || !(oldGlobal instanceof CharacterTagInstance)) globalThis[GLOBAL_INSTANCE_TAG] = newGlobal;
        else if (!oldGlobal.version || oldGlobal.version < newGlobal.version) {
            newGlobal.migrate(oldGlobal);
            globalThis[GLOBAL_INSTANCE_TAG] = newGlobal;
        }

        return globalThis[GLOBAL_INSTANCE_TAG];
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

        ModManager.progressiveHook("ChatRoomSyncMemberJoin", 10).inject((args, next) => {
            this.instance.send(args[0].SourceMemberNumber);
        });

        ModManager.progressiveHook("ChatRoomSync", 10).inject((args, next) => {
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
