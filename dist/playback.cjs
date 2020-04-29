/**
 * playback by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

function _interopNamespace(e) {
    if (e && e.__esModule) { return e; } else {
        var n = {};
        if (e) {
            Object.keys(e).forEach(function (k) {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            });
        }
        n['default'] = e;
        return n;
    }
}

var _Tonal = require('tonal');
var _Tonal__default = _interopDefault(_Tonal);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/**
 * Load a file.
 *
 * * Style locator algorithm:
 * 1. If the path begins with http:// or https://, look at that URL
 * 2. If the path begins with . or / look in the filesystem or at a relative URL
 * 3. Otherwise, look in the styles folder in this repo (which will move to its
 *    own repo eventually). For these built-in styles, the .play file extension
 *    is not required.
 *
 * @param {string} path The path to the file to load.
 * @return {string} The content of the file.
 */
function load(stylePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const isHTTP = stylePath.startsWith('http://') || stylePath.startsWith('https://');
        const isRelative = stylePath.startsWith('.') || stylePath.startsWith('/');
        if (typeof process === 'undefined') {
            if (isHTTP || isRelative) {
                return fetch(stylePath).then(r => r.text());
            }
            else {
                const modulePath = ''; //String(import.meta.url).replace(/[^\/]+$/, '');
                stylePath = modulePath + '../../styles/' + stylePath;
                if (!stylePath.endsWith('.play'))
                    stylePath += '.play';
                return fetch(stylePath).then(r => r.text());
            }
        }
        else {
            if (isHTTP) {
                // @ts-ignore
                const http = yield new Promise(function (resolve) { resolve(_interopNamespace(require(stylePath.startsWith('https://') ? 'https' : 'http'))); });
                return new Promise((resolve, reject) => {
                    http.get(stylePath, res => {
                        let body = '';
                        res.setEncoding('utf8');
                        res.on('data', data => body += data);
                        res.on('end', () => resolve(body));
                        res.on('error', reject);
                    });
                });
            }
            if (!isRelative) {
                // @ts-ignore
                const path = yield new Promise(function (resolve) { resolve(_interopNamespace(require('path'))); });
                try {
                    stylePath = path.join(__dirname, '../../styles/', stylePath);
                }
                catch (_a) { }
                if (!stylePath.endsWith('.play'))
                    stylePath += '.play';
            }
            // @ts-ignore
            const fs = yield new Promise(function (resolve) { resolve(_interopNamespace(require('fs'))); });
            return (new Promise((resolve, reject) => {
                fs.readFile(stylePath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            }));
        }
    });
}

var nearley = (function() {

    function Rule(name, symbols, postprocess) {
        this.id = ++Rule.highestId;
        this.name = name;
        this.symbols = symbols;        // a list of literal | regex class | nonterminal
        this.postprocess = postprocess;
        return this;
    }
    Rule.highestId = 0;

    Rule.prototype.toString = function(withCursorAt) {
        function stringifySymbolSequence (e) {
            return e.literal ? JSON.stringify(e.literal) :
                   e.type ? '%' + e.type : e.toString();
        }
        var symbolSequence = (typeof withCursorAt === "undefined")
                             ? this.symbols.map(stringifySymbolSequence).join(' ')
                             : (   this.symbols.slice(0, withCursorAt).map(stringifySymbolSequence).join(' ')
                                 + " ● "
                                 + this.symbols.slice(withCursorAt).map(stringifySymbolSequence).join(' ')     );
        return this.name + " → " + symbolSequence;
    };


    // a State is a rule at a position from a given starting point in the input stream (reference)
    function State(rule, dot, reference, wantedBy) {
        this.rule = rule;
        this.dot = dot;
        this.reference = reference;
        this.data = [];
        this.wantedBy = wantedBy;
        this.isComplete = this.dot === rule.symbols.length;
    }

    State.prototype.toString = function() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
    };

    State.prototype.nextState = function(child) {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
            state.data = state.build();
        }
        return state;
    };

    State.prototype.build = function() {
        var children = [];
        var node = this;
        do {
            children.push(node.right.data);
            node = node.left;
        } while (node.left);
        children.reverse();
        return children;
    };

    State.prototype.finish = function() {
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
    };


    function Column(grammar, index) {
        this.grammar = grammar;
        this.index = index;
        this.states = [];
        this.wants = {}; // states indexed by the non-terminal they expect
        this.scannable = []; // list of states that expect a token
        this.completed = {}; // states that are nullable
    }


    Column.prototype.process = function(nextColumn) {
        var states = this.states;
        var wants = this.wants;
        var completed = this.completed;

        for (var w = 0; w < states.length; w++) { // nb. we push() during iteration
            var state = states[w];

            if (state.isComplete) {
                state.finish();
                if (state.data !== Parser.fail) {
                    // complete
                    var wantedBy = state.wantedBy;
                    for (var i = wantedBy.length; i--; ) { // this line is hot
                        var left = wantedBy[i];
                        this.complete(left, state);
                    }

                    // special-case nullables
                    if (state.reference === this.index) {
                        // make sure future predictors of this rule get completed.
                        var exp = state.rule.name;
                        (this.completed[exp] = this.completed[exp] || []).push(state);
                    }
                }

            } else {
                // queue scannable states
                var exp = state.rule.symbols[state.dot];
                if (typeof exp !== 'string') {
                    this.scannable.push(state);
                    continue;
                }

                // predict
                if (wants[exp]) {
                    wants[exp].push(state);

                    if (completed.hasOwnProperty(exp)) {
                        var nulls = completed[exp];
                        for (var i = 0; i < nulls.length; i++) {
                            var right = nulls[i];
                            this.complete(state, right);
                        }
                    }
                } else {
                    wants[exp] = [state];
                    this.predict(exp);
                }
            }
        }
    };

    Column.prototype.predict = function(exp) {
        var rules = this.grammar.byName[exp] || [];

        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            var wantedBy = this.wants[exp];
            var s = new State(r, 0, this.index, wantedBy);
            this.states.push(s);
        }
    };

    Column.prototype.complete = function(left, right) {
        var copy = left.nextState(right);
        this.states.push(copy);
    };


    function Grammar(rules, start) {
        this.rules = rules;
        this.start = start || this.rules[0].name;
        var byName = this.byName = {};
        this.rules.forEach(function(rule) {
            if (!byName.hasOwnProperty(rule.name)) {
                byName[rule.name] = [];
            }
            byName[rule.name].push(rule);
        });
    }

    // So we can allow passing (rules, start) directly to Parser for backwards compatibility
    Grammar.fromCompiled = function(rules, start) {
        var lexer = rules.Lexer;
        if (rules.ParserStart) {
          start = rules.ParserStart;
          rules = rules.ParserRules;
        }
        var rules = rules.map(function (r) { return (new Rule(r.name, r.symbols, r.postprocess)); });
        var g = new Grammar(rules, start);
        g.lexer = lexer; // nb. storing lexer on Grammar is iffy, but unavoidable
        return g;
    };


    function StreamLexer() {
      this.reset("");
    }

    StreamLexer.prototype.reset = function(data, state) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
    };

    StreamLexer.prototype.next = function() {
        if (this.index < this.buffer.length) {
            var ch = this.buffer[this.index++];
            if (ch === '\n') {
              this.line += 1;
              this.lastLineBreak = this.index;
            }
            return {value: ch};
        }
    };

    StreamLexer.prototype.save = function() {
      return {
        line: this.line,
        col: this.index - this.lastLineBreak,
      }
    };

    StreamLexer.prototype.formatError = function(token, message) {
        // nb. this gets called after consuming the offending token,
        // so the culprit is index-1
        var buffer = this.buffer;
        if (typeof buffer === 'string') {
            var nextLineBreak = buffer.indexOf('\n', this.index);
            if (nextLineBreak === -1) nextLineBreak = buffer.length;
            var line = buffer.substring(this.lastLineBreak, nextLineBreak);
            var col = this.index - this.lastLineBreak;
            message += " at line " + this.line + " col " + col + ":\n\n";
            message += "  " + line + "\n";
            message += "  " + Array(col).join(" ") + "^";
            return message;
        } else {
            return message + " at index " + (this.index - 1);
        }
    };


    function Parser(rules, start, options) {
        if (rules instanceof Grammar) {
            var grammar = rules;
            var options = start;
        } else {
            var grammar = Grammar.fromCompiled(rules, start);
        }
        this.grammar = grammar;

        // Read options
        this.options = {
            keepHistory: false,
            lexer: grammar.lexer || new StreamLexer,
        };
        for (var key in (options || {})) {
            this.options[key] = options[key];
        }

        // Setup lexer
        this.lexer = this.options.lexer;
        this.lexerState = undefined;

        // Setup a table
        var column = new Column(grammar, 0);
        var table = this.table = [column];

        // I could be expecting anything.
        column.wants[grammar.start] = [];
        column.predict(grammar.start);
        // TODO what if start rule is nullable?
        column.process();
        this.current = 0; // token index
    }

    // create a reserved token for indicating a parse fail
    Parser.fail = {};

    Parser.prototype.feed = function(chunk) {
        var lexer = this.lexer;
        lexer.reset(chunk, this.lexerState);

        var token;
        while (token = lexer.next()) {
            // We add new states to table[current+1]
            var column = this.table[this.current];

            // GC unused states
            if (!this.options.keepHistory) {
                delete this.table[this.current - 1];
            }

            var n = this.current + 1;
            var nextColumn = new Column(this.grammar, n);
            this.table.push(nextColumn);

            // Advance all tokens that expect the symbol
            var literal = token.value;
            var value = lexer.constructor === StreamLexer ? token.value : token;
            var scannable = column.scannable;
            for (var w = scannable.length; w--; ) {
                var state = scannable[w];
                var expect = state.rule.symbols[state.dot];
                // Try to consume the token
                // either regex or literal
                if (expect.test ? expect.test(value) :
                    expect.type ? expect.type === token.type
                                : expect.literal === literal) {
                    // Add it
                    var next = state.nextState({data: value, token: token, isToken: true, reference: n - 1});
                    nextColumn.states.push(next);
                }
            }

            // Next, for each of the rules, we either
            // (a) complete it, and try to see if the reference row expected that
            //     rule
            // (b) predict the next nonterminal it expects by adding that
            //     nonterminal's start state
            // To prevent duplication, we also keep track of rules we have already
            // added

            nextColumn.process();

            // If needed, throw an error:
            if (nextColumn.states.length === 0) {
                // No states at all! This is not good.
                var message = this.lexer.formatError(token, "invalid syntax") + "\n";
                message += "Unexpected " + (token.type ? token.type + " token: " : "");
                message += JSON.stringify(token.value !== undefined ? token.value : token) + "\n";
                var err = new Error(message);
                err.offset = this.current;
                err.token = token;
                throw err;
            }

            // maybe save lexer state
            if (this.options.keepHistory) {
              column.lexerState = lexer.save();
            }

            this.current++;
        }
        if (column) {
          this.lexerState = lexer.save();
        }

        // Incrementally keep track of results
        this.results = this.finish();

        // Allow chaining, for whatever it's worth
        return this;
    };

    Parser.prototype.save = function() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
    };

    Parser.prototype.restore = function(column) {
        var index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;

        // Incrementally keep track of results
        this.results = this.finish();
    };

    // nb. deprecated: use save/restore instead!
    Parser.prototype.rewind = function(index) {
        if (!this.options.keepHistory) {
            throw new Error('set option `keepHistory` to enable rewinding')
        }
        // nb. recall column (table) indicies fall between token indicies.
        //        col 0   --   token 0   --   col 1
        this.restore(this.table[index]);
    };

    Parser.prototype.finish = function() {
        // Return the possible parsings
        var considerations = [];
        var start = this.grammar.start;
        var column = this.table[this.table.length - 1];
        column.states.forEach(function (t) {
            if (t.rule.name === start
                    && t.dot === t.rule.symbols.length
                    && t.reference === 0
                    && t.data !== Parser.fail) {
                considerations.push(t);
            }
        });
        return considerations.map(function(c) {return c.data; });
    };

    return {
        Parser: Parser,
        Grammar: Grammar,
        Rule: Rule,
    };

})();

var moo = (function() {

  var hasOwnProperty = Object.prototype.hasOwnProperty;

  // polyfill assign(), so we support IE9+
  var assign = typeof Object.assign === 'function' ? Object.assign :
    // https://tc39.github.io/ecma262/#sec-object.assign
    function(target, sources) {
      if (target == null) {
        throw new TypeError('Target cannot be null or undefined');
      }
      target = Object(target);

      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        if (source == null) continue

        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target
    };

  var hasSticky = typeof new RegExp().sticky === 'boolean';

  /***************************************************************************/

  function isRegExp(o) { return o && o.constructor === RegExp }
  function isObject(o) { return o && typeof o === 'object' && o.constructor !== RegExp && !Array.isArray(o) }

  function reEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }
  function reGroups(s) {
    var re = new RegExp('|' + s);
    return re.exec('').length - 1
  }
  function reCapture(s) {
    return '(' + s + ')'
  }
  function reUnion(regexps) {
    var source =  regexps.map(function(s) {
      return "(?:" + s + ")"
    }).join('|');
    return "(?:" + source + ")"
  }

  function regexpOrLiteral(obj) {
    if (typeof obj === 'string') {
      return '(?:' + reEscape(obj) + ')'

    } else if (isRegExp(obj)) {
      // TODO: consider /u support
      if (obj.ignoreCase) { throw new Error('RegExp /i flag not allowed') }
      if (obj.global) { throw new Error('RegExp /g flag is implied') }
      if (obj.sticky) { throw new Error('RegExp /y flag is implied') }
      if (obj.multiline) { throw new Error('RegExp /m flag is implied') }
      return obj.source

    } else {
      throw new Error('not a pattern: ' + obj)
    }
  }

  function objectToRules(object) {
    var keys = Object.getOwnPropertyNames(object);
    var result = [];
    for (var i=0; i<keys.length; i++) {
      var key = keys[i];
      var thing = object[key];
      var rules = Array.isArray(thing) ? thing : [thing];
      var match = [];
      rules.forEach(function(rule) {
        if (isObject(rule)) {
          if (match.length) result.push(ruleOptions(key, match));
          result.push(ruleOptions(key, rule));
          match = [];
        } else {
          match.push(rule);
        }
      });
      if (match.length) result.push(ruleOptions(key, match));
    }
    return result
  }

  function arrayToRules(array) {
    var result = [];
    for (var i=0; i<array.length; i++) {
      var obj = array[i];
      if (!obj.name) {
        throw new Error('Rule has no name: ' + JSON.stringify(obj))
      }
      result.push(ruleOptions(obj.name, obj));
    }
    return result
  }

  function ruleOptions(name, obj) {
    if (typeof obj !== 'object' || Array.isArray(obj) || isRegExp(obj)) {
      obj = { match: obj };
    }

    // nb. error implies lineBreaks
    var options = assign({
      tokenType: name,
      lineBreaks: !!obj.error,
      pop: false,
      next: null,
      push: null,
      error: false,
      value: null,
      getType: null,
    }, obj);

    // convert to array
    var match = options.match;
    options.match = Array.isArray(match) ? match : match ? [match] : [];
    options.match.sort(function(a, b) {
      return isRegExp(a) && isRegExp(b) ? 0
           : isRegExp(b) ? -1 : isRegExp(a) ? +1 : b.length - a.length
    });
    if (options.keywords) {
      options.getType = keywordTransform(options.keywords);
    }
    return options
  }

  function compileRules(rules, hasStates) {
    rules = Array.isArray(rules) ? arrayToRules(rules) : objectToRules(rules);

    var errorRule = null;
    var groups = [];
    var parts = [];
    for (var i=0; i<rules.length; i++) {
      var options = rules[i];

      if (options.error) {
        if (errorRule) {
          throw new Error("Multiple error rules not allowed: (for token '" + options.tokenType + "')")
        }
        errorRule = options;
      }

      // skip rules with no match
      if (options.match.length === 0) {
        continue
      }
      groups.push(options);

      // convert to RegExp
      var pat = reUnion(options.match.map(regexpOrLiteral));

      // validate
      var regexp = new RegExp(pat);
      if (regexp.test("")) {
        throw new Error("RegExp matches empty string: " + regexp)
      }
      var groupCount = reGroups(pat);
      if (groupCount > 0) {
        throw new Error("RegExp has capture groups: " + regexp + "\nUse (?: … ) instead")
      }
      if (!hasStates && (options.pop || options.push || options.next)) {
        throw new Error("State-switching options are not allowed in stateless lexers (for token '" + options.tokenType + "')")
      }

      // try and detect rules matching newlines
      if (!options.lineBreaks && regexp.test('\n')) {
        throw new Error('Rule should declare lineBreaks: ' + regexp)
      }

      // store regex
      parts.push(reCapture(pat));
    }

    var suffix = hasSticky ? '' : '|(?:)';
    var flags = hasSticky ? 'ym' : 'gm';
    var combined = new RegExp(reUnion(parts) + suffix, flags);

    return {regexp: combined, groups: groups, error: errorRule}
  }

  function compile(rules) {
    var result = compileRules(rules);
    return new Lexer({start: result}, 'start')
  }

  function compileStates(states, start) {
    var keys = Object.getOwnPropertyNames(states);
    if (!start) start = keys[0];

    var map = Object.create(null);
    for (var i=0; i<keys.length; i++) {
      var key = keys[i];
      map[key] = compileRules(states[key], true);
    }

    for (var i=0; i<keys.length; i++) {
      var groups = map[keys[i]].groups;
      for (var j=0; j<groups.length; j++) {
        var g = groups[j];
        var state = g && (g.push || g.next);
        if (state && !map[state]) {
          throw new Error("Missing state '" + state + "' (in token '" + g.tokenType + "' of state '" + keys[i] + "')")
        }
        if (g && g.pop && +g.pop !== 1) {
          throw new Error("pop must be 1 (in token '" + g.tokenType + "' of state '" + keys[i] + "')")
        }
      }
    }

    return new Lexer(map, start)
  }

  function keywordTransform(map) {
    var reverseMap = Object.create(null);
    var byLength = Object.create(null);
    var types = Object.getOwnPropertyNames(map);
    for (var i=0; i<types.length; i++) {
      var tokenType = types[i];
      var item = map[tokenType];
      var keywordList = Array.isArray(item) ? item : [item];
      keywordList.forEach(function(keyword) {
        (byLength[keyword.length] = byLength[keyword.length] || []).push(keyword);
        if (typeof keyword !== 'string') {
          throw new Error("keyword must be string (in keyword '" + tokenType + "')")
        }
        reverseMap[keyword] = tokenType;
      });
    }

    // fast string lookup
    // https://jsperf.com/string-lookups
    function str(x) { return JSON.stringify(x) }
    var source = '';
    source += '(function(value) {\n';
    source += 'switch (value.length) {\n';
    for (var length in byLength) {
      var keywords = byLength[length];
      source += 'case ' + length + ':\n';
      source += 'switch (value) {\n';
      keywords.forEach(function(keyword) {
        var tokenType = reverseMap[keyword];
        source += 'case ' + str(keyword) + ': return ' + str(tokenType) + '\n';
      });
      source += '}\n';
    }
    source += '}\n';
    source += '})';
    return eval(source) // getType
  }

  /***************************************************************************/

  var Lexer = function(states, state) {
    this.startState = state;
    this.states = states;
    this.buffer = '';
    this.stack = [];
    this.reset();
  };

  Lexer.prototype.reset = function(data, info) {
    this.buffer = data || '';
    this.index = 0;
    this.line = info ? info.line : 1;
    this.col = info ? info.col : 1;
    this.setState(info ? info.state : this.startState);
    return this
  };

  Lexer.prototype.save = function() {
    return {
      line: this.line,
      col: this.col,
      state: this.state,
    }
  };

  Lexer.prototype.setState = function(state) {
    if (!state || this.state === state) return
    this.state = state;
    var info = this.states[state];
    this.groups = info.groups;
    this.error = info.error || {lineBreaks: true, shouldThrow: true};
    this.re = info.regexp;
  };

  Lexer.prototype.popState = function() {
    this.setState(this.stack.pop());
  };

  Lexer.prototype.pushState = function(state) {
    this.stack.push(this.state);
    this.setState(state);
  };

  Lexer.prototype._eat = hasSticky ? function(re) { // assume re is /y
    return re.exec(this.buffer)
  } : function(re) { // assume re is /g
    var match = re.exec(this.buffer);
    // will always match, since we used the |(?:) trick
    if (match[0].length === 0) {
      return null
    }
    return match
  };

  Lexer.prototype._getGroup = function(match) {
    if (match === null) {
      return -1
    }

    var groupCount = this.groups.length;
    for (var i = 0; i < groupCount; i++) {
      if (match[i + 1] !== undefined) {
        return i
      }
    }
    throw new Error('oops')
  };

  function tokenToString() {
    return this.value
  }

  Lexer.prototype.next = function() {
    var re = this.re;
    var buffer = this.buffer;

    var index = re.lastIndex = this.index;
    if (index === buffer.length) {
      return // EOF
    }

    var match = this._eat(re);
    var i = this._getGroup(match);

    var group, text;
    if (i === -1) {
      group = this.error;

      // consume rest of buffer
      text = buffer.slice(index);

    } else {
      text = match[0];
      group = this.groups[i];
    }

    // count line breaks
    var lineBreaks = 0;
    if (group.lineBreaks) {
      var matchNL = /\n/g;
      var nl = 1;
      if (text === '\n') {
        lineBreaks = 1;
      } else {
        while (matchNL.exec(text)) { lineBreaks++; nl = matchNL.lastIndex; }
      }
    }

    var token = {
      type: (group.getType && group.getType(text)) || group.tokenType,
      value: group.value ? group.value(text) : text,
      text: text,
      toString: tokenToString,
      offset: index,
      lineBreaks: lineBreaks,
      line: this.line,
      col: this.col,
    };
    // nb. adding more props to token object will make V8 sad!

    var size = text.length;
    this.index += size;
    this.line += lineBreaks;
    if (lineBreaks !== 0) {
      this.col = size - nl + 1;
    } else {
      this.col += size;
    }
    // throw, if no rule with {error: true}
    if (group.shouldThrow) {
      throw new Error(this.formatError(token, "invalid syntax"))
    }

    if (group.pop) this.popState();
    else if (group.push) this.pushState(group.push);
    else if (group.next) this.setState(group.next);
    return token
  };

  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    var LexerIterator = function(lexer) {
      this.lexer = lexer;
    };

    LexerIterator.prototype.next = function() {
      var token = this.lexer.next();
      return {value: token, done: !token}
    };

    LexerIterator.prototype[Symbol.iterator] = function() {
      return this
    };

    Lexer.prototype[Symbol.iterator] = function() {
      return new LexerIterator(this)
    };
  }

  Lexer.prototype.formatError = function(token, message) {
    var value = token.value;
    var index = token.offset;
    var eol = token.lineBreaks ? value.indexOf('\n') : value.length;
    var start = Math.max(0, index - token.col + 1);
    var firstLine = this.buffer.substring(start, index + eol);
    message += " at line " + token.line + " col " + token.col + ":\n\n";
    message += "  " + firstLine + "\n";
    message += "  " + Array(token.col).join(" ") + "^";
    return message
  };

  Lexer.prototype.clone = function() {
    return new Lexer(this.states, this.state)
  };

  Lexer.prototype.has = function(tokenType) {
    for (var s in this.states) {
      var groups = this.states[s].groups;
      for (var i=0; i<groups.length; i++) {
        var group = groups[i];
        if (group.tokenType === tokenType) return true
        if (group.keywords && hasOwnProperty.call(group.keywords, tokenType)) {
          return true
        }
      }
    }
    return false
  };


  return {
    compile: compile,
    states: compileStates,
    error: Object.freeze({error: true}),
  }

})();

