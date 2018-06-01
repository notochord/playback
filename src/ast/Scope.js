/*
 * In Playback styles, basically any pair of curly brackets defines a scope
 * which inherits settings from its parent scope but can overwrite them.
 */
export default class Scope {
  constructor() {
    this.vars = new Map();
    this.name = null;
    this.parent = null;
  }
  set init(parent) { // parent scope, if that's unclear
    this.parent = parent;
    
    // in case this.vars was set in the constructor
    this.vars = new Map([...parent.vars, ...this.vars]);
  }
}
