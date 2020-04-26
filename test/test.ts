const { Song } = require('notochord-song');
const blueSkies = require('notochord-song/blueSkies.mjs');
const {PlaybackStyle} = require('../dist/playback.web.mjs');

//const verbose = process.argv.includes('--verbose');

// @TODO: have a set of tests directly on playback.js to make sure the apis
// export correctly cuz webpack is being iffy about that

(async function() {
  let song = new Song(blueSkies);
  let style = new PlaybackStyle('./test/styles/example.play');
  await style.init();
  style.play(song);
})();