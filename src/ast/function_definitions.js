import {FunctionArgumentsError, FunctionScopeError} from './errors.js';

let function_definitions = new Map();

/**
 * Make an assertion about argument count and types.
 * @param {string} identifier The function name.
 * @param {Array} args The arguments passed to the function.
 * @param {Array.<string|Function>} types Array of the types (typeof) or classes
 * (instanceof) to expect.
 * @param {Scope} scope The scope, for error logging.
 */
let assertArgTypes = function(dentifier, args, types, scope) {
  if(args.length != types.length) {
    throw new FunctionArgumentsError(`"${identifier}" requires ${types.length} arguments.`, scope);
  }
  for(let i in args) {
    if(typeof types[i] == 'string') {
      if(typeof args[i] != types[i]) {
        throw new FunctionArgumentsError(`Argument ${i+1} of "${identifier}" must be a ${types[i]}.`, scope);
      }
    } else {
      if(!(args[i] instanceof types[i])) {
        throw new FunctionArgumentsError(`Argument ${i+1} of "${identifier}" must be a ${types[i].name}.`, scope);
      }
    }
  }
}
/**
 * Define a function.
 * @param {string} identifier The name of the function.
 * @param {Object} opts Options passed. See below (can be empty object).
 * @param {Array.<string|Function>=} opts.types If set, throw error unless the
 * arguments passed to the function map to these. Can be strings (typeof) or
 * classes (instanceof).
 * @param {Array.<string>=} opts.scopes If set, throw error unless the calling
 * scope's name is in this list.
 * @param {Function} func The function to run. It's passed 3 arguments:
 * - args: an array of the arguments passed in the Playback function call.
 * - scope: the calling scope. So it can set in scope.vars.
 * - argErr: a function. If the function does further testing on its
 *   arguments and there's an issue, pass this the error message and it throws.
 */
let define = function(identifier, opts, func) {
  let funcwrapper = (args, scope) => {
    if(opts.types) assertArgTypes(identifier, args, opts.types, opts.scope);
    if(opts.scopes && !opts.scopes.includes(scope.name)) {
      throw new FunctionScopeError(identifier, scopes, scope);
    }
    let argErr = message => {
      throw new FunctionArgumentsError(message, scope);
    };
    return func(args, scope, argErr);
  }
  
  function_definitions.set(identifier, funcwrapper);
}

/**
 * Quickly define a single-argument function that simply sets a var of the same
 * name in its parent scope.
 */
let defineVar = function(identifier, type, scopes = null) {
  let opts = {types: [type], scopes: scopes};
  define(identifier, opts, (args, scope, argErr) => {
    scope.vars.set(identifier, args[0]);
  })
}

/**
 * Quickly define a function that sets a a var of the same name in its parent
 * scope. If it has 0 args it sets the var to true, if it has 1 boolean arg
 * it sets the var to that.
 */
let defineBoolean = function(identifier, scopes = null) {
  let opts = {scopes: scopes};
  define(identifier, opts, (args, scope, argErr) => {
    if(args.length) {
      assertArgTypes(identifier, args, ['boolean'], scope);
      scope.vars.set(identifier, args[0]);
    } else {
      scope.vars.set(identifier, true);
    }
  })
}

/*** @meta functions ***/
defineVar('name', 'string', ['@meta']);
defineVar('author', 'string', ['@meta']);
defineVar('description', 'string', ['@meta']);

/*** @options functions ***/
define('time-signature',
  {types: ['number', 'number'], scopes: ['@options']},
  (args, scope, argErr) => {
    if(!Number.isInteger(Math.log2(args[1]))) {
      argErr('Argument 2 of "time-signature" must be a power of 2.');
    }
    scope.vars.set('time-signature', [args[0], args[1]]);
  });
defineBoolean('swing', ['@options']);

/*** anywhere (but meta) functions ***/
define('volume',
  {types: ['number']},
  (args, scope, argErr) => {
    if(args[0] < 0 || args[0] > 1) {
      argErr('Argument 1 of "volume" must be in range 0-1 (inclusive).');
    }
    scope.vars.set('volume', args[0]);
  });

export default function_definitions;
