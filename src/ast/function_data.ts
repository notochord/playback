import tonal from '../lib/tonal.min.js';
import {MelodicBeatLiteral} from './BeatLiterals'; 
import {FunctionArgumentsError, FunctionScopeError} from './errors';
import FunctionCall from './FunctionCall';
import {Nil} from './type_utils';
import SongIterator from 'notochord-song/types/songiterator';
import Scope from './Scope';

let definitions = new Map();

/**
 * Make an assertion about argument count and types.
 * @param {string} identifier The function name.
 * @param {Array} args The arguments passed to the function.
 * @param {Array.<string|Function>} types Array of the types (typeof) or classes
 * (instanceof) to expect.
 * @param {Scope} scope The scope, for error logging.
 */
export function assertArgTypes(identifier, args, types, scope) {
  if(types == '*') return;
  if(args.length != types.length) {
    throw new FunctionArgumentsError(`"${identifier}" requires ${types.length} arguments.`, scope);
  }
  for(let i in args) {
    if(types[i] == '*') continue;
    let arg = args[i];
    if(arg instanceof FunctionCall) {
      arg = arg.returns;
      if(arg == '*') {
        continue; // what's the correct functionality here? cry?
      } else if(typeof types[i] == 'string') {
        if(arg != types[i]) {
          throw new FunctionArgumentsError(`Argument ${Number(i)+1} of "${identifier}" must be a ${types[i]}.`, scope);
        }
      } else {
        if(arg != types[i]) {
          throw new FunctionArgumentsError(`Argument ${Number(i)+1} of "${identifier}" must be a ${types[i].name}.`, scope);
        }
      }
    } else {
      if(typeof types[i] == 'string') {
        if(typeof arg != types[i]) {
          throw new FunctionArgumentsError(`Argument ${Number(i)+1} of "${identifier}" must be a ${types[i]}.`, scope);
        }
      } else {
        if(!(arg instanceof types[i])) {
          throw new FunctionArgumentsError(`Argument ${Number(i)+1} of "${identifier}" must be a ${types[i].name}.`, scope);
        }
      }
    }
  }
}
/**
 * Make an assertion about the scope in which the function is called.
 * @param {string} identifier The function's name.
 * @param {string='no-meta'} goalscope One of 4 string options:
 * - 'meta': the function throws if it's called outside a @meta block.
 * - 'options': the function throws if it's called outside an @options block.
 * - 'no-config': the function throws if it's called inside a @meta or @options
 *   block, but runs anywhere else that the parser will let you call a function.
 * - 'pattern': the function throws if called outside a pattern scope.
 * - 'no-meta' (default): the function throws if it's called inside a @meta
 *   block, but runs anywhere else that the parser will let you call a function.
 * @param {Scope} scope The calling scope.
 */
export function assertScope(identifier, goalscope = 'no-meta', scope) {
  if(goalscope == 'meta') {
    if(scope.type != '@meta') {
      throw new FunctionScopeError(`Function "${identifier}" must only be called within a @meta block."`, scope);
    }
  } else if(goalscope == 'options') {
    if(scope.type != '@options') {
      throw new FunctionScopeError(`Function "${identifier}" must only be called within an @options block."`, scope);
    }
  } else if(goalscope == 'no-config') {
    // ensure that config blocks can be resolved at compile time
    if(scope.type == '@meta' || scope.type == '@options') {
      throw new FunctionScopeError(`Function "${identifier}" must not be called within a @meta or @options block."`, scope);
    }
  } else if(goalscope == 'pattern') { 
    if(scope.type != 'PatternExpressionGroup') {
      throw new FunctionScopeError(`Function "${identifier}" must only be called within a @pattern block."`, scope);
    }
    // @TODO: what about @pattern foo private() -- makes no sense but yea
  } else if(goalscope == 'no-meta') { 
    if(scope.type == '@meta') {
      throw new FunctionScopeError(`Function "${identifier}" must not be called within a @meta block."`, scope);
    }
  }
}
/**
 * Define a function.
 * @param {string} identifier The name of the function.
 * @param {Object} opts Options passed. See below.
 * @param {Array.<string|Function>|string='*'} opts.types If set, throw error
 * unless the arguments passed to the function map to these. Can be strings
 * (typeof) or classes (instanceof), or the single string '*' to accept
 * anything. See assertArgTypes above.
 * @param {string='no-meta'} opts.scope Throw error unless the calling
 * scope matches. See assertScope above.
 * @param {string|Function|Nil='*'} opts.returns The return type. If set to '*'
 * it may return anything (for example, choose() returns one of whatever's
 * passed to it regardless of type).
 * @param {Function} func The function to run. It's passed 3 arguments:
 * - args: an array of the arguments passed in the Playback function call.
 * - scope: the calling scope. So it can set in scope.vars.
 * - argErr: a function. If the function does further testing on its
 *   arguments and there's an issue, pass this the error message and it throws.
 */
