import { PlaybackValue } from '../values/values';
import { SongIterator } from 'notochord-song';

export abstract class ASTNodeBase {
  public scope: Scope;
  public init(parentScope: Scope, ...args: any[]): void {
    this.scope = parentScope;
  }
  public link(...args: any[]): void { return undefined; }
  public abstract execute(songInterator: SongIterator): PlaybackValue;
}

/*
 * In Playback styles, basically any pair of curly brackets defines a scope
 * which inherits settings from its parent scope but can overwrite them.
 */
export abstract class Scope extends ASTNodeBase {
  public name: string;
  public defaultVars: Map<string, PlaybackValue> = new Map();
  public vars: Map<string, PlaybackValue> = new Map();
  public type: string;
  public scope: Scope;

  public inherit(): void {
    this.vars = new Map([...this.defaultVars, ...this.scope.vars]);
  }
  public init(scope: Scope, ...args: any[]): void {
    super.init(scope);
    
    // in case this.vars was set in the constructor
    this.vars = new Map([...this.defaultVars, ...this.scope.vars, ...this.vars]);
  }
}
