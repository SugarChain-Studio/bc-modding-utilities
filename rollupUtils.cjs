const fs = require("fs");
const { execSync, spawn } = require("child_process");
const path = require("path");
const alias = require("@rollup/plugin-alias");
const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");
const replace = require("@rollup/plugin-replace");
const terser = require("@rollup/plugin-terser");
const copy = require("rollup-plugin-copy");
const css = require("rollup-plugin-import-css");
const { defineConfig } = require("rollup");
const LZString = require("lz-string");

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

function unescapeGitPath(str) {
    const bytes = [];

    for (let i = 0; i < str.length; ) {
        if (str[i] === "\\" && /^[0-7]{3}/.test(str.slice(i + 1, i + 4))) {
            // 八进制
            const oct = str.slice(i + 1, i + 4);
            bytes.push(parseInt(oct, 8));
            i += 4;
        } else {
            // 普通字符
            bytes.push(str.charCodeAt(i));
            i++;
        }
    }

    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

/**
 * 收集组件，生成import语句和setup语句
 * @param { string } componentsDir 组件目录
 * @param { string } baseDir 组件目录是一组相对目录，这些目录的基础目录
 * @param { string } importStartDir import语句的起始目录
 * @returns { { imports: string, setups: string } }
 */
function collectComponents(componentsDir, baseDir, importStartDir) {
    let imports = [];
    let setups = [];

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
                    if (
                        !content.match(
                            /export\s+default\s+(function\s*\(|\(\s*\)|\w+)/
                        )
                    )
                        return;
                    const fileName = file.name.replace(".js", "");
                    files.push({ name: fileName, path: `${rDir}/${fileName}` });
                }
            });
        }
        return files;
    })(compDir);

    const prefix = `A${Math.random().toString(36).substring(2, 8)}`;
    let counter = 0;

    files.forEach((file) => {
        const name = `${prefix}${counter++}`;
        imports.push(`import ${name} from "${file.path}";`);
        setups.push(`${name}();`);
    });

    imports = imports.join("\n");
    setups = setups.join("\n");

    return { imports, setups };
}

/**
 * 从package.json中构建rollup设置
 * @param {Object} packageObj 通过require()加载的package.json对象
 * @param {ReturnType<typeof parseEnv>} env 环境参数
 * @returns { { input: string, output: string, loaderName: string, author: string, description:string, componentDir: string, assets: { location: string, assets: string[] }} }
 */
function buildRollupSetting(packageObj, env) {
    const ret = { ...packageObj.rollupSetting };
    if (env.beta) {
        ret.output = packageObj.rollupSetting.beta.output ?? ret.output;
        ret.loaderName =
            packageObj.rollupSetting.beta.loaderName ?? ret.loaderName;
    }
    ret.author = packageObj.author;
    ret.description = packageObj.description;
    return ret;
}

/**
 * 分析git ls-tree，获取文件列表
 * @param {string} git_root
 * @param {string} startDir
 * @param {string} dir
 * @returns {Promise<Set<string>>} Set<路径>
 */
async function gitLsTree(git_root, startDir, dir) {
    /** @type {Set<string>} */
    const ret = new Set();

    const processLine = (line) => {
        if (line.startsWith('"')) {
            line = unescapeGitPath(line.slice(1, -1));
        }
        ret.add(path.relative(startDir, line).replace(/\\/g, "/"));
    };

    const ls_process = spawn(
        "git",
        ["ls-tree", "--format=%(path)", "-r", "HEAD", dir],
        {
            cwd: git_root,
        }
    );

    let prev_unfinished = Buffer.alloc(0);

    ls_process.stdout.on("data", (data) => {
        const linedData = Buffer.concat([prev_unfinished, data]);
        let start = 0;
        for (let i = 0; i < linedData.length; i++) {
            if (linedData[i] === 0x0a) {
                processLine(linedData.subarray(start, i).toString());
                start = i + 1;
            }
        }
        prev_unfinished = linedData.subarray(start);
    });

    return new Promise((resolve, reject) => {
        ls_process.on("exit", () => {
            if (prev_unfinished.length > 0)
                processLine(prev_unfinished.toString());
            resolve(ret);
        });
        ls_process.on("error", reject);
    });
}

/**
 * 分析git log，获取文件的版本信息
 * @param {string} git_root
 * @param {string} startDir
 * @param {string} dir
 * @returns {Promise<Map<string, string>>} Map<路径, 版本>
 */
