const fs = require("fs");
const path = require("path");
const packageJSON = require(path.join(process.cwd(), "package.json"));
const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");
const replace = require("@rollup/plugin-replace");
const copy = require("rollup-plugin-copy");
const terser = require("@rollup/plugin-terser");
const alias = require("@rollup/plugin-alias");
const css = require("rollup-plugin-import-css");
const { execSync, spawn } = require("child_process");
const LZString = require("lz-string");

function getLatestSemverTag() {
    const ret = execSync("git describe --tags --abbrev=0").toString().trim();
    return ret.startsWith("v") ? ret.substring(1) : ret;
}

/**
 * 分析相对路径，与path.relative()不同的是，返回的路径会保持"./"开头
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
function relativePath(from, to) {
    const ret = path.relative(from, to).replace(/\\/g, "/");
    if (ret === "") return ".";
    return !ret.startsWith("./") ? `./${ret}` : ret;
}

/**
 * 收集组件，生成import语句和setup语句
 * @param { string } componentsDir 组件目录
 * @param { string } baseDir 组件目录是一组相对目录，这些目录的基础目录
 * @param { string } importStartDir import语句的起始目录
 * @returns { { imports: string, setups: string } }
 */
function collectComponents(componentsDir, baseDir, importStartDir) {
    imports = [];
    setups = [];

    const compDir = `${baseDir}/${componentsDir}`;

    const files = ((dir) => {
        const dirWork = [dir];
        const files = [];
        while (dirWork.length > 0) {
            const dir = dirWork.pop();
            const rDir = relativePath(importStartDir, dir);

            fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
                if (file.isDirectory()) dirWork.push(`${dir}/${file.name}`);
                else if (file.isFile() && file.name.endsWith(".js")) {
                    const content = fs
                        .readFileSync(`${dir}/${file.name}`, "utf8")
                        .replace(/\/\/.*\n?|\/\*.*\*\//gm, "");
                    if (!content.match(/export\s+default\s+function\s*\(/)) return;
                    const fileName = file.name.replace(".js", "");
                    files.push({ name: fileName, path: `${rDir}/${fileName}` });
                }
            });
        }
        return files;
    })(compDir);

    files.forEach((file) => {
        imports.push(`import ${file.name} from "${file.path}";`);
        setups.push(`${file.name}();`);
    });

    imports = imports.join("\n");
    setups = setups.join("\n");

    return { imports, setups };
}

/**
 * 从package.json中构建mod信息
 * @param {Object} packageObj 通过require()加载的package.json对象
 * @returns { { name: string, fullName: string, version: string, repo?: string } }
 */
function buildModInfo(packageObj) {
    return {
        name: `${packageObj.displayName}`,
        fullName: `${packageObj.modFullName}`,
        version: getLatestSemverTag(),
        repo: (() => {
            if (!packageObj.repository || !packageObj.repository.url) return undefined;
            if (packageObj.repository.url.startsWith("git+"))
                return `${packageObj.repository.url.replace("git+", "").replace(".git", "")}`;
            return `${packageObj.repository.url.replace(".git", "")}`;
        })(),
    };
}

/**
 * 从package.json中构建rollup设置
 * @param {Object} packageObj 通过require()加载的package.json对象
 * @param {boolean} debugFlag 是否为debug模式
 * @param {boolean} betaFlag 是否为beta模式
 * @returns { { input: string, output: string, loaderName: string, author: string, description:string, componentDir: string, assets: { location: string, assets: string[] }, debug: boolean } }
 */
function buildRollupSetting(packageObj, debugFlag, betaFlag) {
    const ret = { ...packageObj.rollupSetting };
    if (betaFlag) {
        ret.output = packageObj.rollupSetting.beta.output ?? ret.output;
        ret.loaderName = packageObj.rollupSetting.beta.loaderName ?? ret.loaderName;
    }
    ret.debug = !!debugFlag;
    ret.author = packageObj.author;
    ret.description = packageObj.description;
    return ret;
}