/* eslint-disable @typescript-eslint/camelcase */
var lexer = moo.states({
    main: {
        comment: {
            match: /\/\/.*?(?:\n|$)/,
            lineBreaks: true
        },
        quoted_string: /"(?:[^\\"\n]|\\.)*"/,
        ws: {
            match: /\s+/,
            lineBreaks: true
        },
        at_rule: ['@meta', '@options', '@import', '@track', '@pattern'],
        identifier: {
            // start with alpha, may contain digits and dashes but not end with dash
            match: /[a-zA-z](?:[a-zA-Z\-\d]*[a-zA-Z\d])?/,
            keywords: {
                keyword: ['if', 'as'],
                boolean: ['true', 'false']
            }
        },
        number: /(?:\d*\.)?\d+/,
        brackets: ['{', '}', '(', ')'],
        left_angle: { match: '<', push: 'beat' },
        operators: ['&', '+', '-', '*', '/', '.']
    },
    beat: {
        beat_ws: / +/,
        beat_colon: ':',
        beat_number: /(?:\d*\.)?\d+/,
        beat_flag: /[a-zA-Z]/,
        beat_right_angle: { match: '>', pop: true },
        beat_operators: ['|', '+', '-', '*', '/']
    }
});

// does this have to be an Error? idc
class PlaybackError extends Error {
    constructor(message, scope) {
        super(`${message}\nScope: "${scope.name}"`);
    }
}
/* Import-related errors */
class ImportError extends PlaybackError {
    constructor(message, scope) {
        super(message, scope);
    }
}
class NoSuchStyleError extends ImportError {
    constructor(identifier, scope) {
        super(`No style with the name "${identifier}" was imported`, scope);
    }
}
class NoSuchTrackError extends ImportError {
    constructor(style, track, scope) {
        super(`No track with the name "${track}" exists in the style "${style}"`, scope);
    }
}
class NoSuchPatternError extends ImportError {
    constructor(style, track, pattern, scope) {
        super(`Pattern "${style}.${track}.${pattern}" does not exist`, scope);
    }
}
/* Function-related errors */
class FunctionNameError extends PlaybackError {
    constructor(identifier, scope) {
        super(`No function exists with name "${identifier}"`, scope);
    }
}
class FunctionScopeError extends PlaybackError {
    constructor(message, scope) {
        super(message, scope);
    }
}
class FunctionArgumentsError extends PlaybackError {
    constructor(message, args, scope) {
        super(`${message} (got ${args.map(a => a.toOutputString()).join(', ')})`, scope);
    }
}
/* Pattern-related errors */
class TooManyBeatsError extends PlaybackError {
    constructor(scope) {
        super('Pattern may only contain 1 BeatGroup. Try the join operator "&"', scope);
    }
}
/* Beat-related errors*/
class MelodicBeatInDrumBeatGroupError extends PlaybackError {
    constructor(scope) {
        super('Unexpected Melodic Beat in a Drum Beat Group', scope);
    }
}
class DrumBeatInMelodicBeatGroupError extends PlaybackError {
    constructor(scope) {
        super('Unexpected Drum Beat in a Melodic Beat Group', scope);
    }
}

class ASTNodeBase {
    init(parentScope, ...args) {
        this.scope = parentScope;
    }
}
/*
 * In Playback styles, basically any pair of curly brackets defines a scope
 * which inherits settings from its parent scope but can overwrite them.
 */
class Scope extends ASTNodeBase {
    constructor() {
        super(...arguments);
        this.defaultVars = new Map();
        this.vars = new Map();
    }
    inherit() {
        this.vars = new Map([...this.defaultVars, ...this.scope.vars]);
    }
    init(scope, ...args) {
        super.init(scope);
        // in case this.vars was set in the constructor
        this.vars = new Map([...this.defaultVars, ...this.scope.vars, ...this.vars]);
    }
}

class MetaStatement extends Scope {
    constructor(functionCalls) {
        super();
        this.name = '@meta';
        this.type = '@meta';
        this.functionCalls = functionCalls;
    }
    link() { }
    init(scope) {
        super.init(scope);
        // nothing in here can be dynamic so resolve these at compile time
        for (const functionCall of this.functionCalls) {
            functionCall.init(this);
            functionCall.execute();
        }
        scope.metadata = this.vars;
    }
    execute() { return null; }
}
class OptionsStatement extends Scope {
    constructor(functionCalls) {
        super();
        this.name = '@options';
        this.type = '@options';
        this.functionCalls = functionCalls;
    }
    link() { }
    init(scope) {
        // nothing in here /should/ be dynamic so resolve these at compile time
        for (const functionCall of this.functionCalls) {
            functionCall.init(this);
            functionCall.execute();
        }
        this.scope = scope;
        // in this case we're actually overwriting our scope's variables, not
        // vise-versa
        scope.vars = new Map([...scope.vars, ...this.vars]);
    }
    execute() { return null; }
}
class ImportStatement extends ASTNodeBase {
    constructor(path, identifier) {
        super();
        this.path = path;
        this.identifier = identifier;
    }
    link() { }
    execute() { }
}

var drumJson = {
  "26": "Silence",
  "27": "High-Q",
  "28": "Slap",
  "29": "Scratch Push",
  "30": "Scratch Pull",
  "31": "Sticks",
  "32": "Square Click",
  "33": "Metronome Click",
  "34": "Metronome Bell",
  "35": "Acoustic Bass Drum",
  "36": "Bass Drum",
  "37": "Side Stick",
  "38": "Acoustic Snare",
  "39": "Hand Clap",
  "40": "Electric Snare",
  "41": "Low Floor Tom",
  "42": "Closed Hi Hat",
  "43": "High Floor Tom",
  "44": "Pedal Hi-Hat",
  "45": "Low Tom",
  "46": "Open Hi-Hat",
  "47": "Low-Mid Tom",
  "48": "Hi-Mid Tom",
  "49": "Crash Cymbal 1",
  "50": "High Tom",
  "51": "Ride Cymbal 1",
  "52": "Chinese Cymbal",
  "53": "Ride Bell",
  "54": "Tambourine",
  "55": "Splash Cymbal",
  "56": "Cowbell",
  "57": "Crash Cymbal 2",
  "58": "Vibraslap",
  "59": "Ride Cymbal 2",
  "60": "Hi Bongo",
  "61": "Low Bongo",
  "62": "Mute Hi Conga",
  "63": "Open Hi Conga",
  "64": "Low Conga",
  "65": "High Timbale",
  "66": "Low Timbale",
  "67": "High Agogo",
  "68": "Low Agogo",
  "69": "Cabasa",
  "70": "Maracas",
  "71": "Short Whistle",
  "72": "Long Whistle",
  "73": "Short Guiro",
  "74": "Long Guiro",
  "75": "Claves",
  "76": "Hi Wood Block",
  "77": "Low Wood Block",
  "78": "Mute Cuica",
  "79": "Open Cuica",
  "80": "Mute Triangle",
  "81": "Open Triangle",
  "82": "Shaker",
  "83": "Jingle Bell",
  "84": "Bell Tree",
  "85": "Castanets",
  "86": "Mute Surdo",
  "87": "Open Surdo"
};

const tonal = _Tonal__default || _Tonal;
/**
 * There are some inconsistencies with the official MIDI drum names, this
 * transformation will hopefully ease the pain there.
 * Note: What's the more general word for case-folding? Just "normalizing"? Eh
 * @param {string} name
 * @return {string}
 */
function normalizeDrumName(name) {
    return name.toLowerCase().replace(/ |-|_/g, ' ');
}
// make a map of drum names, which is the inverse of the given JSON file
const DRUM_MAP = new Map();
for (const midi in drumJson) {
    const name = normalizeDrumName(drumJson[midi]);
    DRUM_MAP.set(name, midi);
}
/**
 * Special pitch value meaning the note will be set later by a DrumBeatGroup
 */
const AwaitingDrum = Symbol('AwaitingDrum');
class Note {
    /**
     * @param {Object} opts Options object.
     * @param {number} opts.time The note's time, in beats.
     * @param {string | symbol} opts.pitch A string representing the pitch and octave of the note. e.x. 'A4'
     * @param {number} opts.duraion The note's duration, in beats.
     * @param {number} opts.volume The note's volume, as a float 0-1 (inclusive).
     */
    constructor(opts) {
        this.time = opts.time;
        this.pitch = opts.pitch;
        this.duration = opts.duration;
        this.volume = opts.volume;
    }
    /**
     * An integer representing the MIDI pitch value of the note.
     * @type {number}
     */
    get midi() {
        if (this.pitch === AwaitingDrum) {
            return null;
        }
        else {
            const drumValue = DRUM_MAP.get(normalizeDrumName(this.pitch));
            if (drumValue) {
                return drumValue;
            }
            else {
                return tonal.Note.midi(this.pitch);
            }
        }
    }
    /**
     * An integer 0-127 that roughly correlates to volume
     * @type {number}
     */
    get velocity() {
        return Math.floor(this.volume * 127);
    }
}
class NoteSet extends Array {
    constructor(...args) {
        super();
        this.push(...args);
    }
}

