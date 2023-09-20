import chalk from 'chalk';
import toml from '@iarna/toml';
import fs from 'fs';

class ParseError extends Error {}

function debugLog(msg) {
    if (process.env.ALTV_VERBOSE !== "yes" && process.env.ALTV_VERBOSE !== "true" && process.env.ALTV_VERBOSE !== "y" && process.env.ALTV_VERBOSE !== "1") return;
    console.log(chalk.gray(chalk.blueBright('VERBOSE ') + msg));
}

function obj(obj) {
    if (Object.values(obj).find(Boolean)) return obj;
    return undefined;
}

function exists(env) {
    const val = process.env[env];
    if (val == null) return false;
    return true;
}

function str(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    return val;
}

function num(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    const res = +val;
    if (!isNaN(res)) return res;
    throw new ParseError('Failed to parse ' + chalk.bold(env) + ': ' + chalk.white(chalk.bold(val) + ' is not a number'));
}

function jsonObj(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    return JSON.parse(val);
}

function bool(env) {
    const val = process.env[env];
    if (val == null) return undefined;
    const lower = val.toLowerCase();
    if (lower === "yes" || lower === "true" || lower === "y" || lower === "1") return true;
    if (lower === "no" || lower === "false" || lower === "n" || lower === "0") return false;
    throw new ParseError('Failed to parse ' + chalk.bold(env) + ': ' + chalk.white(chalk.bold(val) + ' is not a boolean'));
}

function arr(env, separator = ',') {
    const val = process.env[env];
    if (val == null) return undefined;
    return val.split(separator).filter(Boolean);
}

