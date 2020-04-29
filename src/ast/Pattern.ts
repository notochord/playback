import { NoteSet } from '../MIDI/Note';
import {
  TooManyBeatsError,
  NoSuchStyleError,
  NoSuchTrackError,
  NoSuchPatternError
} from './errors.js';
import { Scope, ASTNodeBase } from './ASTNodeBase.js';
import FunctionCall from './FunctionCall.js';
import * as values from '../values/values';
import SongIterator from 'notochord-song/types/songiterator';
import GlobalScope from './GlobalScope';
import { TrackStatement } from './Track';

export class PatternExpressionGroup extends Scope {
  public expressions: ASTNodeBase[];
  public functionCalls: FunctionCall[];
  public nonFunctionCallExpressions: ASTNodeBase[];
  public patternStatement?: PatternStatement;

  public constructor(expressions: ASTNodeBase[]) {
    super();
    this.type = 'PatternExpressionGroup';
    this.name = '@pattern(<anonymous>)';
    
    this.defaultVars.set('private', new values.PlaybackBooleanValue(false));
    this.defaultVars.set('chance', new values.PlaybackNumberValue(1));
    
    this.expressions = expressions;
    this.functionCalls = [];
    this.nonFunctionCallExpressions = [];
  }
  public init(scope: Scope, patternStatement?: PatternStatement): void {
    super.init(scope);
    this.patternStatement = patternStatement;
    if(this.patternStatement) {
      this.name = `@pattern(${this.patternStatement})`;
    }
    this.expressions.forEach(expression => {
      if(expression.init) {
        expression.init(this);
      } else {
        throw ['expression not initialized:', expression];
      }
      if(expression instanceof FunctionCall) {
        this.functionCalls.push(expression);
      } else {
        this.nonFunctionCallExpressions.push(expression);
      }
    });
  }
  public link(ASTs: Map<string, GlobalScope>, parentStyle: GlobalScope, parentTrack: TrackStatement): void {
    this.expressions.forEach(expression => {
      expression.link!(ASTs, parentStyle, parentTrack);
    });
  }
  public execute(songIterator: SongIterator, callerIsTrack = false): NoteSet | null {
    this.inherit();
    let beats: NoteSet | null = null;
    for(const functionCall of this.functionCalls) {
      const returnValue = functionCall.execute(songIterator);
      if(returnValue instanceof NoteSet) {
        if(beats) {
          throw new TooManyBeatsError(this);
        }
        beats = returnValue;
      }
    }
    if(callerIsTrack && this.vars.get('private')!.value === true) {
      return null; // if it's private we can give up now
    }
    for(let expression of this.nonFunctionCallExpressions) {
      if(expression.execute) {
        expression = expression.execute(songIterator);
      }
      if(expression instanceof NoteSet) {
        if(beats) {
          throw new TooManyBeatsError(this);
        }
        beats = expression;
      }
    }
    return beats
  }
}

export class PatternStatement extends PatternExpressionGroup {
  public identifier: string;
  public condition?: any;

  public constructor(opts: any) {
    if(opts.expression instanceof PatternExpressionGroup) {
      // unroll the redundant expression group
      super(opts.expression.expressions);
    } else {
      super([opts.expression]);
    }
    this.identifier = opts.identifier;
    this.condition = (opts.condition !== undefined) ? opts.condition : null;
  }
  public getChance(): number {
    return this.vars.get('chance')!.value as number;
  }
  public link(ASTs: Map<string, GlobalScope>, parentStyle: GlobalScope, parentTrack: TrackStatement): void {
    super.link(ASTs, parentStyle, parentTrack);
    if(this.condition && this.condition.link) {
      this.condition.link(ASTs, parentStyle, parentTrack);
    }
  }
  public init(scope: Scope): void {
    super.init(scope);
    if(this.condition && this.condition.init) this.condition.init(this);
  }
  public execute(songIterator: SongIterator, callerIsTrack = false): NoteSet | null {
    if(this.condition) {
      let conditionValue;
      if(this.condition.execute) {
        conditionValue = this.condition.execute(songIterator);
      } else {
        conditionValue = this.condition;
      }
      if((conditionValue as values.PlaybackValue).toBoolean() === false) return null;
    }
    return super.execute(songIterator, callerIsTrack);
  }
}

export class PatternCall extends ASTNodeBase {
  public import?: string;
  public track?: string;
  public pattern: string;
  public patternStatement?: PatternStatement;
  public name: string;

  public constructor(opts: any) {
    super();
    this.import = opts.import || null;
    this.track = opts.track || null;
    this.pattern = opts.pattern;
    this.name = (this.import || 'this') + '.' +
      (this.track || 'this') + '.' +
      this.pattern;
  }
  public getChance(): number {
    return this.patternStatement!.getChance();
  }
  public init(scope: Scope): void {
    super.init(scope);
  }
  public link(ASTs: Map<string, GlobalScope>, parentStyle: GlobalScope, parentTrack: TrackStatement): void {
    let ast;
    if(!this.import) {
      ast = parentStyle
    } else {
      // get path name of style
      const importPath = parentStyle.importedStyles.get(this.import)!;
      ast = ASTs.get(importPath);
      if(!ast) throw new NoSuchStyleError(this.import, this);
    }
    let track;
    if(!this.track) {
      track = parentTrack;
    } else {
      track = ast.tracks.get(this.track);
      if(!track) throw new NoSuchTrackError(
        this.import || 'this',
        this.track || 'this',
        this);
    }
    const patternStatement = track.patterns.get(this.pattern) as PatternStatement | undefined;
    if(!patternStatement) throw new NoSuchPatternError(
      this.import || 'this',
      this.track || 'this',
      this.pattern,
      this);
    this.patternStatement = patternStatement;
  }
  public execute(songIterator: SongIterator): NoteSet | null {
    // called patternStatement ignores private()
    return this.patternStatement!.execute(songIterator);
  }
}

export class JoinedPatternExpression extends ASTNodeBase {
  public patterns: ASTNodeBase[];

  public constructor(patterns: ASTNodeBase[]) {
    super();
    this.patterns = patterns;
  }
  public init(scope: Scope): void {
    super.init(scope);
    this.patterns.forEach(pattern => {
      if(pattern.init) pattern.init(scope);
    });
  }
  public link(ASTs: Map<string, GlobalScope>, parentStyle: GlobalScope, parentTrack: TrackStatement): void {
    this.patterns.forEach(pattern => {
      pattern.link!(ASTs, parentStyle, parentTrack);
    });
  }
  public execute(songIterator: SongIterator): NoteSet | null {
    const noteSets = [];
    for(let pattern of this.patterns) {
      if(pattern.execute) {
        pattern = pattern.execute(songIterator);
      }
      if(pattern instanceof NoteSet) {
        noteSets.push(pattern);
      }
    }
    if(noteSets.length) {
      return (new NoteSet()).concat(...noteSets);
    } else {
      return null;
    }
  }
}
