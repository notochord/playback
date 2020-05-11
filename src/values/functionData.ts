import * as Tonal from '@tonaljs/tonal';
import { normalizeChordForTonal, getAnchorChord, anchorChordToRoot, chordToScaleName } from '../ast/musicUtils';
import * as values from './values';
import { FunctionArgumentsError, FunctionScopeError } from '../ast/errors';
import FunctionCall from '../ast/FunctionCall';
import { SongIterator } from 'notochord-song';
import { Scope } from '../ast/ASTNodeBase';

interface DefineOpts {
  types?: ArgType[] | '*';
  scope?: GoalScope;
  returns: ArgType;
}

export interface FunctionDefinition {
  types?: ArgType[] | '*';
  scope?: GoalScope;
  returns: ArgType;
  execute: (args: values.PlaybackValue[], songIterator: SongIterator, scope: Scope) => values.PlaybackValue;
}

const definitions = new Map<string, FunctionDefinition>();

type ArgType = values.PlaybackValue['type'] | '*';

/**
 * Make an assertion about argument count and types.
 * @param {string} identifier The function name.
 * @param {Array} args The arguments passed to the function.
 * @param {Array.<string|Function>} types Array of the types (typeof) or classes
 * (instanceof) to expect.
 * @param {Scope} scope The scope, for error logging.
 */
export function assertArgTypes(identifier: string, args: values.PlaybackValue[], types: ArgType[] | '*', scope: Scope): void {
  if(types === '*') return;
  if(args.length !== types.length) {
    throw new FunctionArgumentsError(`"${identifier}" requires ${types.length} arguments.`, args, scope);
  }
  for(const i in args) {
    if(types[i] === '*') continue;
    const arg = args[i];
    if(arg instanceof FunctionCall) {
      if(arg.returns === '*') {
        continue; // what's the correct functionality here? cry?
      } else {
        if(arg.returns !== types[i]) {
          throw new FunctionArgumentsError(`Argument ${Number(i)+1} of "${identifier}" must be a ${types[i]}.`, args, scope);
        }
      }
    } else {
      if(arg.type !== types[i]) {
        throw new FunctionArgumentsError(`Argument ${Number(i)+1} of "${identifier}" must be a ${types[i]}.`, args, scope);
      }
    }
  }
}

