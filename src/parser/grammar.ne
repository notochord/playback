# import the lexer
@preprocessor esmodule
@{%
   import lexer from '../lexer/lexer' ;
   import * as ast from '../ast/ast_nodes';
   import * as values from '../values/values';
%}
@lexer lexer

# macro for building whitespace-separated lists
SPACED_LIST[X] -> $X (_ $X {% d => d[1][0] %}):* {% d => d[0].concat(d[1]) %}

# macro for building $SEP-separated lists, e.g. $X _? "|" _ $X
SEP_LIST[X, SEP] -> $X (_? $SEP _? $X {% d => d[3][0] %}):* {% d => d[0].concat(d[1]) %}
# same as above but with minimum 2 items to avoid an ambiguity
SEP_LIST_MIN2[X, SEP] -> $X (_? $SEP _? $X {% d => d[3][0] %}):+ {% d => d[0].concat(d[1]) %}

# start here lolz
main -> _? SPACED_LIST[TopLevelStatement] _? {% d => new ast.GlobalScope(d[1]) %}
TopLevelStatement -> ConfigurationStatement {% id %}
                   | ImportStatement        {% id %}
                   | TrackStatement         {% id %}
                   | TrackCallStatement     {% id %}
ConfigurationStatement -> "@meta" _? "{" _? ConfigurationList _? "}" {% d => new ast.MetaStatement(d[4]) %}
                        | "@options" _? "{" _? ConfigurationList _? "}" {% d => new ast.OptionsStatement(d[4]) %}
ConfigurationList -> SPACED_LIST[FunctionCallExpression] {% id %}
ImportStatement -> "@import" _ StringLiteral _ "as" _ Identifier {% d => new ast.ImportStatement(d[2], d[6]) %}

# tracks
TrackStatement -> "@track" _ StringLiteral _ "as" _ Identifier _? "{" _? SPACED_LIST[TrackMember] _? "}" {% d => new ast.TrackStatement({instrument: d[2], identifier: d[6], members: d[10]}) %}
TrackMember -> FunctionCallExpression       {% id %} # I know this name is bad
             | PatternStatement             {% id %}
             | PatternCallExpression        {% id %}
TrackCallStatement -> "@track" _? "(" _? Identifier "." Identifier _? ")" {% d => new ast.TrackCall({import: d[4], track: d[6]}) %}

# patterns
PatternStatement -> "@pattern" _ Identifier _ PatternConditional _? PatternExpression {% d => new ast.PatternStatement({identifier: d[2], expression: d[6], condition: d[4]}) %}
                  | "@pattern" _ Identifier _ PatternExpression {% d => new ast.PatternStatement({identifier: d[2], expression: d[4]}) %}
PatternConditional -> "if" _? "(" _? FunctionCallArgument _? ")" {% d => d[4] %}
PatternExpression -> PatternExpression_NoJoin {% id %}
                   | JoinedPatternExpression {% id %}
PatternExpression_NoJoin -> PatternExpressionGroup {% id %} # because ambiguity is p lame
                   | BeatGroupLiteral       {% id %}
                   | DrumBeatGroupLiteral   {% id %}
                   | FunctionCallExpression {% id %}
                   | PatternCallExpression  {% id %}
PatternExpressionGroup -> "{" _? SPACED_LIST[PatternExpression] _? "}" {% d => new ast.PatternExpressionGroup(d[2]) %}
PatternCallExpression -> "@pattern" _? "(" _? Identifier _? ")" {% d => new ast.PatternCall({pattern: d[4]}) %}
                       | "@pattern" _? "(" _? Identifier "." Identifier _? ")" {% d => new ast.PatternCall({track: d[4], pattern: d[6]}) %}
                       | "@pattern" _? "(" _? Identifier "." Identifier "." Identifier _? ")" {% d => new ast.PatternCall({import: d[4], track: d[6], pattern: d[8]}) %}
JoinedPatternExpression -> SEP_LIST_MIN2[PatternExpression_NoJoin, "&"] {% d => new ast.JoinedPatternExpression(d[0]) %}

# functions
FunctionCallExpression -> Identifier _? "(" _? SPACED_LIST[FunctionCallArgument] _? ")" {% d => new ast.FunctionCall(d[0], d[4]) %}
                        | Identifier _? "(" ")" {% d => new ast.FunctionCall(d[0], []) %}
FunctionCallArgument -> NumericExpression   {% d => new values.PlaybackNumberValue(d[0]) %}
                      | StringLiteral       {% d => new values.PlaybackStringValue(d[0]) %}
                      | BooleanLiteral      {% d => new values.PlaybackBooleanValue(d[0]) %}
                      | PatternExpression   {% id %}
                      | BL_PP_Anchor        {% d => new values.PlaybackAnchorValue(d[0]) %}
                      | "not" _ FunctionCallArgument {% d => new ast.BooleanNot(d[2]) %}
                      | FunctionCallArgument _ "and" _ FunctionCallArgument {% d => new ast.BooleanAnd(d[0], d[4]) %}
                      | FunctionCallArgument _ "or" _ FunctionCallArgument {% d => new ast.BooleanOr(d[0], d[4]) %}

