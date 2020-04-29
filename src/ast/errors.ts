import { Scope } from './ASTNodeBase';
import { PlaybackValue } from '../values/values';

// does this have to be an Error? idc
class PlaybackError extends Error {
  public constructor(message: string, scope: Scope) {
    super(`${message}\nScope: "${scope.name}"`)
  }
}

/* Import-related errors */
export class ImportError extends PlaybackError {
  public constructor(message: string, scope: Scope) {
    super(message, scope);
  }
}
export class NoSuchStyleError extends ImportError {
  public constructor(identifier: string, scope: Scope) {
    super(`No style with the name "${identifier}" was imported`, scope);
  }
}
export class NoSuchTrackError extends ImportError {
  public constructor(style: string, track: string, scope: Scope) {
    super(
      `No track with the name "${track}" exists in the style "${style}"`,
      scope);
  }
}
export class NoSuchPatternError extends ImportError {
  public constructor(style: string, track: string, pattern: string, scope: Scope) {
    super(
      `Pattern "${style}.${track}.${pattern}" does not exist`,
      scope);
  }
}

/* Function-related errors */
export class FunctionNameError extends PlaybackError {
  public constructor(identifier: string, scope: Scope) {
    super(`No function exists with name "${identifier}"`, scope);
  }
}
export class FunctionScopeError extends PlaybackError {
  public constructor(message: string, scope: Scope) {
    super(message, scope);
  }
}
export class FunctionArgumentsError extends PlaybackError {
  public constructor(message: string, args: PlaybackValue[], scope: Scope) {
    super(`${message} (got ${args.map(a => a.toOutputString()).join(', ')})`, scope);
  }
}

/* Pattern-related errors */
export class TooManyBeatsError extends PlaybackError {
  public constructor(scope: Scope) {
    super(
      'Pattern may only contain 1 BeatGroup. Try the join operator "&"',
      scope);
  }
}

/* Beat-related errors*/
export class MelodicBeatInDrumBeatGroupError extends PlaybackError {
  public constructor(scope: Scope) {
    super('Unexpected Melodic Beat in a Drum Beat Group', scope);
  }
}
export class DrumBeatInMelodicBeatGroupError extends PlaybackError {
  public constructor(scope: Scope) {
    super('Unexpected Drum Beat in a Melodic Beat Group', scope);
  }
}
