import Scope from './Scope.js';
import FunctionCall from './FunctionCall.js';

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
      } else {
        this.patterns.set(member.identifier, member);
      }
    });
  }
}
export class TrackCall {
  constructor(opts) {
    this.import = opts.import;
    this.track = opts.track;
  }
}
