import chalk from 'chalk';
import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { exec } from 'child_process';

const cacheEnabled = process.argv[2] === "cache";
const CDN_URL = "https://cdn.alt-mp.com";

const branches = ['dev', 'rc', 'release'];
const platform = 'x64_win32';
const serverImageName = 'altmp/altv-server';
const voiceServerImageName = 'altmp/altv-voice-server';

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @param {String?} cwd
 * @return {Promise<{ stdout: String, stderr: String } | undefined>}
 */
async function sh(cmd, cwd) {
    return new Promise(function (resolve, reject) {
        console.log(chalk.gray(`Executing ${chalk.white.bold(cmd)} in ${chalk.white.bold(cwd || '.')}`));
        const proc = exec(cmd, { cwd }, (err, stdout, stderr) => {
            if (err) {
                err.cwd = cwd;
                console.error(chalk.red(`Failed to execute ${cmd} in ${cwd || '.'}:\n${String(err)}`));
                reject(undefined);
            } else {
                resolve({ stdout, stderr });
            }
        });
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
    });
}

function sha1(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

function generateTags(branch, version, moduleType, modulesVersions) {
    const buildHash = sha1(`${branch}-${version}-${modulesVersions.join('-')}`);
    const modulePostfix = moduleType === "js" ? "-js" : "";
    const tags = [ 
        version + '-' + modulePostfix + buildHash, // 15.4-dev28-ae27872adf6123e023f89a650a6b3c7b96e85fca
        version + modulePostfix, // 15.4-dev28
        version.replace(/\.\d+|.\d+$/g, '') + modulePostfix, // 15-dev or 15 on release
        branch + modulePostfix, // dev
    ];

    if (branch === "release" && moduleType === "all") {
        tags.push("latest");
    } else {
        tags.push(version.replace(/.\d+$/, '') + modulePostfix); // 15.4-dev
    }

    return [buildHash, tags];
}

async function buildDocker(imageName, tags, branch, dockerfilePath, moduleType, cacheKey){
    const command = cacheEnabled ? `buildx build . --push --cache-to "type=inline" --cache-from "type=registry,ref=${imageName}"` : 'build .';
    const args = `--platform linux/amd64 --build-arg CACHEBUST=${cacheKey ?? Date.now()} --build-arg MODULES=${moduleType} --build-arg BRANCH=${branch}`;
    const serializedTags = tags.map(tag => `-t ${imageName}:${tag}`).join(' ');
    await sh(`docker ${command} ${args} ${serializedTags} -f ${dockerfilePath}`);
}

async function buildBranch(branch, moduleType) {
    console.log(chalk.gray('Building branch ') + chalk.white(chalk.bold(branch)) + chalk.gray(' with modules ') + chalk.white(chalk.bold(moduleType)));

    const modules = ["js-module"];
    if (branch === "release") {
        modules.push("js-bytecode-module");
    }
    
    if (moduleType === "all") {
        modules.push('coreclr-module')
    }

    const serverUpdateReq = await fetch(`${CDN_URL}/server/${branch}/${platform}/update.json`);
    const serverUpdate = JSON.parse(await serverUpdateReq.text());
    const version = serverUpdate.version;
    const sdkVersion = serverUpdate.sdkVersion;

    if (!sdkVersion) {
        console.log(chalk.yellow('Branch ') + chalk.bold(chalk.whiteBright(branch)) + chalk.yellow(' does not have SDK version!'));
        return;
    }

    console.log(chalk.gray('SDK version is ') + chalk.white(chalk.bold(sdkVersion)));

    const modulesVersions = [];

    for (const module of modules) {
        const moduleUpdateReq = await fetch(`${CDN_URL}/${module}/${branch}/${platform}/update.json`);
        const moduleUpdate = JSON.parse(await moduleUpdateReq.text());
        const moduleSdkVersion = moduleUpdate.sdkVersion;
        modulesVersions.push(moduleUpdate.version);

        if (!moduleSdkVersion) {
            console.log(chalk.yellow('Module ') + chalk.bold(chalk.whiteBright(module)) + chalk.yellow(' does not have SDK version!'));
            return;
        }
        if (moduleSdkVersion != sdkVersion) {
            console.log(chalk.redBright('SDK mismatch on module ') + chalk.bold(chalk.whiteBright(module + ' ' + moduleUpdate.sdkVersion)));
            return;
        }
    }

    {
        const [buildHash, tags] = generateTags(branch, version, moduleType, modulesVersions);
        const dockerfilePath = moduleType === "all" ? './server/Dockerfile' : './server/js.Dockerfile';
        console.log(chalk.gray('Building server with tags ' + tags.map(e => chalk.white(chalk.bold(e))).join(', ')));
        await buildDocker(serverImageName, tags, branch, dockerfilePath, moduleType, buildHash);
        console.log(chalk.green('Server on branch ') + chalk.white(chalk.bold(branch)) + chalk.green(' built successfully'));
    }

    if (moduleType === "all") {
        const [buildHash, tags] = generateTags(branch, version, moduleType, []);
        console.log(chalk.gray('Building voice server with tags ' + tags.map(e => chalk.white(chalk.bold(e))).join(', ')));
        await buildDocker(voiceServerImageName, tags, branch, './voice-server/Dockerfile', moduleType, buildHash);
        console.log(chalk.green('Voice server on branch ') + chalk.white(chalk.bold(branch)) + chalk.green(' built successfully'));
    }

    console.log(chalk.green('Build of branch ') + chalk.white(chalk.bold(branch)) + chalk.green(' was successful'));
}

async function run() {
    console.log(chalk.gray('Building alt:V Docker images with ') + chalk.white(chalk.bold(cacheEnabled ? 'cache (images will be pushed automatically)' : 'no cache')));
    for (const branch of branches) {
        await buildBranch(branch, "js");
        await buildBranch(branch, "all");
    }
}

run();