# beats
BeatGroupLiteral -> "<" _? MeasureGroup _? ">" {% d => new ast.BeatGroupLiteral(d[2]) %}
MeasureGroup -> SEP_LIST[Measure, "|"]      {% id %}
Measure -> SPACED_LIST[MelodicBeatLiteral]  {% d => new ast.Measure(d[0]) %}
         # choose allowed in here???? For now no
MelodicBeatLiteral -> BL_TimePart ":" BL_PitchPart ":" BL_OctavePart {% d => new ast.MelodicBeatLiteral({time: d[0], pitch: d[2], octave: d[4]}) %}
                    | ":" BL_PitchPart ":" BL_OctavePart {% d => new ast.MelodicBeatLiteral({pitch: d[1], octave: d[3]}) %}
                    | BL_TimePart ":" BL_PitchPart {% d => new ast.MelodicBeatLiteral({time: d[0], pitch: d[2]}) %}
                    | ":" BL_PitchPart      {% d => new ast.MelodicBeatLiteral({pitch: d[1]}) %}
                    | DrumBeatLiteral       {% id %}
BL_TimePart -> NumericExpression            {% d => ({time: d[0]}) %} # time can be an expression, e.g. tuplet
             | BL_TP_Flag                   {% d => ({time: 'auto', flag: d[0]}) %}
             | NumericExpression BL_TP_Flag {% d => ({time: d[0], flag: d[1]}) %}
BL_TP_Flag -> "s"                           {% d => 'STACCATO' %}
            | "a"                           {% d => 'ACCENTED' %}
BL_PitchPart -> BL_PP_Degree                {% id %}
              | BL_PP_Chord                 {% id %}
BL_PP_Degree -> NumberLiteral               {% d => ({degree: d[0]}) %}
              | BL_PP_Anchor                {% d => ({anchor: d[0], degree: 1}) %}
              | BL_PP_Anchor NumberLiteral  {% d => ({anchor: d[0], degree: d[1]}) %}
BL_PP_Chord -> "c"                          {% d => ({chord: true, degree: 1}) %}
             | BL_PP_Degree "c"             {% d => ({chord: true, anchor: d[0].anchor, degree: d[0].degree}) %}
             | "c" BL_PP_Roll               {% d => ({chord: true, roll: d[1], degree: 1}) %}
             | BL_PP_Degree "c" BL_PP_Roll  {% d => ({chord: true, roll: d[2], anchor: d[0].anchor, degree: d[0].degree}) %}
BL_PP_Anchor -> "k"                         {% d => 'KEY' %}
              | "n"                         {% d => 'NEXT' %}
              | "s"                         {% d => 'STEP' %} # smartly tween stepwise (in the scale when possible)
              | "a"                         {% d => 'ARPEGGIATE' %} # tries to arpeggiate in the prev chord, else its key, toward the final beat
BL_PP_Roll -> "r"                           {% d => 'ROLL_UP' %}
            | "r" "d"                       {% d => 'ROLL_DOWN' %}
BL_OctavePart -> NumberLiteral              {% id %} # for nomenclatural symmetry

# drums
DrumBeatGroupLiteral -> StringLiteral _? BeatGroupLiteral {% d => new ast.DrumBeatGroupLiteral(d[0], d[2]) %}
                      | StringLiteral _? FunctionCallExpression {% d => new ast.DrumBeatGroupLiteral(d[0], d[2]) %}
DrumBeatLiteral -> NumberLiteral            {% d => new ast.DrumBeatLiteral({time: d[0]}) %}
                 | NumberLiteral "a"        {% d => new ast.DrumBeatLiteral({time: d[0], accented: true}) %}


# adapted from https://nearley.js.org/www/railroad-demo
NumericExpression -> NE_addsub              {% id %}
NE_parens -> "(" NE_addsub ")"              {% d => d[1] %}
           | NumberLiteral                  {% id %}
NE_muldiv -> NE_muldiv "*" NE_parens        {% d => (d[0] * d[2]) %}
           | NE_muldiv "/" NE_parens        {% d => (d[0] / d[2]) %}
           | NE_parens                      {% id %}
NE_addsub -> NE_addsub "+" NE_muldiv        {% d => (d[0] + d[2]) %}
           | NE_addsub "-" NE_muldiv        {% d => (d[0] - d[2]) %}
           | NE_muldiv                      {% id %}

# idk what category to put this in but
Identifier -> %identifier                   {% d => d[0].value %}

# our actual primitives
NumberLiteral -> %number                    {% d => Number(d[0].value) %}
               | %beat_number               {% d => Number(d[0].value) %} # because beatmode deserves numbers too
BooleanLiteral -> %boolean                  {% d => Boolean(d[0].value) %}
StringLiteral -> %quoted_string             {% d => d[0].value.slice(1, -1) %}

# INGORABLES
_? -> _:?                                   {% () => null %} # OPTIONAL whitespace
_ -> %ws                                    {% () => null %}
   | %beat_ws                               {% () => null %} # because beatmode deserves whitespace too
   | %ws:? (%comment %ws:?):+               {% () => null %}
   | %beat_ws:? (%comment %beat_ws:?):+     {% () => null %}
