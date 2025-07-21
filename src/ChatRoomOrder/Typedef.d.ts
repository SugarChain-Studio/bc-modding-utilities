type PrevXCharacterState = {
    prevCharacter: number;
};

type NextXCharacterState = {
    nextCharacter: number;
};

type PrevOrNextXCharacter = PrevXCharacterState | NextXCharacterState;

interface XCharacterDrawOrderBase extends PrevOrNextXCharacter {
    drawState?: { X: number; Y: number; Zoom: number };
}
interface XCharacterDrawOrderAssetState extends XCharacterDrawOrderBase {
    associatedAsset: { group: AssetGroupItemName; asset: string };
}

interface XCharacterDrawOrderPoseState extends XCharacterDrawOrderBase {
    associatedPose: { pose: AssetPoseName[] };
}

interface XCharacterDrawOrderTimerState extends XCharacterDrawOrderBase {
    timer: number;
}

type XCharacterDrawOrderState =
    | XCharacterDrawOrderAssetState
    | XCharacterDrawOrderPoseState
    | XCharacterDrawOrderTimerState;

type XCharacter = {
    XCharacterDrawOrder?: XCharacterDrawOrderState;
} & Character;
