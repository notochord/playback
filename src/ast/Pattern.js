import Scope from './Scope.js';

export class PatternStatement {
  constructor(opts) {
    this.identifier = opts.identifier,
    this.expression = opts.expression,
    this.condition = (opts.condition !== undefined) ? opts.condition : null;
  }
  init(scope) {
    this.scope = scope;
    if(this.expression.init) this.expression.init(scope, this); // I am not a scope
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
  }
  init(scope, patternStatement = null) {
    super.init(scope);
    this.patternStatement = patternStatement;
    if(this.patternStatement) {
      this.name = `@pattern(${this.patternStatement})`;
    }
    this.expressions.forEach(expression => {
      if(expression.init) expression.init(this);
    });
  }
}
export class PatternCall {
  constructor(opts) {
    this.import = opts.import || null;
    this.track = opts.track || null;
    this.pattern = opts.pattern;
  }
}
export class JoinedPatternExpression {
  constructor(patterns) {
    this.patterns = patterns;
  }
}
