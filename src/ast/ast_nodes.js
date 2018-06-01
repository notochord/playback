/**
 * Constructors for most kinds of nodes in the AST (excuding strings and things
 * that can be represented more easily by their JS value).
 *
 * It's probably bad form/risky to parse directly to the form that's
 * interpreted. Eh.
 */

import GlobalScope from './GlobalScope.js';
import {MetaStatement, OptionsStatement} from './ConfigStatements.js';
import FunctionCall from './FunctionCall.js';

var tab = (depth) => '\n' + '\t'.repeat(depth);
var string = (item, depth) => {
  if(typeof item == 'object') {
    return item.toString(depth);
  } else if(item.toString) {
    return tab(depth) + item;
  }
}
var tabArr = (array, depth, joiner = '') => array.reduce((out, item, idx, arr) => {
    if(idx == arr.length - 1) joiner = '';
    return out + string(item, depth) + joiner;
  }, '');

export {
  /* global meta stuff */
  GlobalScope, MetaStatement, OptionsStatement,
  
  /* functions */
  FunctionCall
};

/*export function ConfigurationStatement(opts) {
  this.identifier = opts.identifier;
  this.members = opts.members;
  this.toString = (depth = 0) => `${tab(depth)}@${this.identifier} {${tabArr(this.members, depth + 1)}${tab(depth)}}`
}*/
export function ImportStatement(opts) {
  this.path = opts.path;
  this.identifier = opts.identifier;
  this.toString = (depth = 0) => `${tab(depth)}@import "${this.path}" as ${this.identifier}`;
}

/* track */
export function TrackStatement(opts) {
  this.instrument = opts.instrument;
  this.identifier = opts.identifier;
  this.members = opts.members;
  this.toString = (depth = 0) => `${tab(depth)}@track "${this.instrument}" as ${this.identifier} {${tabArr(this.members, depth + 1)}${tab(depth)}}`
}
export function TrackCall(opts) {
  this.import = opts.import;
  this.track = opts.track;
  this.toString = (depth = 0) => `${tab(depth)}@track( ${this.import} . ${this.track} )`
}

/* patterns */
export function PatternStatement(opts) {
  this.identifier = opts.identifier,
  this.expression = opts.expression,
  this.condition = (opts.condition !== undefined) ? opts.condition : null;
  this.toString = (depth = 0) => `${tab(depth)}@pattern ${this.identifier}${
      this.condition ? `${tab(depth)}if (${this.condition.toString(depth + 1)}${tab(depth)})` : ''
    } ${this.expression.toString(depth + 1)}`;
}
export function PatternExpressionGroup(_expressions) {
  this.expressions = _expressions;
  this.toString = (depth = 0) => `${tab(depth)}{${tabArr(this.expressions, depth + 1)}${tab(depth)}}`
}
export function PatternCall(opts) {
  this.import = opts.import || null;
  this.track = opts.track || null;
  this.pattern = opts.pattern;
  this.toString = (depth = 0) => `${tab(depth)}@pattern( ${this.import ? `${this.import} . `: ''}${this.track ? `${this.track} . `: ''}${this.pattern} )`
}
export function JoinedPatternExpression(_patterns) {
  this.patterns = _patterns;
  this.toString = (depth = 0) => `${tabArr(this.patterns, depth, ' &')}`
}

/* functions */
/*export function FunctionCall(identifier, args = []) {
  this.identifier = identifier;
  this.args = args;
  this.toString = (depth = 0) => `${tab(depth)}${this.identifier}(${tabArr(this.args, depth + 1)}${tab(depth)})`;
}*/
export function AnchorAsArgument(anchor) {
  this.anchor = anchor;
  this.toString = (depth = 0) => `${tab(depth)}${this.anchor}`;
}
export function BooleanNot(arg) {
  this.arg = arg;
  this.toString = (depth = 0) => `${tab(depth)}not (${string(this.arg, depth+1)}${tab(depth)})`;
}
export function BooleanAnd(arg1, arg2) {
  this.arg1 = arg1;
  this.arg2 = arg2;
  this.toString = (depth = 0) => `${tab(depth)}(${string(this.arg1, depth+1)}${tab(depth)}and${string(this.arg2, depth+1)}${tab(depth)})`;
}
export function BooleanOr(arg1, arg2) {
  this.arg1 = arg1;
  this.arg2 = arg2;
  this.toString = (depth = 0) => `${tab(depth)}(${string(this.arg1, depth+1)}${tab(depth)}or${string(this.arg2, depth+1)}${tab(depth)})`;
}

/* beats */
export function BeatGroupLiteral(measures) {
  this.measures = measures;
  this.toString = (depth = 0, drum = false) => `${!drum ? tab(depth) : ''}< ${tabArr(this.measures, depth, ' |')} ${tab(depth)}>`;
}
export function Measure(beats) {
  this.beats = beats;
  this.push = this.beats.push;
  this.toString = (depth = 0) => tabArr(this.beats, depth + 1);
}
export function BeatLiteral(opts) {
  this.time = opts.time || {time: 'auto'};
  this.pitch = opts.pitch;
  this.octave = opts.octave || 'inherit';
  this.toString = (depth = 0) => `${tab(depth)}BeatLiteral(${
      this.time.time + (this.time.flag || '')
    }:${ JSON.stringify(this.pitch) }:${ this.octave })`;
}

/* drums */
export function DrumBeatGroupLiteral(drum, beatGroup) {
  this.drum = drum;
  if(beatGroup instanceof FunctionCall) { // we were passed a function call (e.g. choose)
    this.beatGroup = beatGroup; // for now there's no diff in functionality...
  } else {
    this.beatGroup = beatGroup;
  }
  this.toString = (depth = 0) => `${tab(depth)}"${this.drum}" ${this.beatGroup.toString(depth, true)}`;
}
export function DrumBeatLiteral(opts) {
  this.time = opts.time;
  this.accented = opts.accented || false;
  this.toString = (depth = 0) => `${tab(depth)}DrumBeatLiteral(${this.time}${this.accented ? 'a' : ''})`;
  }