let tonal$1 = {};
(function(n){function t(n){"string"!=typeof n&&(n="");var t=T.exec(n);return t?[t[1].toUpperCase(),t[2].replace(/x/g,"##"),t[3],t[4]]:null}function r(n,t){return n=Math.round(n),(!0===t?G:I)[n%12]+(Math.floor(n/12)-1)}function e(n,t){for(var r=[];t--;r[t]=t+n);return r}function m(n,t){for(var r=[];t--;r[t]=n-t);return r}function i(n,t){return null===n||null===t?[]:n<t?e(n,t-n+1):m(n,n-t+1)}function u(n,t){var r=t.length,e=(n%r+r)%r;return t.slice(e,r).concat(t.slice(0,e))}function o(n){return Mn(n.map(R)).sort(function(n,t){return an(n)>an(t)})}function P(n){return o(n).filter(function(n,t,r){return 0===t||n!==r[t-1]})}function M(n){return "string"!=typeof n?An:_n[n]||(_n[n]=xn(n))}function a(n){var t=(n+1)%7;return t<0?7+t:t}function l(n,t){if(1===arguments.length)return function(t){return l(n,t)};var r=Kn(n),e=Qn(t);if(null===r||null===e)return null;var m=1===r.length?[r[0]+e[0]]:[r[0]+e[0],r[1]+e[1]];return mn(Un(m[0],m[1]))}function c(n,t){if(1===arguments.length)return function(t){return c(n,t)};var r=Kn(n);return null===r?null:mn(Un(r[0]+t))}function s(n,t){if(1===arguments.length)return function(t){return s(n,t)};var r=Kn(n),e=Kn(t);return null===e||null===r?null:e[0]-r[0]}function f(n,t){return 1===arguments.length?function(t){return l(t,n)}:l(t,n)}function d(n,t,r){var e=Qn(n),m=Qn(t);if(null===e||null===m)return null;var i=[e[0]+r*m[0],e[1]+r*m[1]];return Dn(Wn(i))}function p(n,t){return 1===arguments.length?function(t){return p(n,t)}:d(n,t,1)}function b(n,t){return 1===arguments.length?function(t){return p(n,t)}:d(n,t,-1)}function h(n,t){if(1===arguments.length)return function(t){return h(n,t)};var r=Kn(n),e=Kn(t);if(null===r||null===e||r.length!==e.length)return null;var m=1===r.length?[e[0]-r[0],-Math.floor(7*(e[0]-r[0])/12)]:[e[0]-r[0],e[1]-r[1]];return Dn(Wn(m))}function v(n,t){if(1===arguments.length)return function(t){return v(n,t)};var r=L(n),e=L(t);return null!==r.midi&&null!==e.midi?e.midi-r.midi:null!==r.chroma&&null!==e.chroma?(e.chroma-r.chroma+12)%12:null}function A(n){if(y(n))return n;if(!Array.isArray(n))return "";var t=[0,0,0,0,0,0,0,0,0,0,0,0];return n.map(nt).forEach(function(n){t[n]=1;}),t.join("")}function g(n){return et=et||i(2048,4095).map(function(n){return n.toString(2)}),"number"==typeof n?et.filter(function(t){return rt(t)===n}):et.slice()}function j(n,t){t=!1!==t;var r=A(n).split("");return Mn(r.map(function(n,e){var m=u(e,r);return t&&"0"===m[0]?null:m.join("")}))}function y(n){return mt.test(n)}function O(n){return y(n)?Mn(n.split("").map(function(n,t){return "1"===n?it[t]:null})):[]}function x(n,t){return 1===arguments.length?function(t){return x(n,t)}:A(n)===A(t)}function _(n,t){return arguments.length>1?_(n)(t):(n=tt(n),function(t){return (t=tt(t))!==n&&(t&n)===t})}function z(n,t){return arguments.length>1?z(n)(t):(n=tt(n),function(t){return (t=tt(t))!==n&&(t|n)===t})}function q(n,t){return arguments.length>1?q(n)(t):(n=A(n),function(t){return "1"===n[nt(t)]})}function k(n,t){return 1===arguments.length?function(t){return k(n,t)}:t.filter(q(n))}function S(n,t){var r=D(n);return t=t||r[1],pt(t).map(l(r[0]))}function w(n){var t=D(n);return void 0!==Mt(t[1])}function D(n){if("string"!=typeof n)return ["",""];var t=n.indexOf(" "),r=R(n.substring(0,t))||R(n)||"",e=""!==r?n.substring(r.length+1):n;return [r,e.length?e:""]}function E(n,t){var r=C(n);return t=t||r[1],xt(t).intervals.map(l(r[0]))}function C(n){var r=t(n);return ""===r[0]?["",n]:"A"===r[0]&&"ug"===r[3]?["","aug"]:St.test(r[2])?[r[0]+r[1],r[2]+r[3]]:[r[0]+r[1]+r[2],r[3]]}var $="C C# Db D D# Eb E F F# Gb G G# Ab A A# Bb B".split(" "),F=function(n){return "string"!=typeof n?$.slice():$.filter(function(t){var r=t[1]||" ";return -1!==n.indexOf(r)})},G=F(" #"),I=F(" b"),T=/^([a-gA-G]?)(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)$/,B=Object.freeze({pc:null,name:null,step:null,alt:null,oct:null,octStr:null,chroma:null,midi:null,freq:null}),N=[0,2,4,5,7,9,11],L=function(n,t){return void 0===t&&(t={}),function(r){return t[r]||(t[r]=n(r))}}(function(n){var r=t(n);if(""===r[0]||""!==r[3])return B;var e=r[0],m=r[1],i=r[2],u={letter:e,acc:m,octStr:i};return u.pc=u.letter+u.acc,u.name=u.pc+i,u.step=(u.letter.charCodeAt(0)+3)%7,u.alt="b"===u.acc[0]?-u.acc.length:u.acc.length,u.oct=i.length?+i:null,u.chroma=(N[u.step]+u.alt+120)%12,u.midi=null!==u.oct?N[u.step]+u.alt+12*(u.oct+1):null,u.freq=J(u.midi),Object.freeze(u)}),R=function(n){return L(n).name},U=function(n){return L(n).pc},H=function(n){return L(n).midi||+n||null},J=function(n,t){return void 0===t&&(t=440),"number"==typeof n?Math.pow(2,(n-69)/12)*t:null},K=function(n){return L(n).freq||J(n)},Q=Math.log(2),V=Math.log(440),W=function(n){var t=12*(Math.log(n)-V)/Q+69;return Math.round(100*t)/100},X=function(n){return L(n).chroma},Y=function(n){return L(n).oct},Z=function(n){return "CDEFGAB"[n]},nn=function(n,t){return Array(t+1).join(n)},tn=function(n,t){return "number"!=typeof n?"":t(n)},rn=function(n){return tn(n,function(n){return n<0?nn("b",-n):nn("#",n)})},en=function(n,t){void 0===n&&(n={}),void 0===t&&(t=null);var r=t?Object.assign({},L(t),n):n,e=r.step,m=r.alt,i=r.oct,u=Z(e);if(!u)return null;var o=u+rn(m);return i||0===i?o+i:o},mn=en,un=function(n,t){var e=L(n),m=e.alt,i=e.chroma,u=e.midi;if(null===i)return null;var o=!1===t?m<0:m>0;return null===u?U(r(i,o)):r(u,o)},on=function(n){return un(n,!1)},Pn=Object.freeze({names:F,tokenize:t,props:L,name:R,pc:U,midi:H,midiToFreq:J,freq:K,freqToMidi:W,chroma:X,oct:Y,stepToLetter:Z,altToAcc:rn,from:en,build:mn,fromMidi:r,simplify:un,enharmonic:on}),Mn=function(n){return n.filter(function(n){return 0===n||n})},an=function(n){var t=H(n);return null!==t?t:H(n+"-100")},ln=function(n,t){void 0===t&&(t=Math.random);for(var r,e,m=n.length;m;)r=t()*m--|0,e=n[m],n[m]=n[r],n[r]=e;return n},cn=function(n){return 0===n.length?[[]]:cn(n.slice(1)).reduce(function(t,r){return t.concat(n.map(function(t,e){var m=r.slice();return m.splice(e,0,n[0]),m}))},[])},sn=Object.freeze({range:i,rotate:u,compact:Mn,sort:o,unique:P,shuffle:ln,permutations:cn}),fn=new RegExp("^([-+]?\\d+)(d{1,4}|m|M|P|A{1,4})|(AA|A|P|M|m|d|dd)([-+]?\\d+)$"),dn=[0,2,4,5,7,9,11],pn=[0,1,2,3,4,5,6,5,4,3,2,1],bn="1P 2m 2M 3m 3M 4P 5P 6m 6M 7m 7M 8P".split(" "),hn=function(n){return "string"!=typeof n?bn.slice():bn.filter(function(t){return -1!==n.indexOf(t[1])})},vn=function(n){var t=fn.exec(n);return null===t?null:t[1]?[t[1],t[2]]:[t[4],t[3]]},An=Object.freeze({name:null,num:null,q:null,step:null,alt:null,dir:null,type:null,simple:null,semitones:null,chroma:null}),gn=function(n,t){return Array(Math.abs(t)+1).join(n)},jn=function(n,t){return "M"===t&&"M"===n?0:"P"===t&&"P"===n?0:"m"===t&&"M"===n?-1:/^A+$/.test(t)?t.length:/^d+$/.test(t)?"P"===n?-t.length:-t.length-1:null},yn=function(n,t){return 0===t?"M"===n?"M":"P":-1===t&&"M"===n?"m":t>0?gn("A",t):t<0?gn("d","P"===n?t:t+1):null},On=function(n){return (Math.abs(n)-1)%7},xn=function(n){var t=vn(n);if(null===t)return An;var r={num:+t[0],q:t[1]};return r.step=On(r.num),r.type="PMMPPMM"[r.step],"M"===r.type&&"P"===r.q?An:(r.name=""+r.num+r.q,r.dir=r.num<0?-1:1,r.simple=8===r.num||-8===r.num?r.num:r.dir*(r.step+1),r.alt=jn(r.type,r.q),r.oct=Math.floor((Math.abs(r.num)-1)/7),r.semitones=r.dir*(dn[r.step]+r.alt+12*r.oct),r.chroma=(r.dir*(dn[r.step]+r.alt)%12+12)%12,Object.freeze(r))},_n={},zn=function(n){return M(n).num},qn=function(n){return M(n).name},kn=function(n){return M(n).semitones},Sn=function(n){return M(n).chroma},wn=function(n){return "string"==typeof n&&(n=M(n).chroma),"number"==typeof n?pn[n%12]:null},Dn=function(n){void 0===n&&(n={});var t=n.num,r=n.step,e=n.alt,m=n.oct;void 0===m&&(m=1);var i=n.dir;if(void 0!==r&&(t=r+1+7*m),void 0===t)return null;var u=i<0?"-":"",o="PMMPPMM"[On(t)];return u+t+yn(o,e)},En=function(n){var t=M(n);return t===An?null:t.simple+t.q},Cn=function(n){var t=M(n);if(t===An)return null;var r=(7-t.step)%7,e="P"===t.type?-t.alt:-(t.alt+1);return Dn({step:r,alt:e,oct:t.oct,dir:t.dir})},$n=[1,2,2,3,3,4,5,5,6,6,7,7],Fn="P m M m M P d P m M m M".split(" "),Gn=function(n){var t=n<0?-1:1,r=Math.abs(n),e=r%12,m=Math.floor(r/12);return t*($n[e]+7*m)+Fn[e]},In=Object.freeze({names:hn,tokenize:vn,props:M,num:zn,name:qn,semitones:kn,chroma:Sn,ic:wn,build:Dn,simplify:En,invert:Cn,fromSemitones:Gn}),Tn=[0,2,4,-1,1,3,5],Bn=function(n){return Math.floor(7*n/12)},Nn=Tn.map(Bn),Ln=function(n){var t=n.step,r=n.alt,e=n.oct,m=n.dir;void 0===m&&(m=1);var i=Tn[t]+7*r;return null===e?[m*i]:[m*i,m*(e-Nn[t]-4*r)]},Rn=[3,0,4,1,5,2,6],Un=function(n,t,r){var e=Rn[a(n)],m=Math.floor((n+1)/7);return void 0===t?{step:e,alt:m,dir:r}:{step:e,alt:m,oct:t+4*m+Nn[e],dir:r}},Hn=function(n,t){return void 0===t&&(t={}),function(r){return t[r]||(t[r]=n(r))}},Jn=function(n){return Hn(function(t){var r=n(t);return null===r.name?null:Ln(r)})},Kn=Jn(L),Qn=Jn(M),Vn=function(n){return 7*n[0]+12*n[1]<0},Wn=function(n){return Vn(n)?Un(-n[0],-n[1],-1):Un(n[0],n[1],1)},Xn=Object.freeze({transpose:l,trFifths:c,fifths:s,transposeBy:f,addIntervals:d,add:p,subtract:b,interval:h,semitones:v}),Yn={chromatic:["1P 2m 2M 3m 3M 4P 4A 5P 6m 6M 7m 7M"],lydian:["1P 2M 3M 4A 5P 6M 7M"],major:["1P 2M 3M 4P 5P 6M 7M",["ionian"]],mixolydian:["1P 2M 3M 4P 5P 6M 7m",["dominant"]],dorian:["1P 2M 3m 4P 5P 6M 7m"],aeolian:["1P 2M 3m 4P 5P 6m 7m",["minor"]],phrygian:["1P 2m 3m 4P 5P 6m 7m"],locrian:["1P 2m 3m 4P 5d 6m 7m"],altered:["1P 2m 3m 3M 5d 6m 7m",["super locrian","diminished whole tone","pomeroy"]],iwato:["1P 2m 4P 5d 7m"],hirajoshi:["1P 2M 3m 5P 6m"],kumoijoshi:["1P 2m 4P 5P 6m"],pelog:["1P 2m 3m 5P 6m"],prometheus:["1P 2M 3M 4A 6M 7m"],ritusen:["1P 2M 4P 5P 6M"],scriabin:["1P 2m 3M 5P 6M"],piongio:["1P 2M 4P 5P 6M 7m"],augmented:["1P 2A 3M 5P 5A 7M"],neopolitan:["1P 2m 3m 4P 5P 6m 7M"],diminished:["1P 2M 3m 4P 5d 6m 6M 7M"],egyptian:["1P 2M 4P 5P 7m"],oriental:["1P 2m 3M 4P 5d 6M 7m"],spanish:["1P 2m 3M 4P 5P 6m 7m",["phrygian major"]],flamenco:["1P 2m 3m 3M 4A 5P 7m"],balinese:["1P 2m 3m 4P 5P 6m 7M"],persian:["1P 2m 3M 4P 5d 6m 7M"],bebop:["1P 2M 3M 4P 5P 6M 7m 7M"],enigmatic:["1P 2m 3M 5d 6m 7m 7M"],ichikosucho:["1P 2M 3M 4P 5d 5P 6M 7M"],"melodic minor":["1P 2M 3m 4P 5P 6M 7M"],"melodic minor second mode":["1P 2m 3m 4P 5P 6M 7m"],"lydian augmented":["1P 2M 3M 4A 5A 6M 7M"],"lydian dominant":["1P 2M 3M 4A 5P 6M 7m",["lydian b7"]],"melodic minor fifth mode":["1P 2M 3M 4P 5P 6m 7m",["hindu","mixolydian b6M"]],"locrian #2":["1P 2M 3m 4P 5d 6m 7m"],"locrian major":["1P 2M 3M 4P 5d 6m 7m",["arabian"]],"major pentatonic":["1P 2M 3M 5P 6M",["pentatonic"]],"lydian pentatonic":["1P 3M 4A 5P 7M",["chinese"]],"mixolydian pentatonic":["1P 3M 4P 5P 7m",["indian"]],"locrian pentatonic":["1P 3m 4P 5d 7m",["minor seven flat five pentatonic"]],"minor pentatonic":["1P 3m 4P 5P 7m"],"minor six pentatonic":["1P 3m 4P 5P 6M"],"minor hexatonic":["1P 2M 3m 4P 5P 7M"],"flat three pentatonic":["1P 2M 3m 5P 6M",["kumoi"]],"flat six pentatonic":["1P 2M 3M 5P 6m"],"major flat two pentatonic":["1P 2m 3M 5P 6M"],"whole tone pentatonic":["1P 3M 5d 6m 7m"],"ionian pentatonic":["1P 3M 4P 5P 7M"],"lydian #5P pentatonic":["1P 3M 4A 5A 7M"],"lydian dominant pentatonic":["1P 3M 4A 5P 7m"],"minor #7M pentatonic":["1P 3m 4P 5P 7M"],"super locrian pentatonic":["1P 3m 4d 5d 7m"],"in-sen":["1P 2m 4P 5P 7m"],"vietnamese 1":["1P 3m 4P 5P 6m"],"vietnamese 2":["1P 3m 4P 5P 7m"],"prometheus neopolitan":["1P 2m 3M 4A 6M 7m"],"major blues":["1P 2M 3m 3M 5P 6M"],"minor blues":["1P 3m 4P 5d 5P 7m",["blues"]],"composite blues":["1P 2M 3m 3M 4P 5d 5P 6M 7m"],"augmented heptatonic":["1P 2A 3M 4P 5P 5A 7M"],"dorian #4":["1P 2M 3m 4A 5P 6M 7m"],"lydian diminished":["1P 2M 3m 4A 5P 6M 7M"],"whole tone":["1P 2M 3M 4A 5A 7m"],"leading whole tone":["1P 2M 3M 4A 5A 7m 7M"],"harmonic minor":["1P 2M 3m 4P 5P 6m 7M"],"lydian minor":["1P 2M 3M 4A 5P 6m 7m"],"neopolitan minor":["1P 2m 3m 4P 5P 6m 7M"],"neopolitan major":["1P 2m 3m 4P 5P 6M 7M",["dorian b2"]],"neopolitan major pentatonic":["1P 3M 4P 5d 7m"],"romanian minor":["1P 2M 3m 5d 5P 6M 7m"],"double harmonic lydian":["1P 2m 3M 4A 5P 6m 7M"],"harmonic major":["1P 2M 3M 4P 5P 6m 7M"],"double harmonic major":["1P 2m 3M 4P 5P 6m 7M",["gypsy"]],"hungarian minor":["1P 2M 3m 4A 5P 6m 7M"],"hungarian major":["1P 2A 3M 4A 5P 6M 7m"],"spanish heptatonic":["1P 2m 3m 3M 4P 5P 6m 7m"],"todi raga":["1P 2m 3m 4A 5P 6m 7M"],"malkos raga":["1P 3m 4P 6m 7m"],"kafi raga":["1P 3m 3M 4P 5P 6M 7m 7M"],"purvi raga":["1P 2m 3M 4P 4A 5P 6m 7M"],"bebop dominant":["1P 2M 3M 4P 5P 6M 7m 7M"],"bebop minor":["1P 2M 3m 3M 4P 5P 6M 7m"],"bebop major":["1P 2M 3M 4P 5P 5A 6M 7M"],"bebop locrian":["1P 2m 3m 4P 5d 5P 6m 7m"],"minor bebop":["1P 2M 3m 4P 5P 6m 7m 7M"],"mystery #1":["1P 2m 3M 5d 6m 7m"],"minor six diminished":["1P 2M 3m 4P 5P 6m 6M 7M"],"ionian augmented":["1P 2M 3M 4P 5A 6M 7M"],"lydian #9":["1P 2m 3M 4A 5P 6M 7M"],"six tone symmetric":["1P 2m 3M 4P 5A 6M"]},Zn={M:["1P 3M 5P",["Major",""]],M13:["1P 3M 5P 7M 9M 13M",["maj13","Maj13"]],M6:["1P 3M 5P 13M",["6"]],M69:["1P 3M 5P 6M 9M",["69"]],M7add13:["1P 3M 5P 6M 7M 9M"],M7b5:["1P 3M 5d 7M"],M7b6:["1P 3M 6m 7M"],M7b9:["1P 3M 5P 7M 9m"],M7sus4:["1P 4P 5P 7M"],M9:["1P 3M 5P 7M 9M",["maj9","Maj9"]],M9b5:["1P 3M 5d 7M 9M"],M9sus4:["1P 4P 5P 7M 9M"],Madd9:["1P 3M 5P 9M",["2","add9","add2"]],Maj7:["1P 3M 5P 7M",["maj7","M7"]],Mb5:["1P 3M 5d"],Mb6:["1P 3M 13m"],Msus2:["1P 2M 5P",["add9no3","sus2"]],Msus4:["1P 4P 5P",["sus","sus4"]],Maddb9:["1P 3M 5P 9m"],m:["1P 3m 5P"],m11:["1P 3m 5P 7m 9M 11P",["_11"]],m11b5:["1P 3m 7m 12d 2M 4P",["h11","_11b5"]],m13:["1P 3m 5P 7m 9M 11P 13M",["_13"]],m6:["1P 3m 4P 5P 13M",["_6"]],m69:["1P 3m 5P 6M 9M",["_69"]],m7:["1P 3m 5P 7m",["minor7","_","_7"]],m7add11:["1P 3m 5P 7m 11P",["m7add4"]],m7b5:["1P 3m 5d 7m",["half-diminished","h7","_7b5"]],m9:["1P 3m 5P 7m 9M",["_9"]],m9b5:["1P 3m 7m 12d 2M",["h9","-9b5"]],mMaj7:["1P 3m 5P 7M",["mM7","_M7"]],mMaj7b6:["1P 3m 5P 6m 7M",["mM7b6"]],mM9:["1P 3m 5P 7M 9M",["mMaj9","-M9"]],mM9b6:["1P 3m 5P 6m 7M 9M",["mMaj9b6"]],mb6M7:["1P 3m 6m 7M"],mb6b9:["1P 3m 6m 9m"],o:["1P 3m 5d",["mb5","dim"]],o7:["1P 3m 5d 13M",["diminished","m6b5","dim7"]],o7M7:["1P 3m 5d 6M 7M"],oM7:["1P 3m 5d 7M"],sus24:["1P 2M 4P 5P",["sus4add9"]],madd4:["1P 3m 4P 5P"],madd9:["1P 3m 5P 9M"],4:["1P 4P 7m 10m",["quartal"]],5:["1P 5P"],7:["1P 3M 5P 7m",["Dominant","Dom"]],9:["1P 3M 5P 7m 9M",["79"]],11:["1P 5P 7m 9M 11P"],13:["1P 3M 5P 7m 9M 13M",["13_"]],64:["5P 8P 10M"],"M#5":["1P 3M 5A",["augmented","maj#5","Maj#5","+","aug"]],"M#5add9":["1P 3M 5A 9M",["+add9"]],"M13#11":["1P 3M 5P 7M 9M 11A 13M",["maj13#11","Maj13#11","M13+4","M13#4"]],"M6#11":["1P 3M 5P 6M 11A",["M6b5","6#11","6b5"]],"M69#11":["1P 3M 5P 6M 9M 11A"],"M7#11":["1P 3M 5P 7M 11A",["maj7#11","Maj7#11","M7+4","M7#4"]],"M7#5":["1P 3M 5A 7M",["maj7#5","Maj7#5","maj9#5","M7+"]],"M7#5sus4":["1P 4P 5A 7M"],"M7#9#11":["1P 3M 5P 7M 9A 11A"],"M9#11":["1P 3M 5P 7M 9M 11A",["maj9#11","Maj9#11","M9+4","M9#4"]],"M9#5":["1P 3M 5A 7M 9M",["Maj9#5"]],"M9#5sus4":["1P 4P 5A 7M 9M"],"11b9":["1P 5P 7m 9m 11P"],"13#11":["1P 3M 5P 7m 9M 11A 13M",["13+4","13#4"]],"13#9":["1P 3M 5P 7m 9A 13M",["13#9_"]],"13#9#11":["1P 3M 5P 7m 9A 11A 13M"],"13b5":["1P 3M 5d 6M 7m 9M"],"13b9":["1P 3M 5P 7m 9m 13M"],"13b9#11":["1P 3M 5P 7m 9m 11A 13M"],"13no5":["1P 3M 7m 9M 13M"],"13sus4":["1P 4P 5P 7m 9M 13M",["13sus"]],"69#11":["1P 3M 5P 6M 9M 11A"],"7#11":["1P 3M 5P 7m 11A",["7+4","7#4","7#11_","7#4_"]],"7#11b13":["1P 3M 5P 7m 11A 13m",["7b5b13"]],"7#5":["1P 3M 5A 7m",["+7","7aug","aug7"]],"7#5#9":["1P 3M 5A 7m 9A",["7alt","7#5#9_","7#9b13_"]],"7#5b9":["1P 3M 5A 7m 9m"],"7#5b9#11":["1P 3M 5A 7m 9m 11A"],"7#5sus4":["1P 4P 5A 7m"],"7#9":["1P 3M 5P 7m 9A",["7#9_"]],"7#9#11":["1P 3M 5P 7m 9A 11A",["7b5#9"]],"7#9#11b13":["1P 3M 5P 7m 9A 11A 13m"],"7#9b13":["1P 3M 5P 7m 9A 13m"],"7add6":["1P 3M 5P 7m 13M",["67","7add13"]],"7b13":["1P 3M 7m 13m"],"7b5":["1P 3M 5d 7m"],"7b6":["1P 3M 5P 6m 7m"],"7b9":["1P 3M 5P 7m 9m"],"7b9#11":["1P 3M 5P 7m 9m 11A",["7b5b9"]],"7b9#9":["1P 3M 5P 7m 9m 9A"],"7b9b13":["1P 3M 5P 7m 9m 13m"],"7b9b13#11":["1P 3M 5P 7m 9m 11A 13m",["7b9#11b13","7b5b9b13"]],"7no5":["1P 3M 7m"],"7sus4":["1P 4P 5P 7m",["7sus"]],"7sus4b9":["1P 4P 5P 7m 9m",["susb9","7susb9","7b9sus","7b9sus4","phryg"]],"7sus4b9b13":["1P 4P 5P 7m 9m 13m",["7b9b13sus4"]],"9#11":["1P 3M 5P 7m 9M 11A",["9+4","9#4","9#11_","9#4_"]],"9#11b13":["1P 3M 5P 7m 9M 11A 13m",["9b5b13"]],"9#5":["1P 3M 5A 7m 9M",["9+"]],"9#5#11":["1P 3M 5A 7m 9M 11A"],"9b13":["1P 3M 7m 9M 13m"],"9b5":["1P 3M 5d 7m 9M"],"9no5":["1P 3M 7m 9M"],"9sus4":["1P 4P 5P 7m 9M",["9sus"]],"m#5":["1P 3m 5A",["m+","mb6"]],"m11A 5":["1P 3m 6m 7m 9M 11P"],"m7#5":["1P 3m 6m 7m"],"m9#5":["1P 3m 6m 7m 9M"],"+add#9":["1P 3M 5A 9A"]},nt=function(n){return X(n)||Sn(n)||0},tt=function(n){return parseInt(A(n),2)},rt=function(n){return n.replace(/0/g,"").length},et=null,mt=/^[01]{12}$/,it="1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M".split(" "),ut=Object.freeze({chroma:A,chromas:g,modes:j,isChroma:y,intervals:O,isEqual:x,isSubsetOf:_,isSupersetOf:z,includes:q,filter:k}),ot=function(n){var t=Object.keys(n).sort(),r=[],e=[],m=function(n,t,m){r[n]=t,e[m]=e[m]||[],e[m].push(n);};t.forEach(function(t){var r=n[t][0].split(" "),e=n[t][1],i=A(r);m(t,r,i),e&&e.forEach(function(n){return m(n,r,i)});});var i=Object.keys(r).sort(),u=function(n){return r[n]};return u.names=function(n){return "string"==typeof n?(e[n]||[]).slice():(!0===n?i:t).slice()},u},Pt=function(n,t){var r=function(r){return n(r)||t(r)};return r.names=function(r){return n.names(r).concat(t.names(r))},r},Mt=ot(Yn),at=ot(Zn),lt=Pt(Mt,at),ct=Object.freeze({dictionary:ot,combine:Pt,scale:Mt,chord:at,pcset:lt}),st=Object.freeze({name:null,intervals:[],names:[],chroma:null,setnum:null}),ft=function(n,t){return function(r){return t[r]||(t[r]=n(r))}}(function(n){var t=Mt(n);if(!t)return st;var r={intervals:t,name:n};return r.chroma=A(t),r.setnum=parseInt(r.chroma,2),r.names=Mt.names(r.chroma),Object.freeze(r)},{}),dt=Mt.names,pt=function(n){var t=D(n);return ft(t[1]).intervals},bt=function(n){var t=pt(n),r=S(n);return j(t).map(function(n,e){var m=Mt.names(n)[0];if(m)return [r[e]||t[e],m]}).filter(function(n){return n})},ht=function(n){var t=_(pt(n));return at.names().filter(function(n){return t(at(n))})},vt=function(n){var t=Mn(n.map(U));if(!t.length)return t;var r=t[0],e=P(t);return u(e.indexOf(r),e)},At=function(n){if(!pt(n).length)return [];var t=z(pt(n));return Mt.names().filter(function(n){return t(Mt(n))})},gt=function(n){var t=_(pt(n));return Mt.names().filter(function(n){return t(Mt(n))})},jt=Object.freeze({props:ft,names:dt,intervals:pt,notes:S,exists:w,tokenize:D,modeNames:bt,chords:ht,toScale:vt,supersets:At,subsets:gt}),yt=at.names,Ot=Object.freeze({name:null,names:[],intervals:[],chroma:null,setnum:null}),xt=function(n,t){return void 0===t&&(t={}),function(r){return t[r]||(t[r]=n(r))}}(function(n){var t=at(n);if(!t)return Ot;var r={intervals:t,name:n};return r.chroma=A(t),r.setnum=parseInt(r.chroma,2),r.names=at.names(r.chroma),r}),_t=function(n){return xt(C(n)[1]).intervals},zt=function(n){return void 0!==at(C(n)[1])},qt=function(n){if(!_t(n).length)return [];var t=z(_t(n));return at.names().filter(function(n){return t(at(n))})},kt=function(n){var t=_(_t(n));return at.names().filter(function(n){return t(at(n))})},St=/^(6|64|7|9|11|13)$/,wt=Object.freeze({names:yt,props:xt,intervals:_t,notes:E,exists:zt,supersets:qt,subsets:kt,tokenize:C}),Dt=l,Et=h,Ct=L,$t=H,Ft=K,Gt=at,It=Mt;n.Array=sn,n.Note=Pn,n.Interval=In,n.Distance=Xn,n.Scale=jt,n.Chord=wt,n.PcSet=ut,n.Dictionary=ct,n.transpose=Dt,n.interval=Et,n.note=Ct,n.midi=$t,n.freq=Ft,n.chord=Gt,n.scale=It,Object.defineProperty(n,"__esModule",{value:!0});})(tonal$1);

