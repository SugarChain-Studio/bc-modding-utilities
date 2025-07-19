interface XCharacterDrawOrderState {
    prevCharacter?: number;
    nextCharacter?: number;
    associatedAsset?: { group: AssetGroupItemName; asset: string };
    associatedPose?: { pose: AssetPoseName[] };
    drawState?: { X: number; Y: number; Zoom: number };
}

interface XCharacterDrawOrderBase {
    prevCharacter: number;
    nextCharacter: number;
    drawState?: { X: number; Y: number; Zoom: number };
}

interface XCharacterDrawOrderWithAsset extends XCharacterDrawOrderBase {
    associatedAsset: { group: AssetGroupItemName; asset: string };
}

interface XCharacterDrawOrderWithPose extends XCharacterDrawOrderBase {
    associatedPose: { pose: AssetPoseName[] };
}

interface XCharacterDrawOrderWithTimer extends XCharacterDrawOrderBase {
    timer: number;
}

type XCharacter = { XCharacterDrawOrder?: XCharacterDrawOrderState } & Character;
