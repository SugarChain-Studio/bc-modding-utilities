import log from "@mod-utils/log";
import { sleepUntil } from "@mod-utils/sleep";

const registerQueue = [];
let queueLoaded = false;

/**
 * @param {FuncWork} fn
 */
export function pushLoad(fn) {
    if (!queueLoaded) registerQueue.push(fn);
    else fn();
}

const loadMessage = {
    en: {
        start: "Start loading",
        end: "Loading completed, time usage: ",
    },
    zh: {
        start: "开始加载",
        end: "加载完成，耗时：",
    },
};

/**
 * @param {()=>boolean} criteria
 */
export function setupLoad(criteria) {
    if (queueLoaded) return;
    (async () => {
        await sleepUntil(() => criteria());
        const userLanguage = navigator.language.startsWith("zh") ? "zh" : "en";

        const start = Date.now();
        log.info(loadMessage[userLanguage].start);
        queueLoaded = true;
        while (registerQueue.length > 0) registerQueue.shift()();
        const end = Date.now();
        log.info(loadMessage[userLanguage].end + (end - start) + "ms");
    })();
}
