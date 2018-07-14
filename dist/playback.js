!function(e){var t={};function s(r){if(t[r])return t[r].exports;var n=t[r]={i:r,l:!1,exports:{}};return e[r].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=e,s.c=t,s.d=function(e,t,r){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(s.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)s.d(r,n,function(t){return e[t]}.bind(null,n));return r},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=4)}([function(e,t,s){"use strict";(function(e){var r=s(3),n=s.n(r);const o=s(5);t.a={load:function(t){return new Promise(function(s,r){t.startsWith(".")||t.startsWith("/")||(t=o.join(e,"../../styles/",t+".play")),n.a.readFile(t,"utf8",(e,t)=>{e?r(e):s(t)})})}}}).call(this,"src/loader")},function(e,t){var s,r;s=this,r=function(){function e(t,s,r){return this.id=++e.highestId,this.name=t,this.symbols=s,this.postprocess=r,this}function t(e,t,s,r){this.rule=e,this.dot=t,this.reference=s,this.data=[],this.wantedBy=r,this.isComplete=this.dot===e.symbols.length}function s(e,t){this.grammar=e,this.index=t,this.states=[],this.wants={},this.scannable=[],this.completed={}}function r(e,t){this.rules=e,this.start=t||this.rules[0].name;var s=this.byName={};this.rules.forEach(function(e){s.hasOwnProperty(e.name)||(s[e.name]=[]),s[e.name].push(e)})}function n(){this.reset("")}function o(e,t,o){if(e instanceof r){var a=e;o=t}else a=r.fromCompiled(e,t);for(var i in this.grammar=a,this.options={keepHistory:!1,lexer:a.lexer||new n},o||{})this.options[i]=o[i];this.lexer=this.options.lexer,this.lexerState=void 0;var l=new s(a,0);this.table=[l];l.wants[a.start]=[],l.predict(a.start),l.process(),this.current=0}return e.highestId=0,e.prototype.toString=function(e){function t(e){return e.literal?JSON.stringify(e.literal):e.type?"%"+e.type:e.toString()}var s=void 0===e?this.symbols.map(t).join(" "):this.symbols.slice(0,e).map(t).join(" ")+" ● "+this.symbols.slice(e).map(t).join(" ");return this.name+" → "+s},t.prototype.toString=function(){return"{"+this.rule.toString(this.dot)+"}, from: "+(this.reference||0)},t.prototype.nextState=function(e){var s=new t(this.rule,this.dot+1,this.reference,this.wantedBy);return s.left=this,s.right=e,s.isComplete&&(s.data=s.build()),s},t.prototype.build=function(){var e=[],t=this;do{e.push(t.right.data),t=t.left}while(t.left);return e.reverse(),e},t.prototype.finish=function(){this.rule.postprocess&&(this.data=this.rule.postprocess(this.data,this.reference,o.fail))},s.prototype.process=function(e){for(var t=this.states,s=this.wants,r=this.completed,n=0;n<t.length;n++){var a=t[n];if(a.isComplete){if(a.finish(),a.data!==o.fail){for(var i=a.wantedBy,l=i.length;l--;){var c=i[l];this.complete(c,a)}if(a.reference===this.index){var p=a.rule.name;(this.completed[p]=this.completed[p]||[]).push(a)}}}else{if("string"!=typeof(p=a.rule.symbols[a.dot])){this.scannable.push(a);continue}if(s[p]){if(s[p].push(a),r.hasOwnProperty(p)){var u=r[p];for(l=0;l<u.length;l++){var m=u[l];this.complete(a,m)}}}else s[p]=[a],this.predict(p)}}},s.prototype.predict=function(e){for(var s=this.grammar.byName[e]||[],r=0;r<s.length;r++){var n=s[r],o=this.wants[e],a=new t(n,0,this.index,o);this.states.push(a)}},s.prototype.complete=function(e,t){var s=e.nextState(t);this.states.push(s)},r.fromCompiled=function(t,s){var n=t.Lexer;t.ParserStart&&(s=t.ParserStart,t=t.ParserRules);var o=new r(t=t.map(function(t){return new e(t.name,t.symbols,t.postprocess)}),s);return o.lexer=n,o},n.prototype.reset=function(e,t){this.buffer=e,this.index=0,this.line=t?t.line:1,this.lastLineBreak=t?-t.col:0},n.prototype.next=function(){if(this.index<this.buffer.length){var e=this.buffer[this.index++];return"\n"===e&&(this.line+=1,this.lastLineBreak=this.index),{value:e}}},n.prototype.save=function(){return{line:this.line,col:this.index-this.lastLineBreak}},n.prototype.formatError=function(e,t){var s=this.buffer;if("string"==typeof s){var r=s.indexOf("\n",this.index);-1===r&&(r=s.length);var n=s.substring(this.lastLineBreak,r),o=this.index-this.lastLineBreak;return t+=" at line "+this.line+" col "+o+":\n\n",t+="  "+n+"\n",t+="  "+Array(o).join(" ")+"^"}return t+" at index "+(this.index-1)},o.fail={},o.prototype.feed=function(e){var t,r=this.lexer;for(r.reset(e,this.lexerState);t=r.next();){var o=this.table[this.current];this.options.keepHistory||delete this.table[this.current-1];var a=this.current+1,i=new s(this.grammar,a);this.table.push(i);for(var l=t.value,c=r.constructor===n?t.value:t,p=o.scannable,u=p.length;u--;){var m=p[u],h=m.rule.symbols[m.dot];if(h.test?h.test(c):h.type?h.type===t.type:h.literal===l){var f=m.nextState({data:c,token:t,isToken:!0,reference:a-1});i.states.push(f)}}if(i.process(),0===i.states.length){var $=this.lexer.formatError(t,"invalid syntax")+"\n";$+="Unexpected "+(t.type?t.type+" token: ":""),$+=JSON.stringify(void 0!==t.value?t.value:t)+"\n";var b=new Error($);throw b.offset=this.current,b.token=t,b}this.options.keepHistory&&(o.lexerState=r.save()),this.current++}return o&&(this.lexerState=r.save()),this.results=this.finish(),this},o.prototype.save=function(){var e=this.table[this.current];return e.lexerState=this.lexerState,e},o.prototype.restore=function(e){var t=e.index;this.current=t,this.table[t]=e,this.table.splice(t+1),this.lexerState=e.lexerState,this.results=this.finish()},o.prototype.rewind=function(e){if(!this.options.keepHistory)throw new Error("set option `keepHistory` to enable rewinding");this.restore(this.table[e])},o.prototype.finish=function(){var e=[],t=this.grammar.start;return this.table[this.table.length-1].states.forEach(function(s){s.rule.name===t&&s.dot===s.rule.symbols.length&&0===s.reference&&s.data!==o.fail&&e.push(s)}),e.map(function(e){return e.data})},{Parser:o,Grammar:r,Rule:e}},"object"==typeof e&&e.exports?e.exports=r():s.nearley=r()},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_FACTORY__,__WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],void 0===(__WEBPACK_AMD_DEFINE_RESULT__="function"==typeof(__WEBPACK_AMD_DEFINE_FACTORY__=function(){"use strict";var hasOwnProperty=Object.prototype.hasOwnProperty,assign="function"==typeof Object.assign?Object.assign:function(e,t){if(null==e)throw new TypeError("Target cannot be null or undefined");e=Object(e);for(var s=1;s<arguments.length;s++){var r=arguments[s];if(null!=r)for(var n in r)hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e},hasSticky="boolean"==typeof(new RegExp).sticky;function isRegExp(e){return e&&e.constructor===RegExp}function isObject(e){return e&&"object"==typeof e&&e.constructor!==RegExp&&!Array.isArray(e)}function reEscape(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function reGroups(e){var t=new RegExp("|"+e);return t.exec("").length-1}function reCapture(e){return"("+e+")"}function reUnion(e){var t=e.map(function(e){return"(?:"+e+")"}).join("|");return"(?:"+t+")"}function regexpOrLiteral(e){if("string"==typeof e)return"(?:"+reEscape(e)+")";if(isRegExp(e)){if(e.ignoreCase)throw new Error("RegExp /i flag not allowed");if(e.global)throw new Error("RegExp /g flag is implied");if(e.sticky)throw new Error("RegExp /y flag is implied");if(e.multiline)throw new Error("RegExp /m flag is implied");return e.source}throw new Error("not a pattern: "+e)}function objectToRules(e){for(var t=Object.getOwnPropertyNames(e),s=[],r=0;r<t.length;r++){var n=t[r],o=e[n],a=Array.isArray(o)?o:[o],i=[];a.forEach(function(e){isObject(e)?(i.length&&s.push(ruleOptions(n,i)),s.push(ruleOptions(n,e)),i=[]):i.push(e)}),i.length&&s.push(ruleOptions(n,i))}return s}function arrayToRules(e){for(var t=[],s=0;s<e.length;s++){var r=e[s];if(!r.name)throw new Error("Rule has no name: "+JSON.stringify(r));t.push(ruleOptions(r.name,r))}return t}function ruleOptions(e,t){("object"!=typeof t||Array.isArray(t)||isRegExp(t))&&(t={match:t});var s=assign({tokenType:e,lineBreaks:!!t.error,pop:!1,next:null,push:null,error:!1,value:null,getType:null},t),r=s.match;return s.match=Array.isArray(r)?r:r?[r]:[],s.match.sort(function(e,t){return isRegExp(e)&&isRegExp(t)?0:isRegExp(t)?-1:isRegExp(e)?1:t.length-e.length}),s.keywords&&(s.getType=keywordTransform(s.keywords)),s}function compileRules(e,t){e=Array.isArray(e)?arrayToRules(e):objectToRules(e);for(var s=null,r=[],n=[],o=0;o<e.length;o++){var a=e[o];if(a.error){if(s)throw new Error("Multiple error rules not allowed: (for token '"+a.tokenType+"')");s=a}if(0!==a.match.length){r.push(a);var i=reUnion(a.match.map(regexpOrLiteral)),l=new RegExp(i);if(l.test(""))throw new Error("RegExp matches empty string: "+l);var c=reGroups(i);if(c>0)throw new Error("RegExp has capture groups: "+l+"\nUse (?: … ) instead");if(!t&&(a.pop||a.push||a.next))throw new Error("State-switching options are not allowed in stateless lexers (for token '"+a.tokenType+"')");if(!a.lineBreaks&&l.test("\n"))throw new Error("Rule should declare lineBreaks: "+l);n.push(reCapture(i))}}var p=hasSticky?"":"|(?:)",u=hasSticky?"ym":"gm",m=new RegExp(reUnion(n)+p,u);return{regexp:m,groups:r,error:s}}function compile(e){var t=compileRules(e);return new Lexer({start:t},"start")}function compileStates(e,t){var s=Object.getOwnPropertyNames(e);t||(t=s[0]);for(var r=Object.create(null),n=0;n<s.length;n++){var o=s[n];r[o]=compileRules(e[o],!0)}for(var n=0;n<s.length;n++)for(var a=r[s[n]].groups,i=0;i<a.length;i++){var l=a[i],c=l&&(l.push||l.next);if(c&&!r[c])throw new Error("Missing state '"+c+"' (in token '"+l.tokenType+"' of state '"+s[n]+"')");if(l&&l.pop&&1!=+l.pop)throw new Error("pop must be 1 (in token '"+l.tokenType+"' of state '"+s[n]+"')")}return new Lexer(r,t)}function keywordTransform(map){for(var reverseMap=Object.create(null),byLength=Object.create(null),types=Object.getOwnPropertyNames(map),i=0;i<types.length;i++){var tokenType=types[i],item=map[tokenType],keywordList=Array.isArray(item)?item:[item];keywordList.forEach(function(e){if((byLength[e.length]=byLength[e.length]||[]).push(e),"string"!=typeof e)throw new Error("keyword must be string (in keyword '"+tokenType+"')");reverseMap[e]=tokenType})}function str(e){return JSON.stringify(e)}var source="";for(var length in source+="(function(value) {\n",source+="switch (value.length) {\n",byLength){var keywords=byLength[length];source+="case "+length+":\n",source+="switch (value) {\n",keywords.forEach(function(e){var t=reverseMap[e];source+="case "+str(e)+": return "+str(t)+"\n"}),source+="}\n"}return source+="}\n",source+="})",eval(source)}var Lexer=function(e,t){this.startState=t,this.states=e,this.buffer="",this.stack=[],this.reset()};function tokenToString(){return this.value}if(Lexer.prototype.reset=function(e,t){return this.buffer=e||"",this.index=0,this.line=t?t.line:1,this.col=t?t.col:1,this.setState(t?t.state:this.startState),this},Lexer.prototype.save=function(){return{line:this.line,col:this.col,state:this.state}},Lexer.prototype.setState=function(e){if(e&&this.state!==e){this.state=e;var t=this.states[e];this.groups=t.groups,this.error=t.error||{lineBreaks:!0,shouldThrow:!0},this.re=t.regexp}},Lexer.prototype.popState=function(){this.setState(this.stack.pop())},Lexer.prototype.pushState=function(e){this.stack.push(this.state),this.setState(e)},Lexer.prototype._eat=hasSticky?function(e){return e.exec(this.buffer)}:function(e){var t=e.exec(this.buffer);return 0===t[0].length?null:t},Lexer.prototype._getGroup=function(e){if(null===e)return-1;for(var t=this.groups.length,s=0;s<t;s++)if(void 0!==e[s+1])return s;throw new Error("oops")},Lexer.prototype.next=function(){var e=this.re,t=this.buffer,s=e.lastIndex=this.index;if(s!==t.length){var r,n,o=this._eat(e),a=this._getGroup(o);-1===a?(r=this.error,n=t.slice(s)):(n=o[0],r=this.groups[a]);var i=0;if(r.lineBreaks){var l=/\n/g,c=1;if("\n"===n)i=1;else for(;l.exec(n);)i++,c=l.lastIndex}var p={type:r.getType&&r.getType(n)||r.tokenType,value:r.value?r.value(n):n,text:n,toString:tokenToString,offset:s,lineBreaks:i,line:this.line,col:this.col},u=n.length;if(this.index+=u,this.line+=i,0!==i?this.col=u-c+1:this.col+=u,r.shouldThrow)throw new Error(this.formatError(p,"invalid syntax"));return r.pop?this.popState():r.push?this.pushState(r.push):r.next&&this.setState(r.next),p}},"undefined"!=typeof Symbol&&Symbol.iterator){var LexerIterator=function(e){this.lexer=e};LexerIterator.prototype.next=function(){var e=this.lexer.next();return{value:e,done:!e}},LexerIterator.prototype[Symbol.iterator]=function(){return this},Lexer.prototype[Symbol.iterator]=function(){return new LexerIterator(this)}}return Lexer.prototype.formatError=function(e,t){var s=e.value,r=e.offset,n=e.lineBreaks?s.indexOf("\n"):s.length,o=Math.max(0,r-e.col+1),a=this.buffer.substring(o,r+n);return t+=" at line "+e.line+" col "+e.col+":\n\n",t+="  "+a+"\n",t+="  "+Array(e.col).join(" ")+"^"},Lexer.prototype.clone=function(){return new Lexer(this.states,this.state)},Lexer.prototype.has=function(e){for(var t in this.states)for(var s=this.states[t].groups,r=0;r<s.length;r++){var n=s[r];if(n.tokenType===e)return!0;if(n.keywords&&hasOwnProperty.call(n.keywords,e))return!0}return!1},{compile:compile,states:compileStates,error:Object.freeze({error:!0})}})?__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__):__WEBPACK_AMD_DEFINE_FACTORY__)||(module.exports=__WEBPACK_AMD_DEFINE_RESULT__)},function(e,t){e.exports=require("fs")},function(e,t,s){"use strict";s.r(t);var r=s(0),n=s(1),o=s.n(n),a=s(2),i=s.n(a).a.states({main:{comment:{match:/\/\/.*?(?:\n|$)/,lineBreaks:!0},quoted_string:/"(?:[^\\"\n]|\\.)*"/,ws:{match:/\s+/,lineBreaks:!0},at_rule:["@meta","@options","@import","@track","@pattern"],identifier:{match:/[a-zA-z](?:[a-zA-Z\-\d]*[a-zA-Z\d])?/,keywords:{keyword:["if","as"],boolean:["true","false"]}},number:/(?:\d*\.)?\d+/,brackets:["{","}","(",")"],left_angle:{match:"<",push:"beat"},operators:["&","+","-","*","/","."]},beat:{beat_ws:/ +/,beat_colon:":",beat_number:/(?:\d*\.)?\d+/,beat_flag:/[a-zA-Z]/,beat_right_angle:{match:">",pop:!0},beat_operators:["|","+","-","*","/"]}});class l{constructor(){this.vars=new Map,this.name=null,this.type=null,this.scope=null}init(e){this.scope=e,this.vars=new Map([...this.scope.vars,...this.vars])}}class c extends l{constructor(e){super(),this.name="@meta",this.type="@meta",this.function_calls=e}init(e){this.scope=e;for(let e of this.function_calls)e.init(this),e.execute();e.meta=this.vars}}class p extends l{constructor(e){super(),this.name="@options",this.type="@options",this.function_calls=e}init(e){for(let e of this.function_calls)e.init(this),e.execute();this.scope=e,e.vars=new Map([...e.vars,...this.vars])}}class u{constructor(e,t){this.path=e,this.identifier=t}}let m=Symbol("Nil"),h=function(e){return e!==m&&!1!==e};class f extends Error{constructor(e,t){super(`${e}\nScope: "${t.name}"`)}}class $ extends f{constructor(e,t){super(`No function exists with name "${e}"`,t)}}class b extends f{constructor(e,t){super(e,t)}}class y extends f{constructor(e,t){super(e,t)}}class _ extends f{constructor(e){super('Pattern may only contain 1 BeatGroup. Try the join operator "&"',e)}}let d=new Map;function x(e,t,s,r){if("*"!=s){if(t.length!=s.length)throw new y(`"${e}" requires ${s.length} arguments.`,r);for(let n in t){if("*"==s[n])continue;let o=t[n];if(o instanceof E){if("*"==(o=o.returns))continue;if("string"==typeof s[n]){if(o!=s[n])throw new y(`Argument ${Number(n)+1} of "${e}" must be a ${s[n]}.`,r)}else if(o!=s[n])throw new y(`Argument ${Number(n)+1} of "${e}" must be a ${s[n].name}.`,r)}else if("string"==typeof s[n]){if(typeof o!=s[n])throw new y(`Argument ${Number(n)+1} of "${e}" must be a ${s[n]}.`,r)}else if(!(o instanceof s[n]))throw new y(`Argument ${Number(n)+1} of "${e}" must be a ${s[n].name}.`,r)}}}let g=function(e,t,s){let r={types:t.types||"*",returns:t.returns||"*",scope:t.scope||"no-meta",execute:(e,t)=>{return s(e,t,e=>{throw new y(e,t)})}};d.set(e,r)},w=function(e,t,s=null){g(e,{types:[t],scope:s,returns:m},(t,s,r)=>(s.vars.set(e,t[0]),m))},v=function(e,t=null){g(e,{types:"*",scopes:t,returns:m},(t,s,r)=>(t.length?(x(e,t,["boolean"],s),s.vars.set(e,t[0])):s.vars.set(e,!0),m))};w("name","string","meta"),w("author","string","meta"),w("description","string","meta"),w("playback-version","number","meta"),g("time-signature",{types:["number","number"],scope:"options",returns:m},(e,t,s)=>(Number.isInteger(Math.log2(e[1]))||s('Argument 2 of "time-signature" must be a power of 2.'),t.vars.set("time-signature",[e[0],e[1]]),m)),v("swing","options"),g("volume",{types:["number"],scope:"no-meta",returns:m},(e,t,s)=>((e[0]<0||e[0]>1)&&s('Argument 1 of "volume" must be in range 0-1 (inclusive).'),t.vars.set("volume",e[0]),m)),v("invertible","no-meta"),w("octave","number","no-meta"),g("choose",{types:"*",scope:"no-config",returns:"*"},(e,t,s)=>{let r=e.filter(e=>e!==m);return r[Math.floor(Math.random()*r.length)]}),g("progression",{types:"*",scope:"no-config",returns:"boolean"},(e,t,s)=>!0),g("in-scale",{types:"*",scope:"no-config",returns:"boolean"},(e,t,s)=>!1),v("private","pattern"),w("length","number","pattern"),g("chance",{types:["number"],scope:"pattern",returns:m},(e,t,s)=>((e[0]<0||e[0]>1)&&s('Argument 1 of "chance" must be in range 0-1 (inclusive).'),t.vars.set("chance",e[0]),m));class E{constructor(e,t){this.identifier=e,this.definition=d.get(e),this.args=t,this.scope=null}init(e){if(this.scope=e,!this.definition)throw new $(this.identifier,this.scope);this.returns=this.definition.returns,function(e,t="no-meta",s){if("meta"==t){if("@meta"!=s.type)throw new b(`Function "${e}" must only be called within a @meta block."`,s)}else if("options"==t){if("@options"!=s.type)throw new b(`Function "${e}" must only be called within an @options block."`,s)}else if("no-config"==t){if("@meta"==s.type||"@options"==s.type)throw new b(`Function "${e}" must not be called within a @meta or @options block."`,s)}else if("pattern"==t){if("PatternExpressionGroup"!=s.type)throw new b(`Function "${e}" must only be called within a @pattern block."`,s)}else if("no-meta"==t&&"@meta"==s.type)throw new b(`Function "${e}" must not be called within a @meta block."`,s)}(this.identifier,this.definition.scope,this.scope),this.args.forEach(t=>{t.init&&t.init(e)}),x(this.identifier,this.args,this.definition.types,this.scope)}execute(){if(!this.scope)throw new Error("function not initialized :(");let e=this.args.map(e=>e.execute?e.execute():e),t=this.definition.execute(e,this.scope);if(void 0===t)throw new Error(`Function "${this.identifier}" can return undefined`);return t}}class P{constructor(e){this.beat=e.beat,this.pitch=e.pitch,this.duration=e.duration,this.velocity=e.velocity}toString(){return"Note"}}class L extends Array{constructor(){super(),this.push(...arguments)}}class S{constructor(e,t){this.drum=e,this.beatGroup=t}}class k{constructor(e){this.identifier=e.identifier,this.expression=e.expression,this.condition=void 0!==e.condition?e.condition:null}init(e){this.scope=e,this.condition&&this.condition.init&&this.condition.init(e),this.expression.init&&this.expression.init(e,this)}execute(e,t){if(this.condition){let e=this.condition.execute();if(!1===h(e))return m}return this.expression.execute?this.expression.execute(e,t):"expression not executable yet :/"}}class C{constructor(e){this.import=e.import||null,this.track=e.track||null,this.pattern=e.pattern,this.scope=null}init(e){this.scope=e}}class A extends l{constructor(e){super(),this.name=e.identifier,this.type="@track",this.instrument=e.instrument,this.identifier=e.identifier,this.members=e.members}init(e){super.init(e),this.function_calls=[],this.patterns=new Map,this.members.forEach(e=>{e.init(this),e instanceof E?this.function_calls.push(e):e instanceof k&&this.patterns.set(e.identifier,e)})}execute(e){console.log(`executing ${this.name}`);for(let[t,s]of this.patterns)console.log(`- ${t}: ${s.execute(e,!0).toString()}`)}}class B{constructor(){this.args=Array.prototype.slice.call(arguments)}init(e){this.scope=e,this.args.forEach(t=>{t.init&&t.init(e)})}resolve_args(){return this.args.map(e=>e.init?e.init():e)}}class T{constructor(e){this.time=e.time||{time:"auto"},this.pitch=e.pitch,this.octave=e.octave||"inherit"}}class N{constructor(e){this.time=e.time,this.accented=e.accented||!1}}function M(e){return e[0]}var F={Lexer:i,ParserRules:[{name:"main$macrocall$2",symbols:["TopLevelStatement"]},{name:"main$macrocall$1$ebnf$1",symbols:[]},{name:"main$macrocall$1$ebnf$1$subexpression$1",symbols:["_","main$macrocall$2"],postprocess:e=>e[1][0]},{name:"main$macrocall$1$ebnf$1",symbols:["main$macrocall$1$ebnf$1","main$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"main$macrocall$1",symbols:["main$macrocall$2","main$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"main",symbols:["_?","main$macrocall$1","_?"],postprocess:e=>new class extends l{constructor(e){super(),this.name="global",this.type="global",this.statements=e}init(){this.vars.set("octave",2),this.vars.set("volume",1),this.vars.set("private",!1),this.vars.set("time-signature",[4,4]),this.vars.set("tempo",120),this.tracks=new Map,this.meta=[],this.importedStyles=new Map,this.dependencies=[];for(let e of this.statements)e instanceof c||e instanceof p?this.meta.push(e):e instanceof u?(this.importedStyles.set(e.identifier,e.path),this.dependencies.push(e.path)):e instanceof A&&this.tracks.set(e.name,e);this.meta.forEach(e=>e.init(this)),this.tracks.forEach(e=>e.init(this))}execute(e){for(let[t,s]of this.tracks)s.execute(e)}}(e[1])},{name:"TopLevelStatement",symbols:["ConfigurationStatement"],postprocess:M},{name:"TopLevelStatement",symbols:["ImportStatement"],postprocess:M},{name:"TopLevelStatement",symbols:["TrackStatement"],postprocess:M},{name:"TopLevelStatement",symbols:["TrackCallStatement"],postprocess:M},{name:"ConfigurationStatement",symbols:[{literal:"@meta"},"_?",{literal:"{"},"_?","ConfigurationList","_?",{literal:"}"}],postprocess:e=>new c(e[4])},{name:"ConfigurationStatement",symbols:[{literal:"@options"},"_?",{literal:"{"},"_?","ConfigurationList","_?",{literal:"}"}],postprocess:e=>new p(e[4])},{name:"ConfigurationList$macrocall$2",symbols:["FunctionCallExpression"]},{name:"ConfigurationList$macrocall$1$ebnf$1",symbols:[]},{name:"ConfigurationList$macrocall$1$ebnf$1$subexpression$1",symbols:["_","ConfigurationList$macrocall$2"],postprocess:e=>e[1][0]},{name:"ConfigurationList$macrocall$1$ebnf$1",symbols:["ConfigurationList$macrocall$1$ebnf$1","ConfigurationList$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"ConfigurationList$macrocall$1",symbols:["ConfigurationList$macrocall$2","ConfigurationList$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"ConfigurationList",symbols:["ConfigurationList$macrocall$1"],postprocess:M},{name:"ImportStatement",symbols:[{literal:"@import"},"_","StringLiteral","_",{literal:"as"},"_","Identifier"],postprocess:e=>new u(e[2],e[6])},{name:"TrackStatement$macrocall$2",symbols:["TrackMember"]},{name:"TrackStatement$macrocall$1$ebnf$1",symbols:[]},{name:"TrackStatement$macrocall$1$ebnf$1$subexpression$1",symbols:["_","TrackStatement$macrocall$2"],postprocess:e=>e[1][0]},{name:"TrackStatement$macrocall$1$ebnf$1",symbols:["TrackStatement$macrocall$1$ebnf$1","TrackStatement$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"TrackStatement$macrocall$1",symbols:["TrackStatement$macrocall$2","TrackStatement$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"TrackStatement",symbols:[{literal:"@track"},"_","StringLiteral","_",{literal:"as"},"_","Identifier","_?",{literal:"{"},"_?","TrackStatement$macrocall$1","_?",{literal:"}"}],postprocess:e=>new A({instrument:e[2],identifier:e[6],members:e[10]})},{name:"TrackMember",symbols:["FunctionCallExpression"],postprocess:M},{name:"TrackMember",symbols:["PatternStatement"],postprocess:M},{name:"TrackCallStatement",symbols:[{literal:"@track"},"_?",{literal:"("},"_?","Identifier",{literal:"."},"Identifier","_?",{literal:")"}],postprocess:e=>new class{constructor(e){this.import=e.import,this.track=e.track,this.trackStatement=null}}({import:e[4],track:e[6]})},{name:"PatternStatement",symbols:[{literal:"@pattern"},"_","Identifier","_","PatternConditional","_?","PatternExpression"],postprocess:e=>new k({identifier:e[2],expression:e[6],condition:e[4]})},{name:"PatternStatement",symbols:[{literal:"@pattern"},"_","Identifier","_","PatternExpression"],postprocess:e=>new k({identifier:e[2],expression:e[4]})},{name:"PatternConditional",symbols:[{literal:"if"},"_?",{literal:"("},"_?","FunctionCallArgument","_?",{literal:")"}],postprocess:e=>e[4]},{name:"PatternExpression",symbols:["PatternExpression_NoJoin"],postprocess:M},{name:"PatternExpression",symbols:["JoinedPatternExpression"],postprocess:M},{name:"PatternExpression_NoJoin",symbols:["PatternExpressionGroup"],postprocess:M},{name:"PatternExpression_NoJoin",symbols:["BeatGroupLiteral"],postprocess:M},{name:"PatternExpression_NoJoin",symbols:["DrumBeatGroupLiteral"],postprocess:M},{name:"PatternExpression_NoJoin",symbols:["FunctionCallExpression"],postprocess:M},{name:"PatternExpression_NoJoin",symbols:["PatternCallExpression"],postprocess:M},{name:"PatternExpressionGroup$macrocall$2",symbols:["PatternExpression"]},{name:"PatternExpressionGroup$macrocall$1$ebnf$1",symbols:[]},{name:"PatternExpressionGroup$macrocall$1$ebnf$1$subexpression$1",symbols:["_","PatternExpressionGroup$macrocall$2"],postprocess:e=>e[1][0]},{name:"PatternExpressionGroup$macrocall$1$ebnf$1",symbols:["PatternExpressionGroup$macrocall$1$ebnf$1","PatternExpressionGroup$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"PatternExpressionGroup$macrocall$1",symbols:["PatternExpressionGroup$macrocall$2","PatternExpressionGroup$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"PatternExpressionGroup",symbols:[{literal:"{"},"_?","PatternExpressionGroup$macrocall$1","_?",{literal:"}"}],postprocess:e=>new class extends l{constructor(e){super(),this.type="PatternExpressionGroup",this.name="@pattern(<anonymous>)",this.vars.set("private",!1),this.vars.set("chance",1),this.expressions=e,this.function_calls=[],this.non_function_call_expressions=[]}init(e,t=null){super.init(e),this.patternStatement=t,this.patternStatement&&(this.name=`@pattern(${this.patternStatement})`),this.expressions.forEach(e=>{e.init&&e.init(this),e instanceof E?this.function_calls.push(e):this.non_function_call_expressions.push(e)})}execute(e,t=!1){let s=m;for(let e of this.function_calls){let t=e.execute();if(t instanceof L){if(s!==m)throw new _(this);s=t}}if(t&&!0===this.vars.get("private"))return m;for(let t of this.non_function_call_expressions)if(t.execute&&(t=t.execute(e)),t instanceof L){if(s!==m)throw new _(this);s=t}return s}}(e[2])},{name:"PatternCallExpression",symbols:[{literal:"@pattern"},"_?",{literal:"("},"_?","Identifier","_?",{literal:")"}],postprocess:e=>new C({pattern:e[4]})},{name:"PatternCallExpression",symbols:[{literal:"@pattern"},"_?",{literal:"("},"_?","Identifier",{literal:"."},"Identifier","_?",{literal:")"}],postprocess:e=>new C({track:e[4],pattern:e[6]})},{name:"PatternCallExpression",symbols:[{literal:"@pattern"},"_?",{literal:"("},"_?","Identifier",{literal:"."},"Identifier",{literal:"."},"Identifier","_?",{literal:")"}],postprocess:e=>new C({import:e[4],track:e[6],pattern:e[8]})},{name:"JoinedPatternExpression$macrocall$2",symbols:["PatternExpression_NoJoin"]},{name:"JoinedPatternExpression$macrocall$3",symbols:[{literal:"&"}]},{name:"JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$1",symbols:["_?","JoinedPatternExpression$macrocall$3","_?","JoinedPatternExpression$macrocall$2"],postprocess:e=>e[3][0]},{name:"JoinedPatternExpression$macrocall$1$ebnf$1",symbols:["JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$1"]},{name:"JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$2",symbols:["_?","JoinedPatternExpression$macrocall$3","_?","JoinedPatternExpression$macrocall$2"],postprocess:e=>e[3][0]},{name:"JoinedPatternExpression$macrocall$1$ebnf$1",symbols:["JoinedPatternExpression$macrocall$1$ebnf$1","JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$2"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"JoinedPatternExpression$macrocall$1",symbols:["JoinedPatternExpression$macrocall$2","JoinedPatternExpression$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"JoinedPatternExpression",symbols:["JoinedPatternExpression$macrocall$1"],postprocess:e=>new class{constructor(e){this.patterns=e}init(e){this.scope=e}execute(e){return!0}}(e[0])},{name:"FunctionCallExpression$macrocall$2",symbols:["FunctionCallArgument"]},{name:"FunctionCallExpression$macrocall$1$ebnf$1",symbols:[]},{name:"FunctionCallExpression$macrocall$1$ebnf$1$subexpression$1",symbols:["_","FunctionCallExpression$macrocall$2"],postprocess:e=>e[1][0]},{name:"FunctionCallExpression$macrocall$1$ebnf$1",symbols:["FunctionCallExpression$macrocall$1$ebnf$1","FunctionCallExpression$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"FunctionCallExpression$macrocall$1",symbols:["FunctionCallExpression$macrocall$2","FunctionCallExpression$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"FunctionCallExpression",symbols:["Identifier","_?",{literal:"("},"_?","FunctionCallExpression$macrocall$1","_?",{literal:")"}],postprocess:e=>new E(e[0],e[4])},{name:"FunctionCallExpression",symbols:["Identifier","_?",{literal:"("},{literal:")"}],postprocess:e=>new E(e[0],[])},{name:"FunctionCallArgument",symbols:["NumericExpression"],postprocess:M},{name:"FunctionCallArgument",symbols:["StringLiteral"],postprocess:M},{name:"FunctionCallArgument",symbols:["BooleanLiteral"],postprocess:M},{name:"FunctionCallArgument",symbols:["PatternExpression"],postprocess:M},{name:"FunctionCallArgument",symbols:["BL_PP_Anchor"],postprocess:e=>new class{constructor(e){this.anchor=e}}(e[0])},{name:"FunctionCallArgument",symbols:[{literal:"not"},"_","FunctionCallArgument"],postprocess:e=>new class extends B{constructor(){super(arguments)}execute(){let e=this.resolve_args();return!h(e[0])}}(e[2])},{name:"FunctionCallArgument",symbols:["FunctionCallArgument","_",{literal:"and"},"_","FunctionCallArgument"],postprocess:e=>new class extends B{constructor(){super(arguments)}execute(){let e=this.resolve_args();return h(e[0])&&h(e[1])}}(e[0],e[4])},{name:"FunctionCallArgument",symbols:["FunctionCallArgument","_",{literal:"or"},"_","FunctionCallArgument"],postprocess:e=>new class extends B{constructor(){super(arguments)}execute(e){let t=this.resolve_args();return h(t[0])||h(t[1])}}(e[0],e[4])},{name:"BeatGroupLiteral",symbols:[{literal:"<"},"_?","MeasureGroup","_?",{literal:">"}],postprocess:e=>new class{constructor(e){this.measures=e}execute(e){return new L(new P({beat:1,pitch:50,duration:1,velocity:.4}))}}(e[2])},{name:"MeasureGroup$macrocall$2",symbols:["Measure"]},{name:"MeasureGroup$macrocall$3",symbols:[{literal:"|"}]},{name:"MeasureGroup$macrocall$1$ebnf$1",symbols:[]},{name:"MeasureGroup$macrocall$1$ebnf$1$subexpression$1",symbols:["_?","MeasureGroup$macrocall$3","_?","MeasureGroup$macrocall$2"],postprocess:e=>e[3][0]},{name:"MeasureGroup$macrocall$1$ebnf$1",symbols:["MeasureGroup$macrocall$1$ebnf$1","MeasureGroup$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"MeasureGroup$macrocall$1",symbols:["MeasureGroup$macrocall$2","MeasureGroup$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"MeasureGroup",symbols:["MeasureGroup$macrocall$1"],postprocess:M},{name:"Measure$macrocall$2",symbols:["MelodicBeatLiteral"]},{name:"Measure$macrocall$1$ebnf$1",symbols:[]},{name:"Measure$macrocall$1$ebnf$1$subexpression$1",symbols:["_","Measure$macrocall$2"],postprocess:e=>e[1][0]},{name:"Measure$macrocall$1$ebnf$1",symbols:["Measure$macrocall$1$ebnf$1","Measure$macrocall$1$ebnf$1$subexpression$1"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"Measure$macrocall$1",symbols:["Measure$macrocall$2","Measure$macrocall$1$ebnf$1"],postprocess:e=>e[0].concat(e[1])},{name:"Measure",symbols:["Measure$macrocall$1"],postprocess:e=>new class{constructor(e){this.beats=e}execute(e){return this.beats[0].execute(e)}}(e[0])},{name:"MelodicBeatLiteral",symbols:["BL_TimePart",{literal:":"},"BL_PitchPart",{literal:":"},"BL_OctavePart"],postprocess:e=>new T({time:e[0],pitch:e[2],octave:e[4]})},{name:"MelodicBeatLiteral",symbols:[{literal:":"},"BL_PitchPart",{literal:":"},"BL_OctavePart"],postprocess:e=>new T({pitch:e[1],octave:e[3]})},{name:"MelodicBeatLiteral",symbols:["BL_TimePart",{literal:":"},"BL_PitchPart"],postprocess:e=>new T({time:e[0],pitch:e[2]})},{name:"MelodicBeatLiteral",symbols:[{literal:":"},"BL_PitchPart"],postprocess:e=>new T({pitch:e[1]})},{name:"MelodicBeatLiteral",symbols:["DrumBeatLiteral"],postprocess:M},{name:"BL_TimePart",symbols:["NumericExpression"],postprocess:e=>({time:e[0]})},{name:"BL_TimePart",symbols:["BL_TP_Flag"],postprocess:e=>({time:"auto",flag:e[0]})},{name:"BL_TimePart",symbols:["NumericExpression","BL_TP_Flag"],postprocess:e=>({time:e[0],flag:e[1]})},{name:"BL_TP_Flag",symbols:[{literal:"s"}],postprocess:e=>"STACCATO"},{name:"BL_TP_Flag",symbols:[{literal:"a"}],postprocess:e=>"ACCENTED"},{name:"BL_PitchPart",symbols:["BL_PP_Degree"],postprocess:M},{name:"BL_PitchPart",symbols:["BL_PP_Chord"],postprocess:M},{name:"BL_PP_Degree",symbols:["NumberLiteral"],postprocess:e=>({degree:e[0]})},{name:"BL_PP_Degree",symbols:["BL_PP_Anchor"],postprocess:e=>({anchor:e[0],degree:1})},{name:"BL_PP_Degree",symbols:["BL_PP_Anchor","NumberLiteral"],postprocess:e=>({anchor:e[0],degree:e[1]})},{name:"BL_PP_Chord",symbols:[{literal:"c"}],postprocess:e=>({chord:!0,degree:1})},{name:"BL_PP_Chord",symbols:["BL_PP_Degree",{literal:"c"}],postprocess:e=>({chord:!0,anchor:e[0].anchor,degree:e[0].degree})},{name:"BL_PP_Chord",symbols:[{literal:"c"},"BL_PP_Roll"],postprocess:e=>({chord:!0,roll:e[1],degree:1})},{name:"BL_PP_Chord",symbols:["BL_PP_Degree",{literal:"c"},"BL_PP_Roll"],postprocess:e=>({chord:!0,roll:e[2],anchor:e[0].anchor,degree:e[0].degree})},{name:"BL_PP_Anchor",symbols:[{literal:"k"}],postprocess:e=>"KEY"},{name:"BL_PP_Anchor",symbols:[{literal:"n"}],postprocess:e=>"NEXT"},{name:"BL_PP_Anchor",symbols:[{literal:"s"}],postprocess:e=>"STEP"},{name:"BL_PP_Anchor",symbols:[{literal:"a"}],postprocess:e=>"ARPEGGIATE"},{name:"BL_PP_Roll",symbols:[{literal:"r"}],postprocess:e=>"ROLL_UP"},{name:"BL_PP_Roll",symbols:[{literal:"r"},{literal:"d"}],postprocess:e=>"ROLL_DOWN"},{name:"BL_OctavePart",symbols:["NumberLiteral"],postprocess:M},{name:"DrumBeatGroupLiteral",symbols:["StringLiteral","_?","BeatGroupLiteral"],postprocess:e=>new S(e[0],e[2])},{name:"DrumBeatGroupLiteral",symbols:["StringLiteral","_?","FunctionCallExpression"],postprocess:e=>new S(e[0],e[2])},{name:"DrumBeatLiteral",symbols:["NumberLiteral"],postprocess:e=>new N({time:e[0]})},{name:"DrumBeatLiteral",symbols:["NumberLiteral",{literal:"a"}],postprocess:e=>new N({time:e[0],accented:!0})},{name:"NumericExpression",symbols:["NE_addsub"],postprocess:M},{name:"NE_parens",symbols:[{literal:"("},"NE_addsub",{literal:")"}],postprocess:e=>e[1]},{name:"NE_parens",symbols:["NumberLiteral"],postprocess:M},{name:"NE_muldiv",symbols:["NE_muldiv",{literal:"*"},"NE_parens"],postprocess:e=>e[0]*e[2]},{name:"NE_muldiv",symbols:["NE_muldiv",{literal:"/"},"NE_parens"],postprocess:e=>e[0]/e[2]},{name:"NE_muldiv",symbols:["NE_parens"],postprocess:M},{name:"NE_addsub",symbols:["NE_addsub",{literal:"+"},"NE_muldiv"],postprocess:e=>e[0]+e[2]},{name:"NE_addsub",symbols:["NE_addsub",{literal:"-"},"NE_muldiv"],postprocess:e=>e[0]-e[2]},{name:"NE_addsub",symbols:["NE_muldiv"],postprocess:M},{name:"Identifier",symbols:[i.has("identifier")?{type:"identifier"}:identifier],postprocess:e=>e[0].value},{name:"NumberLiteral",symbols:[i.has("number")?{type:"number"}:number],postprocess:e=>Number(e[0].value)},{name:"NumberLiteral",symbols:[i.has("beat_number")?{type:"beat_number"}:beat_number],postprocess:e=>Number(e[0].value)},{name:"BooleanLiteral",symbols:[i.has("boolean")?{type:"boolean"}:boolean],postprocess:e=>Boolean(e[0].value)},{name:"StringLiteral",symbols:[i.has("quoted_string")?{type:"quoted_string"}:quoted_string],postprocess:e=>e[0].value.slice(1,-1)},{name:"_?$ebnf$1",symbols:["_"],postprocess:M},{name:"_?$ebnf$1",symbols:[],postprocess:function(e){return null}},{name:"_?",symbols:["_?$ebnf$1"],postprocess:()=>null},{name:"_",symbols:[i.has("ws")?{type:"ws"}:ws],postprocess:()=>null},{name:"_",symbols:[i.has("beat_ws")?{type:"beat_ws"}:beat_ws],postprocess:()=>null},{name:"_$ebnf$1",symbols:[i.has("ws")?{type:"ws"}:ws],postprocess:M},{name:"_$ebnf$1",symbols:[],postprocess:function(e){return null}},{name:"_$ebnf$2$subexpression$1$ebnf$1",symbols:[i.has("ws")?{type:"ws"}:ws],postprocess:M},{name:"_$ebnf$2$subexpression$1$ebnf$1",symbols:[],postprocess:function(e){return null}},{name:"_$ebnf$2$subexpression$1",symbols:[i.has("comment")?{type:"comment"}:comment,"_$ebnf$2$subexpression$1$ebnf$1"]},{name:"_$ebnf$2",symbols:["_$ebnf$2$subexpression$1"]},{name:"_$ebnf$2$subexpression$2$ebnf$1",symbols:[i.has("ws")?{type:"ws"}:ws],postprocess:M},{name:"_$ebnf$2$subexpression$2$ebnf$1",symbols:[],postprocess:function(e){return null}},{name:"_$ebnf$2$subexpression$2",symbols:[i.has("comment")?{type:"comment"}:comment,"_$ebnf$2$subexpression$2$ebnf$1"]},{name:"_$ebnf$2",symbols:["_$ebnf$2","_$ebnf$2$subexpression$2"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"_",symbols:["_$ebnf$1","_$ebnf$2"],postprocess:()=>null},{name:"_$ebnf$3",symbols:[i.has("beat_ws")?{type:"beat_ws"}:beat_ws],postprocess:M},{name:"_$ebnf$3",symbols:[],postprocess:function(e){return null}},{name:"_$ebnf$4$subexpression$1$ebnf$1",symbols:[i.has("beat_ws")?{type:"beat_ws"}:beat_ws],postprocess:M},{name:"_$ebnf$4$subexpression$1$ebnf$1",symbols:[],postprocess:function(e){return null}},{name:"_$ebnf$4$subexpression$1",symbols:[i.has("comment")?{type:"comment"}:comment,"_$ebnf$4$subexpression$1$ebnf$1"]},{name:"_$ebnf$4",symbols:["_$ebnf$4$subexpression$1"]},{name:"_$ebnf$4$subexpression$2$ebnf$1",symbols:[i.has("beat_ws")?{type:"beat_ws"}:beat_ws],postprocess:M},{name:"_$ebnf$4$subexpression$2$ebnf$1",symbols:[],postprocess:function(e){return null}},{name:"_$ebnf$4$subexpression$2",symbols:[i.has("comment")?{type:"comment"}:comment,"_$ebnf$4$subexpression$2$ebnf$1"]},{name:"_$ebnf$4",symbols:["_$ebnf$4","_$ebnf$4$subexpression$2"],postprocess:function(e){return e[0].concat([e[1]])}},{name:"_",symbols:["_$ebnf$3","_$ebnf$4"],postprocess:()=>null}],ParserStart:"main"};let O=function(e){const t=new o.a.Parser(o.a.Grammar.fromCompiled(F));return new Promise(function(s,r){try{t.feed(e)}catch(e){e.message=e.message.replace(/\t/g," "),r(e)}s(t.results)})};var R={string_to_ast:O,parse:function(e){return new Promise(function(t,s){O(e).then(e=>{if(!e.length)throw new SyntaxError("Something went wrong, input not parseable.");t(e[0])})})}};t.default={load:r.a.load,PlaybackStyle:class{constructor(e){this._mainPath=e,this._ASTs=new Map}async _loadDependencies(){let e,t=[this._mainPath];for(;e=t.pop();){let s;try{s=await r.a.load(e)}catch(t){throw new Error(`Couldn't locate imported style "${e}".`)}let n=await R.parse(s);this._ASTs.set(e,n),n.init(),console.log(e,t);for(let e of n.dependencies)this._ASTs.has(e)||t.push(e)}this._main=this._ASTs.get(this._mainPath)}async play(e){this._main.execute(e)}},parse:R.parse}},function(e,t){e.exports=require("path")}]);