/**
 * @typedef { string | AssetOverrideContainer } AssetOverrideLeaf
 * @typedef { Record<string, AssetOverrideLeaf> } AssetOverrideContainer
 * 读取assets映射
 * @param {string} startDir 基础目录
 * @param {string[]} assetDirs 资源目录
 * @returns { Promise<AssetOverrideContainer> } 资源映射表
 */
async function readAssetsMapping(startDir, assetDirs) {
    const git_root = execSync("git rev-parse --show-toplevel").toString().trim();
    const assets = {};

    const git_asset = new Set();

    execSync("git config core.quotepath false");

    const addAsset = (path, version, override = false) => {
        const dirs = path.split(/\\|\//);
        let curDir = assets;

        while (dirs.length > 1) {
            const cur = dirs.shift();
            if (cur === ".") continue;
            if (!curDir[cur]) curDir[cur] = {};
            curDir = curDir[cur];
        }

        const file = dirs[0];
        if (typeof curDir[file] !== "string" || override) curDir[file] = version;
    };

    const process_line = (line) => {
        const [sha, fpath] = line.split(/\t/, 2);
        const relpath = path.relative(startDir, fpath);

        git_asset.add(relpath);

        addAsset(relpath, sha.substring(0, 7));
    };

    const promises = assetDirs
        .map((dir) => path.join(startDir, dir))
        .map((dir) => {
            const ls_tree = spawn("git", ["ls-tree", "--format=%(objectname)%x09%(path)", "-r", "HEAD", dir], {
                cwd: git_root,
            });

            let prev_unfinished = Buffer.alloc(0);

            ls_tree.stdout.on("data", (data) => {
                const linedData = Buffer.concat([prev_unfinished, data]);
                let start = 0;
                for (let i = 0; i < linedData.length; i++) {
                    if (linedData[i] === 0x0a) {
                        process_line(linedData.subarray(start, i).toString());
                        start = i + 1;
                    }
                }
                prev_unfinished = linedData.subarray(start);
            });

            return new Promise((resolve, reject) => {
                ls_tree.on("exit", () => {
                    if (prev_unfinished && prev_unfinished.length > 0) process_line(prev_unfinished.toString());
                    resolve();
                });
                ls_tree.on("error", reject);
            });
        });

    await Promise.all(promises);

    const timeStr = `${Date.now()}`;

    // 发生修改的文件使用时间戳作为版本号
    await new Promise((resolve, reject) => {
        const status = spawn("git", ["status", "--porcelain", startDir], { cwd: git_root });

        status.stdout.on("data", (data) => {
            data.toString()
                .split("\n")
                .forEach((line) => {
                    if (line.length < 4) return;
                    const status = line.substring(0, 2);
                    if (status !== " M" && status !== "M " && status !== "R " && status !== "??") return;

                    const line_path_part = status === "R " ? line.substring(3).split(" -> ")[1] : line.substring(3);

                    const fpath = path.relative(
                        startDir,
                        ((src) => (src.startsWith('"') ? src.substring(1, src.length - 1) : src))(line_path_part)
                    );

                    if (!fpath.endsWith(".png")) return;
                    console.warn(`[WARN] [${fpath}] is not in version control, using timestamp as version`);
                    addAsset(fpath, timeStr, true);
                });
        });

        status.on("exit", resolve);
        status.on("error", reject);
    });

    return assets;
}

/**
 * 创建rollup配置
 * @param { string } baseURL 部署的基础URL
 * @param { ReturnType<typeof buildModInfo> } modInfo 从pacakge.json获取的mod信息, 参考 {@link buildModInfo}
 * @param { ReturnType<typeof buildRollupSetting> } rollupSetting 从pacakge.json获取的rollup设置, 参考 {@link buildRollupSetting}
 * @param { string } utilDir 工具目录
 * @param { boolean } [betaFlag] 是否为beta模式
 */
async function createRollupConfig(baseURL, modInfo, rollupSetting, utilDir, betaFlag = false) {
    // 当前目录需要使用 __dirname, 它可能在多个子目录中被直接eval调用
    // 使用process.cwd()则只能用在作为npm项目根目录的情况
    const curDir = __dirname;

    const buildDestDir = `${process.env.INIT_CWD}/public/`;
    const curDirRelative = relativePath(".", curDir);

    const config = {
        input: `${curDirRelative}/${rollupSetting.input}`,
        output: {
            file: `${buildDestDir}/${rollupSetting.output}`,
            format: "iife",
            sourcemap: rollupSetting.debug ? "inline" : false,
            banner: ``,
        },
        treeshake: true,
    };

    const componentsImports = rollupSetting.componentDir
        ? collectComponents(rollupSetting.componentDir, curDirRelative, rollupSetting.componentDir)
        : { imports: "", setups: "" };

    const assetMapping = LZString.compressToBase64(
        rollupSetting.assets
            ? JSON.stringify(await readAssetsMapping(rollupSetting.assets.location, rollupSetting.assets.assets))
            : "{}"
    );

    const baseURL_ = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;

    const betaString = betaFlag ? "-beta" : "";

    const versionString = (() => {
        if (betaFlag && !modInfo.version.includes("beta")) return `${modInfo.version}-beta`;
        return modInfo.version;
    })();

    const loader_replaces = {
        __base_url__: `${baseURL.endsWith("/") ? baseURL.substring(0, baseURL.length - 1) : baseURL}`,
        __description__: rollupSetting.description,
        __name__: `${modInfo.name}${betaString}`,
        __author__: rollupSetting.author,
        __script_file__: rollupSetting.output,

        __mod_name__: `"${modInfo.name}"`,
        __mod_full_name__: `"${modInfo.fullName}${betaString}"`,
        __mod_version__: `"${versionString}"`,
        __mod_beta_flag__: `${!!betaFlag}`,
        __mod_repo__: modInfo.repo ? `"${modInfo.repo}"` : "undefined",
        __mod_asset_overrides__: `"${assetMapping}"`,
        __mod_base_url__: `"${baseURL}"`,
        __mod_resource_base_url__: `"${baseURL_}${betaFlag ? "beta/" : ""}"`,
        __mod_rollup_imports__: componentsImports.imports,
        __mod_rollup_setup__: componentsImports.setups,
    };

    return {
        ...config,
        plugins: [
            copy({
                targets: [
                    {
                        src: `${curDirRelative}/${utilDir}/loader.template.user.js`,
                        dest: buildDestDir,
                        rename: rollupSetting.loaderName,
                        transform: (contents) =>
                            Object.entries(loader_replaces).reduce(
                                (pv, [from, to]) => pv.replace(from, to),
                                contents.toString()
                            ),
                    },
                ],
            }),
            replace({
                ...loader_replaces,
                preventAssignment: false,
            }),
            alias({
                entries: {
                    "@mod-utils": `${curDir}/${utilDir}/src`,
                    "bondage-club-mod-sdk": `${curDir}/node_modules/bondage-club-mod-sdk`,
                },
            }),
            commonjs(),
            resolve({ browser: true }),
            css({ inject: true }),
            ...(rollupSetting.debug ? [] : [terser({ sourceMap: true })]),
        ],
    };
}

module.exports = (cliArgs) => {
    const debug = !!cliArgs.configDebug;
    const baseURL = cliArgs.configBaseURL;
    const beta = !!cliArgs.configBeta;
    const utilsDir = cliArgs.configUtilsDir ? cliArgs.configUtilsDir : "utils";

    const modInfo = buildModInfo(packageJSON);
    const setting = buildRollupSetting(packageJSON, debug, beta);

    const log = (msg) => {
        console.info(`[${modInfo.name}] ${msg}`);
    };

    if (debug) log("Debug mode enabled");
    if (!baseURL || typeof baseURL !== "string") throw new Error("No deploy site specified");

    const baseURL_ = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;

    log(`Deploying to ${baseURL_}`);
    log(`Build time: ${new Date().toLocaleString("zh-CN", { hour12: false })}`);
    log(`Artifact version: ${modInfo.version}`);

    return createRollupConfig(baseURL, modInfo, setting, utilsDir, beta);
};
