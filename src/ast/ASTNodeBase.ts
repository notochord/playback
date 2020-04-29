import { PlaybackValue } from '../values/values';
import SongIterator from '../../../notochord-song/types/songiterator';

export abstract class ASTNodeBase {
  public scope: Scope;
  public init(parentScope: Scope, ...args): void {
    this.scope = parentScope;
  }
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
  public init(scope: Scope, ...args): void {
    super.init(scope);
    
    // in case this.vars was set in the constructor
    this.vars = new Map([...this.defaultVars, ...this.scope.vars, ...this.vars]);
  }
  public abstract execute(songInterator: SongIterator): any;
}
