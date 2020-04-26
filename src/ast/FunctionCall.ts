import * as function_data from './function_data';
import {FunctionNameError} from './errors';
import SongIterator from 'notochord-song/types/songiterator';
import Scope from './Scope';

type FunctionDefinition = {
  types: (Function|string)[] | '*';
  scope: 'meta' | 'options' | 'no-config' | 'pattern' | 'no-meta';
  returns: string | Function | symbol;
  execute: (args: any[], songIterator: SongIterator, scope: Scope) => any;
};

/**
 * If the value is a FunctionCall, call it and return the returned value.
 * Otherwise, return the value itself.
 * @private
 */ // @TODO: if this is needed elsewhere, put it somewhere useful.
export default class FunctionCall {
  public identifier: string;
  public definition: FunctionDefinition;
  public args: any[];
  public scope: Scope;
  public returns: string | Function | symbol;

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
  init(scope: Scope) {
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
  execute(songIterator?: SongIterator) { // Compile-type functions don't require a SongIterator
    if(!this.scope) throw new Error('function not initialized :(');
    let evaluatedArgs = this.args.map(arg => {
      if(arg.execute) {
        return arg.execute(songIterator);
      } else {
        return arg;
      }
    });
    let returnValue = this.definition.execute(
      evaluatedArgs,
      songIterator,
      this.scope);
    if(returnValue === undefined) {
      throw new Error(`Function "${this.identifier}" can return undefined`);
    }
    return returnValue;
  }
}