let define = function(identifier, opts, func) {
  let definition = {
    types: opts.types || '*',
    returns: opts.returns || '*',
    scope: opts.scope || 'no-meta',
    execute: (args: any[], songIterator: SongIterator, scope: Scope) => {
      let argErr = message => {
        throw new FunctionArgumentsError(message, scope);
      };
      return func(args, songIterator, scope, argErr);
    }
  };
  
  definitions.set(identifier, definition);
}

/**
 * Quickly define a single-argument function that simply sets a var of the same
 * name in its parent scope.
 * @param {string} identifier The name of the function.
 * @param {string|Function} type Throw unless the argument is of this type (see
 * assertArgTypes above).
 * @param {?string=null} goalscope Throw error unless the calling scope matches.
 * See assertScope above.
 */
let defineVar = function(identifier, type, goalscope = null) {
  let opts = {
    types: [type],
    scope: goalscope,
    returns: Nil
  };
  define(identifier, opts, (args, songIterator, scope, argErr) => {
    scope.vars.set(identifier, args[0]);
    return Nil;
  })
}

/**
 * Quickly define a function that sets a a var of the same name in its parent
 * scope. If it has 0 args it sets the var to true, if it has 1 boolean arg
 * it sets the var to that.
 * @param {string} identifier The name of the function.
 * @param {?string=null} goalscope Throw error unless the calling scope matches.
 * See assertScope above.
 */
let defineBoolean = function(identifier, goalscope = null) {
  let opts = {
    types: '*',
    scopes: goalscope,
    returns: Nil
  }
  define(identifier, opts, (args, songIterator, scope, argErr) => {
    if(args.length) {
      assertArgTypes(identifier, args, ['boolean'], scope);
      scope.vars.set(identifier, args[0]);
    } else {
      scope.vars.set(identifier, true);
    }
    return Nil;
  })
}

/*********** ACTUAL FUNCTION DEFINITIONS ***********/

/*** @meta functions ***/
defineVar('name', 'string', 'meta');
defineVar('author', 'string', 'meta');
defineVar('description', 'string', 'meta');
defineVar('playback-version', 'number', 'meta');

/*** @options functions ***/
define('time-signature',
  {
    types: ['number', 'number'],
    scope: 'options',
    returns: Nil
  },
  (args, songIterator, scope, argErr) => {
    if(!Number.isInteger(Math.log2(args[1]))) {
      argErr('Argument 2 of "time-signature" must be a power of 2.');
    }
    scope.vars.set('time-signature', [args[0], args[1]]);
    return Nil;
  });
defineBoolean('swing', 'options');

/*** anywhere but @meta functions ***/
define('volume',
  {
    types: ['number'],
    scope: 'no-meta',
    returns: Nil
  },
  (args, songIterator, scope, argErr) => {
    if(args[0] < 0 || args[0] > 1) {
      argErr('Argument 1 of "volume" must be in range 0-1 (inclusive).');
    }
    scope.vars.set('volume', args[0]);
    return Nil;
  });
