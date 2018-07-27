import {Nil, cast_bool} from './type_utils.js';

export class AnchorArgument {
  constructor(anchor) {
    this.anchor = anchor;
  }
}

class BooleanOperator {
  constructor() {
    this.args = [...arguments];
  }
  link(ASTs, parentStyle, parentTrack) {
    this.args.forEach(arg => {
      if(arg.link) arg.link(ASTs, parentStyle, parentTrack);
    });
  }
  init(scope) {
    this.scope = scope
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
  }
  resolve_args(songIterator) {
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
  constructor() {
    super(...arguments);
  }
  execute(songIterator) {
    let args = this.resolve_args(songIterator);
    return !cast_bool(args[0]);
  }
}
export class BooleanAnd extends BooleanOperator {
  constructor() {
    super(...arguments);
  }
  execute(songIterator) {
    // sorry no short-circuiting because this code is prettier
    // @TODO: add short-circuiting if this actually makes it too slow
    let args = this.resolve_args(songIterator);
    return cast_bool(args[0]) && cast_bool(args[1]);
  }
}
export class BooleanOr extends BooleanOperator {
  constructor() {
    super(...arguments);
  }
  execute(songIterator) {
    let args = this.resolve_args(songIterator);
    return cast_bool(args[0]) || cast_bool(args[1]);
  }
}
