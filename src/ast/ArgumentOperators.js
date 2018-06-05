import {Nil, cast_bool} from './type_utils.js';

export class AnchorArgument {
  constructor(anchor) {
    this.anchor = anchor;
  }
}

class BooleanOperator {
  constructor() {
    this.args = Array.prototype.slice.call(arguments);
  }
  init(scope) {
    this.scope = scope
    this.args.forEach(arg => {
      if(arg.init) arg.init(scope);
    });
  }
  resolve_args() {
    return this.args.map(arg => {
      if(arg.init) {
        return arg.init();
      } else {
        return arg;
      }
    });
  }
}

export class BooleanNot extends BooleanOperator {
  constructor() {
    super(arguments);
  }
  execute() {
    let args = this.resolve_args();
    return !cast_bool(args[0]);
  }
}
export class BooleanAnd extends BooleanOperator {
  constructor() {
    super(arguments);
  }
  execute() {
    // sorry no short-circuiting because this code is prettier
    // @TODO: add short-circuiting if this actually makes it too slow
    let args = this.resolve_args();
    return cast_bool(args[0]) && cast_bool(args[1]);
  }
}
export class BooleanOr extends BooleanOperator {
  constructor() {
    super(arguments);
  }
  execute(arg) {
    let args = this.resolve_args();
    return cast_bool(args[0]) || cast_bool(args[1]);
  }
}
