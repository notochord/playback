/*
 * In Playback styles, basically any pair of curly brackets defines a scope
 * which inherits settings from its parent scope but can overwrite them.
 */
export default class Scope {
  public defaultVars: Map<string, any>;
  public vars: Map<string, any>;
  public name: string;
  public type: string;
  public scope: Scope;

  constructor() {
    this.defaultVars = new Map();
    this.vars = new Map();
    this.name = null;
    this.type = null;
    this.scope = null;
  }
  inherit() {
    this.vars = new Map([...this.defaultVars, ...this.scope.vars]);
  }
  init(scope) { // parent scope, if that's unclear
    this.scope = scope;
    
    // in case this.vars was set in the constructor
    this.vars = new Map([...this.defaultVars, ...this.scope.vars, ...this.vars]);
  }
}