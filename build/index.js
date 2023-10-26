import chalk from 'chalk';
import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { exec } from 'child_process';

const cacheEnabled = process.argv[2] === "cache";
const CDN_URL = "https://cdn.alt-mp.com";

const baseModules = ['coreclr-module', 'js-module'];
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

function generateTags(branch, version, modulesVersions) {
    const buildHash = sha1(`${branch}-${version}-${modulesVersions.join('-')}`);
    const tags = [ 
        version + '-' + buildHash, // 15.4-dev28-ae27872adf6123e023f89a650a6b3c7b96e85fca
        version, // 15.4-dev28
        version.replace(/\.\d+|\d+$/g, ''), // 15-dev or 15 on release
        branch, // dev
    ];

    if (branch === "release") {
        tags.push("latest");
    } else {
        tags.push(version.replace(/\d+$/, '')); // 15.4-dev
    }

    return tags;
}

async function buildBranch(branch) {
    console.log(chalk.gray('Building branch ') + chalk.white(chalk.bold(branch)));

    const modules = [...baseModules];
    if (branch === "release") {
        modules.push("js-bytecode-module");
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
        const tags = generateTags(branch, version, modulesVersions);
        console.log(chalk.gray('Building server with tags ' + tags.map(e => chalk.white(chalk.bold(e))).join(', ')));

        const serializedTags = tags.map(e => `-t ${serverImageName}:${e}`).join(' ');
        const command = cacheEnabled ? 'buildx build --load . --cache-to "type=gha,mode=max" --cache-from type=gha' : 'build .';
        const args = `--build-arg CACHEBUST=${Date.now()} --build-arg BRANCH=${branch}`;
        await sh(`docker ${command} ${args} ${serializedTags}`, './server');
        console.log(chalk.green('Server on branch ') + chalk.white(chalk.bold(branch)) + chalk.green(' built successfully'));
    }

    {
        const tags = generateTags(branch, version, []);
        console.log(chalk.gray('Building voice server with tags ' + tags.map(e => chalk.white(chalk.bold(e))).join(', ')));

        const serializedTags = tags.map(e => `-t ${voiceServerImageName}:${e}`).join(' ');
        const command = cacheEnabled ? 'buildx build --load . --cache-to "type=gha,mode=max" --cache-from type=gha' : 'build .';
        const args = `--build-arg CACHEBUST=${Date.now()} --build-arg BRANCH=${branch}`;
        await sh(`docker ${command} ${args} ${serializedTags}`, './voice-server');
        console.log(chalk.green('Voice server on branch ') + chalk.white(chalk.bold(branch)) + chalk.green(' built successfully'));
    }

    console.log(chalk.green('Build of branch ') + chalk.white(chalk.bold(branch)) + chalk.green(' was successful'));
}

async function run() {
    for (const branch of branches) {
        await buildBranch(branch);
    }
}

run();