async function gitLogFileHistory(git_root, startDir, dir) {
    /** @type {Map<string, string>} */
    const ret = new Map();

    const log_process = spawn(
        "git",
        ["log", "--pretty=format:'%H'", "--name-only", "--", dir],
        {
            cwd: git_root,
        }
    );
    let prev_unfinished = Buffer.alloc(0);

    let cur_sha = "";
    const processLine = (line) => {
        if (line.startsWith("'") && line.length === 42) {
            cur_sha = line.slice(1, -1);
            return;
        }
        if (line.startsWith('"')) {
            line = unescapeGitPath(line.slice(1, -1));
        }
        const p = path.relative(startDir, line).replace(/\\/g, "/");
        if (!ret.has(p)) ret.set(p, cur_sha);
    };

    log_process.stdout.on("data", (data) => {
        const linedData = Buffer.concat([prev_unfinished, data]);
        let start = 0;
        for (let i = 0; i < linedData.length; i++) {
            if (linedData[i] === 0x0a) {
                if (start !== i)
                    processLine(linedData.subarray(start, i).toString());
                start = i + 1;
            }
        }
        prev_unfinished = linedData.subarray(start);
    });

    return new Promise((resolve, reject) => {
        log_process.on("exit", () => {
            if (prev_unfinished.length > 0)
                processLine(prev_unfinished.toString());
            resolve(ret);
        });
        log_process.on("error", reject);
    });
}

/**
 * 检查未提交的修改
 * @param {string} git_root
 * @param {string} startDir
 * @returns {Promise<{edit:Set<string>, remove:Set<string>}>} 修改和删除的文件列表
 */
function gitChanges(git_root, startDir) {
    const timeStr = `${Date.now()}`;

    return new Promise((resolve, reject) => {
        /** @type {Set<string>} */
        const edit = new Set();
        /** @type {Set<string>} */
        const remove = new Set();

        const status = spawn("git", ["status", "--porcelain", startDir], {
            cwd: git_root,
        });

        let prev_unfinished = Buffer.alloc(0);

        const process_git_status = (line) => {
            if (line.length < 4) return;
            const status = line.substring(0, 2);
            const line_path_part =
                status === "R "
                    ? line.substring(3).split(" -> ")[1]
                    : line.substring(3);

            const unescaped = line_path_part.startsWith('"')
                ? unescapeGitPath(
                      line_path_part.substring(1, line_path_part.length - 1)
                  )
                : line_path_part;
            if ([" M", "M ", "R ", "??", "A "].includes(status)) {
                const fpath = path
                    .relative(startDir, unescaped)
                    .replace(/\\/g, "/");
                if (!fpath.endsWith(".png")) return;
                console.warn(
                    `[WARN] [${fpath}] is not in version control, using timestamp as version : ${timeStr}`
                );
                edit.add(fpath);
            } else if (status === " D" || status === "D ") {
                const fpath = path
                    .relative(startDir, unescaped)
                    .replace(/\\/g, "/");
                remove.add(fpath);
                console.warn(
                    `[WARN] [${fpath}] has been removed from version control`
                );
            }
        };

        status.stdout.on("data", (data) => {
            const linedData = Buffer.concat([prev_unfinished, data]);
            let start = 0;
            for (let i = 0; i < linedData.length; i++) {
                if (linedData[i] === 0x0a) {
                    process_git_status(linedData.subarray(start, i).toString());
                    start = i + 1;
                }
            }
            prev_unfinished = linedData.subarray(start);
        });

        status.on("exit", () => {
            if (prev_unfinished && prev_unfinished.length > 0)
                process_git_status(prev_unfinished.toString());
            resolve({ edit, remove });
        });
        status.on("error", reject);
    });
}

/**
 * @typedef { Record<string, string[]> } AssetOverrideContainer
 * 读取assets映射
 * @param {string} startDir 基础目录
 * @param {string[]} assetDirs 资源目录
 * @param {boolean} checkChanges 是否检查未提交的修改，默认为false
 * @returns { Promise<AssetOverrideContainer> } 资源映射表
 */
