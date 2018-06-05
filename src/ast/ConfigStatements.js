import Scope from './Scope.js';

export class MetaStatement extends Scope {
  constructor(function_calls) {
    super();
    this.name = '@meta';
    this.type = '@meta';
    this.function_calls = function_calls;
  }
  init(scope) {
    this.scope = scope;
    
    // nothing in here can be dynamic so resolve these at compile time
    for(let function_call of this.function_calls) {
      function_call.init(this);
      function_call.execute();
    }
    
    scope.meta = this.vars;
  }
}

export class OptionsStatement extends Scope {
  constructor(function_calls) {
    super();
    this.name = '@options';
    this.type = '@options';
    this.function_calls = function_calls;
  }
  init(scope) {
    
    // nothing in here /should/ be dynamic so resolve these at compile time
    for(let function_call of this.function_calls) {
      function_call.init(this);
      function_call.execute();
    }
    
    this.scope = scope;
    // in this case we're actually overwriting our scope's variables, not
    // vise-versa
    scope.vars = new Map([...scope.vars, ...this.vars]);
  }
}

export class ImportStatement {
  constructor(path, identifier) {
    this.path = path;
    this.identifier = identifier;
  }
}