type GoalScope = 'meta' | 'options' | 'no-config' | 'pattern' | 'no-meta';

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
export function assertScope(identifier: string, goalscope: GoalScope = 'no-meta', scope: Scope): void {
  if(goalscope === 'meta') {
    if(scope.type !== '@meta') {
      throw new FunctionScopeError(`Function "${identifier}" must only be called within a @meta block."`, scope);
    }
  } else if(goalscope === 'options') {
    if(scope.type !== '@options') {
      throw new FunctionScopeError(`Function "${identifier}" must only be called within an @options block."`, scope);
    }
  } else if(goalscope === 'no-config') {
    // ensure that config blocks can be resolved at compile time
    if(scope.type === '@meta' || scope.type === '@options') {
      throw new FunctionScopeError(`Function "${identifier}" must not be called within a @meta or @options block."`, scope);
    }
  } else if(goalscope === 'pattern') { 
    if(scope.type !== 'PatternExpressionGroup') {
      throw new FunctionScopeError(`Function "${identifier}" must only be called within a @pattern block."`, scope);
    }
    // @TODO: what about @pattern foo private() -- makes no sense but yea
  } else if(goalscope === 'no-meta') { 
    if(scope.type === '@meta') {
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
const define = function(identifier: string, opts: DefineOpts, func: (args: values.PlaybackValue[], songIterator: SongIterator, scope: Scope, argErr: (message: string) => void) => values.PlaybackValue): void {
  const definition = {
    types: opts.types || '*',
    returns: opts.returns || '*',
    scope: opts.scope || 'no-meta',
    execute: (args: values.PlaybackValue[], songIterator: SongIterator, scope: Scope): values.PlaybackValue => {
      const argErr = (message: string): never => {
        throw new FunctionArgumentsError(message, args, scope);
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
const defineVar = function(identifier: string, type: ArgType, goalscope: GoalScope = 'no-meta'): void {
  const opts: DefineOpts = {
    types: [type],
    scope: goalscope,
    returns: 'Nil'
  };
  define(identifier, opts, (args, songIterator, scope, argErr) => {
    scope.vars.set(identifier, args[0]);
    return new values.NilValue();
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
const defineBoolean = function(identifier: string, goalscope: GoalScope = 'no-meta'): void {
  const opts: DefineOpts = {
    types: '*',
    scope: goalscope,
    returns: 'Nil'
  }
  define(identifier, opts, (args, songIterator, scope, argErr) => {
    if(args.length) {
      assertArgTypes(identifier, args, ['boolean'], scope);
      scope.vars.set(identifier, args[0]);
    } else {
      scope.vars.set(identifier, new values.BooleanValue(true));
    }
    return new values.NilValue;
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
    returns: 'Nil'
  },
  (args, songIterator, scope, argErr) => {
    const value1 = (args[0] as values.NumberValue).value;
    const value2 = (args[1] as values.NumberValue).value;
    if(!Number.isInteger(Math.log2(value1))) {
      argErr(`Argument 2 of "time-signature" must be a power of 2`);
    }
    scope.vars.set('time-signature', new values.TimeSignatureValue([value1, value2]));
    return new values.NilValue();
  });
defineBoolean('swing', 'options');

/*** anywhere but @meta functions ***/
define('volume',
  {
    types: ['number'],
    scope: 'no-meta',
    returns: 'Nil'
  },
  (args, songIterator, scope, argErr) => {
    const { value } = (args[0] as values.NumberValue);
    if(value < 0 || value > 1) {
      argErr(`Argument 1 of "volume" must be in range 0-1 (inclusive)`);
    }
    scope.vars.set('volume', args[0]);
    return new values.NilValue();
  });
defineBoolean('invertible', 'no-meta');
define('octave',
  {
    types: ['number'],
    scope: 'no-meta',
    returns: 'Nil'
  },
  (args, songIterator, scope, argErr) => {
    const { value } = (args[0] as values.NumberValue);
    if(!Number.isInteger(value) || value < 0 || value > 9) {
      argErr(`Argument 1 of "octave" must be an integer 0-9`);
    }
    scope.vars.set('octave', args[0]);
    return new values.NilValue();
  });

/*** anywhere but config functions (strictly dynamic functions) ***/
define('choose',
  {
    types: '*',
    scope: 'no-config',
    returns: '*'
  },
  (args, songIterator, scope, argErr) => {
    const nonNilArgs = args.filter(arg => arg.type !== 'Nil');
    if(nonNilArgs.length) {
      const index = Math.floor(Math.random() * nonNilArgs.length);
      return nonNilArgs[index];
    } else {
      return new values.NilValue();
    }
  });

const anchorOrNumberToChordAndRoot = function(arg: values.NumberValue | values.AnchorValue, songIterator: SongIterator): [string, string] {
  let anchorChord: string, root: string;
  if(arg.type === 'number') {
    anchorChord = getAnchorChord(
      null, songIterator, 1);
    root = anchorChordToRoot(anchorChord, arg.value, 4);
  } else {
    anchorChord = getAnchorChord(
      arg.value, songIterator, 1);
    root = anchorChordToRoot(anchorChord, 1, 4);
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
    for(const i in args) {
      if(args[0].type !== 'number' && args[0].type !== 'anchor') {
        argErr(`Arguments of "progression" must be numbers or anchors`);
      }
      const [,goal] = anchorOrNumberToChordAndRoot(args[0] as values.NumberValue | values.AnchorValue, songIterator);
      const actualMeasure = songIterator.getRelative(Number(i));
      if(!actualMeasure) return new values.BooleanValue(false);
      const actualChord = normalizeChordForTonal(actualMeasure.beats[0].chord || undefined);
      const actual = anchorChordToRoot(
        actualChord, 1, 4);
      if(actual !== goal) return new values.BooleanValue(false);
    }
    return new values.BooleanValue(true);
  });
define('in-scale',
  {
    types: '*',
    scope: 'no-config',
    returns: 'boolean'
  },
  (args, songIterator, scope, argErr) => {
    if((args[0].type !== 'number' && args[0].type !== 'anchor')
      || args[1].type !== 'number' && args[1].type !== 'anchor') {
      argErr(`Arguments of "in-scale" must be numbers or anchors`);
    }
    const [,note] = anchorOrNumberToChordAndRoot(args[0] as values.NumberValue | values.AnchorValue, songIterator);
    const [goalChord, goalTonic] = anchorOrNumberToChordAndRoot(args[1] as values.NumberValue | values.AnchorValue, songIterator);
    const goalScaleName = chordToScaleName(goalChord);
    const goalScale = Tonal.Scale.notes(goalTonic, goalScaleName);
    return new values.BooleanValue(goalScale.includes(note));
  });
define('beat-defined',
  {
    types: ['number'],
    scope: 'no-config',
    returns: 'boolean'
  },
  (args, songIterator, scope, argErr) => {
    const measure = songIterator.getRelative(0);
    if(!measure) return new values.BooleanValue(false);
    const index = (args[0] as values.NumberValue).value - 1;
    console.log('     - beat-defined: item', index, 'of', measure, '=', measure.beats[index]);
    return new values.BooleanValue(!!(measure.beats[index] && measure.beats[index].chord));
  });

define('measure-divisible-by',
  {
    types: ['number'],
    scope: 'no-config',
    returns: 'boolean'
  },
  (args, songIterator, scope, argErr) => {
    return new values.BooleanValue(songIterator.index % (args[0] as values.NumberValue).value === 0);
  });

/*** pattern-only functions ***/
defineBoolean('private', 'pattern');
defineBoolean('override-track', 'pattern');
defineVar('length', 'number', 'pattern');
define('chance',
  {
    types: ['number'],
    scope: 'pattern',
    returns: 'Nil'
  },
  (args, songIterator, scope, argErr) => {
    if((args[0] as values.NumberValue).value < 0 || (args[0] as values.NumberValue).value > 1) {
      argErr(`Argument 1 of "chance" must be in range 0-1 (inclusive)`);
    }
    scope.vars.set('chance', args[0]);
    return new values.NilValue();
  });

export { definitions };