async function readAssetsMapping(startDir, assetDirs, checkChanges = false) {
    const git_root = execSync("git rev-parse --show-toplevel")
        .toString()
        .trim();

    /** @type {AssetOverrideContainer} */
    const assets = {};

    execSync("git config core.quotepath true");

    const addAssetCache = (path, version, override = false) => {
        if (assetCatch.has(path) && !override) return;
        assetCatch.set(path, version);
    };

    const addAsset = (path, version, override = false) => {
        assets[version] ??= [];
        if (!assets[version].includes(path) || override) {
            assets[version].push(path);
        }
    };

    const dirs = assetDirs.map((dir) =>
        path.join(startDir, dir).replace(/\\/g, "/")
    );

    const lspaths = await (async () => {
        /** @type {string[]} */
        const ret = [];
        for (const dir of dirs) {
            const files = await gitLsTree(git_root, startDir, dir);
            files.forEach((f) => ret.push(f));
        }
        return ret;
    })();

    const logpaths = await (async () => {
        /** @type {Map<string,string>} */
        const ret = new Map();
        for (const dir of dirs) {
            const log = await gitLogFileHistory(git_root, startDir, dir);
            for (const [file, sha] of log) {
                ret.set(file, sha);
            }
        }
        return ret;
    })();

    /**
     * Map<路径, 版本>
     * @type {Map<string,string>}
     */
    const assetCatch = new Map();

    for (const path of lspaths) {
        if (logpaths.has(path)) {
            addAssetCache(path, logpaths.get(path));
        } else {
            console.warn(
                `[WARN] [${path}] is not in commit history, using timestamp as version`
            );
        }
    }

    const timeStr = `${Date.now()}`;

    if (checkChanges) {
        // 发生修改的文件使用时间戳作为版本号
        const { edit, remove } = await gitChanges(git_root, startDir);
        edit.forEach((path) => addAssetCache(path, timeStr, true));
        remove.forEach((path) => assetCatch.delete(path));
    }

    assetCatch.forEach((version, path) => addAsset(path, version));

    return assets;
}

function getLatestSemverTag(packageObj) {
    try {
        const ret = execSync("git describe --tags --abbrev=0")
            .toString()
            .trim();
        return ret.startsWith("v") ? ret.substring(1) : ret;
    } catch (e) {
        if (packageObj.version) return packageObj.version;
        console.warn(
            "[WARN] No git tag found, nor version in package.json, using v0.0.0 as version"
        );
        return "0.0.0";
    }
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
        version: getLatestSemverTag(packageObj),
        repo: (() => {
            if (!packageObj.repository || !packageObj.repository.url)
                return undefined;
            if (packageObj.repository.url.startsWith("git+"))
                return `${packageObj.repository.url
                    .replace("git+", "")
                    .replace(".git", "")}`;
            return `${packageObj.repository.url.replace(".git", "")}`;
        })(),
    };
}

/**
 * 创建用于 @rollup/plugin-replace 的替换记录
 * @param { object } param0
 * @param { ReturnType<typeof parseEnv> } param0.env 环境参数
 * @param { string } param0.baseURL 部署的基础URL
 * @param { ReturnType<typeof buildModInfo> } param0.modInfo 从pacakge.json获取的mod信息, 参考 {@link buildModInfo}
 * @param { ReturnType<typeof buildRollupSetting> } param0.rollupSetting 从pacakge.json获取的rollup设置, 参考 {@link buildRollupSetting}
 * @param { string } param0.curDir 当前目录
 * @param { boolean } [param0.beta] 是否为beta模式
 */
async function createReplaceRecord({ env, modInfo, rollupSetting }) {
    const componentsImports = rollupSetting.componentDir
        ? collectComponents(
              rollupSetting.componentDir,
              env.curDir,
              rollupSetting.componentDir
          )
        : { imports: "", setups: "" };

    const betaString = env.beta ? "-beta" : "";

    const versionString = (() => {
        if (env.beta && !modInfo.version.includes("beta"))
            return `${modInfo.version}-beta`;
        return modInfo.version;
    })();

    return {
        loaderReplace: {
            __base_url__: `${
                env.baseURL.endsWith("/")
                    ? env.baseURL.substring(0, env.baseURL.length - 1)
                    : env.baseURL
            }`,
            __description__: rollupSetting.description,
            __name__: `${modInfo.name}${betaString}`,
            __author__: rollupSetting.author,
            __script_file__: rollupSetting.output,
        },
        scriptReplace: {
            __mod_name__: `"${modInfo.name}"`,
            __mod_full_name__: `"${modInfo.fullName}${betaString}"`,
            __mod_version__: `"${versionString}"`,
            __mod_beta_flag__: `${!!env.beta}`,
            __mod_repo__: modInfo.repo ? `"${modInfo.repo}"` : "undefined",
            __mod_base_url__: `"${env.baseURL}"`,
            __mod_resource_base_url__: `"${env.resourceURL}"`,
            __mod_rollup_imports__: componentsImports.imports,
            __mod_rollup_setup__: componentsImports.setups,
            __mod_debug_flag__: `${env.debug}`,
        },
    };
}

