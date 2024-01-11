import {arr, bool, exists, generate, jsonObj, num, obj, str} from "./base.js";

process.exit(generate('voice.toml', () => ({
    secret: num('ALTV_SECRET') ?? 0,
    host: str('ALTV_HOST'),
    port: num('ALTV_PORT'),
    playerHost: str('ALTV_PLAYER_HOST'),
    playerPort: num('ALTV_PLAYER_PORT'),
    loopback: num('ALTV_LOOPBACK'),
    mapBoundsMinX: num('ALTV_MAP_BOUNDS_MIN_X'),
    mapBoundsMinY: num('ALTV_MAP_BOUNDS_MIN_Y'),
    mapBoundsMaxX: num('ALTV_MAP_BOUNDS_MAX_X'),
    mapBoundsMaxY: num('ALTV_MAP_BOUNDS_MAX_Y'),
    mapCellAreaSize: num('ALTV_MAP_CELL_AREA_SIZE'),
    streamingTickRate: num('ALTV_STREAMING_TICK_RATE'),
    allowDuplicatePlayers: bool('ALTV_ALLOW_DUPLICATE_PLAYERS'),
    worldProfiler: obj({
        host: str('ALTV_WORLD_PROFILER_HOST'),
        port: num('ALTV_WORLD_PROFILER_PORT')
    }),
    threads: obj({
        streamer: num('ALTV_THREADS_STREAMER')
    })
})));