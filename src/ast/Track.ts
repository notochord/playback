import {
  DrumBeatInMelodicBeatGroupError
} from './errors.js';
import {AwaitingDrum} from '../MIDI/Note';
import Scope from './Scope';
import FunctionCall from './FunctionCall';
import {PatternStatement, PatternCall} from './Pattern';
import SongIterator from 'notochord-song/types/songiterator';
import * as values from '../values/values';
import {NoteSet} from '../MIDI/Note';

export class TrackStatement extends Scope {
  public instrument: string;
  public identifier: string;
  public members: (FunctionCall | PatternStatement | PatternCall)[];

  public functionCalls: FunctionCall[];
  public patterns: Map<string, PatternStatement | PatternCall>;
  public patternCalls: PatternCall[];

  constructor(opts) {
    super();
    this.name = opts.identifier;
    this.type = '@track';

    this.defaultVars.set('octave', new values.PlaybackNumberValue(4));
    this.defaultVars.set('volume', new values.PlaybackNumberValue(1));
    this.defaultVars.set('private', new values.PlaybackBooleanValue(false));
    
    this.instrument = opts.instrument;
    this.identifier = opts.identifier;
    this.members = opts.members;
  }
  init(scope) {
    super.init(scope);
    this.functionCalls = [];
    this.patterns = new Map();
    this.patternCalls = [];
    this.members.forEach(member => {
      // initialize them all now, var inheritence is handled during execution
      member.init(this);
      if(member instanceof FunctionCall) {
        this.functionCalls.push(member);
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
    
    for(let [, pattern] of this.patterns) {
      pattern.link(ASTs, parentStyle, this);
    }
  }
  execute(songIterator) {
    this.inherit();
    console.log(`executing TrackStatement "${this.name}"`);
    
    this.functionCalls.forEach(function_call => {
      function_call.execute(songIterator);
    });
    
    // weighted random picking
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
      if(result) {
        for(let note of (result as NoteSet)) {
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
    console.log('  - Final result:', null);
    return null;
  }
}
export class TrackCall {
  public import: string;
  public track: string;
  public trackStatement: TrackStatement;

  constructor(opts) {
    this.import = opts.import;
    this.track = opts.track;
    this.trackStatement = null; // will be set by the loader.
  }
  execute(songIterator: SongIterator) {
    this.trackStatement.execute(songIterator);
  }
}
