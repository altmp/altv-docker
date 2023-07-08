import chalk from 'chalk';
import toml from '@iarna/toml';
import fs from 'fs';

class ParseError extends Error {}

function debugLog(msg) {
    if (process.env.ALTV_VERBOSE !== "yes" && process.env.ALTV_VERBOSE !== "true" && process.env.ALTV_VERBOSE !== "y") return;
    console.log(chalk.gray(chalk.blueBright('VERBOSE ') + msg));
}

function notEmpty(obj) {
    if (Object.values(obj).find(Boolean)) return obj;
    return undefined;
}

function exists(env) {
    env = 'ALTV_' + env;
    const val = process.env[env];
    if (val == null) return false;
    return true;
}

function str(env) {
    env = 'ALTV_' + env;
    const val = process.env[env];
    if (val == null) return undefined;
    return val;
}

function num(env) {
    env = 'ALTV_' + env;
    const val = process.env[env];
    if (val == null) return undefined;
    const res = +val;
    if (!isNaN(res)) return res;
    throw new ParseError('Failed to parse ' + chalk.bold(env) + ': ' + chalk.white(chalk.bold(val) + ' is not a number'));
}

function bool(env) {
    env = 'ALTV_' + env;
    const val = process.env[env];
    if (val == null) return undefined;
    const lower = val.toLowerCase();
    if (lower === "yes" || lower === "true" || lower === "y") return true;
    if (lower === "no" || lower === "false" || lower === "n") return false;
    throw new ParseError('Failed to parse ' + chalk.bold(env) + ': ' + chalk.white(chalk.bold(val) + ' is not a boolean'));
}

function arr(env, separator = ',') {
    env = 'ALTV_' + env;
    const val = process.env[env];
    if (val == null) return undefined;
    return val.split(separator).filter(Boolean);
}

function run() {
    try {
        if (fs.existsSync('./server.toml') && !bool('OVERRIDE_EXISTING_CONFIG')) {
            debugLog('Found existing ' + chalk.bold('server.toml') + ', skipping generation')
            if (exists('OVERRIDE_EXISTING_CONFIG')) return 0;
            console.log(chalk.yellowBright('Found existing ' + chalk.bold('server.toml') + '! Skipping environment server parameters'));
            console.log('You can change this behavior or hide this message by setting ' + chalk.bold('ALTV_OVERRIDE_EXISTING_CONFIG') + ' option');
            console.log('See ' + chalk.bold('https://go.altv.mp/docker-override-config') + ' for more details')
            return 0;
        }

        if (fs.existsSync('./server.toml') && bool('OVERRIDE_EXISTING_CONFIG')) {
            debugLog('Found existing ' + chalk.bold('server.toml') + ', but overriding it with environment parameters, because ' + chalk.bold('OVERRIDE_EXISTING_CONFIG') + ' is true');
        }
        
        const defaultModules = [ 'js-module', 'csharp-module' ];

        if (process.env.ALTV_BRANCH === 'release') {
            defaultModules.push('js-bytecode-module');
        }

        const settings = {
            name: str('NAME'),
            host: str('HOST'),
            port: num('PORT'),
            players: num('PLAYERS'),
            password: str('PASSWORD'),
            announce: bool('ANNOUNCE'),
            token: str('TOKEN'),
            gamemode: str('GAMEMODE'),
            website: str('WEBSITE'),
            language: str('LANGUAGE'),
            description: str('DESCRIPTION'),
            debug: bool('DEBUG'),
            streamingDistance: num('STREAMING_DISTANCE'),
            migrationDistance: num('MIGRATION_DISTANCE'),
            timeout: num('TIMEOUT'),
            announceRetryErrorDelay: num('ANNOUNCE_RETRY_ERROR_DELAY'),
            announceRetryErrorAttempts: num('ANNOUNCE_RETRY_ERROR_ATTEMPTS'),
            duplicatePlayers: num('DUPLICATE_PLAYERS'),
            mapBoundsMinX: num('MAP_BOUNDS_MIN_X'),
            mapBoundsMinY: num('MAP_BOUNDS_MIN_Y'),
            mapBoundsMaxX: num('MAP_BOUNDS_MAX_X'),
            mapBoundsMaxY: num('MAP_BOUNDS_MAX_Y'),
            mapCellAreaSize: num('MAP_CELL_AREA_SIZE'),
            colShapeTickRate: num('COL_SHAPE_TICK_RATE'),
            logStreams: arr('LOG_STREAMS'),
            tags: arr('TAGS'),
            connectionQueue: bool('CONNECTION_QUEUE'),
            useEarlyAuth: exists('EARLY_AUTH_URL'),
            earlyAuthUrl: str('EARLY_AUTH_URL'),
            useCdn: exists('CDN_URL'),
            cdnUrl: str('CDN_URL'),
            sendPlayerNames: bool('SEND_PLAYER_NAMES'),
            spawnAfterConnect: bool('SPAWN_AFTER_CONNECT'),
            hashClientResourceName: bool('HASH_CLIENT_RESOURCE_NAME'),
            resources: arr('RESOURCES') ?? ['*'],
            modules: arr('MODULES') ?? defaultModules,
            'dlc-whitelist': arr('DLC_WHITELIST'),
            voice: notEmpty({
                bitrate: num('VOICE_BITRATE'),
                externalSecret: str('VOICE_EXTERNAL_SECRET'),
                externalHost: str('VOICE_EXTERNAL_HOST'),
                externalPort: num('VOICE_EXTERNAL_PORT'),
                externalPublicHost: str('VOICE_EXTERNAL_PUBLIC_HOST'),
                externalPublicPort: num('VOICE_EXTERNAL_PUBLIC_PORT')
            }),
            worldProfiler: notEmpty({
                host: str('WORLD_PROFILER_HOST'),
                port: num('WORLD_PROFILER_PORT')
            }),
            threads: notEmpty({
                streamer: num('THREADS_STREAMER'),
                migration: num('THREADS_MIGRATION'),
            }),
            'csharp-module': notEmpty({
                disableDependencyDownload: bool('CSHARP_DISABLE_DEPENDENCY_DOWNLOAD')
            }),
            'js-module': notEmpty({
                'source-maps': bool('JS_SOURCE_MAPS'),
                'heap-profiler': bool('JS_HEAP_PROFILER'),
                'profiler': bool('JS_PROFILER'),
                'global-webcrypto': bool('JS_GLOBAL_WEBCRYPTO'),
                'network-imports': bool('JS_NETWORK_IMPORTS'),
                'extra-cli-args': arr('JS_EXTRA_CLI_ARGS', ' '),
                inspector: notEmpty({
                    host: str('JS_INSPECTOR_HOST'),
                    port: num('JS_INSPECTOR_PORT')
                })
            })
        }

        debugLog('Writing to server.toml:\n' + toml.stringify(settings));
        fs.writeFileSync('./server.toml', toml.stringify(settings));
        console.log(chalk.greenBright('Saved config params to ' + chalk.bold('server.toml')))
        return 0;
    } catch(e) {
        console.error(chalk.redBright(e instanceof ParseError ? e.message : (e?.stack ?? String(e))));
        return 1;
    }
}

process.exit(run());