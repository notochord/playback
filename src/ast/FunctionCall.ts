import * as FunctionData from './FunctionData';
import {FunctionNameError} from './errors';
import SongIterator from 'notochord-song/types/songiterator';
import * as values from '../values/values';
import {ASTNodeBase, Scope} from './ASTNodeBase';

/**
 * If the value is a FunctionCall, call it and return the returned value.
 * Otherwise, return the value itself.
 * @private
 */ // @TODO: if this is needed elsewhere, put it somewhere useful.
export default class FunctionCall extends ASTNodeBase {
  public identifier: string;
  public definition: FunctionData.FunctionDefinition;
  public args: any[];
  public returns: string | Function | symbol;

  /**
   * @constructor
   * @param {string} identifier The name of the function. Ideally it should
   * match the name of one of the functions in function_data.js
   */
  public constructor(identifier: string, args: values.PlaybackValue[]) {
    super();
    this.identifier = identifier;
    this.definition = FunctionData.definitions.get(identifier);
    this.args = args;
  }
  public init(scope: Scope): void {
    super.init(scope);
    if(!this.definition) {
      throw new FunctionNameError(this.identifier, this.scope);
    }
    this.returns = this.definition.returns;
    FunctionData.assertScope(this.identifier, this.definition.scope, this.scope);
    
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
    
    FunctionData.assertArgTypes(this.identifier, this.args, this.definition.types, this.scope);
  }
  public link(ASTs, parentStyle, parentTrack): void {
    this.args.forEach(arg => {
      if(arg.link) arg.link(ASTs, parentStyle, parentTrack);
    });
  }
  public execute(songIterator?: SongIterator): values.PlaybackValue { // Compile-type functions don't require a SongIterator
    if(!this.scope) throw new Error('function not initialized :(');
    const evaluatedArgs = this.args.map(arg => {
      if(arg.execute) {
        return arg.execute(songIterator);
      } else {
        return arg;
      }
    });
    const returnValue = this.definition.execute(
      evaluatedArgs,
      songIterator,
      this.scope);
    if(returnValue === undefined) {
      throw new Error(`Function "${this.identifier}" can return undefined`);
    }
    return returnValue;
  }
}
