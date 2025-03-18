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

/** 扩展的身体组（非物品）名称 */
type CustomGroupBodyName =
    | AssetGroupBodyName
    | `${AssetGroupBodyName}_笨笨蛋Luzi`
    | `${AssetGroupBodyName}_笨笨笨蛋Luzi2`
    | 'Liquid2_Luzi'
    | 'BodyMarkings2_Luzi'
    | '动物身体_Luzi'
    | '长袖子_Luzi'
    | '新前发_Luzi'
    | '新后发_Luzi'
    | '额外头发_Luzi'
    | '额外身高_Luzi'
    | '身体痕迹_Luzi'
    | '眼睛左_Luzi'
    | '眼睛右_Luzi';

type FuncWork<T extends any[] = []> = (...args: T) => void;

type MyAssetManager = import('@sugarch/bc-asset-manager').AssetManagerType<CustomGroupBodyName>;

type CustomGroupName = import('@sugarch/bc-asset-manager').CustomGroupName<CustomGroupBodyName>;

type CustomGroupDefinition = import('@sugarch/bc-asset-manager').CustomGroupDefinition<CustomGroupBodyName>;

type CustomAssetDefinitionItem = import('@sugarch/bc-asset-manager').CustomAssetDefinitionItem<CustomGroupBodyName>;

type CustomAssetDefinitionAppearance =
    import('@sugarch/bc-asset-manager').CustomAssetDefinitionAppearance<CustomGroupBodyName>;

type CustomAssetDefinition = import('@sugarch/bc-asset-manager').CustomAssetDefinition<CustomGroupBodyName>;

/** 按照身体组分类的物品定义 */
type CustomGroupedAssetDefinitions =
    import('@sugarch/bc-asset-manager').CustomGroupedAssetDefinitions<CustomGroupBodyName>;

declare namespace Translation {
    type Entry = import('@sugarch/bc-asset-manager').Translation.Entry;
    type Dialog = import('@sugarch/bc-asset-manager').Translation.Dialog;
    type ActivityEntry = import('@sugarch/bc-asset-manager').Translation.ActivityEntry;
    type GroupedEntries = import('@sugarch/bc-asset-manager').Translation.GroupedEntries<CustomGroupBodyName>;
    type CustomRecord<T extends string, U> = import('@sugarch/bc-asset-manager').Translation.CustomRecord<T, U>;
}

type AssetOverrideContainer = import('@sugarch/bc-asset-manager').AssetOverrideContainer;

type CopyGroupInfo = { name: CustomGroupName; mirror: AssetGroupName; description?: Translation.Entry };

type CustomActivityPrerequisite =
    | ActivityPrerequisite
    | 'TargetHasTail'
    | 'TargetHasWings'
    | 'TargetHasLeash'
    | 'TargetHasCatTail'
    | 'TargetHasTentacles'
    | 'NeedTentacles'
    | 'NeedPawMittens'
    | 'NeedPetSuit'
    | 'NeedKennel'
    | 'TargetHasItemVulvaPiercings'
    | 'TargetHasItemVulva'
    | 'NeedSword'
    | 'NeedScissors'
    | 'NeedCloth'
    | 'NeedNoCloth'
    | 'NeedNoClothLower'
    | 'NeedBra'
    | 'NeedPanties'
    | 'NeedSocks'
    | 'NeedSuitLower鱼鱼尾_Luzi'
    | 'Need阿巴阿巴_Luzi';

type CustomActivity = Omit<Activity, 'Name' | 'Prerequisite' | 'ActivityID'> & {
    Name: string;
    ActivityID?: number;
    Prerequisite: ActivityManagerInterface.ExCustomActivityPrerequisite[];
};

declare namespace ActivityManagerInterface {
    type ActivityDialogKey = `Chat${'Other' | 'Self'}-${AssetGroupItemName}-${CustomActivity['Name']}`;

    type ActivityRunnableTriggerMode = 'OnSelf' | 'OtherOnSelf' | 'OnOther';

    type PrerequisiteCheckFunction = (
        ...args: ModManagerInterface.FunctionArguments<'ActivityCheckPrerequisite'>
    ) => boolean;

    type ExCustomActivityPrerequisite = CustomActivityPrerequisite | ActivityManagerInterface.PrerequisiteCheckFunction;

    interface ICustomActivityPrerequisite {
        readonly name: CustomActivityPrerequisite;
        readonly test: PrerequisiteCheckFunction;
    }

    interface IActivityRunnable {
        readonly mode?: ActivityRunnableTriggerMode;
        run?: (player: PlayerCharacter, sender: Character, info: ActivityInfo) => void;
    }

    interface ICustomActivity extends IActivityRunnable {
        readonly activity: CustomActivity;

        // 提供一个字符串时，代表使用对应的动作的图片。提供[组名, 物品名]时，代表使用对应的物品的图片。
        readonly useImage?: [AssetGroupName, string] | ActivityName;
        // 对他人使用动作的动作名称
        readonly label?: Translation.ActivityEntry | Translation.Entry;
        readonly dialog?: Translation.ActivityEntry | Translation.Entry;
        // 对自己使用动作的动作名称，如果没有定义则使用 label
        readonly labelSelf?: Translation.ActivityEntry | Translation.Entry;
        readonly dialogSelf?: Translation.ActivityEntry | Translation.Entry;
    }

    interface IActivityModifier extends Required<IActivityRunnable> {
        readonly name: ActivityName;
    }

    interface ActivityInfo {
        SourceCharacter: number;
        TargetCharacter: number;
        ActivityGroup: AssetGroupName;
        ActivityName: string;
        Asset?: {
            AssetName: string;
            CraftName: string;
            GroupName: AssetGroupItemName;
        };
        BCDictionary: ChatMessageDictionaryEntry[];
    }
}

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
