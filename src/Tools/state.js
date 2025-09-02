class OrgasmState {
    constructor() {
        this.Orgasmed = false;
        this.Ruined = false;
        this.Resisted = false;
    }

    reset() {
        this.Orgasmed = false;
        this.Ruined = false;
        this.Resisted = false;
    }

    /**
     * 获取某个状态，然后重置
     * @param {"Orgasmed" | "Ruined" | "Resisted"} state
     */
    take(state) {
        let ret = false;
        ret = this[state];
        this[state] = false;
        return ret;
    }

    /**
     * 将事件监听器绑定到状态
     * @param {typeof import("@sugarch/bc-event-handler").OrgasmEvents} event
     */
    watch(event) {
        event.on("orgasmed", () => (this.Orgasmed = true));
        event.on("ruined", () => (this.Ruined = true));
        event.on("resisted", () => (this.Resisted = true));
    }
}

export const StateTools = {
    OrgasmState,
};