/**
 * 写入资源映射文件
 * @param {object} param0
 * @param { ReturnType<typeof parseEnv> } param0.env 环境参数
 * @param {object} param0.rollupSetting rollup设置
 */
async function writeAssetOverrides({ env, rollupSetting }) {
    const assetMappings = await readAssetsMapping(
        rollupSetting.assets.location,
        rollupSetting.assets.assets,
        env.debug
    );
    if (!fs.existsSync(env.resourceDir))
        fs.mkdirSync(env.resourceDir, { recursive: true });
    if (env.debug) {
        fs.writeFileSync(
            `${env.resourceDir}assetOverrides.json`,
            JSON.stringify(assetMappings, null, 2)
        );
    }
    fs.writeFileSync(
        `${env.resourceDir}assetOverrides.lz`,
        LZString.compressToBase64(JSON.stringify(assetMappings))
    );
}

/**
 * 创建构建插件的rollup配置
 * @param { object } param0
 * @param { ReturnType<typeof parseEnv> } param0.env 环境参数
 * @param { object } param0.packageJSON package.json对象
 * @param { string } [param0.banner] 可选的banner字符串
 */
async function createModRollupConfig({ env, packageJSON, banner = "" }) {
    const modInfo = buildModInfo(packageJSON);
    const rollupSetting = buildRollupSetting(packageJSON, env);

    const log = (msg) => {
        console.info(`[${modInfo.name}] ${msg}`);
    };

    if (env.debug) log("Debug mode enabled");
    log(`Deploying to ${env.baseURL}`);
    log(`Build time: ${new Date().toLocaleString("zh-CN", { hour12: false })}`);
    log(`Artifact version: ${modInfo.version}`);
    log(`Current directory: ${env.curDir}`);
    log(`Destination directory: ${env.destDir}`);

    const config = defineConfig({
        input: `${env.curDir}/${rollupSetting.input}`,
        output: {
            file: `${env.destDir}/${rollupSetting.output}`,
            format: "iife",
            sourcemap: env.debug ? "inline" : true,
            banner,
        },
        treeshake: true,
        external: [
            "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm",
            "https://cdn.jsdelivr.net/npm/bondage-club-mod-sdk@1.2.0",
        ],
    });

    await writeAssetOverrides({
        env,
        rollupSetting,
    });

    const { loaderReplace, scriptReplace } = await createReplaceRecord({
        env,
        modInfo,
        rollupSetting,
    });

    return defineConfig({
        ...config,
        plugins: [
            copy({
                targets: [
                    {
                        src: `${env.curDir}/${env.utilDir}/loader.template.user.js`,
                        dest: env.destDir,
                        rename: rollupSetting.loaderName,
                        transform: (contents) =>
                            Object.entries(loaderReplace).reduce(
                                (pv, [from, to]) => pv.replace(from, to),
                                contents.toString()
                            ),
                    },
                ],
            }),
            replace({
                ...scriptReplace,
                preventAssignment: false,
            }),
            alias({
                entries: {
                    "@mod-utils": `${env.curDir}/${env.utilDir}/src`,
                },
            }),
            commonjs(),
            resolve({ browser: true }),
            css({ inject: true }),
            ...(env.debug ? [] : [terser({ sourceMap: true })]),
        ],
    });
}

/**
 * 处理环境相关的配置
 * @param {string} curDir
 * @param {any} cliArgs
 */
function parseEnv(curDir, cliArgs) {
    let baseURL = cliArgs.configBaseURL;
    if (typeof baseURL !== "string") {
        throw new Error("No deploy site specified");
    }

    baseURL = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    const beta = !!cliArgs.configBeta;
    const curDir_ = path.resolve(curDir).replace(/\\/g, "/");

    return {
        curDir: curDir_,
        destDir: `${curDir_}/public/`,
        resourceDir: `${curDir_}/public/${beta ? "beta/" : ""}`,
        utilDir: /** @type {string} */ (cliArgs.configUtilsDir || "utils"),
        baseURL,
        resourceURL: `${baseURL}${beta ? "beta/" : ""}`,
        debug: !!cliArgs.configDebug,
        beta: !!cliArgs.configBeta,
    };
}

module.exports = {
    relativePath,
    collectComponents,
    buildRollupSetting,
    readAssetsMapping,
    getLatestSemverTag,
    buildModInfo,
    createReplaceRecord,
    writeAssetOverrides,
    createModRollupConfig,
    parseEnv,
};
