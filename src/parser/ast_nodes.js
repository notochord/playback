/**
 * This file should have a better name maybe?
 */
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
module.exports = {
  ConfigurationStatement: function(opts) {
    this.identifier = opts.identifier;
    this.members = opts.members;
    this.toString = (depth = 0) => `${tab(depth)}@${this.identifier} {${tabArr(this.members, depth + 1)}${tab(depth)}}`
  },
  ImportStatement: function(opts) {
    this.path = opts.path;
    this.identifier = opts.identifier;
    this.toString = (depth = 0) => `${tab(depth)}@import "${this.path}" as ${this.identifier}`;
  },
  
  /* track */
  TrackStatement: function(opts) {
    this.instrument = opts.instrument;
    this.identifier = opts.identifier;
    this.members = opts.members;
    this.toString = (depth = 0) => `${tab(depth)}@track "${this.instrument}" as ${this.identifier} {${tabArr(this.members, depth + 1)}${tab(depth)}}`
  },
  
  /* patterns */
  PatternStatement: function(opts) {
    this.identifier = opts.identifier,
    this.expression = opts.expression,
    this.condition = (opts.condition !== undefined) ? opts.condition : null;
    this.toString = (depth = 0) => `${tab(depth)}@pattern ${this.identifier}${
        this.condition ? `${tab(depth)}if (${this.condition.toString(depth + 1)}${tab(depth)})` : ''
      } ${this.expression.toString(depth + 1)}`;
  },
  PatternExpressionGroup: function(_expressions) {
    this.expressions = _expressions;
    this.toString = (depth = 0) => `${tab(depth)}{${tabArr(this.expressions, depth + 1)}${tab(depth)}}`
  },
  PatternCall: function(opts) {
    this.instrument = opts.instrument;
    this.pattern = opts.pattern;
    this.local = opts.local;
    this.toString = (depth = 0) => `${tab(depth)}@pattern( ${this.instrument ? `${this.instrument} . `: ''}${this.pattern} )`
  },
  JoinedPatternExpression: function(_patterns) {
    this.patterns = _patterns;
    this.push = this.patterns.push;
    this.toString = (depth = 0) => `${tabArr(this.patterns, depth, ' &')}`
  },
  
  /* functions */
  FunctionCall: function(identifier, args = []) {
    this.identifier = identifier;
    this.args = args;
    this.toString = (depth = 0) => `${tab(depth)}${this.identifier}(${tabArr(this.args, depth + 1)}${tab(depth)})`;
  },
  AnchorAsArgument: function(anchor) {
    this.anchor = anchor;
    this.toString = (depth = 0) => `${tab(depth)}${this.anchor}`;
  },
  BooleanNot: function(arg) {
    this.arg = arg;
    this.toString = (depth = 0) => `${tab(depth)}not (${string(this.arg, depth+1)}${tab(depth)})`;
  },
  BooleanAnd: function(arg1, arg2) {
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.toString = (depth = 0) => `${tab(depth)}(${string(this.arg1, depth+1)}${tab(depth)}and${string(this.arg2, depth+1)}${tab(depth)})`;
  },
  BooleanOr: function(arg1, arg2) {
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.toString = (depth = 0) => `${tab(depth)}(${string(this.arg1, depth+1)}${tab(depth)}or${string(this.arg2, depth+1)}${tab(depth)})`;
  },
  
  /* beats */
  BeatGroupLiteral: function(measures) {
    this.measures = measures;
    this.toString = (depth = 0, drum = false) => `${!drum ? tab(depth) : ''}< ${tabArr(this.measures, depth, ' |')} ${tab(depth)}>`;
  },
  Measure: function(beats) {
    this.beats = beats;
    this.push = this.beats.push;
    this.toString = (depth = 0) => tabArr(this.beats, depth + 1);
  },
  BeatLiteral: function(opts) {
    this.time = opts.time || {time: 'auto'};
    this.pitch = opts.pitch;
    this.octave = opts.octave || 'inherit';
    this.toString = (depth = 0) => `${tab(depth)}BeatLiteral(${
        this.time.time + (this.time.flag || '')
      }:${ JSON.stringify(this.pitch) }:${ this.octave })`;
  },
  
  /* drums */
  DrumBeatGroupLiteral: function(drum, beatGroup) {
    this.drum = drum;
    if(beatGroup instanceof module.exports.FunctionCall) { // we were passed a function call (e.g. choose)
      this.beatGroup = beatGroup; // for now there's no diff in functionality...
    } else {
      this.beatGroup = beatGroup;
    }
    this.toString = (depth = 0) => `${tab(depth)}"${this.drum}" ${this.beatGroup.toString(depth, true)}`;
  },
  DrumBeatLiteral: function(opts) {
    this.time = opts.time;
    this.accented = opts.accented || false;
    this.toString = (depth = 0) => `${tab(depth)}DrumBeatLiteral(${this.time}${this.accented ? 'a' : ''})`;
  }
};
