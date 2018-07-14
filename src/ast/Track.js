import {Nil} from './type_utils.js';
import Scope from './Scope.js';
import FunctionCall from './FunctionCall.js';
import {PatternStatement, PatternCall} from './Pattern.js';

export class TrackStatement extends Scope {
  constructor(opts) {
    super();
    this.name = opts.identifier;
    this.type = '@track';
    
    this.instrument = opts.instrument;
    this.identifier = opts.identifier;
    this.members = opts.members;
  }
  init(scope) {
    super.init(scope);
    this.function_calls = [];
    this.patterns = new Map();
    this.members.forEach(member => {
      // initialize them all now, var inheritence is handled during execution
      member.init(this);
      if(member instanceof FunctionCall) {
        this.function_calls.push(member);
      } else if(member instanceof PatternStatement) {
        this.patterns.set(member.identifier, member);
      } // @TODO: deal with pattern calls
    });
  }
  execute(songIterator) {
    console.log(`executing ${this.name}`);
    // @TODO: run functions before patterns
    for(let [patternname, pattern] of this.patterns) {
      console.log(`- ${patternname}: ${pattern.execute(songIterator, true).toString()}`);
      // @TODO: handle multi-measure patterns (via locks?)
      // true = I'm the instrument so if you're private return Nil
    }
  }
}
export class TrackCall {
  constructor(opts) {
    this.import = opts.import;
    this.track = opts.track;
    this.trackStatement = null; // will be set by the loader.
  }
}
