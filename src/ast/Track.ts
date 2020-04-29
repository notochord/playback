import {
  DrumBeatInMelodicBeatGroupError
} from './errors.js';
import {AwaitingDrum} from '../MIDI/Note';
import {Scope, ASTNodeBase} from './ASTNodeBase';
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

  public constructor(opts) {
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
  public link(ASTs, parentStyle): void {
    for(const patternCall of this.patternCalls) {
      patternCall.link(ASTs, parentStyle, this);
      this.patterns.set(patternCall.prettyprintname, patternCall);
    }
    
    for(const [, pattern] of this.patterns) {
      pattern.link(ASTs, parentStyle, this);
    }
  }
  public execute(songIterator: SongIterator): null {
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
      if(result) {
        for(const note of (result as NoteSet)) {
          if (note.pitch === AwaitingDrum) {
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
    return null;
  }
}
export class TrackCall extends ASTNodeBase {
  public import: string;
  public track: string;
  public trackStatement: TrackStatement;

  public constructor(opts) {
    super();
    this.import = opts.import;
    this.track = opts.track;
    this.trackStatement = null; // will be set by the loader.
  }
  public execute(songIterator: SongIterator): void {
    this.trackStatement.execute(songIterator);
  }
}
