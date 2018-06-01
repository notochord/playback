import Scope from './Scope.js';

export class MetaStatement extends Scope {
  constructor(function_calls) {
    super();
    this.name = '@meta';
    
    // nothing in here can be dynamic so resolve these at compile time
    for(let function_call of function_calls) {
      function_call.init(this);
      function_call.call_func();
    }
  }
  init(parent) {
    this.parent = parent;
    parent.meta = this.vars;
  }
}

export class OptionsStatement extends Scope {
  constructor(function_calls) {
    super();
    this.name = '@options';
    
    // nothing in here can be dynamic so resolve these at compile time
    for(let function_call of function_calls) {
      function_call.init(this);
      function_call.call_func();
    }
  }
  init(parent) {
    this.parent = parent;
    // in this case we're actually overwriting our parent's variables, not
    // vise-versa
    parent.vars = new Map([...parent.vars, ...this.vars]);
  }
}
