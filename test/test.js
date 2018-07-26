import parser_tests from '../src/parser/test/test.js';
import {Song} from './song.js';
import {PlaybackStyle} from '../src/index.js';

//const verbose = process.argv.includes('--verbose');

// run parser tests
parser_tests();

// @TODO: have a set of tests directly on playback.js to make sure the apis
// export correctly cuz webpack is being iffy about that

(async function() {
  let song = new Song([
    // Each array is a measure, and each item in an array is a beat.
    // null inside a measure means there's no chord set for that beat.
    ['A-', null, null, null], ['E', null, null, null], ['A-7', null, null, null], ['A-6', null, null, null],
    ['CM7', null, 'A7', null], ['D-7', null, 'G7', null], ['C6', null, null, null], ['Bdim7', null, 'E7', null],
    ['A-', null, null, null], ['E', null, null, null], ['A-7', null, null, null], ['A-6', null, null, null],
    ['CM7', null, 'A7', null], ['D-7', null, 'G7', null], ['C6', null, null, null], ['C6', null, null, null]
  ]);

  let style = new PlaybackStyle('./test/styles/example.play');
  await style.init();
  style.play(song);
})();