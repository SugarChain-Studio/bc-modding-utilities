import { assetOverridesURL, ModInfo, debugFlag } from "@mod-utils/rollupHelper";

/**
 *
 * @param {string} url
 * @param {number} [retries = 3]
 * @param {number} [delay = 1000]
 * @returns {Promise<any>}
 */
async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const urlWithVersion = new URL(url);
            if (debugFlag) {
                urlWithVersion.searchParams.set("version", `${Date.now()}`);
            } else {
                urlWithVersion.searchParams.set("version", ModInfo.version);
            }

            const response = await fetch(urlWithVersion.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
            }
        }
    }
}

/**
 *
 * @param {number} [retries = 3]
 * @param {number} [delay = 1000]
 * @returns {Promise<AssetOverrideContainer>}
 */
export async function fetchAssetOverrides(retries = 3, delay = 1000) {
    return await fetchWithRetry(assetOverridesURL, retries, delay);
}
