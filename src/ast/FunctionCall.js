import * as function_data from './function_data.js';
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
    this.definition = function_data.definitions.get(identifier);
    this.args = args;
    this.scope = null;
  }
  init(scope) {
    this.scope = scope;
    if(!this.definition) {
      throw new FunctionNameError(this.identifier, this.scope);
    }
    this.returns = this.definition.returns;
    function_data.assertScope(this.identifier, this.definition.scope, this.scope);
    
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
    
    function_data.assertArgTypes(this.identifier, this.args, this.definition.types, this.scope);
  }
  link(ASTs, parentStyle, parentTrack) {
    this.args.forEach(arg => {
      if(arg.link) arg.link(ASTs, parentStyle, parentTrack);
    });
  }
  execute() { // don't want to mess with JS's Function.prototype.call()
    if(!this.scope) throw new Error('function not initialized :(');
    let evaluated_args = this.args.map(arg => {
      if(arg.execute) {
        return arg.execute();
      } else {
        return arg;
      }
    });
    let return_value = this.definition.execute(evaluated_args, this.scope);
    if(return_value === undefined) {
      throw new Error(`Function "${this.identifier}" can return undefined`);
    }
    return return_value;
  }
}
