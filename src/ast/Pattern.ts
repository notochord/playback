import {Nil, cast_bool} from './type_utils';
import {NoteSet} from '../MIDI/Note';
import {
  TooManyBeatsError,
  NoSuchStyleError,
  NoSuchTrackError,
  NoSuchPatternError
} from './errors.js';
import Scope from './Scope.js';
import FunctionCall from './FunctionCall.js';
import SongIterator from 'notochord-song/types/songiterator';

export class PatternExpressionGroup extends Scope {
  public expressions: any[];
  public functionCalls: FunctionCall[];
  public nonFunctionCallExpressions: any[];
  public patternStatement: PatternStatement;

  constructor(expressions) {
    super();
    this.type = 'PatternExpressionGroup';
    this.name = '@pattern(<anonymous>)';
    
    this.defaultVars.set('private', false);
    this.defaultVars.set('chance', 1);
    
    this.expressions = expressions;
    this.functionCalls = [];
    this.nonFunctionCallExpressions = [];
  }
  init(scope, patternStatement = null) {
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
  link(ASTs, parentStyle, parentTrack) {
    this.expressions.forEach(expression => {
      expression.link(ASTs, parentStyle, parentTrack);
    });
  }
  execute(songIterator, callerIsTrack = false) {
    this.inherit();
    let beats: NoteSet | symbol = Nil;
    for(let function_call of this.functionCalls) {
      let return_value = function_call.execute(songIterator);
      if(return_value instanceof NoteSet) {
        if(beats !== Nil) {
          throw new TooManyBeatsError(this);
        }
        beats = return_value;
      }
    }
    if(callerIsTrack && this.vars.get('private') === true) {
      return Nil; // if it's private we can give up now
    }
    for(let expression of this.nonFunctionCallExpressions) {
      if(expression.execute) {
        expression = expression.execute(songIterator);
      }
      if(expression instanceof NoteSet) {
        if(beats !== Nil) {
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

  constructor(opts) {
    if(opts.expression instanceof PatternExpressionGroup) {
      // unroll the redundant expression group
      super(opts.expression.expressions);
    } else {
      super([opts.expression]);
    }
    this.identifier = opts.identifier;
    this.condition = (opts.condition !== undefined) ? opts.condition : null;
  }
  getChance() {
    return this.vars.get('chance');
  }
  link(ASTs, parentStyle, parentTrack) {
    super.link(ASTs, parentStyle, parentTrack);
    if(this.condition && this.condition.link) {
      this.condition.link(ASTs, parentStyle, parentTrack);
    }
  }
  init(scope) {
    super.init(scope);
    if(this.condition && this.condition.init) this.condition.init(this);
  }
  execute(songIterator: SongIterator, callerIsTrack = false) {
    if(this.condition) {
      let condition_value;
      if(this.condition.execute) {
        condition_value = this.condition.execute(songIterator);
      } else {
        condition_value = this.condition;
      }
      if(cast_bool(condition_value) === false) return Nil;
    }
    return super.execute(songIterator, callerIsTrack);
  }
}

export class PatternCall {
  public import?: string;
  public track?: string;
  public pattern: string;
  public scope: Scope;
  public patternStatement: PatternStatement;
  public prettyprintname: string;

  constructor(opts) {
    this.import = opts.import || null;
    this.track = opts.track || null;
    this.pattern = opts.pattern;
    this.scope = null;
    this.patternStatement = null;
    this.prettyprintname = (this.import || 'this') + '.' +
      (this.track || 'this') + '.' +
      this.pattern;
  }
  getChance() {
    return this.patternStatement.getChance()();
  }
  init(scope) {
    this.scope = scope;
  }
  link(ASTs, parentStyle, parentTrack) {
    let ast;
    if(this.import === null) {
      ast = parentStyle
    } else {
      // get path name of style
      let importPath = parentStyle.importedStyles.get(this.import);
      ast = ASTs.get(importPath);
      if(!ast) throw new NoSuchStyleError(this.import, this);
    }
    let track;
    if(this.track === null) {
      track = parentTrack;
    } else {
      track = ast.tracks.get(this.track);
      if(!track) throw new NoSuchTrackError(
        this.import || 'this',
        this.track || 'this',
        this);
    }
    let patternStatement = track.patterns.get(this.pattern);
    if(!patternStatement) throw new NoSuchPatternError(
      this.import || 'this',
      this.track || 'this',
      this.pattern,
      this);
    this.patternStatement = patternStatement;
  }
  execute(songIterator: SongIterator) {
    // called patternStatement ignores private()
    return this.patternStatement.execute(songIterator);
  }
}

export class JoinedPatternExpression {
  public patterns: any[];
  public scope: Scope;

  constructor(patterns) {
    this.patterns = patterns;
  }
  init(scope) {
    this.scope = scope;
    this.patterns.forEach(pattern => {
      if(pattern.init) pattern.init(scope);
    });
  }
  link(ASTs, parentStyle, parentTrack) {
    this.patterns.forEach(pattern => {
      pattern.link(ASTs, parentStyle, parentTrack);
    });
  }
  execute(songIterator: SongIterator) {
    let noteSets = [];
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
      return Nil;
    }
  }
}
