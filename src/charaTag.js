import ModManager from "./ModManager";

const ECHO_INFO_TAG = "ECHO_INFO";

/**
 * @typedef { Record<string,string> } CharacterTagInfo
 */

/** @type {CharacterTagInfo} */
const localTag = {}; // 本地标签

/**
 * @param {number} [target]
 */
function sendMyTag(target) {
    ServerSend("ChatRoomChat", {
        Content: ECHO_INFO_TAG,
        Type: "Hidden",
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
    /**
     * @param {string} name
     * @param {string} version
     */
    static myTag(name, version) {
        localTag[name] = version;
        
        const addTag = () => {
            Player[ECHO_INFO_TAG] = {
                ...Player[ECHO_INFO_TAG],
                [name]: version,
            };
        };

        if (Player && Player.MemberNumber) {
            addTag();
        } else {
            ModManager.progressiveHook("LoginResponse", 10)
                .next()
                .inject((args, next) => {
                    if (typeof args[0] !== "string") addTag();
                });
        }
    }

    static init() {
        ModManager.progressiveHook("ChatRoomSyncMemberJoin", 10).inject((args, next) => {
            sendMyTag(args[0].SourceMemberNumber);
        });

        ModManager.progressiveHook("ChatRoomSync", 10).inject((args, next) => {
            sendMyTag();
        });

        ModManager.progressiveHook("ChatRoomMessage", 10).inject((args, next) => {
            const [data] = args;
            if (data.Type === "Hidden") processOtherCharaTag(data);
        });
    }

    /**
     * @param {Character} chara
     * @returns { CharacterTagInfo | undefined }
     */
    static getTag(chara) {
        return chara[ECHO_INFO_TAG];
    }
}
