/**
 * Constructors for most kinds of nodes in the AST (excuding strings and things
 * that can be represented more easily by their JS value).
 *
 * It's probably bad form/risky to parse directly to the form that's
 * interpreted. Eh.
 */

import GlobalScope from './GlobalScope.js';
import {MetaStatement, OptionsStatement, ImportStatement} from './ConfigStatements.js';
import {TrackStatement, TrackCall} from './Track.js';
import {PatternStatement, PatternExpressionGroup, PatternCall, JoinedPatternExpression} from './Pattern.js';
import FunctionCall from './FunctionCall.js';
import {AnchorArgument, BooleanNot, BooleanAnd, BooleanOr} from './ArgumentOperators.js';

export {
  /* global meta stuff */
  GlobalScope,
  MetaStatement, OptionsStatement, ImportStatement,
  
  /* tracks */
  TrackStatement, TrackCall,
  
  /* patterns */
  PatternStatement, PatternExpressionGroup, PatternCall, JoinedPatternExpression,
  
  /* functions */
  FunctionCall,
  AnchorArgument, BooleanNot, BooleanAnd, BooleanOr
};

/* beats */
export function BeatGroupLiteral(measures) {
  this.measures = measures;
}
export function Measure(beats) {
  this.beats = beats;
  this.push = this.beats.push;
}
export function BeatLiteral(opts) {
  this.time = opts.time || {time: 'auto'};
  this.pitch = opts.pitch;
  this.octave = opts.octave || 'inherit';
}

/* drums */
export function DrumBeatGroupLiteral(drum, beatGroup) {
  this.drum = drum;
  if(beatGroup instanceof FunctionCall) { // we were passed a function call (e.g. choose)
    this.beatGroup = beatGroup; // for now there's no diff in functionality...
  } else {
    this.beatGroup = beatGroup;
  }
}
export function DrumBeatLiteral(opts) {
  this.time = opts.time;
  this.accented = opts.accented || false;
  }
