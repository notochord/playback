import { ASTNodeBase, Scope } from './ASTNodeBase';
import * as values from '../values/values';
import SongIterator from 'notochord-song/types/songiterator';
import GlobalScope from './GlobalScope';
import { TrackStatement } from './Track';

abstract class BooleanOperator extends ASTNodeBase {
  public args: ASTNodeBase[];

  public constructor(...args: ASTNodeBase[]) {
    super();
    this.args = args;
  }
  public link(ASTs: Map<string, GlobalScope>, parentStyle: GlobalScope, parentTrack: TrackStatement): void {
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
      return arg.execute(songIterator);
    });
  }
}

export class BooleanNot extends BooleanOperator {
  public execute(songIterator: SongIterator): values.BooleanValue {
    const args = this.resolveArgs(songIterator);
    return new values.BooleanValue(!args[0].toBoolean());
  }
}

export class BooleanAnd extends BooleanOperator {
  public execute(songIterator: SongIterator): values.BooleanValue {
    // sorry no short-circuiting because this code is prettier
    // @TODO: add short-circuiting if this actually makes it too slow
    const args = this.resolveArgs(songIterator);
    return new values.BooleanValue(args[0].toBoolean() && args[1].toBoolean());
  }
}

export class BooleanOr extends BooleanOperator {
  public execute(songIterator: SongIterator): values.BooleanValue {
    const args = this.resolveArgs(songIterator);
    return new values.BooleanValue(args[0].toBoolean() || args[1].toBoolean());
  }
}
