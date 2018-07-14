import {Nil, cast_bool} from './type_utils.js';
import {NoteSet} from '../MIDI/Note.js';
import {TooManyBeatsError} from './errors.js';
import Scope from './Scope.js';
import FunctionCall from './FunctionCall.js';
import {BeatGroupLiteral} from './BeatGroups.js';

export class PatternStatement {
  constructor(opts) {
    this.identifier = opts.identifier,
    this.expression = opts.expression,
    this.condition = (opts.condition !== undefined) ? opts.condition : null;
  }
  init(scope) {
    this.scope = scope;
    if(this.condition && this.condition.init) this.condition.init(scope); //????
    if(this.expression.init) this.expression.init(scope, this); // I am not a scope
  }
  execute(songIterator, callerIsTrack) {
    if(this.condition) {
      let condition_value = this.condition.execute();
      if(cast_bool(condition_value) === false) return Nil;
    }
    if(this.expression.execute) {
      return this.expression.execute(songIterator, callerIsTrack);
    } else {
      return 'expression not executable yet :/'
    }
  }
}
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
    return true;
  }
}
