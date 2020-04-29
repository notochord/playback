import {Scope, ASTNodeBase} from './ASTNodeBase';
import FunctionCall from './FunctionCall';
import GlobalScope from './GlobalScope';

export class MetaStatement extends Scope {
  public functionCalls: FunctionCall[];

  public constructor(functionCalls: FunctionCall[]) {
    super();
    this.name = '@meta';
    this.type = '@meta';
    this.functionCalls = functionCalls;
  }
  public init(scope: GlobalScope): void {
    super.init(scope);
    
    // nothing in here can be dynamic so resolve these at compile time
    for(const functionCall of this.functionCalls) {
      functionCall.init(this);
      functionCall.execute();
    }
    
    scope.metadata = this.vars;
  }
  public execute(): null { return null; }
}

export class OptionsStatement extends Scope {
  public functionCalls: FunctionCall[];

  public constructor(functionCalls) {
    super();
    this.name = '@options';
    this.type = '@options';
    this.functionCalls = functionCalls;
  }
  public init(scope: GlobalScope): void {
    
    // nothing in here /should/ be dynamic so resolve these at compile time
    for(const functionCall of this.functionCalls) {
      functionCall.init(this);
      functionCall.execute();
    }
    
    this.scope = scope;
    // in this case we're actually overwriting our scope's variables, not
    // vise-versa
    scope.vars = new Map([...scope.vars, ...this.vars]);
  }
  public execute(): null { return null; }
}

export class ImportStatement extends ASTNodeBase {
  public path: string;
  public identifier: string;

  public constructor(path: string, identifier: string) {
    super();
    this.path = path;
    this.identifier = identifier;
  }
}
