// does this have to be an Error? idc
class PlaybackError extends Error {
  constructor(message, scope) {
    super(`${message}\nScope: "${scope.name}"`)
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
  constructor(message, scope) {
    super(message, scope);
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
