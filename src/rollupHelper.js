/** @type {import("bondage-club-mod-sdk").ModSDKModInfo} */
export const ModInfo = {
    name: __mod_name__,
    fullName: __mod_full_name__,
    version: __mod_version__,
    repository: __mod_repo__,
};

/** @type { AssetOverrideContainer } */
export const assetOverrides = JSON.parse(LZString.decompressFromBase64(__mod_asset_overrides__));

export const baseURL = __mod_base_url__;

export const resourceBaseURL = __mod_resource_base_url__;

export const betaFlag = __mod_beta_flag__;
