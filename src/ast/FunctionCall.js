import function_definitions from './function_definitions.js';
import {FunctionNameError} from './errors.js';

/**
 * If the value is a FunctionCall, call it and return the returned value.
 * Otherwise, return the value itself.
 * @private
 */ // @TODO: if this is needed elsewhere, put it somewhere useful.

export default class FunctionCall {
  /**
   * @constructor
   * @param {string} identifier The name of the function. Ideally it should
   * match the name of one of the functions in function_data.js
   */
  constructor(identifier, args) {
    this.identifier = identifier;
    this.definition = function_definitions.get(identifier);
    this.args = args;
    this.scope = null;
  }
  init(scope) {
    this.scope = scope
    if(!this.definition) {
      throw new FunctionNameError(this.identifier, this.scope);
    }
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
  }
  call_func() { // don't want to mess with JS's Function.prototype.call()
    let evaluated_args = this.args.map(arg => {
      if(arg instanceof FunctionCall) {
        return arg.call_func();
      } else {
        return arg;
      }
    });
    return this.definition(evaluated_args, this.scope);
  }
}