import {Nil} from './type_utils.js';
import {
  NoSuchStyleError,
  NoSuchTrackError,
  NoSuchPatternError
} from './errors.js';
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
    this.patternCalls = [];
    this.members.forEach(member => {
      // initialize them all now, var inheritence is handled during execution
      member.init(this);
      if(member instanceof FunctionCall) {
        this.function_calls.push(member);
      } else if(member instanceof PatternStatement) {
        this.patterns.set(member.identifier, member);
      } else if(member instanceof PatternCall) {
        this.patternCalls.push(member);
      }
    });
  }
  link(ASTs, parentStyle) {
    for(let patternCall of this.patternCalls) {
      patternCall.link(ASTs, parentStyle, this);
      this.patterns.set(patternCall.prettyprintname, patternCall);
    }
    
    for(let [patternname, pattern] of this.patterns) {
      pattern.link(ASTs, parentStyle, this);
    }
  }
  execute(songIterator) {
    console.log(`executing TrackStatement "${this.name}"`);
    // @TODO: run functions before patterns
    for(let [patternname, pattern] of this.patterns) {
      console.log(`- pattern "${patternname}":`);
      console.log('  - Result:', pattern.execute(songIterator, true));
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
  execute(songIterator) {
    this.trackStatement.execute(songIterator);
  }
}
