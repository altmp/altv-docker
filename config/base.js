import chalk from 'chalk';
import toml from '@iarna/toml';
import fs from 'fs';

class ParseError extends Error {}

function debugLog(msg) {
    if (process.env.ALTV_VERBOSE !== "yes" && process.env.ALTV_VERBOSE !== "true" && process.env.ALTV_VERBOSE !== "y" && process.env.ALTV_VERBOSE !== "1") return;
    console.log(chalk.gray(chalk.blueBright('VERBOSE ') + msg));
}

export function obj(obj) {
    if (Object.values(obj).find(Boolean)) return obj;
    return undefined;
}

export function exists(env) {
    const val = process.env[env];
    if (val == null) return false;
    return true;
}

export function str(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    return val;
}

export function num(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    const res = +val;
    if (!isNaN(res)) return res;
    throw new ParseError('Failed to parse ' + chalk.bold(env) + ': ' + chalk.white(chalk.bold(val) + ' is not a number'));
}

export function jsonObj(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    return JSON.parse(val);
}

export function bool(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    const lower = val.toLowerCase();
    if (lower === "yes" || lower === "true" || lower === "y" || lower === "1") return true;
    if (lower === "no" || lower === "false" || lower === "n" || lower === "0") return false;
    throw new ParseError('Failed to parse ' + chalk.bold(env) + ': ' + chalk.white(chalk.bold(val) + ' is not a boolean'));
}

export function arr(env, separator = ',') {
    const val = process.env[env];
    if (val == null) return undefined;
    return val.split(separator).filter(Boolean);
}

export function generate(filename, getSettings) {
    try {
        if (fs.existsSync('./' + filename) && !bool('ALTV_USE_ENV_CONFIG')) {
            debugLog('Found existing ' + chalk.bold(filename) + ', skipping generation');
            if (exists('ALTV_USE_ENV_CONFIG')) return 0;
            console.log(chalk.yellowBright('Found existing ' + chalk.bold(filename) + '! Skipping environment server parameters'));
            console.log('You can change this behavior or hide this message by setting ' + chalk.bold('ALTV_USE_ENV_CONFIG') + ' option');
            // console.log('See ' + chalk.bold('https://go.altv.mp/docker-env-config') + ' for more details');
            return 0;
        }

        if (fs.existsSync('./' + filename) && bool('ALTV_USE_ENV_CONFIG')) {
            debugLog('Found existing ' + chalk.bold(filename) + ', but overriding it with environment parameters, because ' + chalk.bold('ALTV_OVERRIDE_EXISTING_CONFIG') + ' is true');
        }

        const settings = getSettings();

        debugLog('Writing to ' + filename + ':\n' + toml.stringify(settings));
        fs.writeFileSync('./' + filename, toml.stringify(settings));
        console.log(chalk.greenBright('Saved config params to ' + chalk.bold(filename)));
        return 0;
    } catch(e) {
        console.error(chalk.redBright(e instanceof ParseError ? e.message : (e?.stack ?? String(e))));
        return 1;
    }
}