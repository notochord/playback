import Scope from './Scope';
import FunctionCall from './FunctionCall';
import GlobalScope from './GlobalScope';

export class MetaStatement extends Scope {
  public functionCalls: FunctionCall[];

  constructor(functionCalls: FunctionCall[]) {
    super();
    this.name = '@meta';
    this.type = '@meta';
    this.functionCalls = functionCalls;
  }
  init(scope: GlobalScope) {
    this.scope = scope;
    
    // nothing in here can be dynamic so resolve these at compile time
    for(let functionCall of this.functionCalls) {
      functionCall.init(this);
      functionCall.execute();
    }
    
    scope.metadata = this.vars;
  }
}

export class OptionsStatement extends Scope {
  public functionCalls: FunctionCall[];

  constructor(functionCalls) {
    super();
    this.name = '@options';
    this.type = '@options';
    this.functionCalls = functionCalls;
  }
  init(scope: GlobalScope) {
    
    // nothing in here /should/ be dynamic so resolve these at compile time
    for(let functionCall of this.functionCalls) {
      functionCall.init(this);
      functionCall.execute();
    }
    
    this.scope = scope;
    // in this case we're actually overwriting our scope's variables, not
    // vise-versa
    scope.vars = new Map([...scope.vars, ...this.vars]);
  }
}

export class ImportStatement {
  public path: string;
  public identifier: string;

  constructor(path, identifier) {
    this.path = path;
    this.identifier = identifier;
  }
}