// @ts-ignore
function normalizeChordForTonal(chord = '') {
    return chord
        .replace(/-/g, '_') // tonal uses _ over - for minor7
        .replace(/minor|min/g, 'm'); // tonal is surprisingly bad at identifying minor chords??
}
function getAnchorChord(anchor, songIterator, currentTime) {
    let anchorChord = '';
    switch (anchor) {
        case 'KEY': {
            anchorChord = songIterator.song.getTransposedKey();
            break;
        }
        case 'NEXT': {
            const nextMeasure = songIterator.getRelative(1);
            if (nextMeasure) {
                anchorChord = nextMeasure.beats[0].chord;
            }
            else {
                anchorChord = songIterator.song.getTransposedKey();
            }
            break;
        }
        case 'STEP':
        case 'ARPEGGIATE': /* {
          let prev = songIterator.getRelative(0)[0]; //???
          if(!this.parentMeasure) console.log('tttttttt', this);
          let next = this.parentMeasure.getNextStaticBeatRoot(
            this.indexInMeasure,
            songIterator
          );
        } */
        default: {
            // crawl backward through this measure to get the last set beat
            let lastSetBeat = Math.floor(currentTime);
            const iteratorMeasure = songIterator.getRelative(0);
            if (!iteratorMeasure)
                break;
            do {
                const beat = iteratorMeasure.beats[lastSetBeat];
                anchorChord = beat && beat.chord;
                lastSetBeat--;
            } while (!anchorChord);
            break;
        }
    }
    return normalizeChordForTonal(anchorChord);
}
function anchorChordToRoot(anchorChord, degree, octave) {
    const anchorTonic = tonal$1.Chord.tokenize(anchorChord)[0];
    const anchorScaleName = chordToScaleName(anchorChord);
    const scalePCs = tonal$1.Scale.notes(anchorTonic, anchorScaleName);
    const rootPC = scalePCs[degree - 1];
    return tonal$1.Note.from({ oct: octave }, rootPC);
}
function chordToScaleName(chord) {
    const chordType = tonal$1.Chord.tokenize(chord)[1];
    // @TODO: make this more robust
    const names = tonal$1.Chord.props(chordType).names;
    if (names.includes('dim'))
        return 'diminished';
    if (names.includes('aug'))
        return 'augmented';
    if (names.includes('Major'))
        return 'major';
    if (names.includes('minor'))
        return 'minor';
    if (names.includes('minor7'))
        return 'dorian';
    if (names.includes('Dominant'))
        return 'mixolydian';
    // if none of the above match, do our best to find the closest fit
    let closestScale = 'major';
    names.forEach(name => {
        if (name.startsWith('dim'))
            closestScale = 'diminished';
        if (name.startsWith('aug'))
            closestScale = 'augmented';
        if (name.startsWith('M'))
            closestScale = 'major';
        if (name.startsWith('m'))
            closestScale = 'minor';
    });
    return closestScale;
}

const anchorReverseMap = { 'KEY': 'k', 'NEXT': 'n', 'STEP': 's', 'ARPEGGIATE': 'a' };
class PlaybackAnchorValue {
    constructor(value) {
        this.type = 'anchor';
        this.value = value;
    }
    toBoolean() { return true; }
    toOutputString() { return anchorReverseMap[this.value]; }
}
class PlaybackBeatValue {
    constructor() {
        this.type = null;
    }
    toBoolean() { return true; }
}
class PlaybackMelodicBeatValue extends PlaybackBeatValue {
    constructor(time = { time: 'auto' }, pitch, octave = 'inherit') {
        super();
        this.type = 'melodic_beat';
        this.value = {
            time: null,
            pitch: null,
            octave: null,
        };
        this.value.time = time;
        this.value.pitch = pitch;
        this.value.octave = octave;
    }
    toOutputString() {
        const timeFlag = this.time.flag ? (this.time.flag === 'ACCENTED' ? 'a' : 's') : '';
        const timePart = `${this.time.time === 'auto' ? '' : this.time.time}${timeFlag}`;
        const pitchAnchor = this.pitch.anchor ? anchorReverseMap[this.pitch.anchor] : '';
        const pitchRoll = this.pitch.roll ? (this.pitch.roll === 'ROLL_UP' ? 'r' : 'rd') : '';
        const pitchPart = `:${pitchAnchor}${this.pitch.degree || ''}${this.pitch.chord ? 'c' : ''}${pitchRoll}`;
        const octavePart = this.octave === 'inherit' ? '' : `:${this.octave}`;
        return `${timePart}${pitchPart}${octavePart}`;
    }
    get time() { return this.value.time; }
    get pitch() { return this.value.pitch; }
    get octave() { return this.value.octave; }
}
class PlaybackDrumBeatValue extends PlaybackBeatValue {
    constructor(time, accented = false) {
        super();
        this.type = 'drum_beat';
        this.value = {
            time: null,
            accented: null,
        };
        this.value.time = time;
        this.value.accented = accented;
    }
    toOutputString() {
        return `${this.time}${this.accented ? 'a' : ''}`;
    }
    get time() { return this.value.time; }
    get accented() { return this.value.accented; }
}

class PlaybackNilValue {
    constructor() {
        this.type = 'Nil';
        this.value = null;
    }
    toBoolean() { return false; }
    toOutputString() { return 'Nil'; }
}
class PlaybackStringValue {
    constructor(value) {
        this.type = 'string';
        this.value = value;
    }
    toBoolean() { return this.value !== ''; }
    toOutputString() {
        // @TODO: store raw value from tokenizer? (which may not always exist for programmatically-generated strings)
        // At least this is consistent...
        return `"${this.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
}
class PlaybackNumberValue {
    constructor(value) {
        this.type = 'number';
        this.value = value;
    }
    toInteger() { return Math.floor(this.value); }
    toBoolean() { return this.value !== 0; }
    toOutputString() { return this.value.toString(); }
}
class PlaybackBooleanValue {
    constructor(value) {
        this.type = 'boolean';
        this.value = value;
    }
    toBoolean() { return this.value; }
    toOutputString() { return this.value ? 'true' : 'false'; }
}
class PlaybackTimeSignatureValue {
    constructor(value) {
        this.type = 'time_signature';
        this.value = value;
    }
    toBoolean() { return true; }
    toOutputString() { return `${this.value[0]} / ${this.value[1]}`; }
}

// @ts-ignore
const definitions = new Map();
/**
 * Make an assertion about argument count and types.
 * @param {string} identifier The function name.
 * @param {Array} args The arguments passed to the function.
 * @param {Array.<string|Function>} types Array of the types (typeof) or classes
 * (instanceof) to expect.
 * @param {Scope} scope The scope, for error logging.
 */
function assertArgTypes(identifier, args, types, scope) {
    if (types === '*')
        return;
    if (args.length !== types.length) {
        throw new FunctionArgumentsError(`"${identifier}" requires ${types.length} arguments.`, args, scope);
    }
    for (const i in args) {
        if (types[i] === '*')
            continue;
        const arg = args[i];
        if (arg instanceof FunctionCall) {
            if (arg.returns === '*') {
                continue; // what's the correct functionality here? cry?
            }
            else {
                if (arg.returns !== types[i]) {
                    throw new FunctionArgumentsError(`Argument ${Number(i) + 1} of "${identifier}" must be a ${types[i]}.`, args, scope);
                }
            }
        }
        else {
            if (arg.type !== types[i]) {
                throw new FunctionArgumentsError(`Argument ${Number(i) + 1} of "${identifier}" must be a ${types[i]}.`, args, scope);
            }
        }
    }
}
/**
 * Make an assertion about the scope in which the function is called.
 * @param {string} identifier The function's name.
 * @param {string='no-meta'} goalscope One of 4 string options:
 * - 'meta': the function throws if it's called outside a @meta block.
 * - 'options': the function throws if it's called outside an @options block.
 * - 'no-config': the function throws if it's called inside a @meta or @options
 *   block, but runs anywhere else that the parser will let you call a function.
 * - 'pattern': the function throws if called outside a pattern scope.
 * - 'no-meta' (default): the function throws if it's called inside a @meta
 *   block, but runs anywhere else that the parser will let you call a function.
 * @param {Scope} scope The calling scope.
 */
function assertScope(identifier, goalscope = 'no-meta', scope) {
    if (goalscope === 'meta') {
        if (scope.type !== '@meta') {
            throw new FunctionScopeError(`Function "${identifier}" must only be called within a @meta block."`, scope);
        }
    }
    else if (goalscope === 'options') {
        if (scope.type !== '@options') {
            throw new FunctionScopeError(`Function "${identifier}" must only be called within an @options block."`, scope);
        }
    }
    else if (goalscope === 'no-config') {
        // ensure that config blocks can be resolved at compile time
        if (scope.type === '@meta' || scope.type === '@options') {
            throw new FunctionScopeError(`Function "${identifier}" must not be called within a @meta or @options block."`, scope);
        }
    }
    else if (goalscope === 'pattern') {
        if (scope.type !== 'PatternExpressionGroup') {
            throw new FunctionScopeError(`Function "${identifier}" must only be called within a @pattern block."`, scope);
        }
        // @TODO: what about @pattern foo private() -- makes no sense but yea
    }
    else if (goalscope === 'no-meta') {
        if (scope.type === '@meta') {
            throw new FunctionScopeError(`Function "${identifier}" must not be called within a @meta block."`, scope);
        }
    }
}
/**
 * Define a function.
 * @param {string} identifier The name of the function.
 * @param {Object} opts Options passed. See below.
 * @param {Array.<string|Function>|string='*'} opts.types If set, throw error
 * unless the arguments passed to the function map to these. Can be strings
 * (typeof) or classes (instanceof), or the single string '*' to accept
 * anything. See assertArgTypes above.
 * @param {string='no-meta'} opts.scope Throw error unless the calling
 * scope matches. See assertScope above.
 * @param {string|Function|Nil='*'} opts.returns The return type. If set to '*'
 * it may return anything (for example, choose() returns one of whatever's
 * passed to it regardless of type).
 * @param {Function} func The function to run. It's passed 3 arguments:
 * - args: an array of the arguments passed in the Playback function call.
 * - scope: the calling scope. So it can set in scope.vars.
 * - argErr: a function. If the function does further testing on its
 *   arguments and there's an issue, pass this the error message and it throws.
 */
const define$1 = function (identifier, opts, func) {
    const definition = {
        types: opts.types || '*',
        returns: opts.returns || '*',
        scope: opts.scope || 'no-meta',
        execute: (args, songIterator, scope) => {
            const argErr = (message) => {
                throw new FunctionArgumentsError(message, args, scope);
            };
            return func(args, songIterator, scope, argErr);
        }
    };
    definitions.set(identifier, definition);
};
/**
 * Quickly define a single-argument function that simply sets a var of the same
 * name in its parent scope.
 * @param {string} identifier The name of the function.
 * @param {string|Function} type Throw unless the argument is of this type (see
 * assertArgTypes above).
 * @param {?string=null} goalscope Throw error unless the calling scope matches.
 * See assertScope above.
 */
const defineVar = function (identifier, type, goalscope = 'no-meta') {
    const opts = {
        types: [type],
        scope: goalscope,
        returns: 'Nil'
    };
    define$1(identifier, opts, (args, songIterator, scope, argErr) => {
        scope.vars.set(identifier, args[0]);
        return new PlaybackNilValue();
    });
};
/**
 * Quickly define a function that sets a a var of the same name in its parent
 * scope. If it has 0 args it sets the var to true, if it has 1 boolean arg
 * it sets the var to that.
 * @param {string} identifier The name of the function.
 * @param {?string=null} goalscope Throw error unless the calling scope matches.
 * See assertScope above.
 */
const defineBoolean = function (identifier, goalscope = 'no-meta') {
    const opts = {
        types: '*',
        scope: goalscope,
        returns: 'Nil'
    };
    define$1(identifier, opts, (args, songIterator, scope, argErr) => {
        if (args.length) {
            assertArgTypes(identifier, args, ['boolean'], scope);
            scope.vars.set(identifier, args[0]);
        }
        else {
            scope.vars.set(identifier, new PlaybackBooleanValue(true));
        }
        return new PlaybackNilValue;
    });
};
/*********** ACTUAL FUNCTION DEFINITIONS ***********/
/*** @meta functions ***/
defineVar('name', 'string', 'meta');
defineVar('author', 'string', 'meta');
defineVar('description', 'string', 'meta');
defineVar('playback-version', 'number', 'meta');
/*** @options functions ***/
define$1('time-signature', {
    types: ['number', 'number'],
    scope: 'options',
    returns: 'Nil'
}, (args, songIterator, scope, argErr) => {
    const value1 = args[0].value;
    const value2 = args[1].value;
    if (!Number.isInteger(Math.log2(value1))) {
        argErr(`Argument 2 of "time-signature" must be a power of 2`);
    }
    scope.vars.set('time-signature', new PlaybackTimeSignatureValue([value1, value2]));
    return new PlaybackNilValue();
});
defineBoolean('swing', 'options');
/*** anywhere but @meta functions ***/
define$1('volume', {
    types: ['number'],
    scope: 'no-meta',
    returns: 'Nil'
}, (args, songIterator, scope, argErr) => {
    const { value } = args[0];
    if (value < 0 || value > 1) {
        argErr(`Argument 1 of "volume" must be in range 0-1 (inclusive)`);
    }
    scope.vars.set('volume', args[0]);
    return new PlaybackNilValue();
});
defineBoolean('invertible', 'no-meta');
define$1('octave', {
    types: ['number'],
    scope: 'no-meta',
    returns: 'Nil'
}, (args, songIterator, scope, argErr) => {
    const { value } = args[0];
    if (!Number.isInteger(value) || value < 0 || value > 9) {
        argErr(`Argument 1 of "octave" must be an integer 0-9`);
    }
    scope.vars.set('octave', args[0]);
    return new PlaybackNilValue();
});
/*** anywhere but config functions (strictly dynamic functions) ***/
define$1('choose', {
    types: '*',
    scope: 'no-config',
    returns: '*'
}, (args, songIterator, scope, argErr) => {
    const nonNilArgs = args.filter(arg => arg.type !== 'Nil');
    if (nonNilArgs.length) {
        const index = Math.floor(Math.random() * nonNilArgs.length);
        return nonNilArgs[index];
    }
    else {
        return new PlaybackNilValue();
    }
});
const anchorOrNumberToChordAndRoot = function (arg, songIterator) {
    let anchorChord, root;
    if (arg.type === 'number') {
        anchorChord = getAnchorChord(null, songIterator, 1);
        root = anchorChordToRoot(anchorChord, arg.value, 4);
    }
    else {
        anchorChord = getAnchorChord(arg.value, songIterator, 1);
        root = anchorChordToRoot(anchorChord, 1, 4);
    }
    return [anchorChord, root];
};
define$1('progression', {
    types: '*',
    scope: 'no-config',
    returns: 'boolean'
}, (args, songIterator, scope, argErr) => {
    for (const i in args) {
        if (args[0].type !== 'number' && args[0].type !== 'anchor') {
            argErr(`Arguments of "progression" must be numbers or anchors`);
        }
        const [, goal] = anchorOrNumberToChordAndRoot(args[0], songIterator);
        const actualMeasure = songIterator.getRelative(Number(i));
        if (!actualMeasure)
            return new PlaybackBooleanValue(false);
        const actualChord = normalizeChordForTonal(actualMeasure.beats[0].chord);
        const actual = anchorChordToRoot(actualChord, 1, 4);
        if (actual !== goal)
            return new PlaybackBooleanValue(false);
    }
    return new PlaybackBooleanValue(true);
});
define$1('in-scale', {
    types: '*',
    scope: 'no-config',
    returns: 'boolean'
}, (args, songIterator, scope, argErr) => {
    if ((args[0].type !== 'number' && args[0].type !== 'anchor')
        || args[1].type !== 'number' && args[1].type !== 'anchor') {
        argErr(`Arguments of "in-scale" must be numbers or anchors`);
    }
    const [, note] = anchorOrNumberToChordAndRoot(args[0], songIterator);
    const [goalChord, goalTonic] = anchorOrNumberToChordAndRoot(args[1], songIterator);
    const goalScaleName = chordToScaleName(goalChord);
    const goalScale = tonal$1.Scale.notes(goalTonic, goalScaleName);
    return new PlaybackBooleanValue(goalScale.includes(note));
});
define$1('beat-defined', {
    types: ['number'],
    scope: 'no-config',
    returns: 'boolean'
}, (args, songIterator, scope, argErr) => {
    const measure = songIterator.getRelative(0);
    if (!measure)
        return new PlaybackBooleanValue(false);
    const index = args[0].value;
    return new PlaybackBooleanValue(measure.beats[index].chord !== null);
});
/*** pattern-only functions ***/
defineBoolean('private', 'pattern');
defineVar('length', 'number', 'pattern');
define$1('chance', {
    types: ['number'],
    scope: 'pattern',
    returns: 'Nil'
}, (args, songIterator, scope, argErr) => {
    if (args[0].value < 0 || args[0].value > 1) {
        argErr(`Argument 1 of "chance" must be in range 0-1 (inclusive)`);
    }
    scope.vars.set('chance', args[0]);
    return new PlaybackNilValue();
});

/**
 * If the value is a FunctionCall, call it and return the returned value.
 * Otherwise, return the value itself.
 * @private
 */ // @TODO: if this is needed elsewhere, put it somewhere useful.
class FunctionCall extends ASTNodeBase {
    /**
     * @constructor
     * @param {string} identifier The name of the function. Ideally it should
     * match the name of one of the functions in function_data.js
     */
    constructor(identifier, args) {
        super();
        this.identifier = identifier;
        this.definition = definitions.get(identifier);
        this.args = args;
    }
    init(scope) {
        super.init(scope);
        if (!this.definition) {
            throw new FunctionNameError(this.identifier, this.scope);
        }
        this.returns = this.definition.returns;
        assertScope(this.identifier, this.definition.scope, this.scope);
        this.args.forEach(arg => {
            if (arg.init)
                arg.init(scope);
        });
        assertArgTypes(this.identifier, this.args, this.definition.types, this.scope);
    }
    link(ASTs, parentStyle, parentTrack) {
        this.args.forEach(arg => {
            if (arg.link)
                arg.link(ASTs, parentStyle, parentTrack);
        });
    }
    execute(songIterator) {
        if (!this.scope)
            throw new Error('function not initialized :(');
        const evaluatedArgs = this.args.map(arg => {
            if (arg.execute) {
                return arg.execute(songIterator);
            }
            else {
                return arg;
            }
        });
        const returnValue = this.definition.execute(evaluatedArgs, songIterator, // functions will know if they don't need songIterator...
        this.scope);
        if (returnValue === undefined) {
            throw new Error(`Function "${this.identifier}" can return undefined`);
        }
        return returnValue;
    }
}

class PatternExpressionGroup extends Scope {
    constructor(expressions) {
        super();
        this.type = 'PatternExpressionGroup';
        this.name = '@pattern(<anonymous>)';
        this.defaultVars.set('private', new PlaybackBooleanValue(false));
        this.defaultVars.set('chance', new PlaybackNumberValue(1));
        this.expressions = expressions;
        this.functionCalls = [];
        this.nonFunctionCallExpressions = [];
    }
    init(scope, patternStatement) {
        super.init(scope);
        this.patternStatement = patternStatement;
        if (this.patternStatement) {
            this.name = `@pattern(${this.patternStatement})`;
        }
        this.expressions.forEach(expression => {
            if (expression.init) {
                expression.init(this);
            }
            else {
                throw ['expression not initialized:', expression];
            }
            if (expression instanceof FunctionCall) {
                this.functionCalls.push(expression);
            }
            else {
                this.nonFunctionCallExpressions.push(expression);
            }
        });
    }
    link(ASTs, parentStyle, parentTrack) {
        this.expressions.forEach(expression => {
            expression.link(ASTs, parentStyle, parentTrack);
        });
    }
    execute(songIterator, callerIsTrack = false) {
        this.inherit();
        let beats = null;
        for (const functionCall of this.functionCalls) {
            const returnValue = functionCall.execute(songIterator);
            if (returnValue instanceof NoteSet) {
                if (beats) {
                    throw new TooManyBeatsError(this);
                }
                beats = returnValue;
            }
        }
        if (callerIsTrack && this.vars.get('private').value === true) {
            return null; // if it's private we can give up now
        }
        for (let expression of this.nonFunctionCallExpressions) {
            if (expression.execute) {
                expression = expression.execute(songIterator);
            }
            if (expression instanceof NoteSet) {
                if (beats) {
                    throw new TooManyBeatsError(this);
                }
                beats = expression;
            }
        }
        return beats;
    }
}
class PatternStatement extends PatternExpressionGroup {
    constructor(opts) {
        if (opts.expression instanceof PatternExpressionGroup) {
            // unroll the redundant expression group
            super(opts.expression.expressions);
        }
        else {
            super([opts.expression]);
        }
        this.identifier = opts.identifier;
        this.condition = (opts.condition !== undefined) ? opts.condition : null;
    }
    getChance() {
        return this.vars.get('chance').value;
    }
    link(ASTs, parentStyle, parentTrack) {
        super.link(ASTs, parentStyle, parentTrack);
        if (this.condition && this.condition.link) {
            this.condition.link(ASTs, parentStyle, parentTrack);
        }
    }
    init(scope) {
        super.init(scope);
        if (this.condition && this.condition.init)
            this.condition.init(this);
    }
    execute(songIterator, callerIsTrack = false) {
        if (this.condition) {
            let conditionValue;
            if (this.condition.execute) {
                conditionValue = this.condition.execute(songIterator);
            }
            else {
                conditionValue = this.condition;
            }
            if (conditionValue.toBoolean() === false)
                return null;
        }
        return super.execute(songIterator, callerIsTrack);
    }
}
class PatternCall extends ASTNodeBase {
    constructor(opts) {
        super();
        this.import = opts.import || null;
        this.track = opts.track || null;
        this.pattern = opts.pattern;
        this.name = (this.import || 'this') + '.' +
            (this.track || 'this') + '.' +
            this.pattern;
    }
    getChance() {
        return this.patternStatement.getChance();
    }
    init(scope) {
        super.init(scope);
    }
    link(ASTs, parentStyle, parentTrack) {
        let ast;
        if (!this.import) {
            ast = parentStyle;
        }
        else {
            // get path name of style
            const importPath = parentStyle.importedStyles.get(this.import);
            ast = ASTs.get(importPath);
            if (!ast)
                throw new NoSuchStyleError(this.import, this);
        }
        let track;
        if (!this.track) {
            track = parentTrack;
        }
        else {
            track = ast.tracks.get(this.track);
            if (!track)
                throw new NoSuchTrackError(this.import || 'this', this.track || 'this', this);
        }
        const patternStatement = track.patterns.get(this.pattern);
        if (!patternStatement)
            throw new NoSuchPatternError(this.import || 'this', this.track || 'this', this.pattern, this);
        this.patternStatement = patternStatement;
    }
    execute(songIterator) {
        // called patternStatement ignores private()
        return this.patternStatement.execute(songIterator);
    }
}
class JoinedPatternExpression extends ASTNodeBase {
    constructor(patterns) {
        super();
        this.patterns = patterns;
    }
    init(scope) {
        super.init(scope);
        this.patterns.forEach(pattern => {
            if (pattern.init)
                pattern.init(scope);
        });
    }
    link(ASTs, parentStyle, parentTrack) {
        this.patterns.forEach(pattern => {
            pattern.link(ASTs, parentStyle, parentTrack);
        });
    }
    execute(songIterator) {
        const noteSets = [];
        for (let pattern of this.patterns) {
            if (pattern.execute) {
                pattern = pattern.execute(songIterator);
            }
            if (pattern instanceof NoteSet) {
                noteSets.push(pattern);
            }
        }
        if (noteSets.length) {
            return (new NoteSet()).concat(...noteSets);
        }
        else {
            return null;
        }
    }
}

