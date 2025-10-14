type PrevXCharacterState = {
    prevCharacter: number;
    nextCharacter?: never;
};

type NextXCharacterState = {
    nextCharacter: number;
    prevCharacter?: never;
};

type PrevOrNextXCharacter = PrevXCharacterState | NextXCharacterState;

interface XCharacterDrawState {
    X: number;
    Y: number;
    Zoom: number;
}

interface XCharacterDrawOrderBase {
    drawState?: XCharacterDrawState;
    leash?: 'lead' | 'follow';
}

interface XCharacterDrawOrderAssetState {
    associatedAsset: { group: AssetGroupItemName; asset: string };
}

interface XCharacterDrawOrderPoseState {
    associatedPose: { pose: AssetPoseName[] };
}

interface XCharacterDrawOrderTimerState {
    timer: number;
    reason: string;
}

type XCharacterDrawOrderState = PrevOrNextXCharacter &
    XCharacterDrawOrderBase &
    (
        | XCharacterDrawOrderAssetState
        | XCharacterDrawOrderPoseState
        | XCharacterDrawOrderTimerState
    );

type XCharacter = {
    XCharacterDrawOrder?: XCharacterDrawOrderState;
} & Character;

interface CharaPair<T> {
    prev: T;
    next: T;
}

type XCharaPair = CharaPair<XCharacter>;
type XCharaPairAssetState = CharaPair<XCharacterDrawOrderAssetState>;
type XCharaPairPoseState = CharaPair<XCharacterDrawOrderPoseState>;
type XCharaPairTimerState = CharaPair<XCharacterDrawOrderTimerState>;

type DrawOffsetParam = XCharacterDrawState;

type DrawOffsetPipelineFunction = (
    C: Character,
    from: DrawOffsetParam
) => DrawOffsetParam;

type DrawOffsetFunction = (
    C: Character,
    from: DrawOffsetParam
) => DrawOffsetParam | void;

type CustomAssetDefinition =
    import('@sugarch/bc-mod-types').CustomAssetDefinition<CustomGroupName>;

type SharedCenterState = {
    prev: XCharacter;
    next: XCharacter;
    center: { X: number; Y: number };
    where: { prev: XCharacterDrawState; next: XCharacterDrawState };
};

type CtxDrawMods = {
    sharedC: SharedCenterState;
    initState: DrawOffsetParam;
    C: Character;
};

type DrawModifierCallback<T> = (
    arg0: T,
    arg1: CtxDrawMods
) => DrawOffsetParam | undefined;
