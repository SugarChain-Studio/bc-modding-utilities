import ModManager from "../ModManager";
import { accessCustomAsset } from "./customStash";

/**
 * @typedef { AppearanceUpdateParameters & { fromModUser?: boolean } } AUParametersExt
 */

/**
 * @param {(param:AppearanceUpdateParameters)=>boolean} fromModUserTest
 */
export function enableNonModValidation(fromModUserTest) {
    // prevent custom assets from being removed by non-mod users
    ModManager.hookFunction("ValidationResolveRemoveDiff", 1, (args, next) => {
        const [previousItem, params] = args;
        if (
            !(/**@type {AUParametersExt} */ (params).fromModUser) &&
            accessCustomAsset(previousItem.Asset.Group.Name, previousItem.Asset.Name)
        ) {
            return { item: previousItem, valid: false };
        }
        return next(args);
    });

    // prevent custom assets from being swapped by non-mod users
    ModManager.hookFunction("ValidationResolveSwapDiff", 1, (args, next) => {
        const [previousItem, _, params] = args;
        if (
            !(/**@type {AUParametersExt} */ (params).fromModUser) &&
            accessCustomAsset(previousItem.Asset.Group.Name, previousItem.Asset.Name)
        ) {
            return { item: previousItem, valid: false };
        }
        return next(args);
    });

    ModManager.hookFunction("ValidationResolveAppearanceDiff", 1, (args, next) => {
        /** @type {AUParametersExt}*/ (args[3]).fromModUser = fromModUserTest(args[3]);
        return next(args);
    });
}
