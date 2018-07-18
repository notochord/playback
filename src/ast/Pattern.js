import {Nil, cast_bool} from './type_utils.js';
import {NoteSet} from '../MIDI/Note.js';
import {TooManyBeatsError} from './errors.js';
import Scope from './Scope.js';
import FunctionCall from './FunctionCall.js';
import {BeatGroupLiteral} from './BeatGroups.js';

export class PatternExpressionGroup extends Scope {
  constructor(expressions) {
    super();
    this.type = 'PatternExpressionGroup';
    this.name = '@pattern(<anonymous>)';
    
    this.vars.set('private', false);
    this.vars.set('chance', 1);
    
    this.expressions = expressions;
    this.function_calls = [];
    this.non_function_call_expressions = [];
  }
  init(scope, patternStatement = null) {
    super.init(scope);
    this.patternStatement = patternStatement;
    if(this.patternStatement) {
      this.name = `@pattern(${this.patternStatement})`;
    }
    this.expressions.forEach(expression => {
      if(expression.init) expression.init(this);
      if(expression instanceof FunctionCall) {
        this.function_calls.push(expression);
      } else {
        this.non_function_call_expressions.push(expression);
      }
    });
  }
  link(ASTs, parentStyle, parentTrack) {
    /*for(let patternCall of this.patternCalls) {
      // get path name of style
      let ast;
      if(patternCall.import === null) {
        ast = parentStyle
      } else {
        let importPath = parentStyle.importedStyles.get(patternCall.import);
        ast = ASTs.get(importPath);
        if(!ast) throw new NoSuchStyleError(patternCall.import, this);
      }
      let track;
      if(patternCall.track === null) {
        track = parentTrack;
      } else {
        let trackStatement = ast.tracks.get(patternCall.track);
        if(!trackStatement) throw new NoSuchTrackError(
          patternCall.import || 'this',
          patternCall.track || 'this',
          this);
      }
      let patternStatement = track.patterns.get(patternCall.pattern);
      if(!patternStatement) throw new NoSuchPatternError(
        patternCall.import || 'this',
        patternCall.track || 'this',
        patternCall.pattern,
        this);
      //trackCall.trackStatement = trackStatement;
      let name = (patternCall.import || 'this') + '.' +
        (patternCall.track || 'this') + '.' +
        patternCall.pattern;
      this.patterns.set(name, patternStatement);
    }*/
  }
  execute(songIterator, callerIsTrack = false) {
    let beats = Nil;
    for(let function_call of this.function_calls) {
      let return_value = function_call.execute();
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
    for(let expression of this.non_function_call_expressions) {
      if(expression.execute) {
        console.log('  - executing executable expression')
        expression = expression.execute(songIterator);
      }
      if(expression instanceof NoteSet) {
        console.log('  - instanceof NoteSet');
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
  init(scope) {
    super.init(scope);
    if(this.condition && this.condition.init) this.condition.init(this);
  }
  execute(songIterator, callerIsTrack) {
    if(this.condition) {
      let condition_value = this.condition.execute();
      if(cast_bool(condition_value) === false) return Nil;
    }
    return super.execute(songIterator, callerIsTrack);
  }
}

export class PatternCall {
  constructor(opts) {
    this.import = opts.import || null;
    this.track = opts.track || null;
    this.pattern = opts.pattern;
    this.scope = null;
  }
  init(scope) {
    this.scope = scope;
    // @TODO: somehow request them from the PlaybackStyle object?
  }
}
export class JoinedPatternExpression {
  constructor(patterns) {
    this.patterns = patterns;
  }
  init(scope) {
    this.scope = scope;
  }
  execute(songIterator) {
    let noteSets = [];
    for(let pattern of this.patterns) {
      if(pattern.execute) {
        pattern = pattern.execute(songIterator);
      }
      if(pattern instanceof NoteSet) {
        noteSets.push(pattern);
      } else {
        console.log('    - non NoteSet in joined expression:', pattern);
      }
    }
    if(noteSets.length) {
      return (new NoteSet()).concat(...noteSets);
    } else {
      return Nil;
    }
  }
}
