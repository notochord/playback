import parser_tests from '../src/parser/test/test.js';
import parser from '../src/parser/parser.js';
import index from '../src/index.js';

//const verbose = process.argv.includes('--verbose');

// run parser tests
parser_tests();

// @TODO: have a set of tests directly on playback.js to make sure the apis
// export correctly cuz webpack is being iffy about that

class Song extends Array {
  constructor(measures) {
    super(...measures);
    this._idx = -1;
  }
  [Symbol.iterator]() {
    return new SongIterator(this);
  }
}

class SongIterator {
  constructor(song) {
    this.song = song;
    this.index = -1;
  }
  next() {
    if(++this.index < this.song.length) {
      return {value: this.song[this.index], done: false};
    } else {
      return {value: undefined, done: true};
    }
  }
  get(idx) {
    return this.song[idx];
  }
  getRelative(dist = 0) {
    return this.song[this.index + dist];
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
  await style.init();
  style.play(song)
})();
