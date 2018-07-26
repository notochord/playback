import moo from '../lib/moo/moo.js';

export default moo.states({
  main: {
    comment: {
      match:/\/\/.*?(?:\n|$)/, // consuming newline should be fine since this is _?. Can I do eof anchor here? Guess we'll find out 
      lineBreaks: true
    },
    quoted_string: /"(?:[^\\"\n]|\\.)*"/, // thanx https://stackoverflow.com/a/249937/1784306
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
    left_angle: {match: '<', push: 'beat'},
    operators: ['&', '+', '-', '*', '/', '.']
  },
  beat: {
    beat_ws: / +/,
    beat_colon: ':',
    beat_number: /(?:\d*\.)?\d+/,
    beat_flag: /[a-zA-Z]/,
    beat_right_angle: {match: '>', pop: true},
    beat_operators: ['|', '+', '-', '*', '/']
  }
});
