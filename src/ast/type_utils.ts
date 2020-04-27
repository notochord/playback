const Nil: unique symbol = Symbol('Nil');
type Nil = typeof Nil;
let cast_bool = function(arg) {
  if(arg === Nil || arg === false) {
    return false;
  } else {
    return true;
  }
}

export {Nil, cast_bool};