defineBoolean('invertible', 'no-meta');
define('octave',
  {
    types: ['number'],
    scope: 'no-meta',
    returns: Nil
  },
  (args, songIterator, scope, argErr) => {
    if(!Number.isInteger(args[0]) || args[0] < 0 || args[0] > 9) {
      argErr('Argument 1 of "octave" must be an integer 0-9.');
    }
    scope.vars.set('octave', args[0]);
    return Nil;
  });

/*** anywhere but config functions (strictly dynamic functions) ***/
define('choose',
  {
    types: '*',
    scope: 'no-config',
    returns: '*'
  },
  (args, songIterator, scope, argErr) => {
    let nonNilArgs = args.filter(arg => arg !== Nil);
    if(nonNilArgs.length) {
      let index = Math.floor(Math.random() * nonNilArgs.length);
      return nonNilArgs[index];
    } else {
      return Nil;
    }
  });

let anchorOrNumberToChordAndRoot = function(arg, songIterator) {
  let anchorChord, root;
  if(typeof arg == 'number') {
    anchorChord = MelodicBeatLiteral.getAnchorChord(
      null, songIterator, 1);
    root = MelodicBeatLiteral.anchorChordToRoot(anchorChord, arg, 4);
  } else if(arg.anchor) {
    anchorChord = MelodicBeatLiteral.getAnchorChord(
      arg.anchor, songIterator, 1);
    root =  MelodicBeatLiteral.anchorChordToRoot(anchorChord, 1, 4);
  }
  return [anchorChord, root];
};

define('progression',
  {
    types: '*',
    scope: 'no-config',
    returns: 'boolean'
  },
  (args, songIterator, scope, argErr) => {
    for(let i in args) {
      let arg = args[i];
      let [,goal] = anchorOrNumberToChordAndRoot(arg, songIterator);
      if(!goal) {
        argErr('Arguments of "progression" must be numbers or anchors.');
      }
      let actualMeasure = songIterator.getRelative(Number(i));
      if(!actualMeasure) return false;
      let actualChord = MelodicBeatLiteral.normalizeChord(actualMeasure.beats[0].chord);
      let actual = MelodicBeatLiteral.anchorChordToRoot(
        actualChord, 1, 4);
      if(actual != goal) return false;
    }
    return true;
  });
define('in-scale',
  {
    types: '*',
    scope: 'no-config',
    returns: 'boolean'
  },
  (args, songIterator, scope, argErr) => {
    let [,note] = anchorOrNumberToChordAndRoot(args[0], songIterator);
    let [goalChord, goalTonic] = anchorOrNumberToChordAndRoot(args[1], songIterator);
    if(!note || !goalChord) {
      argErr('Arguments of "in-scale" must be numbers or anchors.');
    }
    let goalScaleName = MelodicBeatLiteral.chordToScaleName(goalChord);
    let goalScale = tonal.Scale.notes(goalTonic, goalScaleName);
    return goalScale.includes(note);
  });
define('beat-defined',
  {
    types: ['number'],
    scope: 'no-config',
    returns: 'boolean'
  },
  (args, songIterator, scope, argErr) => {
    let measure = songIterator.getRelative(0);
    if(!measure) return false;
    return measure.beats[args[0]].chord !== null;
  });

/*** pattern-only functions ***/
defineBoolean('private', 'pattern');
defineVar('length', 'number', 'pattern');
define('chance',
  {
    types: ['number'],
    scope: 'pattern',
    returns: Nil
  },
  (args, songIterator, scope, argErr) => {
    if(args[0] < 0 || args[0] > 1) {
      argErr('Argument 1 of "chance" must be in range 0-1 (inclusive).');
    }
    scope.vars.set('chance', args[0]);
    return Nil;
  });

export {definitions};