class TrackStatement extends Scope {
    constructor(opts) {
        super();
        this.name = opts.identifier;
        this.type = '@track';
        this.defaultVars.set('octave', new PlaybackNumberValue(4));
        this.defaultVars.set('volume', new PlaybackNumberValue(1));
        this.defaultVars.set('private', new PlaybackBooleanValue(false));
        this.instrument = opts.instrument;
        this.identifier = opts.identifier;
        this.members = opts.members;
    }
    init(scope) {
        super.init(scope);
        this.functionCalls = [];
        this.patterns = new Map();
        this.patternCalls = [];
        this.members.forEach(member => {
            // initialize them all now, var inheritence is handled during execution
            member.init(this);
            if (member instanceof FunctionCall) {
                this.functionCalls.push(member);
            }
            else if (member instanceof PatternStatement) {
                this.patterns.set(member.identifier, member);
            }
            else if (member instanceof PatternCall) {
                this.patternCalls.push(member);
            }
        });
    }
    link(ASTs, parentStyle) {
        for (const patternCall of this.patternCalls) {
            patternCall.link(ASTs, parentStyle, this);
            this.patterns.set(patternCall.name, patternCall);
        }
        for (const [, pattern] of this.patterns) {
            pattern.link(ASTs, parentStyle, this);
        }
    }
    execute(songIterator) {
        this.inherit();
        console.log(`executing TrackStatement "${this.name}"`);
        this.functionCalls.forEach(functionCall => {
            functionCall.execute(songIterator);
        });
        // weighted random picking
        // https://stackoverflow.com/a/4463613/1784306
        // I don't really understand the above explanation, this is probs wrong
        let totalWeight = 0;
        const weightedOptions = [];
        for (const [patternname, pattern] of this.patterns) {
            console.log(`- pattern "${patternname}":`);
            // true = I'm the instrument so if you're private return Nil
            const result = pattern.execute(songIterator, true);
            console.log('  - Result:', result);
            // @TODO: handle multi-measure patterns (via locks?)
            if (result) {
                for (const note of result) {
                    if (note.pitch === AwaitingDrum) {
                        throw new DrumBeatInMelodicBeatGroupError(pattern);
                    }
                }
                const chance = pattern.getChance();
                weightedOptions.push({
                    noteSet: result,
                    lower: totalWeight,
                    upper: totalWeight + chance
                });
                totalWeight += chance;
            }
        }
        // binary search would make sense here if I expected more items
        const goal = Math.random() * totalWeight;
        for (const option of weightedOptions) {
            if (option.lower <= goal && goal <= option.upper) {
                console.log('  - Final result:', option.noteSet);
                return option.noteSet;
            }
        }
        console.log('  - Final result:', null);
        return null;
    }
}
class TrackCall extends ASTNodeBase {
    constructor(opts) {
        super();
        this.import = opts.import;
        this.track = opts.track;
        this.trackStatement = null; // will be set by the loader.
    }
    execute(songIterator) {
        this.trackStatement.execute(songIterator);
    }
}

class GlobalScope extends Scope {
    constructor(statements) {
        super();
        this.name = 'global';
        this.type = 'global';
        this.statements = statements;
    }
    init() {
        // set some default values
        this.vars.set('time-signature', new PlaybackTimeSignatureValue([4, 4]));
        this.vars.set('tempo', new PlaybackNumberValue(120));
        this.tracks = new Map();
        this.metaStatements = [];
        // @TODO: stop circular dependencies? cache them and mark one as mom
        this.importedStyles = new Map();
        this.trackCalls = [];
        this.dependencies = [];
        for (const statement of this.statements) {
            if (statement instanceof MetaStatement
                || statement instanceof OptionsStatement) {
                // @TODO: make sure there's exactly 1 meta block
                this.metaStatements.push(statement);
            }
            else if (statement instanceof ImportStatement) {
                this.importedStyles.set(statement.identifier, statement.path);
                this.dependencies.push(statement.path);
            }
            else if (statement instanceof TrackStatement) {
                this.tracks.set(statement.name, statement);
            }
            else if (statement instanceof TrackCall) {
                this.trackCalls.push(statement);
            }
        }
        // handle meta blocks first since they set variables in own scope
        this.metaStatements.forEach(statement => statement.init(this));
        // -- handle importing before statements --
        this.tracks.forEach(statement => statement.init(this));
    }
    link(ASTs) {
        for (const trackCall of this.trackCalls) {
            // get path name of style
            const importPath = this.importedStyles.get(trackCall.import);
            const ast = ASTs.get(importPath);
            if (!ast)
                throw new NoSuchStyleError(trackCall.import, this);
            const trackStatement = ast.tracks.get(trackCall.track);
            if (!trackStatement)
                throw new NoSuchTrackError(trackCall.import, trackCall.track, this);
            //trackCall.trackStatement = trackStatement;
            this.tracks.set(`${trackCall.import}.${trackCall.track}`, trackStatement);
        }
        for (const [, track] of this.tracks) {
            track.link(ASTs, this);
        }
    }
    execute(songIterator) {
        const trackNoteMap = new Map();
        for (const [, track] of this.tracks) {
            const trackNotes = track.execute(songIterator);
            if (trackNotes)
                trackNoteMap.set(track.instrument, trackNotes);
        }
        return trackNoteMap;
    }
    getInstruments() {
        const instruments = new Set();
        for (const [, track] of this.tracks) {
            instruments.add(track.instrument);
        }
        return instruments;
    }
}

class BooleanOperator extends ASTNodeBase {
    constructor(...args) {
        super();
        this.args = args;
    }
    link(ASTs, parentStyle, parentTrack) {
        this.args.forEach(arg => {
            if (arg.link)
                arg.link(ASTs, parentStyle, parentTrack);
        });
    }
    init(scope) {
        super.init(scope);
        this.args.forEach(arg => {
            if (arg.init)
                arg.init(scope);
        });
    }
    resolveArgs(songIterator) {
        return this.args.map(arg => {
            if (arg.execute) {
                return arg.execute(songIterator);
            }
            else {
                return arg;
            }
        });
    }
}
class BooleanNot extends BooleanOperator {
    execute(songIterator) {
        const args = this.resolveArgs(songIterator);
        return new PlaybackBooleanValue(!args[0].toBoolean());
    }
}
class BooleanAnd extends BooleanOperator {
    execute(songIterator) {
        // sorry no short-circuiting because this code is prettier
        // @TODO: add short-circuiting if this actually makes it too slow
        const args = this.resolveArgs(songIterator);
        return new PlaybackBooleanValue(args[0].toBoolean() && args[1].toBoolean());
    }
}
class BooleanOr extends BooleanOperator {
    execute(songIterator) {
        const args = this.resolveArgs(songIterator);
        return new PlaybackBooleanValue(args[0].toBoolean() || args[1].toBoolean());
    }
}

// @ts-ignore
class MelodicBeatLiteral extends ASTNodeBase {
    constructor(opts) {
        super();
        this.cachedAnchor = null; // used for STEP/ARPEGGIATE interpolation
        this.value = new PlaybackMelodicBeatValue(opts.time, opts.pitch, opts.octave);
    }
    init(scope, parentMeasure, indexInMeasure) {
        super.init(scope);
        this.parentMeasure = parentMeasure;
        this.indexInMeasure = indexInMeasure;
    }
    link() { }
    getTime() {
        if (this.value.time.time === 'auto') {
            return this.indexInMeasure + 1;
        }
        else {
            return this.value.time.time;
        }
    }
    handleInversion(songIterator, pitches) {
        const tonicPC = songIterator.song.getTransposedKey();
        const tonicNote = tonal$1.Note.from({ oct: this.getOctave() }, tonicPC);
        const tonic = tonal$1.Note.midi(tonicNote);
        const outPitches = [];
        for (const pitchNote of pitches) {
            let pitch = tonal$1.Note.midi(pitchNote);
            if (pitch - tonic >= 6)
                pitch -= 12;
            outPitches.push(tonal$1.Note.fromMidi(pitch));
        }
        return outPitches;
    }
    getAnchorData(songIterator) {
        const anchorChord = getAnchorChord(this.value.pitch.anchor, songIterator, this.getTime());
        const root = anchorChordToRoot(anchorChord, this.value.pitch.degree, this.getOctave());
        return [anchorChord, root];
    }
    getPitches(songIterator) {
        const [anchorChord, root] = this.getAnchorData(songIterator);
        let pitches;
        if (this.value.pitch.chord) {
            // this feels extremely incorrect
            // why would anyone need it to work this way
            const anchorChordType = tonal$1.Chord.tokenize(anchorChord)[1];
            pitches = tonal$1.Chord.notes(root, anchorChordType);
        }
        else {
            pitches = [root];
        }
        if (this.scope.vars.get('invertible')) {
            pitches = this.handleInversion(songIterator, pitches);
        }
        return pitches;
    }
    /**
     * Returns true if the beat is anchored via STEP or ARPEGGIATE
     * @returns {boolean}
     */
    isDynamic() {
        return ['STEP', 'ARPEGGIATE'].includes(this.value.pitch.anchor);
    }
    getOctave() {
        if (this.value.octave === 'inherit') {
            return this.scope.vars.get('octave').value;
        }
        else {
            return this.value.octave;
        }
    }
    getDuration() {
        const duration = this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
        if (this.value.time.flag === 'STACCATO') {
            return Math.min(0.25, duration);
        }
        else {
            return duration;
        }
    }
    getVolume() {
        let volume = this.scope.vars.get('volume').value;
        if (this.value.time.flag === 'ACCENTED')
            volume = Math.min(1, volume += .1);
        return volume;
    }
    execute(songIterator) {
        const notes = new NoteSet();
        const time = this.getTime(); // @TODO: this varies with rolling
        const pitches = this.getPitches(songIterator);
        const duration = this.getDuration(); // @TODO: this varies with rolling
        const volume = this.getVolume();
        for (const pitch of pitches) {
            notes.push(new Note({
                time: time,
                pitch: pitch,
                duration: duration,
                volume: volume
            }));
        }
        return notes;
    }
}
class DrumBeatLiteral extends ASTNodeBase {
    constructor(opts) {
        super();
        this.value = new PlaybackDrumBeatValue(opts.time, opts.accented);
    }
    init(scope, parentMeasure, indexInMeasure) {
        super.init(scope);
        this.parentMeasure = parentMeasure;
        this.indexInMeasure = indexInMeasure;
    }
    link() { }
    getTime() {
        return this.value.time;
    }
    getDuration() {
        return this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
    }
    getVolume() {
        let volume = this.scope.vars.get('volume').value;
        if (this.value.accented)
            volume = Math.min(1, volume += .1);
        return volume;
    }
    isDynamic() { return false; }
    getAnchorData() { return []; }
    execute(songIterator) {
        const time = this.getTime();
        const duration = this.getDuration();
        const volume = this.getVolume();
        return new NoteSet(new Note({
            time: time,
            pitch: AwaitingDrum,
            duration: duration,
            volume: volume
        }));
    }
}

class BeatGroupLiteral extends ASTNodeBase {
    constructor(measures) {
        super();
        this.measures = measures;
    }
    init(scope) {
        super.init(scope);
        this.measures.forEach((measure, i) => measure.init(scope, this, i));
    }
    link() { return; }
    execute(songIterator) {
        const joinedMeasures = new NoteSet();
        for (let i = 0; i < this.measures.length; i++) {
            const offset = i * 4; // @TODO: pull in actual meter somehow
            const measureNotes = this.measures[i].execute(songIterator);
            if (measureNotes === null)
                return null; // lets a/s abort the beatgroup
            for (const measureNote of measureNotes) {
                measureNote.time += offset;
                joinedMeasures.push(measureNote);
            }
        }
        return joinedMeasures;
    }
    getNextStaticBeatRoot(measureIndex, beatIndex, songIterator) {
        // first, try every subsequent beat in the beatGroup
        // (including subsequent measures)
        let measure, beat;
        while (measure = this.parentBeatGroup.measures[measureIndex++]) {
            while (beat = measure.beats[++beatIndex]) {
                if (!beat.isDynamic()) {
                    return beat.getAnchorData(songIterator)[1];
                }
            }
            beatIndex = -1;
        }
        // if there are no non-dynamic beats in the rest of the beat-group, return
        // the first note of the next measure (@TODO: could be multiple measures
        // later if it's a multi-measure beatgroup)
        // @TODO: wtf?
        const nextMeasure = songIterator.getRelative(1);
        return normalizeChordForTonal(nextMeasure && nextMeasure.beats[0].chord);
    }
}
class Measure extends ASTNodeBase {
    constructor(beats) {
        super();
        this.beats = beats;
        this.beatsPerMeasure = 0;
    }
    calculateDurationAfter(beatIndex) {
        const currentBeat = this.beats[beatIndex];
        const currentBeatTime = currentBeat.getTime();
        let nextBeatTime;
        if (beatIndex + 1 >= this.beats.length) {
            nextBeatTime = this.beatsPerMeasure + 1;
        }
        else {
            const nextBeat = this.beats[beatIndex + 1];
            nextBeatTime = nextBeat.getTime();
        }
        return nextBeatTime - currentBeatTime;
    }
    getNextStaticBeatRoot(beatIndex, songIterator) {
        return this.parentBeatGroup.getNextStaticBeatRoot(this.indexInBeatGroup, beatIndex, songIterator);
    }
    link() { }
    init(scope, parentBeatGroup, indexInBeatGroup) {
        super.init(scope);
        this.parentBeatGroup = parentBeatGroup;
        this.indexInBeatGroup = indexInBeatGroup;
        this.beatsPerMeasure = this.scope.vars.get('time-signature').value[0];
        // @TODO does this need more math?
        this.beats.forEach((beat, i) => {
            beat.init(scope, this, i);
        });
    }
    execute(songIterator) {
        // clear cached notes (used for STEP/ARPEGGIATE interpolation)
        for (const beat of this.beats) {
            if (beat instanceof MelodicBeatLiteral)
                beat.cachedAnchor = null;
        }
        // each beat returns a NoteSet since it could be a chord or whatever
        const joined = new NoteSet();
        for (const beat of this.beats) {
            const notes = beat.execute(songIterator);
            if (!notes)
                return null; // lets a and s abort the beatgroup.
            joined.push(...notes);
        }
        return joined;
    }
}
class DrumBeatGroupLiteral extends ASTNodeBase {
    constructor(drum, beatGroup) {
        super();
        this.drum = drum;
        this.beatGroup = beatGroup; // for now there's no diff in functionality...
        // @TODO make sure our beats are all drummy
    }
    init(scope) {
        super.init(scope);
        if (this.beatGroup.init)
            this.beatGroup.init(scope);
    }
    link() { return; } // @TODO: I think patterncalls are allowed here?
    execute(songIterator) {
        const notes = this.beatGroup.execute(songIterator);
        if (notes === null)
            return null;
        for (const note of notes) {
            if (note.pitch === AwaitingDrum) {
                note.pitch = this.drum; // @TODO: convert to number?
            }
            else {
                throw new MelodicBeatInDrumBeatGroupError(this.scope);
            }
        }
        return notes;
    }
}

