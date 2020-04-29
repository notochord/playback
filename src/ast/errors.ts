import { PlaybackValue } from '../values/values';

// does this have to be an Error? idc
class PlaybackError extends Error {
  constructor(message, scope) {
    super(`${message}\nScope: "${scope.name}"`)
  }
}

/* Import-related errors */
export class ImportError extends PlaybackError {
  constructor(message, scope) {
    super(message, scope);
  }
}
export class NoSuchStyleError extends ImportError {
  constructor(identifier, scope) {
    super(`No style with the name "${identifier}" was imported`, scope);
  }
}
export class NoSuchTrackError extends ImportError {
  constructor(style, track, scope) {
    super(
      `No track with the name "${track}" exists in the style "${style}"`,
      scope);
  }
}
export class NoSuchPatternError extends ImportError {
  constructor(style, track, pattern, scope) {
    super(
      `Pattern "${style}.${track}.${pattern}" does not exist`,
      scope);
  }
}

/* Function-related errors */
export class FunctionNameError extends PlaybackError {
  constructor(identifier, scope) {
    super(`No function exists with name "${identifier}"`, scope);
  }
}
export class FunctionScopeError extends PlaybackError {
  constructor(message, scope) {
    super(message, scope);
  }
}
export class FunctionArgumentsError extends PlaybackError {
  constructor(message: string, args: PlaybackValue[], scope) {
    super(`${message} (got ${args.map(a => a.toOutputString()).join(', ')})`, scope);
  }
}

/* Pattern-related errors */
export class TooManyBeatsError extends PlaybackError {
  constructor(scope) {
    super(
      'Pattern may only contain 1 BeatGroup. Try the join operator "&"',
      scope);
  }
}

/* Beat-related errors*/
export class MelodicBeatInDrumBeatGroupError extends PlaybackError {
  constructor(scope) {
    super('Unexpected Melodic Beat in a Drum Beat Group', scope);
  }
}
export class DrumBeatInMelodicBeatGroupError extends PlaybackError {
  constructor(scope) {
    super('Unexpected Drum Beat in a Melodic Beat Group', scope);
  }
}
