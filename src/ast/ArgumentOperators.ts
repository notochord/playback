import { ASTNodeBase, Scope } from './ASTNodeBase';
import * as values from '../values/values';
import SongIterator from 'notochord-song/types/songiterator';

abstract class BooleanOperator extends ASTNodeBase {
  public args: any[];

  public constructor(...args) {
    super();
    this.args = args;
  }
  public link(ASTs, parentStyle, parentTrack): void {
    this.args.forEach(arg => {
      if(arg.link) arg.link(ASTs, parentStyle, parentTrack);
    });
  }
  public init(scope: Scope): void {
    super.init(scope);
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
  }
  protected resolveArgs(songIterator: SongIterator): values.PlaybackValue[] {
    return this.args.map(arg => {
      if(arg.execute) {
        return arg.execute(songIterator);
      } else {
        return arg;
      }
    });
  }
}

export class BooleanNot extends BooleanOperator {
  public execute(songIterator: SongIterator): values.PlaybackBooleanValue {
    const args = this.resolveArgs(songIterator);
    return new values.PlaybackBooleanValue(!args[0].toBoolean());
  }
}

export class BooleanAnd extends BooleanOperator {
  public execute(songIterator: SongIterator): values.PlaybackBooleanValue {
    // sorry no short-circuiting because this code is prettier
    // @TODO: add short-circuiting if this actually makes it too slow
    const args = this.resolveArgs(songIterator);
    return new values.PlaybackBooleanValue(args[0].toBoolean() && args[1].toBoolean());
  }
}

export class BooleanOr extends BooleanOperator {
  public execute(songIterator: SongIterator): values.PlaybackBooleanValue {
    const args = this.resolveArgs(songIterator);
    return new values.PlaybackBooleanValue(args[0].toBoolean() || args[1].toBoolean());
  }
}