// Generated automatically by nearley, version 2.13.0
// http://github.com/Hardmath123/nearley
function id(x) { return x[0]; }
let Lexer = lexer;
let ParserRules = [
    {"name": "main$macrocall$2", "symbols": ["TopLevelStatement"]},
    {"name": "main$macrocall$1$ebnf$1", "symbols": []},
    {"name": "main$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_", "main$macrocall$2"], "postprocess": d => d[1][0]},
    {"name": "main$macrocall$1$ebnf$1", "symbols": ["main$macrocall$1$ebnf$1", "main$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main$macrocall$1", "symbols": ["main$macrocall$2", "main$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "main", "symbols": ["_?", "main$macrocall$1", "_?"], "postprocess": d => new GlobalScope(d[1])},
    {"name": "TopLevelStatement", "symbols": ["ConfigurationStatement"], "postprocess": id},
    {"name": "TopLevelStatement", "symbols": ["ImportStatement"], "postprocess": id},
    {"name": "TopLevelStatement", "symbols": ["TrackStatement"], "postprocess": id},
    {"name": "TopLevelStatement", "symbols": ["TrackCallStatement"], "postprocess": id},
    {"name": "ConfigurationStatement", "symbols": [{"literal":"@meta"}, "_?", {"literal":"{"}, "_?", "ConfigurationList", "_?", {"literal":"}"}], "postprocess": d => new MetaStatement(d[4])},
    {"name": "ConfigurationStatement", "symbols": [{"literal":"@options"}, "_?", {"literal":"{"}, "_?", "ConfigurationList", "_?", {"literal":"}"}], "postprocess": d => new OptionsStatement(d[4])},
    {"name": "ConfigurationList$macrocall$2", "symbols": ["FunctionCallExpression"]},
    {"name": "ConfigurationList$macrocall$1$ebnf$1", "symbols": []},
    {"name": "ConfigurationList$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_", "ConfigurationList$macrocall$2"], "postprocess": d => d[1][0]},
    {"name": "ConfigurationList$macrocall$1$ebnf$1", "symbols": ["ConfigurationList$macrocall$1$ebnf$1", "ConfigurationList$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ConfigurationList$macrocall$1", "symbols": ["ConfigurationList$macrocall$2", "ConfigurationList$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "ConfigurationList", "symbols": ["ConfigurationList$macrocall$1"], "postprocess": id},
    {"name": "ImportStatement", "symbols": [{"literal":"@import"}, "_", "StringLiteral", "_", {"literal":"as"}, "_", "Identifier"], "postprocess": d => new ImportStatement(d[2], d[6])},
    {"name": "TrackStatement$macrocall$2", "symbols": ["TrackMember"]},
    {"name": "TrackStatement$macrocall$1$ebnf$1", "symbols": []},
    {"name": "TrackStatement$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_", "TrackStatement$macrocall$2"], "postprocess": d => d[1][0]},
    {"name": "TrackStatement$macrocall$1$ebnf$1", "symbols": ["TrackStatement$macrocall$1$ebnf$1", "TrackStatement$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "TrackStatement$macrocall$1", "symbols": ["TrackStatement$macrocall$2", "TrackStatement$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "TrackStatement", "symbols": [{"literal":"@track"}, "_", "StringLiteral", "_", {"literal":"as"}, "_", "Identifier", "_?", {"literal":"{"}, "_?", "TrackStatement$macrocall$1", "_?", {"literal":"}"}], "postprocess": d => new TrackStatement({instrument: d[2], identifier: d[6], members: d[10]})},
    {"name": "TrackMember", "symbols": ["FunctionCallExpression"], "postprocess": id},
    {"name": "TrackMember", "symbols": ["PatternStatement"], "postprocess": id},
    {"name": "TrackMember", "symbols": ["PatternCallExpression"], "postprocess": id},
    {"name": "TrackCallStatement", "symbols": [{"literal":"@track"}, "_?", {"literal":"("}, "_?", "Identifier", {"literal":"."}, "Identifier", "_?", {"literal":")"}], "postprocess": d => new TrackCall({import: d[4], track: d[6]})},
    {"name": "PatternStatement", "symbols": [{"literal":"@pattern"}, "_", "Identifier", "_", "PatternConditional", "_?", "PatternExpression"], "postprocess": d => new PatternStatement({identifier: d[2], expression: d[6], condition: d[4]})},
    {"name": "PatternStatement", "symbols": [{"literal":"@pattern"}, "_", "Identifier", "_", "PatternExpression"], "postprocess": d => new PatternStatement({identifier: d[2], expression: d[4]})},
    {"name": "PatternConditional", "symbols": [{"literal":"if"}, "_?", {"literal":"("}, "_?", "FunctionCallArgument", "_?", {"literal":")"}], "postprocess": d => d[4]},
    {"name": "PatternExpression", "symbols": ["PatternExpression_NoJoin"], "postprocess": id},
    {"name": "PatternExpression", "symbols": ["JoinedPatternExpression"], "postprocess": id},
    {"name": "PatternExpression_NoJoin", "symbols": ["PatternExpressionGroup"], "postprocess": id},
    {"name": "PatternExpression_NoJoin", "symbols": ["BeatGroupLiteral"], "postprocess": id},
    {"name": "PatternExpression_NoJoin", "symbols": ["DrumBeatGroupLiteral"], "postprocess": id},
    {"name": "PatternExpression_NoJoin", "symbols": ["FunctionCallExpression"], "postprocess": id},
    {"name": "PatternExpression_NoJoin", "symbols": ["PatternCallExpression"], "postprocess": id},
    {"name": "PatternExpressionGroup$macrocall$2", "symbols": ["PatternExpression"]},
    {"name": "PatternExpressionGroup$macrocall$1$ebnf$1", "symbols": []},
    {"name": "PatternExpressionGroup$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_", "PatternExpressionGroup$macrocall$2"], "postprocess": d => d[1][0]},
    {"name": "PatternExpressionGroup$macrocall$1$ebnf$1", "symbols": ["PatternExpressionGroup$macrocall$1$ebnf$1", "PatternExpressionGroup$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PatternExpressionGroup$macrocall$1", "symbols": ["PatternExpressionGroup$macrocall$2", "PatternExpressionGroup$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "PatternExpressionGroup", "symbols": [{"literal":"{"}, "_?", "PatternExpressionGroup$macrocall$1", "_?", {"literal":"}"}], "postprocess": d => new PatternExpressionGroup(d[2])},
    {"name": "PatternCallExpression", "symbols": [{"literal":"@pattern"}, "_?", {"literal":"("}, "_?", "Identifier", "_?", {"literal":")"}], "postprocess": d => new PatternCall({pattern: d[4]})},
    {"name": "PatternCallExpression", "symbols": [{"literal":"@pattern"}, "_?", {"literal":"("}, "_?", "Identifier", {"literal":"."}, "Identifier", "_?", {"literal":")"}], "postprocess": d => new PatternCall({track: d[4], pattern: d[6]})},
    {"name": "PatternCallExpression", "symbols": [{"literal":"@pattern"}, "_?", {"literal":"("}, "_?", "Identifier", {"literal":"."}, "Identifier", {"literal":"."}, "Identifier", "_?", {"literal":")"}], "postprocess": d => new PatternCall({import: d[4], track: d[6], pattern: d[8]})},
    {"name": "JoinedPatternExpression$macrocall$2", "symbols": ["PatternExpression_NoJoin"]},
    {"name": "JoinedPatternExpression$macrocall$3", "symbols": [{"literal":"&"}]},
    {"name": "JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_?", "JoinedPatternExpression$macrocall$3", "_?", "JoinedPatternExpression$macrocall$2"], "postprocess": d => d[3][0]},
    {"name": "JoinedPatternExpression$macrocall$1$ebnf$1", "symbols": ["JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$1"]},
    {"name": "JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$2", "symbols": ["_?", "JoinedPatternExpression$macrocall$3", "_?", "JoinedPatternExpression$macrocall$2"], "postprocess": d => d[3][0]},
    {"name": "JoinedPatternExpression$macrocall$1$ebnf$1", "symbols": ["JoinedPatternExpression$macrocall$1$ebnf$1", "JoinedPatternExpression$macrocall$1$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "JoinedPatternExpression$macrocall$1", "symbols": ["JoinedPatternExpression$macrocall$2", "JoinedPatternExpression$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "JoinedPatternExpression", "symbols": ["JoinedPatternExpression$macrocall$1"], "postprocess": d => new JoinedPatternExpression(d[0])},
    {"name": "FunctionCallExpression$macrocall$2", "symbols": ["FunctionCallArgument"]},
    {"name": "FunctionCallExpression$macrocall$1$ebnf$1", "symbols": []},
    {"name": "FunctionCallExpression$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_", "FunctionCallExpression$macrocall$2"], "postprocess": d => d[1][0]},
    {"name": "FunctionCallExpression$macrocall$1$ebnf$1", "symbols": ["FunctionCallExpression$macrocall$1$ebnf$1", "FunctionCallExpression$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionCallExpression$macrocall$1", "symbols": ["FunctionCallExpression$macrocall$2", "FunctionCallExpression$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "FunctionCallExpression", "symbols": ["Identifier", "_?", {"literal":"("}, "_?", "FunctionCallExpression$macrocall$1", "_?", {"literal":")"}], "postprocess": d => new FunctionCall(d[0], d[4])},
    {"name": "FunctionCallExpression", "symbols": ["Identifier", "_?", {"literal":"("}, {"literal":")"}], "postprocess": d => new FunctionCall(d[0], [])},
    {"name": "FunctionCallArgument", "symbols": ["NumericExpression"], "postprocess": d => new PlaybackNumberValue(d[0])},
    {"name": "FunctionCallArgument", "symbols": ["StringLiteral"], "postprocess": d => new PlaybackStringValue(d[0])},
    {"name": "FunctionCallArgument", "symbols": ["BooleanLiteral"], "postprocess": d => new PlaybackBooleanValue(d[0])},
    {"name": "FunctionCallArgument", "symbols": ["PatternExpression"], "postprocess": id},
    {"name": "FunctionCallArgument", "symbols": ["BL_PP_Anchor"], "postprocess": d => new PlaybackAnchorValue(d[0])},
    {"name": "FunctionCallArgument", "symbols": [{"literal":"not"}, "_", "FunctionCallArgument"], "postprocess": d => new BooleanNot(d[2])},
    {"name": "FunctionCallArgument", "symbols": ["FunctionCallArgument", "_", {"literal":"and"}, "_", "FunctionCallArgument"], "postprocess": d => new BooleanAnd(d[0], d[4])},
    {"name": "FunctionCallArgument", "symbols": ["FunctionCallArgument", "_", {"literal":"or"}, "_", "FunctionCallArgument"], "postprocess": d => new BooleanOr(d[0], d[4])},
    {"name": "BeatGroupLiteral", "symbols": [{"literal":"<"}, "_?", "MeasureGroup", "_?", {"literal":">"}], "postprocess": d => new BeatGroupLiteral(d[2])},
    {"name": "MeasureGroup$macrocall$2", "symbols": ["Measure"]},
    {"name": "MeasureGroup$macrocall$3", "symbols": [{"literal":"|"}]},
    {"name": "MeasureGroup$macrocall$1$ebnf$1", "symbols": []},
    {"name": "MeasureGroup$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_?", "MeasureGroup$macrocall$3", "_?", "MeasureGroup$macrocall$2"], "postprocess": d => d[3][0]},
    {"name": "MeasureGroup$macrocall$1$ebnf$1", "symbols": ["MeasureGroup$macrocall$1$ebnf$1", "MeasureGroup$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MeasureGroup$macrocall$1", "symbols": ["MeasureGroup$macrocall$2", "MeasureGroup$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "MeasureGroup", "symbols": ["MeasureGroup$macrocall$1"], "postprocess": id},
    {"name": "Measure$macrocall$2", "symbols": ["MelodicBeatLiteral"]},
    {"name": "Measure$macrocall$1$ebnf$1", "symbols": []},
    {"name": "Measure$macrocall$1$ebnf$1$subexpression$1", "symbols": ["_", "Measure$macrocall$2"], "postprocess": d => d[1][0]},
    {"name": "Measure$macrocall$1$ebnf$1", "symbols": ["Measure$macrocall$1$ebnf$1", "Measure$macrocall$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Measure$macrocall$1", "symbols": ["Measure$macrocall$2", "Measure$macrocall$1$ebnf$1"], "postprocess": d => d[0].concat(d[1])},
    {"name": "Measure", "symbols": ["Measure$macrocall$1"], "postprocess": d => new Measure(d[0])},
    {"name": "MelodicBeatLiteral", "symbols": ["BL_TimePart", {"literal":":"}, "BL_PitchPart", {"literal":":"}, "BL_OctavePart"], "postprocess": d => new MelodicBeatLiteral({time: d[0], pitch: d[2], octave: d[4]})},
    {"name": "MelodicBeatLiteral", "symbols": [{"literal":":"}, "BL_PitchPart", {"literal":":"}, "BL_OctavePart"], "postprocess": d => new MelodicBeatLiteral({pitch: d[1], octave: d[3]})},
    {"name": "MelodicBeatLiteral", "symbols": ["BL_TimePart", {"literal":":"}, "BL_PitchPart"], "postprocess": d => new MelodicBeatLiteral({time: d[0], pitch: d[2]})},
    {"name": "MelodicBeatLiteral", "symbols": [{"literal":":"}, "BL_PitchPart"], "postprocess": d => new MelodicBeatLiteral({pitch: d[1]})},
    {"name": "MelodicBeatLiteral", "symbols": ["DrumBeatLiteral"], "postprocess": id},
    {"name": "BL_TimePart", "symbols": ["NumericExpression"], "postprocess": d => ({time: d[0]})},
    {"name": "BL_TimePart", "symbols": ["BL_TP_Flag"], "postprocess": d => ({time: 'auto', flag: d[0]})},
    {"name": "BL_TimePart", "symbols": ["NumericExpression", "BL_TP_Flag"], "postprocess": d => ({time: d[0], flag: d[1]})},
    {"name": "BL_TP_Flag", "symbols": [{"literal":"s"}], "postprocess": d => 'STACCATO'},
    {"name": "BL_TP_Flag", "symbols": [{"literal":"a"}], "postprocess": d => 'ACCENTED'},
    {"name": "BL_PitchPart", "symbols": ["BL_PP_Degree"], "postprocess": id},
    {"name": "BL_PitchPart", "symbols": ["BL_PP_Chord"], "postprocess": id},
    {"name": "BL_PP_Degree", "symbols": ["NumberLiteral"], "postprocess": d => ({degree: d[0]})},
    {"name": "BL_PP_Degree", "symbols": ["BL_PP_Anchor"], "postprocess": d => ({anchor: d[0], degree: 1})},
    {"name": "BL_PP_Degree", "symbols": ["BL_PP_Anchor", "NumberLiteral"], "postprocess": d => ({anchor: d[0], degree: d[1]})},
    {"name": "BL_PP_Chord", "symbols": [{"literal":"c"}], "postprocess": d => ({chord: true, degree: 1})},
    {"name": "BL_PP_Chord", "symbols": ["BL_PP_Degree", {"literal":"c"}], "postprocess": d => ({chord: true, anchor: d[0].anchor, degree: d[0].degree})},
    {"name": "BL_PP_Chord", "symbols": [{"literal":"c"}, "BL_PP_Roll"], "postprocess": d => ({chord: true, roll: d[1], degree: 1})},
    {"name": "BL_PP_Chord", "symbols": ["BL_PP_Degree", {"literal":"c"}, "BL_PP_Roll"], "postprocess": d => ({chord: true, roll: d[2], anchor: d[0].anchor, degree: d[0].degree})},
    {"name": "BL_PP_Anchor", "symbols": [{"literal":"k"}], "postprocess": d => 'KEY'},
    {"name": "BL_PP_Anchor", "symbols": [{"literal":"n"}], "postprocess": d => 'NEXT'},
    {"name": "BL_PP_Anchor", "symbols": [{"literal":"s"}], "postprocess": d => 'STEP'},
    {"name": "BL_PP_Anchor", "symbols": [{"literal":"a"}], "postprocess": d => 'ARPEGGIATE'},
    {"name": "BL_PP_Roll", "symbols": [{"literal":"r"}], "postprocess": d => 'ROLL_UP'},
    {"name": "BL_PP_Roll", "symbols": [{"literal":"r"}, {"literal":"d"}], "postprocess": d => 'ROLL_DOWN'},
    {"name": "BL_OctavePart", "symbols": ["NumberLiteral"], "postprocess": id},
    {"name": "DrumBeatGroupLiteral", "symbols": ["StringLiteral", "_?", "BeatGroupLiteral"], "postprocess": d => new DrumBeatGroupLiteral(d[0], d[2])},
    {"name": "DrumBeatGroupLiteral", "symbols": ["StringLiteral", "_?", "FunctionCallExpression"], "postprocess": d => new DrumBeatGroupLiteral(d[0], d[2])},
    {"name": "DrumBeatLiteral", "symbols": ["NumberLiteral"], "postprocess": d => new DrumBeatLiteral({time: d[0]})},
    {"name": "DrumBeatLiteral", "symbols": ["NumberLiteral", {"literal":"a"}], "postprocess": d => new DrumBeatLiteral({time: d[0], accented: true})},
    {"name": "NumericExpression", "symbols": ["NE_addsub"], "postprocess": id},
    {"name": "NE_parens", "symbols": [{"literal":"("}, "NE_addsub", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "NE_parens", "symbols": ["NumberLiteral"], "postprocess": id},
    {"name": "NE_muldiv", "symbols": ["NE_muldiv", {"literal":"*"}, "NE_parens"], "postprocess": d => (d[0] * d[2])},
    {"name": "NE_muldiv", "symbols": ["NE_muldiv", {"literal":"/"}, "NE_parens"], "postprocess": d => (d[0] / d[2])},
    {"name": "NE_muldiv", "symbols": ["NE_parens"], "postprocess": id},
    {"name": "NE_addsub", "symbols": ["NE_addsub", {"literal":"+"}, "NE_muldiv"], "postprocess": d => (d[0] + d[2])},
    {"name": "NE_addsub", "symbols": ["NE_addsub", {"literal":"-"}, "NE_muldiv"], "postprocess": d => (d[0] - d[2])},
    {"name": "NE_addsub", "symbols": ["NE_muldiv"], "postprocess": id},
    {"name": "Identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => d[0].value},
    {"name": "NumberLiteral", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => Number(d[0].value)},
    {"name": "NumberLiteral", "symbols": [(lexer.has("beat_number") ? {type: "beat_number"} : beat_number)], "postprocess": d => Number(d[0].value)},
    {"name": "BooleanLiteral", "symbols": [(lexer.has("boolean") ? {type: "boolean"} : boolean)], "postprocess": d => Boolean(d[0].value)},
    {"name": "StringLiteral", "symbols": [(lexer.has("quoted_string") ? {type: "quoted_string"} : quoted_string)], "postprocess": d => d[0].value.slice(1, -1)},
    {"name": "_?$ebnf$1", "symbols": ["_"], "postprocess": id},
    {"name": "_?$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_?", "symbols": ["_?$ebnf$1"], "postprocess": () => null},
    {"name": "_", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": () => null},
    {"name": "_", "symbols": [(lexer.has("beat_ws") ? {type: "beat_ws"} : beat_ws)], "postprocess": () => null},
    {"name": "_$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "_$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$2$subexpression$1", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment), "_$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "_$ebnf$2", "symbols": ["_$ebnf$2$subexpression$1"]},
    {"name": "_$ebnf$2$subexpression$2$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "_$ebnf$2$subexpression$2$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$2$subexpression$2", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment), "_$ebnf$2$subexpression$2$ebnf$1"]},
    {"name": "_$ebnf$2", "symbols": ["_$ebnf$2", "_$ebnf$2$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1", "_$ebnf$2"], "postprocess": () => null},
    {"name": "_$ebnf$3", "symbols": [(lexer.has("beat_ws") ? {type: "beat_ws"} : beat_ws)], "postprocess": id},
    {"name": "_$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$4$subexpression$1$ebnf$1", "symbols": [(lexer.has("beat_ws") ? {type: "beat_ws"} : beat_ws)], "postprocess": id},
    {"name": "_$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$4$subexpression$1", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment), "_$ebnf$4$subexpression$1$ebnf$1"]},
    {"name": "_$ebnf$4", "symbols": ["_$ebnf$4$subexpression$1"]},
    {"name": "_$ebnf$4$subexpression$2$ebnf$1", "symbols": [(lexer.has("beat_ws") ? {type: "beat_ws"} : beat_ws)], "postprocess": id},
    {"name": "_$ebnf$4$subexpression$2$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$4$subexpression$2", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment), "_$ebnf$4$subexpression$2$ebnf$1"]},
    {"name": "_$ebnf$4", "symbols": ["_$ebnf$4", "_$ebnf$4$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$3", "_$ebnf$4"], "postprocess": () => null}
];
let ParserStart = "main";
var grammar = { Lexer, ParserRules, ParserStart };

/**
 * Parses a string into a set of possible abstract systax trees (ASTs) trees of
 * objects representing the syntax of the file.
 * @param {string} data The string to parse
 * @return {Promise.<Array>.<GlobalScope>} A promise that resolves to an array
 * of parsings, each of which is an AST. (Ideally there should be 1 parsing.)
 *
 * See ast_nodes.js or the grammar itself for an idea of what the nodes in the
 * tree might look like.
 * @private
 */
function getPossibleParses(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a Parser object from our grammar.
        // (I don't think you can reset the parser so make a new one each time)
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        try {
            parser.feed(data);
            return parser.results;
        }
        catch (err) {
            // Because tabs screw up the formatting of SyntaxError messages.
            err.message = err.message.replace(/\t/g, ' ');
            throw err;
        }
    });
}
/**
 * Parse a string into an Abstract Syntax Tree (AST) -- a tree of objects
 * representing the syntax of the file.
 * @param {string}  data The string to parse
 * @return {Promise.<GlobalScope>} The Abstract Systax Tree (AST).
 */
function parse(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const parses = yield getPossibleParses(data);
        if (!parses.length) {
            throw new SyntaxError('Something went wrong, input not parseable.');
        }
        return parses[0];
    });
}

class PlaybackStyle {
    constructor(mainPath) {
        this.mainPath = mainPath;
        this.ASTs = new Map();
        this.initialized = false;
    }
    /**
     * Parse each file, pull its dependencies, put it all in a cache, rinse and
     * repeat.
     */
    loadDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            const pendingDependencies = [this.mainPath];
            let dependencyPath;
            // @TODO: verify that dependencies have compatible time signature to main
            while (dependencyPath = pendingDependencies.pop()) {
                let rawfile;
                try {
                    rawfile = yield load(dependencyPath);
                }
                catch (e) {
                    throw new Error(`Couldn't locate imported style "${dependencyPath}".`);
                }
                const ast = yield parse(rawfile);
                this.ASTs.set(dependencyPath, ast);
                ast.init();
                for (const newDependency of ast.dependencies) {
                    if (!this.ASTs.has(newDependency)) {
                        pendingDependencies.push(newDependency);
                    }
                }
            }
            this.main = this.ASTs.get(this.mainPath);
        });
    }
    link() {
        this.main.link(this.ASTs);
    }
    /**
     * Initialize the style, which includes loading dependencies and linking
     * track/pattern calls. Must be called before compiling/playing.
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadDependencies();
            this.link();
            this.initialized = true;
        });
    }
    /**
     * Compile a song into a set of MIDI-like note instructions.
     * @param {Song} song A Playback Song (notochord????)
     * @returns {Map<string, NoteSet>} A map of instrument names to array-like
     * objects containing MIDI-like note instructions.
     */
    compile(song) {
        if (!this.initialized) {
            throw new Error('PlayBack style must be initialized before compiling');
        }
        const songIterator = song[Symbol.iterator]();
        const instruments = this.getInstruments();
        const notes = new Map();
        const beatsPerMeasure = this.main.vars.get('time-signature').value[0];
        let totalPastBeats = 0;
        for (const instrument of instruments)
            notes.set(instrument, new NoteSet());
        let nextValue;
        while (nextValue = songIterator.next(), nextValue.done === false) {
            const thisMeasureTracks = this.main.execute(songIterator);
            for (const [instrument, thisMeasureNotes] of thisMeasureTracks) {
                for (const note of thisMeasureNotes) {
                    note.time += totalPastBeats;
                    if (this.main.vars.get('swing')) {
                        const intPart = Math.floor(note.time);
                        let floatPart = note.time - intPart;
                        if (floatPart <= 0.5) {
                            floatPart *= 2;
                            floatPart = (2 / 3) * floatPart;
                        }
                        else {
                            floatPart = 2 * (floatPart - 0.5);
                            floatPart = (2 / 3) + ((1 / 3) * floatPart);
                        }
                        note.time = intPart + floatPart;
                    }
                }
                notes.get(instrument).push(...thisMeasureNotes);
            }
            totalPastBeats += beatsPerMeasure;
        }
        return notes;
    }
    getInstruments() {
        return this.main.getInstruments();
    }
}

let moduleDefs = {1:[function(require,module,exports){
  
  var load = require('audio-loader');
  var player = require('sample-player');
  
  /**
   * Load a soundfont instrument. It returns a promise that resolves to a
   * instrument object.
   *
   * The instrument object returned by the promise has the following properties:
   *
   * - name: the instrument name
   * - play: A function to play notes from the buffer with the signature
   * `play(note, time, duration, options)`
   *
   *
   * The valid options are:
   *
   * - `format`: the soundfont format. 'mp3' by default. Can be 'ogg'
   * - `soundfont`: the soundfont name. 'MusyngKite' by default. Can be 'FluidR3_GM'
   * - `nameToUrl` <Function>: a function to convert from instrument names to URL
   * - `destination`: by default Soundfont uses the `audioContext.destination` but you can override it.
   * - `gain`: the gain of the player (1 by default)
   * - `notes`: an array of the notes to decode. It can be an array of strings
   * with note names or an array of numbers with midi note numbers. This is a
   * performance option: since decoding mp3 is a cpu intensive process, you can limit
   * limit the number of notes you want and reduce the time to load the instrument.
   *
   * @param {AudioContext} ac - the audio context
   * @param {String} name - the instrument name. For example: 'acoustic_grand_piano'
   * @param {Object} options - (Optional) the same options as Soundfont.loadBuffers
   * @return {Promise}
   *
   * @example
   * var Soundfont = require('sounfont-player')
   * Soundfont.instrument('marimba').then(function (marimba) {
   *   marimba.play('C4')
   * })
   */
  function instrument (ac, name, options) {
    if (arguments.length === 1) return function (n, o) { return instrument(ac, n, o) }
    var opts = options || {};
    var isUrl = opts.isSoundfontURL || isSoundfontURL;
    var toUrl = opts.nameToUrl || nameToUrl;
    var url = isUrl(name) ? name : toUrl(name, opts.soundfont, opts.format);
  
    return load(ac, url, { only: opts.only || opts.notes }).then(function (buffers) {
      var p = player(ac, buffers, opts).connect(opts.destination ? opts.destination : ac.destination);
      p.url = url;
      p.name = name;
      return p
    })
  }
  
  function isSoundfontURL (name) {
    return /\.js(\?.*)?$/i.test(name)
  }
  
  /**
   * Given an instrument name returns a URL to to the Benjamin Gleitzman's
   * package of [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)
   *
   * @param {String} name - instrument name
   * @param {String} soundfont - (Optional) the soundfont name. One of 'FluidR3_GM'
   * or 'MusyngKite' ('MusyngKite' by default)
   * @param {String} format - (Optional) Can be 'mp3' or 'ogg' (mp3 by default)
   * @returns {String} the Soundfont file url
   * @example
   * var Soundfont = require('soundfont-player')
   * Soundfont.nameToUrl('marimba', 'mp3')
   */
  function nameToUrl (name, sf, format) {
    format = format === 'ogg' ? format : 'mp3';
    sf = sf === 'FluidR3_GM' ? sf : 'MusyngKite';
    return 'https://gleitz.github.io/midi-js-soundfonts/' + sf + '/' + name + '-' + format + '.js'
  }
  
  // In the 1.0.0 release it will be:
  // var Soundfont = {}
  var Soundfont = require('./legacy');
  Soundfont.instrument = instrument;
  Soundfont.nameToUrl = nameToUrl;
  
  if (typeof module === 'object' && module.exports) module.exports = Soundfont;
  if (typeof window !== 'undefined') window.Soundfont = Soundfont;
  
  },{"./legacy":2,"audio-loader":6,"sample-player":10}],2:[function(require,module,exports){
  
  var parser = require('note-parser');
  
  /**
   * Create a Soundfont object
   *
   * @param {AudioContext} context - the [audio context](https://developer.mozilla.org/en/docs/Web/API/AudioContext)
   * @param {Function} nameToUrl - (Optional) a function that maps the sound font name to the url
   * @return {Soundfont} a soundfont object
   */
  function Soundfont (ctx, nameToUrl) {
    console.warn('new Soundfont() is deprected');
    console.log('Please use Soundfont.instrument() instead of new Soundfont().instrument()');
    if (!(this instanceof Soundfont)) return new Soundfont(ctx)
  
    this.nameToUrl = nameToUrl || Soundfont.nameToUrl;
    this.ctx = ctx;
    this.instruments = {};
    this.promises = [];
  }
  
  Soundfont.prototype.onready = function (callback) {
    console.warn('deprecated API');
    console.log('Please use Promise.all(Soundfont.instrument(), Soundfont.instrument()).then() instead of new Soundfont().onready()');
    Promise.all(this.promises).then(callback);
  };
  
  Soundfont.prototype.instrument = function (name, options) {
    console.warn('new Soundfont().instrument() is deprecated.');
    console.log('Please use Soundfont.instrument() instead.');
    var ctx = this.ctx;
    name = name || 'default';
    if (name in this.instruments) return this.instruments[name]
    var inst = {name: name, play: oscillatorPlayer(ctx, options)};
    this.instruments[name] = inst;
    if (name !== 'default') {
      var promise = Soundfont.instrument(ctx, name, options).then(function (instrument) {
        inst.play = instrument.play;
        return inst
      });
      this.promises.push(promise);
      inst.onready = function (cb) {
        console.warn('onready is deprecated. Use Soundfont.instrument().then()');
        promise.then(cb);
      };
    } else {
      inst.onready = function (cb) {
        console.warn('onready is deprecated. Use Soundfont.instrument().then()');
        cb();
      };
    }
    return inst
  };
  
  /*
   * Load the buffers of a given instrument name. It returns a promise that resolves
   * to a hash with midi note numbers as keys, and audio buffers as values.
   *
   * @param {AudioContext} ac - the audio context
   * @param {String} name - the instrument name (it accepts an url if starts with "http")
   * @param {Object} options - (Optional) options object
   * @return {Promise} a promise that resolves to a Hash of { midiNoteNum: <AudioBuffer> }
   *
   * The options object accepts the following keys:
   *
   * - nameToUrl {Function}: a function to convert from instrument names to urls.
   * By default it uses Benjamin Gleitzman's package of
   * [pre-rendered sound fonts](https://github.com/gleitz/midi-js-soundfonts)
   * - notes {Array}: the list of note names to be decoded (all by default)
   *
   * @example
   * var Soundfont = require('soundfont-player')
   * Soundfont.loadBuffers(ctx, 'acoustic_grand_piano').then(function(buffers) {
   *  buffers[60] // => An <AudioBuffer> corresponding to note C4
   * })
   */
  function loadBuffers (ac, name, options) {
    console.warn('Soundfont.loadBuffers is deprecate.');
    console.log('Use Soundfont.instrument(..) and get buffers properties from the result.');
    return Soundfont.instrument(ac, name, options).then(function (inst) {
      return inst.buffers
    })
  }
  Soundfont.loadBuffers = loadBuffers;
  
  /**
   * Returns a function that plays an oscillator
   *
   * @param {AudioContext} ac - the audio context
   * @param {Hash} defaultOptions - (Optional) a hash of options:
   * - vcoType: the oscillator type (default: 'sine')
   * - gain: the output gain value (default: 0.4)
    * - destination: the player destination (default: ac.destination)
   */
  function oscillatorPlayer (ctx, defaultOptions) {
    defaultOptions = defaultOptions || {};
    return function (note, time, duration, options) {
      console.warn('The oscillator player is deprecated.');
      console.log('Starting with version 0.9.0 you will have to wait until the soundfont is loaded to play sounds.');
      var midi = note > 0 && note < 129 ? +note : parser.midi(note);
      var freq = midi ? parser.midiToFreq(midi, 440) : null;
      if (!freq) return
  
      duration = duration || 0.2;
  
      options = options || {};
      var destination = options.destination || defaultOptions.destination || ctx.destination;
      var vcoType = options.vcoType || defaultOptions.vcoType || 'sine';
      var gain = options.gain || defaultOptions.gain || 0.4;
  
      var vco = ctx.createOscillator();
      vco.type = vcoType;
      vco.frequency.value = freq;
  
      /* VCA */
      var vca = ctx.createGain();
      vca.gain.value = gain;
  
      /* Connections */
      vco.connect(vca);
      vca.connect(destination);
  
      vco.start(time);
      if (duration > 0) vco.stop(time + duration);
      return vco
    }
  }
  
  /**
   * Given a note name, return the note midi number
   *
   * @name noteToMidi
   * @function
   * @param {String} noteName
   * @return {Integer} the note midi number or null if not a valid note name
   */
  Soundfont.noteToMidi = parser.midi;
  
  module.exports = Soundfont;
  
  },{"note-parser":8}],3:[function(require,module,exports){
  module.exports = ADSR;
  
  function ADSR(audioContext){
    var node = audioContext.createGain();
  
    var voltage = node._voltage = getVoltage(audioContext);
    var value = scale(voltage);
    var startValue = scale(voltage);
    var endValue = scale(voltage);
  
    node._startAmount = scale(startValue);
    node._endAmount = scale(endValue);
  
    node._multiplier = scale(value);
    node._multiplier.connect(node);
    node._startAmount.connect(node);
    node._endAmount.connect(node);
  
    node.value = value.gain;
    node.startValue = startValue.gain;
    node.endValue = endValue.gain;
  
    node.startValue.value = 0;
    node.endValue.value = 0;
  
    Object.defineProperties(node, props);
    return node
  }
  
  var props = {
  
    attack: { value: 0, writable: true },
    decay: { value: 0, writable: true },
    sustain: { value: 1, writable: true },
    release: {value: 0, writable: true },
  
    getReleaseDuration: {
      value: function(){
        return this.release
      }
    },
  
    start: {
      value: function(at){
        var target = this._multiplier.gain;
        var startAmount = this._startAmount.gain;
        var endAmount = this._endAmount.gain;
  
        this._voltage.start(at);
        this._decayFrom = this._decayFrom = at+this.attack;
        this._startedAt = at;
  
        var sustain = this.sustain;
  
        target.cancelScheduledValues(at);
        startAmount.cancelScheduledValues(at);
        endAmount.cancelScheduledValues(at);
  
        endAmount.setValueAtTime(0, at);
  
        if (this.attack){
          target.setValueAtTime(0, at);
          target.linearRampToValueAtTime(1, at + this.attack);
  
          startAmount.setValueAtTime(1, at);
          startAmount.linearRampToValueAtTime(0, at + this.attack);
        } else {
          target.setValueAtTime(1, at);
          startAmount.setValueAtTime(0, at);
        }
  
        if (this.decay){
          target.setTargetAtTime(sustain, this._decayFrom, getTimeConstant(this.decay));
        }
      }
    },
  
    stop: {
      value: function(at, isTarget){
        if (isTarget){
          at = at - this.release;
        }
  
        var endTime = at + this.release;
        if (this.release){
  
          var target = this._multiplier.gain;
          var startAmount = this._startAmount.gain;
          var endAmount = this._endAmount.gain;
  
          target.cancelScheduledValues(at);
          startAmount.cancelScheduledValues(at);
          endAmount.cancelScheduledValues(at);
  
          var expFalloff = getTimeConstant(this.release);
  
          // truncate attack (required as linearRamp is removed by cancelScheduledValues)
          if (this.attack && at < this._decayFrom){
            var valueAtTime = getValue(0, 1, this._startedAt, this._decayFrom, at);
            target.linearRampToValueAtTime(valueAtTime, at);
            startAmount.linearRampToValueAtTime(1-valueAtTime, at);
            startAmount.setTargetAtTime(0, at, expFalloff);
          }
  
          endAmount.setTargetAtTime(1, at, expFalloff);
          target.setTargetAtTime(0, at, expFalloff);
        }
  
        this._voltage.stop(endTime);
        return endTime
      }
    },
  
    onended: {
      get: function(){
        return this._voltage.onended
      },
      set: function(value){
        this._voltage.onended = value;
      }
    }
  
  };
  
  var flat = new Float32Array([1,1]);
  function getVoltage(context){
    var voltage = context.createBufferSource();
    var buffer = context.createBuffer(1, 2, context.sampleRate);
    buffer.getChannelData(0).set(flat);
    voltage.buffer = buffer;
    voltage.loop = true;
    return voltage
  }
  
  function scale(node){
    var gain = node.context.createGain();
    node.connect(gain);
    return gain
  }
  
  function getTimeConstant(time){
    return Math.log(time+1)/Math.log(100)
  }
  
  function getValue(start, end, fromTime, toTime, at){
    var difference = end - start;
    var time = toTime - fromTime;
    var truncateTime = at - fromTime;
    var phase = truncateTime / time;
    var value = start + phase * difference;
  
    if (value <= start) {
        value = start;
    }
    if (value >= end) {
        value = end;
    }
  
    return value
  }
  
  },{}],4:[function(require,module,exports){
  
  // DECODE UTILITIES
  function b64ToUint6 (nChr) {
    return nChr > 64 && nChr < 91 ? nChr - 65
      : nChr > 96 && nChr < 123 ? nChr - 71
      : nChr > 47 && nChr < 58 ? nChr + 4
      : nChr === 43 ? 62
      : nChr === 47 ? 63
      : 0
  }
  
  // Decode Base64 to Uint8Array
  // ---------------------------
  function decode (sBase64, nBlocksSize) {
    var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, '');
    var nInLen = sB64Enc.length;
    var nOutLen = nBlocksSize
      ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
      : nInLen * 3 + 1 >> 2;
    var taBytes = new Uint8Array(nOutLen);
  
    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
      nMod4 = nInIdx & 3;
      nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
      if (nMod4 === 3 || nInLen - nInIdx === 1) {
        for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
          taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
        }
        nUint24 = 0;
      }
    }
    return taBytes
  }
  
  module.exports = { decode: decode };
  
  },{}],5:[function(require,module,exports){
  
  /**
   * Given a url and a return type, returns a promise to the content of the url
   * Basically it wraps a XMLHttpRequest into a Promise
   *
   * @param {String} url
   * @param {String} type - can be 'text' or 'arraybuffer'
   * @return {Promise}
   */
  module.exports = function (url, type) {
    return new Promise(function (done, reject) {
      var req = new XMLHttpRequest();
      if (type) req.responseType = type;
  
      req.open('GET', url);
      req.onload = function () {
        req.status === 200 ? done(req.response) : reject(Error(req.statusText));
      };
      req.onerror = function () { reject(Error('Network Error')); };
      req.send();
    })
  };
  
  },{}],6:[function(require,module,exports){
  
  var base64 = require('./base64');
  var fetch = require('./fetch');
  
  // Given a regex, return a function that test if against a string
  function fromRegex (r) {
    return function (o) { return typeof o === 'string' && r.test(o) }
  }
  // Try to apply a prefix to a name
  function prefix (pre, name) {
    return typeof pre === 'string' ? pre + name
      : typeof pre === 'function' ? pre(name)
      : name
  }
  
  /**
   * Load one or more audio files
   *
   *
   * Possible option keys:
   *
   * - __from__ {Function|String}: a function or string to convert from file names to urls.
   * If is a string it will be prefixed to the name:
   * `load(ac, 'snare.mp3', { from: 'http://audio.net/samples/' })`
   * If it's a function it receives the file name and should return the url as string.
   * - __only__ {Array} - when loading objects, if provided, only the given keys
   * will be included in the decoded object:
   * `load(ac, 'piano.json', { only: ['C2', 'D2'] })`
   *
   * @param {AudioContext} ac - the audio context
   * @param {Object} source - the object to be loaded
   * @param {Object} options - (Optional) the load options for that object
   * @param {Object} defaultValue - (Optional) the default value to return as
   * in a promise if not valid loader found
   */
  function load (ac, source, options, defVal) {
    var loader =
      // Basic audio loading
        isArrayBuffer(source) ? loadArrayBuffer
      : isAudioFileName(source) ? loadAudioFile
      : isPromise(source) ? loadPromise
      // Compound objects
      : isArray(source) ? loadArrayData
      : isObject(source) ? loadObjectData
      : isJsonFileName(source) ? loadJsonFile
      // Base64 encoded audio
      : isBase64Audio(source) ? loadBase64Audio
      : isJsFileName(source) ? loadMidiJSFile
      : null;
  
    var opts = options || {};
    return loader ? loader(ac, source, opts)
      : defVal ? Promise.resolve(defVal)
      : Promise.reject('Source not valid (' + source + ')')
  }
  load.fetch = fetch;
  
  // BASIC AUDIO LOADING
  // ===================
  
  // Load (decode) an array buffer
  function isArrayBuffer (o) { return o instanceof ArrayBuffer }
  function loadArrayBuffer (ac, array, options) {
    return new Promise(function (done, reject) {
      ac.decodeAudioData(array,
        function (buffer) { done(buffer); },
        function () { reject("Can't decode audio data (" + array.slice(0, 30) + '...)'); }
      );
    })
  }
  
  // Load an audio filename
  var isAudioFileName = fromRegex(/\.(mp3|wav|ogg)(\?.*)?$/i);
  function loadAudioFile (ac, name, options) {
    var url = prefix(options.from, name);
    return load(ac, load.fetch(url, 'arraybuffer'), options)
  }
  
  // Load the result of a promise
  function isPromise (o) { return o && typeof o.then === 'function' }
  function loadPromise (ac, promise, options) {
    return promise.then(function (value) {
      return load(ac, value, options)
    })
  }
  
  // COMPOUND OBJECTS
  // ================
  
  // Try to load all the items of an array
  var isArray = Array.isArray;
  function loadArrayData (ac, array, options) {
    return Promise.all(array.map(function (data) {
      return load(ac, data, options, data)
    }))
  }
  
  // Try to load all the values of a key/value object
  function isObject (o) { return o && typeof o === 'object' }
  function loadObjectData (ac, obj, options) {
    var dest = {};
    var promises = Object.keys(obj).map(function (key) {
      if (options.only && options.only.indexOf(key) === -1) return null
      var value = obj[key];
      return load(ac, value, options, value).then(function (audio) {
        dest[key] = audio;
      })
    });
    return Promise.all(promises).then(function () { return dest })
  }
  
  // Load the content of a JSON file
  var isJsonFileName = fromRegex(/\.json(\?.*)?$/i);
  function loadJsonFile (ac, name, options) {
    var url = prefix(options.from, name);
    return load(ac, load.fetch(url, 'text').then(JSON.parse), options)
  }
  
  // BASE64 ENCODED FORMATS
  // ======================
  
  // Load strings with Base64 encoded audio
  var isBase64Audio = fromRegex(/^data:audio/);
  function loadBase64Audio (ac, source, options) {
    var i = source.indexOf(',');
    return load(ac, base64.decode(source.slice(i + 1)).buffer, options)
  }
  
  // Load .js files with MidiJS soundfont prerendered audio
  var isJsFileName = fromRegex(/\.js(\?.*)?$/i);
  function loadMidiJSFile (ac, name, options) {
    var url = prefix(options.from, name);
    return load(ac, load.fetch(url, 'text').then(midiJsToJson), options)
  }
  
  // convert a MIDI.js javascript soundfont file to json
  function midiJsToJson (data) {
    var begin = data.indexOf('MIDI.Soundfont.');
    if (begin < 0) throw Error('Invalid MIDI.js Soundfont format')
    begin = data.indexOf('=', begin) + 2;
    var end = data.lastIndexOf(',');
    return JSON.parse(data.slice(begin, end) + '}')
  }
  
  if (typeof module === 'object' && module.exports) module.exports = load;
  if (typeof window !== 'undefined') window.loadAudio = load;
  
  },{"./base64":4,"./fetch":5}],7:[function(require,module,exports){
  (function (global){
  (function(e){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=e();}else if(typeof define==="function"&&define.amd){define([],e);}else{var t;if(typeof window!=="undefined"){t=window;}else if(typeof global!=="undefined"){t=global;}else if(typeof self!=="undefined"){t=self;}else{t=this;}t.midimessage=e();}})(function(){return function o(e,t,s){function a(n,i){if(!t[n]){if(!e[n]){var l=typeof require=="function"&&require;if(!i&&l)return l(n,!0);if(r)return r(n,!0);var h=new Error("Cannot find module '"+n+"'");throw h.code="MODULE_NOT_FOUND",h}var c=t[n]={exports:{}};e[n][0].call(c.exports,function(t){var s=e[n][1][t];return a(s?s:t)},c,c.exports,o,e,t,s);}return t[n].exports}var r=typeof require=="function"&&require;for(var n=0;n<s.length;n++)a(s[n]);return a}({1:[function(e,t,s){Object.defineProperty(s,"__esModule",{value:true});s["default"]=function(e){function t(e){this._event=e;this._data=e.data;this.receivedTime=e.receivedTime;if(this._data&&this._data.length<2){console.warn("Illegal MIDI message of length",this._data.length);return}this._messageCode=e.data[0]&240;this.channel=e.data[0]&15;switch(this._messageCode){case 128:this.messageType="noteoff";this.key=e.data[1]&127;this.velocity=e.data[2]&127;break;case 144:this.messageType="noteon";this.key=e.data[1]&127;this.velocity=e.data[2]&127;break;case 160:this.messageType="keypressure";this.key=e.data[1]&127;this.pressure=e.data[2]&127;break;case 176:this.messageType="controlchange";this.controllerNumber=e.data[1]&127;this.controllerValue=e.data[2]&127;if(this.controllerNumber===120&&this.controllerValue===0){this.channelModeMessage="allsoundoff";}else if(this.controllerNumber===121){this.channelModeMessage="resetallcontrollers";}else if(this.controllerNumber===122){if(this.controllerValue===0){this.channelModeMessage="localcontroloff";}else{this.channelModeMessage="localcontrolon";}}else if(this.controllerNumber===123&&this.controllerValue===0){this.channelModeMessage="allnotesoff";}else if(this.controllerNumber===124&&this.controllerValue===0){this.channelModeMessage="omnimodeoff";}else if(this.controllerNumber===125&&this.controllerValue===0){this.channelModeMessage="omnimodeon";}else if(this.controllerNumber===126){this.channelModeMessage="monomodeon";}else if(this.controllerNumber===127){this.channelModeMessage="polymodeon";}break;case 192:this.messageType="programchange";this.program=e.data[1];break;case 208:this.messageType="channelpressure";this.pressure=e.data[1]&127;break;case 224:this.messageType="pitchbendchange";var t=e.data[2]&127;var s=e.data[1]&127;this.pitchBend=(t<<8)+s;break}}return new t(e)};t.exports=s["default"];},{}]},{},[1])(1)});
  
  }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
  },{}],8:[function(require,module,exports){
  !function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.NoteParser=t.NoteParser||{});}(this,function(t){function n(t,n){return Array(n+1).join(t)}function r(t){return "number"==typeof t}function e(t){return "string"==typeof t}function u(t){return void 0!==t}function c(t,n){return Math.pow(2,(t-69)/12)*(n||440)}function o(){return b}function i(t,n,r){if("string"!=typeof t)return null;var e=b.exec(t);if(!e||!n&&e[4])return null;var u={letter:e[1].toUpperCase(),acc:e[2].replace(/x/g,"##")};u.pc=u.letter+u.acc,u.step=(u.letter.charCodeAt(0)+3)%7,u.alt="b"===u.acc[0]?-u.acc.length:u.acc.length;var o=A[u.step]+u.alt;return u.chroma=o<0?12+o:o%12,e[3]&&(u.oct=+e[3],u.midi=o+12*(u.oct+1),u.freq=c(u.midi,r)),n&&(u.tonicOf=e[4]),u}function f(t){return r(t)?t<0?n("b",-t):n("#",t):""}function a(t){return r(t)?""+t:""}function l(t,n,r){return null===t||void 0===t?null:t.step?l(t.step,t.alt,t.oct):t<0||t>6?null:C.charAt(t)+f(n)+a(r)}function p(t){if((r(t)||e(t))&&t>=0&&t<128)return +t;var n=i(t);return n&&u(n.midi)?n.midi:null}function s(t,n){var r=p(t);return null===r?null:c(r,n)}function d(t){return (i(t)||{}).letter}function m(t){return (i(t)||{}).acc}function h(t){return (i(t)||{}).pc}function v(t){return (i(t)||{}).step}function g(t){return (i(t)||{}).alt}function x(t){return (i(t)||{}).chroma}function y(t){return (i(t)||{}).oct}var b=/^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/,A=[0,2,4,5,7,9,11],C="CDEFGAB";t.regex=o,t.parse=i,t.build=l,t.midi=p,t.freq=s,t.letter=d,t.acc=m,t.pc=h,t.step=v,t.alt=g,t.chroma=x,t.oct=y;});
  
  
  },{}],9:[function(require,module,exports){
  
  module.exports = function (player) {
    /**
     * Adds a listener of an event
     * @chainable
     * @param {String} event - the event name
     * @param {Function} callback - the event handler
     * @return {SamplePlayer} the player
     * @example
     * player.on('start', function(time, note) {
     *   console.log(time, note)
     * })
     */
    player.on = function (event, cb) {
      if (arguments.length === 1 && typeof event === 'function') return player.on('event', event)
      var prop = 'on' + event;
      var old = player[prop];
      player[prop] = old ? chain(old, cb) : cb;
      return player
    };
    return player
  };
  
  function chain (fn1, fn2) {
    return function (a, b, c, d) { fn1(a, b, c, d); fn2(a, b, c, d); }
  }
  
  },{}],10:[function(require,module,exports){
  
  var player = require('./player');
  var events = require('./events');
  var notes = require('./notes');
  var scheduler = require('./scheduler');
  var midi = require('./midi');
  
  function SamplePlayer (ac, source, options) {
    return midi(scheduler(notes(events(player(ac, source, options)))))
  }
  
  if (typeof module === 'object' && module.exports) module.exports = SamplePlayer;
  if (typeof window !== 'undefined') window.SamplePlayer = SamplePlayer;
  
  },{"./events":9,"./midi":11,"./notes":12,"./player":13,"./scheduler":14}],11:[function(require,module,exports){
  var midimessage = require('midimessage');
  
  module.exports = function (player) {
    /**
    * Connect a player to a midi input
    *
    * The options accepts:
    *
    * - channel: the channel to listen to. Listen to all channels by default.
    *
    * @param {MIDIInput} input
    * @param {Object} options - (Optional)
    * @return {SamplePlayer} the player
    * @example
    * var piano = player(...)
    * window.navigator.requestMIDIAccess().then(function (midiAccess) {
    *   midiAccess.inputs.forEach(function (midiInput) {
    *     piano.listenToMidi(midiInput)
    *   })
    * })
    */
    player.listenToMidi = function (input, options) {
      var started = {};
      var opts = options || {};
      var gain = opts.gain || function (vel) { return vel / 127 };
  
      input.onmidimessage = function (msg) {
        var mm = msg.messageType ? msg : midimessage(msg);
        if (mm.messageType === 'noteon' && mm.velocity === 0) {
          mm.messageType = 'noteoff';
        }
        if (opts.channel && mm.channel !== opts.channel) return
  
        switch (mm.messageType) {
          case 'noteon':
            started[mm.key] = player.play(mm.key, 0, { gain: gain(mm.velocity) });
            break
          case 'noteoff':
            if (started[mm.key]) {
              started[mm.key].stop();
              delete started[mm.key];
            }
            break
        }
      };
      return player
    };
    return player
  };
  
  },{"midimessage":7}],12:[function(require,module,exports){
  
  var note = require('note-parser');
  var isMidi = function (n) { return n !== null && n !== [] && n >= 0 && n < 129 };
  var toMidi = function (n) { return isMidi(n) ? +n : note.midi(n) };
  
  // Adds note name to midi conversion
  module.exports = function (player) {
    if (player.buffers) {
      var map = player.opts.map;
      var toKey = typeof map === 'function' ? map : toMidi;
      var mapper = function (name) {
        return name ? toKey(name) || name : null
      };
  
      player.buffers = mapBuffers(player.buffers, mapper);
      var start = player.start;
      player.start = function (name, when, options) {
        var key = mapper(name);
        var dec = key % 1;
        if (dec) {
          key = Math.floor(key);
          options = Object.assign(options || {}, { cents: Math.floor(dec * 100) });
        }
        return start(key, when, options)
      };
    }
    return player
  };
  
  function mapBuffers (buffers, toKey) {
    return Object.keys(buffers).reduce(function (mapped, name) {
      mapped[toKey(name)] = buffers[name];
      return mapped
    }, {})
  }
  
  },{"note-parser":15}],13:[function(require,module,exports){
  
  var ADSR = require('adsr');
  
  var EMPTY = {};
  var DEFAULTS = {
    gain: 1,
    attack: 0.01,
    decay: 0.1,
    sustain: 0.9,
    release: 0.3,
    loop: false,
    cents: 0,
    loopStart: 0,
    loopEnd: 0
  };
  
  /**
   * Create a sample player.
   *
   * @param {AudioContext} ac - the audio context
   * @param {ArrayBuffer|Object<String,ArrayBuffer>} source
   * @param {Onject} options - (Optional) an options object
   * @return {player} the player
   * @example
   * var SamplePlayer = require('sample-player')
   * var ac = new AudioContext()
   * var snare = SamplePlayer(ac, <AudioBuffer>)
   * snare.play()
   */
  function SamplePlayer (ac, source, options) {
    var connected = false;
    var nextId = 0;
    var tracked = {};
    var out = ac.createGain();
    out.gain.value = 1;
  
    var opts = Object.assign({}, DEFAULTS, options);
  
    /**
     * @namespace
     */
    var player = { context: ac, out: out, opts: opts };
    if (source instanceof AudioBuffer) player.buffer = source;
    else player.buffers = source;
  
    /**
     * Start a sample buffer.
     *
     * The returned object has a function `stop(when)` to stop the sound.
     *
     * @param {String} name - the name of the buffer. If the source of the
     * SamplePlayer is one sample buffer, this parameter is not required
     * @param {Float} when - (Optional) when to start (current time if by default)
     * @param {Object} options - additional sample playing options
     * @return {AudioNode} an audio node with a `stop` function
     * @example
     * var sample = player(ac, <AudioBuffer>).connect(ac.destination)
     * sample.start()
     * sample.start(5, { gain: 0.7 }) // name not required since is only one AudioBuffer
     * @example
     * var drums = player(ac, { snare: <AudioBuffer>, kick: <AudioBuffer>, ... }).connect(ac.destination)
     * drums.start('snare')
     * drums.start('snare', 0, { gain: 0.3 })
     */
    player.start = function (name, when, options) {
      // if only one buffer, reorder arguments
      if (player.buffer && name !== null) return player.start(null, name, when)
  
      var buffer = name ? player.buffers[name] : player.buffer;
      if (!buffer) {
        console.warn('Buffer ' + name + ' not found.');
        return
      } else if (!connected) {
        console.warn('SamplePlayer not connected to any node.');
        return
      }
  
      var opts = options || EMPTY;
      when = Math.max(ac.currentTime, when || 0);
      player.emit('start', when, name, opts);
      var node = createNode(name, buffer, opts);
      node.id = track(name, node);
      node.env.start(when);
      node.source.start(when);
      player.emit('started', when, node.id, node);
      if (opts.duration) node.stop(when + opts.duration);
      return node
    };
  
    // NOTE: start will be override so we can't copy the function reference
    // this is obviously not a good design, so this code will be gone soon.
    /**
     * An alias for `player.start`
     * @see player.start
     * @since 0.3.0
     */
    player.play = function (name, when, options) {
      return player.start(name, when, options)
    };
  
    /**
     * Stop some or all samples
     *
     * @param {Float} when - (Optional) an absolute time in seconds (or currentTime
     * if not specified)
     * @param {Array} nodes - (Optional) an array of nodes or nodes ids to stop
     * @return {Array} an array of ids of the stoped samples
     *
     * @example
     * var longSound = player(ac, <AudioBuffer>).connect(ac.destination)
     * longSound.start(ac.currentTime)
     * longSound.start(ac.currentTime + 1)
     * longSound.start(ac.currentTime + 2)
     * longSound.stop(ac.currentTime + 3) // stop the three sounds
     */
    player.stop = function (when, ids) {
      var node;
      ids = ids || Object.keys(tracked);
      return ids.map(function (id) {
        node = tracked[id];
        if (!node) return null
        node.stop(when);
        return node.id
      })
    };
    /**
     * Connect the player to a destination node
     *
     * @param {AudioNode} destination - the destination node
     * @return {AudioPlayer} the player
     * @chainable
     * @example
     * var sample = player(ac, <AudioBuffer>).connect(ac.destination)
     */
    player.connect = function (dest) {
      connected = true;
      out.connect(dest);
      return player
    };
  
    player.emit = function (event, when, obj, opts) {
      if (player.onevent) player.onevent(event, when, obj, opts);
      var fn = player['on' + event];
      if (fn) fn(when, obj, opts);
    };
  
    return player
  
    // =============== PRIVATE FUNCTIONS ============== //
  
    function track (name, node) {
      node.id = nextId++;
      tracked[node.id] = node;
      node.source.onended = function () {
        var now = ac.currentTime;
        node.source.disconnect();
        node.env.disconnect();
        node.disconnect();
        player.emit('ended', now, node.id, node);
      };
      return node.id
    }
  
    function createNode (name, buffer, options) {
      var node = ac.createGain();
      node.gain.value = 0; // the envelope will control the gain
      node.connect(out);
  
      node.env = envelope(ac, options, opts);
      node.env.connect(node.gain);
  
      node.source = ac.createBufferSource();
      node.source.buffer = buffer;
      node.source.connect(node);
      node.source.loop = options.loop || opts.loop;
      node.source.playbackRate.value = centsToRate(options.cents || opts.cents);
      node.source.loopStart = options.loopStart || opts.loopStart;
      node.source.loopEnd = options.loopEnd || opts.loopEnd;
      node.stop = function (when) {
        var time = when || ac.currentTime;
        player.emit('stop', time, name);
        var stopAt = node.env.stop(time);
        node.source.stop(stopAt);
      };
      return node
    }
  }
  
  function isNum (x) { return typeof x === 'number' }
  var PARAMS = ['attack', 'decay', 'sustain', 'release'];
  function envelope (ac, options, opts) {
    var env = ADSR(ac);
    var adsr = options.adsr || opts.adsr;
    PARAMS.forEach(function (name, i) {
      if (adsr) env[name] = adsr[i];
      else env[name] = options[name] || opts[name];
    });
    env.value.value = isNum(options.gain) ? options.gain
      : isNum(opts.gain) ? opts.gain : 1;
    return env
  }
  
  /*
   * Get playback rate for a given pitch change (in cents)
   * Basic [math](http://www.birdsoft.demon.co.uk/music/samplert.htm):
   * f2 = f1 * 2^( C / 1200 )
   */
  function centsToRate (cents) { return cents ? Math.pow(2, cents / 1200) : 1 }
  
  module.exports = SamplePlayer;
  
  },{"adsr":3}],14:[function(require,module,exports){
  
  var isArr = Array.isArray;
  var isObj = function (o) { return o && typeof o === 'object' };
  var OPTS = {};
  
  module.exports = function (player) {
    /**
     * Schedule a list of events to be played at specific time.
     *
     * It supports three formats of events for the events list:
     *
     * - An array with [time, note]
     * - An array with [time, object]
     * - An object with { time: ?, [name|note|midi|key]: ? }
     *
     * @param {Float} time - an absolute time to start (or AudioContext's
     * currentTime if provided number is 0)
     * @param {Array} events - the events list.
     * @return {Array} an array of ids
     *
     * @example
     * // Event format: [time, note]
     * var piano = player(ac, ...).connect(ac.destination)
     * piano.schedule(0, [ [0, 'C2'], [0.5, 'C3'], [1, 'C4'] ])
     *
     * @example
     * // Event format: an object { time: ?, name: ? }
     * var drums = player(ac, ...).connect(ac.destination)
     * drums.schedule(0, [
     *   { name: 'kick', time: 0 },
     *   { name: 'snare', time: 0.5 },
     *   { name: 'kick', time: 1 },
     *   { name: 'snare', time: 1.5 }
     * ])
     */
    player.schedule = function (time, events) {
      var now = player.context.currentTime;
      var when = time < now ? now : time;
      player.emit('schedule', when, events);
      var t, o, note, opts;
      return events.map(function (event) {
        if (!event) return null
        else if (isArr(event)) {
          t = event[0]; o = event[1];
        } else {
          t = event.time; o = event;
        }
  
        if (isObj(o)) {
          note = o.name || o.key || o.note || o.midi || null;
          opts = o;
        } else {
          note = o;
          opts = OPTS;
        }
  
        return player.start(note, when + (t || 0), opts)
      })
    };
    return player
  };
  
  },{}],15:[function(require,module,exports){
  
  var REGEX = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/;
  /**
   * A regex for matching note strings in scientific notation.
   *
   * @name regex
   * @function
   * @return {RegExp} the regexp used to parse the note name
   *
   * The note string should have the form `letter[accidentals][octave][element]`
   * where:
   *
   * - letter: (Required) is a letter from A to G either upper or lower case
   * - accidentals: (Optional) can be one or more `b` (flats), `#` (sharps) or `x` (double sharps).
   * They can NOT be mixed.
   * - octave: (Optional) a positive or negative integer
   * - element: (Optional) additionally anything after the duration is considered to
   * be the element name (for example: 'C2 dorian')
   *
   * The executed regex contains (by array index):
   *
   * - 0: the complete string
   * - 1: the note letter
   * - 2: the optional accidentals
   * - 3: the optional octave
   * - 4: the rest of the string (trimmed)
   *
   * @example
   * var parser = require('note-parser')
   * parser.regex.exec('c#4')
   * // => ['c#4', 'c', '#', '4', '']
   * parser.regex.exec('c#4 major')
   * // => ['c#4major', 'c', '#', '4', 'major']
   * parser.regex().exec('CMaj7')
   * // => ['CMaj7', 'C', '', '', 'Maj7']
   */
  function regex () { return REGEX }
  
  var SEMITONES = [0, 2, 4, 5, 7, 9, 11];
  /**
   * Parse a note name in scientific notation an return it's components,
   * and some numeric properties including midi number and frequency.
   *
   * @name parse
   * @function
   * @param {String} note - the note string to be parsed
   * @param {Boolean} isTonic - true if the note is the tonic of something.
   * If true, en extra tonicOf property is returned. It's false by default.
   * @param {Float} tunning - The frequency of A4 note to calculate frequencies.
   * By default it 440.
   * @return {Object} the parsed note name or null if not a valid note
   *
   * The parsed note name object will ALWAYS contains:
   * - letter: the uppercase letter of the note
   * - acc: the accidentals of the note (only sharps or flats)
   * - pc: the pitch class (letter + acc)
   * - step: s a numeric representation of the letter. It's an integer from 0 to 6
   * where 0 = C, 1 = D ... 6 = B
   * - alt: a numeric representation of the accidentals. 0 means no alteration,
   * positive numbers are for sharps and negative for flats
   * - chroma: a numeric representation of the pitch class. It's like midi for
   * pitch classes. 0 = C, 1 = C#, 2 = D ... It can have negative values: -1 = Cb.
   * Can detect pitch class enhramonics.
   *
   * If the note has octave, the parser object will contain:
   * - oct: the octave number (as integer)
   * - midi: the midi number
   * - freq: the frequency (using tuning parameter as base)
   *
   * If the parameter `isTonic` is set to true, the parsed object will contain:
   * - tonicOf: the rest of the string that follows note name (left and right trimmed)
   *
   * @example
   * var parse = require('note-parser').parse
   * parse('Cb4')
   * // => { letter: 'C', acc: 'b', pc: 'Cb', step: 0, alt: -1, chroma: -1,
   *         oct: 4, midi: 59, freq: 246.94165062806206 }
   * // if no octave, no midi, no freq
   * parse('fx')
   * // => { letter: 'F', acc: '##', pc: 'F##', step: 3, alt: 2, chroma: 7 })
   */
  function parse (str, isTonic, tuning) {
    if (typeof str !== 'string') return null
    var m = REGEX.exec(str);
    if (!m || !isTonic && m[4]) return null
  
    var p = { letter: m[1].toUpperCase(), acc: m[2].replace(/x/g, '##') };
    p.pc = p.letter + p.acc;
    p.step = (p.letter.charCodeAt(0) + 3) % 7;
    p.alt = p.acc[0] === 'b' ? -p.acc.length : p.acc.length;
    p.chroma = SEMITONES[p.step] + p.alt;
    if (m[3]) {
      p.oct = +m[3];
      p.midi = p.chroma + 12 * (p.oct + 1);
      p.freq = midiToFreq(p.midi, tuning);
    }
    if (isTonic) p.tonicOf = m[4];
    return p
  }
  
  /**
   * Given a midi number, return its frequency
   * @param {Integer} midi - midi note number
   * @param {Float} tuning - (Optional) the A4 tuning (440Hz by default)
   * @return {Float} frequency in hertzs
   */
  function midiToFreq (midi, tuning) {
    return Math.pow(2, (midi - 69) / 12) * (tuning || 440)
  }
  
  var parser = { parse: parse, regex: regex, midiToFreq: midiToFreq };
  var FNS = ['letter', 'acc', 'pc', 'step', 'alt', 'chroma', 'oct', 'midi', 'freq'];
  FNS.forEach(function (name) {
    parser[name] = function (src) {
      var p = parse(src);
      return p && (typeof p[name] !== 'undefined') ? p[name] : null
    };
  });
  
  module.exports = parser;
  
  // extra API docs
  /**
   * Get midi of a note
   *
   * @name midi
   * @function
   * @param {String} note - the note name
   * @return {Integer} the midi number of the note or null if not a valid note
   * or the note does NOT contains octave
   * @example
   * var parser = require('note-parser')
   * parser.midi('A4') // => 69
   * parser.midi('A') // => null
   */
  /**
   * Get freq of a note in hertzs (in a well tempered 440Hz A4)
   *
   * @name freq
   * @function
   * @param {String} note - the note name
   * @return {Float} the freq of the number if hertzs or null if not valid note
   * or the note does NOT contains octave
   * @example
   * var parser = require('note-parser')
   * parser.freq('A4') // => 440
   * parser.freq('A') // => null
   */
  
  },{}]};

