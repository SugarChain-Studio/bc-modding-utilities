/** @type {import("bondage-club-mod-sdk").ModSDKModInfo} */
export const ModInfo = {
    name: __mod_name__,
    fullName: __mod_full_name__,
    version: __mod_version__,
    repository: __mod_repo__,
};

export const baseURL = __mod_base_url__;

export const resourceBaseURL = __mod_resource_base_url__;

export const assetOverridesURL = `${resourceBaseURL}/assetOverrides.json`;

export const betaFlag = __mod_beta_flag__;

export const debugFlag = __mod_debug_flag__;
