declare class PlaybackError extends Error {
    constructor(message: any, scope: any);
}
export declare class ImportError extends PlaybackError {
    constructor(message: any, scope: any);
}
export declare class NoSuchStyleError extends ImportError {
    constructor(identifier: any, scope: any);
}
export declare class NoSuchTrackError extends ImportError {
    constructor(style: any, track: any, scope: any);
}
export declare class NoSuchPatternError extends ImportError {
    constructor(style: any, track: any, pattern: any, scope: any);
}
export declare class FunctionNameError extends PlaybackError {
    constructor(identifier: any, scope: any);
}
export declare class FunctionScopeError extends PlaybackError {
    constructor(message: any, scope: any);
}
export declare class FunctionArgumentsError extends PlaybackError {
    constructor(message: any, scope: any);
}
export declare class TooManyBeatsError extends PlaybackError {
    constructor(scope: any);
}
export declare class MelodicBeatInDrumBeatGroupError extends PlaybackError {
    constructor(scope: any);
}
export declare class DrumBeatInMelodicBeatGroupError extends PlaybackError {
    constructor(scope: any);
}
export {};