let modulesByID = {};
function link(id) {
  if(!modulesByID[id]) {
    let _module = modulesByID[id] = { exports: {} };
    let _require = function(requiredName) {
      let requiredID = moduleDefs[id][1][requiredName];
      return link(requiredID || requiredName);
    };
    moduleDefs[id][0].call(_module.exports, _require, _module, _module.exports);
  }
  return modulesByID[id].exports;
}

let soundfont = link(1);

class Player {
    /**
     * Loads the necessary soundfonts and plays a song in a PlaybackStyle in the
     * browser.
     * @param {AudioContext=} context If you pass it an AudioContext it'll use
     * it. Otherwise it'll make its own.
     */
    constructor(context = new AudioContext({ latencyHint: "playback" })) {
        this.style = null;
        this.context = context;
        this.initialized = false;
        window.player = this;
    }
    setStyle(style) {
        return __awaiter(this, void 0, void 0, function* () {
            this.style = style;
            if (!style.initialized) {
                yield style.init();
            }
            this.initialized = false;
            this.soundfonts = new Map();
            const promises = [];
            for (const instrument of style.getInstruments()) {
                let sfpromise;
                if (instrument.startsWith('http://') || instrument.startsWith('https://')) {
                    // Soundfont has a bug where you can't just pass it a URL
                    // @TODO: open an issue there
                    sfpromise = soundfont.instrument(this.context, instrument, {
                        isSoundfontUrl: () => true,
                        nameToUrl: () => instrument
                    });
                }
                else if (instrument === 'percussion') {
                    sfpromise = soundfont.instrument(this.context, instrument, { soundfont: 'FluidR3_GM' });
                }
                else {
                    sfpromise = soundfont.instrument(this.context, instrument);
                }
                promises.push(yield sfpromise.then(font => {
                    this.soundfonts.set(instrument, font);
                }));
            }
            yield Promise.all(promises);
            this.initialized = true;
        });
    }
    play(song) {
        if (!this.style) {
            throw new Error('No style selected');
        }
        if (!this.initialized) {
            throw new Error('A style hasn\'t finished loading');
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        const compiledSong = this.style.compile(song);
        const tempoCoef = 0.4; // WHATEVER IDC HOW ANYTHING WORKS
        const startTime = this.context.currentTime + 1;
        for (const [instrument, notes] of compiledSong) {
            const soundfont = this.soundfonts.get(instrument);
            for (const note of notes) {
                const start = startTime + (tempoCoef * note.time);
                const dur = tempoCoef * note.duration - 0.05;
                soundfont.play(note.midi, start, {
                    duration: dur,
                    gain: note.volume
                });
            }
        }
    }
}

exports.PlaybackStyle = PlaybackStyle;
exports.Player = Player;
