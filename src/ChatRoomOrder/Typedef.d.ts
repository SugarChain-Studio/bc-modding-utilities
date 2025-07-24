type PrevXCharacterState = {
    prevCharacter: number;
    nextCharacter?: never;
};

type NextXCharacterState = {
    nextCharacter: number;
    prevCharacter?: never;
};

type PrevOrNextXCharacter = PrevXCharacterState | NextXCharacterState;

interface XCharacterDrawOrderBase {
    drawState?: { X: number; Y: number; Zoom: number };
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
