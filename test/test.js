import parser_tests from '../src/parser/test/test.js';
import parser from '../src/parser/parser.js';
import index from '../src/index.js';

//const verbose = process.argv.includes('--verbose');

// run parser tests
parser_tests();

// @TODO: have a set of tests directly on playback.js to make sure the apis
// export correctly cuz webpack is being iffy about that

class Song {
  constructor(measures) {
    this.measures = measures;
    this.length = this.measures.length;
    this._idx = -1;
  }
  next() {
    if(++this._idx < this.length) {
      return {value: this.measures[this._idx], done: false};
    } else {
      return {value: undefined, done: true};
    }
  }
  lookahead(dist) {
    return this.measures[this._idx + dist];
  }
}

(async function() {
  let song = new Song([
    // Each array is a measure, and each item in an array is a beat.
    // null inside a measure means there's no chord set for that beat.
    ['A-', null, null, null], ['E', null, null, null], ['A-7', null, null, null], ['A-6', null, null, null],
    ['CM7', null, 'A7', null], ['D-7', null, 'G7', null], ['C6', null, null, null], ['Bdim7', null, 'E7', null],
    ['A-', null, null, null], ['E', null, null, null], ['A-7', null, null, null], ['A-6', null, null, null],
    ['CM7', null, 'A7', null], ['D-7', null, 'G7', null], ['C6', null, null, null], ['C6', null, null, null]
  ]);

  let style = new index.PlaybackStyle('./test/styles/example.play');
  await style._loadDependencies();
  style.play(song)
})();
