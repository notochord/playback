import {
  DrumBeatInMelodicBeatGroupError
} from './errors.js';
import { Scope, ASTNodeBase } from './ASTNodeBase';
import FunctionCall from './FunctionCall';
import { PatternStatement, PatternCall } from './Pattern';
import SongIterator from 'notochord-song/types/songiterator';
import * as values from '../values/values';
import GlobalScope from './GlobalScope';

export class TrackStatement extends Scope {
  public instrument: string;
  public identifier: string;
  public members: (FunctionCall | PatternStatement | PatternCall)[];

  public functionCalls: FunctionCall[];
  public patterns: Map<string, PatternStatement | PatternCall>;
  public patternCalls: PatternCall[];

  public constructor(opts: any) {
    super();
    this.name = opts.identifier;
    this.type = '@track';

    this.defaultVars.set('octave', new values.NumberValue(4));
    this.defaultVars.set('volume', new values.NumberValue(1));
    this.defaultVars.set('private', new values.BooleanValue(false));
    
    this.instrument = opts.instrument;
    this.identifier = opts.identifier;
    this.members = opts.members;
  }
  public init(scope: Scope): void {
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
  public link(ASTs: Map<string, GlobalScope>, parentStyle: GlobalScope): void {
    for(const patternCall of this.patternCalls) {
      patternCall.link(ASTs, parentStyle, this);
      this.patterns.set(patternCall.name, patternCall);
    }
    
    for(const [, pattern] of this.patterns) {
      pattern.link(ASTs, parentStyle, this);
    }
  }
  public execute(songIterator: SongIterator): values.NoteSetValue | values.NilValue {
    this.inherit();
    console.log(`executing TrackStatement "${this.name}"`);
    
    this.functionCalls.forEach(functionCall => {
      functionCall.execute(songIterator);
    });
    
    // weighted random picking
    // https://stackoverflow.com/a/4463613/1784306
    // I don't really understand the above explanation, this is probs wrong
    let totalWeight = 0;
    const weightedOptions = [];
    for(const [patternname, pattern] of this.patterns) {
      console.log(`- pattern "${patternname}":`);
      // true = I'm the instrument so if you're private return Nil
      const result = pattern.execute(songIterator, true);
      console.log('  - Result:', result);
      // @TODO: handle multi-measure patterns (via locks?)
      if(result.type === 'note_set') {
        for(const note of result.value) {
          if (note.pitch === 'AwaitingDrum') {
            throw new DrumBeatInMelodicBeatGroupError(pattern);
          }
        }
        
        const chance = pattern.getChance();
        weightedOptions.push({
          noteSet: result,
          lower: totalWeight,
          upper: totalWeight + chance
        });
        totalWeight += chance;
      }
    }
    // binary search would make sense here if I expected more items
    const goal = Math.random() * totalWeight;
    for(const option of weightedOptions) {
      if(option.lower <= goal && goal <= option.upper) {
        console.log('  - Final result:', option.noteSet);
        return option.noteSet;
      }
    }
    console.log('  - Final result:', null);
    return new values.NilValue();
  }
}
export class TrackCall extends ASTNodeBase {
  public import: string;
  public track: string;
  public trackStatement: TrackStatement; // will be set by the loader.

  public constructor(opts: any) {
    super();
    this.import = opts.import;
    this.track = opts.track;
  }
  public execute(songIterator: SongIterator): values.NilValue {
    this.trackStatement.execute(songIterator); // @TODO: should we be doing something with this value?
    return new values.NilValue();
  }
}
