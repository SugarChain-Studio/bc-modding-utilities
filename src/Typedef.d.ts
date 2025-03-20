declare const __mod_version__: string;
declare const __mod_full_name__: string;
declare const __mod_name__: string;
declare const __mod_repo__: string | undefined;
declare const __mod_base_url__: string;
declare const __mod_resource_base_url__: string;
declare const __mod_asset_overrides__: string;
declare const __mod_beta_flag__: boolean;

declare const __mod_rollup_imports__: string[];
declare const __mod_rollup_setup__: string[];

declare namespace Translation {
    type Entry = import('@sugarch/bc-asset-manager').Translation.Entry;
    type Dialog = import('@sugarch/bc-asset-manager').Translation.Dialog;
    type ActivityEntry = import('@sugarch/bc-asset-manager').Translation.ActivityEntry;
    type CustomRecord<T extends string, U> = import('@sugarch/bc-asset-manager').Translation.CustomRecord<T, U>;
}

type AssetOverrideContainer = import('@sugarch/bc-asset-manager').AssetOverrideContainer;

type CopyGroupInfo = { name: CustomGroupName; mirror: AssetGroupName; description?: Translation.Entry };

declare function ServerSend<T extends keyof ClientToServerEvents>(
    Message: T,
    ...args: Parameters<ClientToServerEvents[T]>
): void;

interface XCharacterDrawOrderState {
    prevCharacter?: number;
    nextCharacter?: number;
    associatedAsset?: { group: AssetGroupItemName; asset: string };
    associatedPose?: { pose: AssetPoseName[] };
    drawState?: { X: number; Y: number; Zoom: number };
}

type XCharacter = { XCharacterDrawOrder?: XCharacterDrawOrderState } & Character;

type DrawFunParameters<T extends (...args: any[]) => any> = T extends (
    X: number,
    Y: number,
    W: number,
    H: number,
    ...args: infer P
) => any
    ? P
    : never;

type SliceParameters<E extends number, T extends (...args: any[]) => any> = E extends 0
    ? T
    : E extends 1
    ? T extends (_1: any, ...args: infer P) => any
        ? P
        : never
    : E extends 2
    ? T extends (_1: any, _2: any, ...args: infer P) => any
        ? P
        : never
    : E extends 3
    ? T extends (_1: any, _2: any, _3: any, ...args: infer P) => any
        ? P
        : never
    : E extends 4
    ? T extends (_1: any, _2: any, _3: any, _4: any, ...args: infer P) => any
        ? P
        : never
    : E extends 5
    ? T extends (_1: any, _2: any, _3: any, _4: any, _5: any, ...args: infer P) => any
        ? P
        : never
    : never;
