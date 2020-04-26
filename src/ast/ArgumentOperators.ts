import {Nil, cast_bool} from './type_utils';
import Scope from './Scope';
import SongIterator from 'notochord-song/types/songiterator';

type Anchor = 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
export class AnchorArgument {
  public anchor: Anchor;

  constructor(anchor: Anchor) {
    this.anchor = anchor;
  }
}

class BooleanOperator {
  public args: any[];
  public scope: Scope;

  constructor(...args) {
    this.args = args;
  }
  link(ASTs, parentStyle, parentTrack) {
    this.args.forEach(arg => {
      if(arg.link) arg.link(ASTs, parentStyle, parentTrack);
    });
  }
  init(scope: Scope) {
    this.scope = scope
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
  }
  resolve_args(songIterator: SongIterator) {
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
  constructor(...args) {
    super(...args);
  }
  execute(songIterator: SongIterator) {
    let args = this.resolve_args(songIterator);
    return !cast_bool(args[0]);
  }
}
export class BooleanAnd extends BooleanOperator {
  constructor(...args) {
    super(...args);
  }
  execute(songIterator: SongIterator) {
    // sorry no short-circuiting because this code is prettier
    // @TODO: add short-circuiting if this actually makes it too slow
    let args = this.resolve_args(songIterator);
    return cast_bool(args[0]) && cast_bool(args[1]);
  }
}
export class BooleanOr extends BooleanOperator {
  constructor(...args) {
    super(...args);
  }
  execute(songIterator: SongIterator) {
    let args = this.resolve_args(songIterator);
    return cast_bool(args[0]) || cast_bool(args[1]);
  }
}
