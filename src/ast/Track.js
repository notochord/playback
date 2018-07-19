import {Nil} from './type_utils.js';
import {
  NoSuchStyleError,
  NoSuchTrackError,
  NoSuchPatternError,
  DrumBeatInMelodicBeatGroupError
} from './errors.js';
import {AwaitingDrum} from '../MIDI/Note.js';
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
    
    this.function_calls.forEach(function_call => {
      function_call.execute(songIterator);
    });
    
    // https://stackoverflow.com/a/4463613/1784306
    // I don't really understand the above explanation, this is probs wrong
    let totalWeight = 0;
    let weightedOptions = [];
    for(let [patternname, pattern] of this.patterns) {
      console.log(`- pattern "${patternname}":`);
      // true = I'm the instrument so if you're private return Nil
      let result = pattern.execute(songIterator, true);
      console.log('  - Result:', result);
      // @TODO: handle multi-measure patterns (via locks?)
      if(result !== Nil) {
        for(let note of result) {
          if (note.pitch === AwaitingDrum) {
            throw new DrumBeatInMelodicBeatGroupError(pattern);
          }
        }
        
        let chance = pattern.getChance();
        weightedOptions.push({
          noteSet: result,
          lower: totalWeight,
          upper: totalWeight + chance
        });
        totalWeight += chance;
      }
    }
    // binary search would make sense here if I expected more items
    let goal = Math.random() * totalWeight;
    for(let option of weightedOptions) {
      if(option.lower <= goal && goal <= option.upper) {
        console.log('  - Final result:', option.noteSet);
        return option.noteSet;
      }
    }
    console.log('  - Final result:', Nil);
    return Nil;
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
