/**
 * Constructors for most kinds of nodes in the AST (excuding strings and things
 * that can be represented more easily by their JS value).
 *
 * It's probably bad form/risky to parse directly to the form that's
 * interpreted. Eh.
 */

import GlobalScope from './GlobalScope.js';
import { MetaStatement, OptionsStatement, ImportStatement } from './ConfigStatements.js';
import { TrackStatement, TrackCall } from './Track.js';
import { PatternStatement, PatternExpressionGroup, PatternCall, JoinedPatternExpression } from './Pattern.js';
import FunctionCall from './FunctionCall.js';
import { BooleanNot, BooleanAnd, BooleanOr } from './ArgumentOperators.js';
import { BeatGroupLiteral, Measure, DrumBeatGroupLiteral } from './BeatGroups.js';
import { MelodicBeatLiteral, DrumBeatLiteral } from './BeatLiterals.js';

export {
  /* meta stuff */
  GlobalScope,
  MetaStatement, OptionsStatement, ImportStatement,
  
  /* tracks */
  TrackStatement, TrackCall,
  
  /* patterns */
  PatternStatement, PatternExpressionGroup, PatternCall, JoinedPatternExpression,
  
  /* functions */
  FunctionCall,
  BooleanNot, BooleanAnd, BooleanOr,
  
  /* beat groups */
  BeatGroupLiteral, Measure, DrumBeatGroupLiteral,
  
  /* beats */
  MelodicBeatLiteral, DrumBeatLiteral
};
