declare const __mod_version__: string;
declare const __mod_full_name__: string;
declare const __mod_name__: string;
declare const __mod_repo__: string | undefined;
declare const __mod_base_url__: `${'http://' | 'https://'}${string}`;
declare const __mod_resource_base_url__: `${'http://' | 'https://'}${string}`;
declare const __mod_beta_flag__: boolean;
declare const __mod_debug_flag__: boolean;

declare const __mod_rollup_imports__: string[];
declare const __mod_rollup_setup__: string[];

/** 扩展的身体组（非物品）名称 */
type CustomGroupBodyName =
    | AssetGroupBodyName
    | '新前发_Luzi'
    | '新前发_Luzi_stack'
    | '新后发_Luzi'
    | '新后发_Luzi_stack'
    | '额外头发_Luzi'
    | 'Liquid2_Luzi'
    | '身体痕迹_Luzi'
    | '动物身体_Luzi'
    | '额外身高_Luzi'
    | '长袖子_Luzi'
    | '外观工具'
    | '左眼_Luzi'
    | '右眼_Luzi'
    | 'BodyMarkings2_Luzi'
    | 'Cloth_笨笨蛋Luzi'
    | 'Cloth_笨笨笨蛋Luzi2'
    | 'ClothLower_笨笨蛋Luzi'
    | 'ClothLower_笨笨笨蛋Luzi2'
    | 'Bra_笨笨蛋Luzi'
    | 'Panties_笨笨蛋Luzi'
    | 'Suit_笨笨蛋Luzi'
    | 'SuitLower_笨笨蛋Luzi'
    | 'ClothAccessory_笨笨蛋Luzi'
    | 'ClothAccessory_笨笨笨蛋Luzi2'
    | 'Necklace_笨笨蛋Luzi'
    | 'Shoes_笨笨蛋Luzi'
    | 'Hat_笨笨蛋Luzi'
    | 'HairAccessory3_笨笨蛋Luzi'
    | 'Luzi_HairAccessory3_1'
    | 'Luzi_HairAccessory3_2'
    | 'Gloves_笨笨蛋Luzi'
    | 'Mask_笨笨蛋Luzi'
    | 'Wings_笨笨蛋Luzi'
    | 'LuziCustom';

type CustomGroupName =
    import('@sugarch/bc-mod-types').CustomGroupName<CustomGroupBodyName>;

declare namespace Translation {
    type Entry = import('@sugarch/bc-mod-types').Translation.Entry;
    type Dialog = import('@sugarch/bc-mod-types').Translation.Dialog;
    type String = import('@sugarch/bc-mod-types').Translation.String;
    type ActivityEntry =
        import('@sugarch/bc-mod-types').Translation.ActivityEntry;
    type GroupedEntries =
        import('@sugarch/bc-mod-types').Translation.GroupedEntries<CustomGroupBodyName>;
    type CustomRecord<
        T extends string,
        U
    > = import('@sugarch/bc-mod-types').Translation.CustomRecord<T, U>;

    type CNRecord<T> = Omit<Record<TranslationLanguage, T>, 'CN'> & { CN: T };
}

type AssetOverrideContainer =
    import('@sugarch/bc-mod-types').AssetOverrideContainer;

declare function ServerSend<T extends keyof ClientToServerEvents>(
    Message: T,
    ...args: Parameters<ClientToServerEvents[T]>
): void;
type DrawFunParameters<T extends (...args: any[]) => any> = T extends (
    X: number,
    Y: number,
    W: number,
    H: number,
    ...args: infer P
) => any
    ? P
    : never;

type SliceParameters<
    E extends number,
    T extends (...args: any[]) => any
> = E extends 0
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
    ? T extends (
          _1: any,
          _2: any,
          _3: any,
          _4: any,
          _5: any,
          ...args: infer P
      ) => any
        ? P
        : never
    : never;