function run() {
    try {
        if (fs.existsSync('./server.toml') && !bool('ALTV_USE_ENV_CONFIG')) {
            debugLog('Found existing ' + chalk.bold('server.toml') + ', skipping generation');
            if (exists('ALTV_USE_ENV_CONFIG')) return 0;
            console.log(chalk.yellowBright('Found existing ' + chalk.bold('server.toml') + '! Skipping environment server parameters'));
            console.log('You can change this behavior or hide this message by setting ' + chalk.bold('ALTV_USE_ENV_CONFIG') + ' option');
            // console.log('See ' + chalk.bold('https://go.altv.mp/docker-env-config') + ' for more details');
            return 0;
        }

        if (fs.existsSync('./server.toml') && bool('ALTV_USE_ENV_CONFIG')) {
            debugLog('Found existing ' + chalk.bold('server.toml') + ', but overriding it with environment parameters, because ' + chalk.bold('ALTV_OVERRIDE_EXISTING_CONFIG') + ' is true');
        }
        
        const defaultModules = [ 'js-module', 'csharp-module' ];

        if (process.env.ALTV_BRANCH === 'release') {
            defaultModules.push('js-bytecode-module');
        }

        const settings = {
            name: str('ALTV_NAME'),
            host: str('ALTV_HOST'),
            port: num('ALTV_PORT'),
            players: num('ALTV_PLAYERS'),
            password: str('ALTV_PASSWORD'),
            announce: bool('ALTV_ANNOUNCE'),
            token: str('ALTV_TOKEN'),
            gamemode: str('ALTV_GAMEMODE'),
            website: str('ALTV_WEBSITE'),
            language: str('ALTV_LANGUAGE'),
            description: str('ALTV_DESCRIPTION'),
            debug: bool('ALTV_DEBUG'),
            streamingDistance: num('ALTV_STREAMING_DISTANCE'),
            migrationDistance: num('ALTV_MIGRATION_DISTANCE'),
            timeout: num('ALTV_TIMEOUT'),
            announceRetryErrorDelay: num('ALTV_ANNOUNCE_RETRY_ERROR_DELAY'),
            announceRetryErrorAttempts: num('ALTV_ANNOUNCE_RETRY_ERROR_ATTEMPTS'),
            duplicatePlayers: num('ALTV_DUPLICATE_PLAYERS'),
            mapBoundsMinX: num('ALTV_MAP_BOUNDS_MIN_X'),
            mapBoundsMinY: num('ALTV_MAP_BOUNDS_MIN_Y'),
            mapBoundsMaxX: num('ALTV_MAP_BOUNDS_MAX_X'),
            mapBoundsMaxY: num('ALTV_MAP_BOUNDS_MAX_Y'),
            mapCellAreaSize: num('ALTV_MAP_CELL_AREA_SIZE'),
            colShapeTickRate: num('ALTV_COL_SHAPE_TICK_RATE'),
            logStreams: arr('ALTV_LOG_STREAMS'),
            tags: arr('ALTV_TAGS'),
            connectionQueue: bool('ALTV_CONNECTION_QUEUE'),
            useEarlyAuth: exists('ALTV_EARLY_AUTH_URL'),
            earlyAuthUrl: str('ALTV_EARLY_AUTH_URL'),
            useCdn: exists('ALTV_CDN_URL'),
            cdnUrl: str('ALTV_CDN_URL'),
            sendPlayerNames: bool('ALTV_SEND_PLAYER_NAMES'),
            spawnAfterConnect: bool('ALTV_SPAWN_AFTER_CONNECT'),
            hashClientResourceName: bool('ALTV_HASH_CLIENT_RESOURCE_NAME'),
            sharedProjectName: str('ALTV_SHARED_PROJECT_NAME'),
            sharedProjectKey: str('ALTV_SHARED_PROJECT_KEY'),
            resources: arr('ALTV_RESOURCES') ?? ['*'],
            modules: arr('ALTV_MODULES') ?? defaultModules,
            'dlc-whitelist': arr('ALTV_DLC_WHITELIST'),
            voice: obj({
                bitrate: num('ALTV_VOICE_BITRATE'),
                externalSecret: str('ALTV_VOICE_EXTERNAL_SECRET'),
                externalHost: str('ALTV_VOICE_EXTERNAL_HOST'),
                externalPort: num('ALTV_VOICE_EXTERNAL_PORT'),
                externalPublicHost: str('ALTV_VOICE_EXTERNAL_PUBLIC_HOST'),
                externalPublicPort: num('ALTV_VOICE_EXTERNAL_PUBLIC_PORT')
            }),
            worldProfiler: obj({
                host: str('ALTV_WORLD_PROFILER_HOST'),
                port: num('ALTV_WORLD_PROFILER_PORT')
            }),
            threads: obj({
                streamer: num('ALTV_THREADS_STREAMER'),
                migration: num('ALTV_THREADS_MIGRATION'),
            }),
            pools: jsonObj('ALTV_POOLS'),
            'csharp-module': obj({
                disableDependencyDownload: bool('ALTV_CSHARP_DISABLE_DEPENDENCY_DOWNLOAD')
            }),
            'js-module': obj({
                'source-maps': bool('ALTV_JS_SOURCE_MAPS'),
                'heap-profiler': bool('ALTV_JS_HEAP_PROFILER'),
                'profiler': bool('ALTV_JS_PROFILER'),
                'global-webcrypto': bool('ALTV_JS_GLOBAL_WEBCRYPTO'),
                'network-imports': bool('ALTV_JS_NETWORK_IMPORTS'),
                'extra-cli-args': arr('ALTV_JS_EXTRA_CLI_ARGS', ' '),
                inspector: obj({
                    host: str('ALTV_JS_INSPECTOR_HOST'),
                    port: num('ALTV_JS_INSPECTOR_PORT')
                })
            })
        };

        debugLog('Writing to server.toml:\n' + toml.stringify(settings));
        fs.writeFileSync('./server.toml', toml.stringify(settings));
        console.log(chalk.greenBright('Saved config params to ' + chalk.bold('server.toml')));
        return 0;
    } catch(e) {
        console.error(chalk.redBright(e instanceof ParseError ? e.message : (e?.stack ?? String(e))));
        return 1;
    }
}

process.exit(run());
