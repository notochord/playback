# notochord-song

This is the song container used by other parts of [notochord](http://notochord.herokuapp.com).
Notochord is a chord player, so in the notochord universe, a song is not so much
a melody and lyrics as it is a set of chords. notochord-song does several things
that make it well-suited for this purpose:

- Stores data about the song, such as title, author, key, and preferred
  transposition
- Handles repeats (even nested ones if you want that)
- Handles transposition of chords
- Allows subscription to changes

## NPM scripts

```shell
# Build
npm run-script build

# Run test suite
npm test
```

## Usage

```javascript
import Song from 'notochord-song';

// This is the serialized format. song.serialize() turns a song into this kind
// of object.
const song = new Song({
  title: 'Blue Skies',
  composer: 'Irving Berlin',
  key: 'C',
  measureContainer: {
    type: 'repeat',
    repeatInfo: {
      repeatCount: 2
    },
    measures: [
      ['A-', null, null, null],
      ['E', null, null, null],
      ['A-7', null, null, null],
      ['A-6', null, null, null],
      ['CM7', null, 'A7', null],
      ['D-7', null, 'G7', null],

      {
        type: 'ending',
        repeatInfo: {
          ending: 1
        },
        measures: [
          ['C6', null, null, null],
          ['Bdim7', null, 'E7', null],
        ]
      },

      {
        type: 'ending',
        repeatInfo: {
          ending: 2
        },
        measures: [
          ['C6', null, null, null],
          ['C6', null, null, null],
        ]
      }
    ]
  }});

  // you can get and set properties of the song
  song.get('key'); // -> 'C'
  song.set('composer', 'Still Irving Berlin');

  // you can also subscribe to changes to properties of the song
  song.onChange('composer', newValue => console.log(newValue));
  song.set('composer', 'Irving Berlin'); // logs "Irving Berlin"


  // you can iterate over the measures of the song
  for(const measure of song) {
    // each has a beats array
    const beat = measure.beats[0];

    // the beat has a .chord property that respects the "transpose" property of the song
    beat.chord; // -> 'Am'
    song.set('transpose', 2); // (semitones)
    beat.chord; // -> 'Bm'
    // setting it also respects the transpose property
    beat.chord = 'D'
    song.set('transpose', 0);
    beat.chord; // -> 'C'

    // it also has a .scaleDegree property
    beat.scaleDegree; // -> {numeral: 'I', flat: false, quality: ''}

    // you can subscribe to changes to measures as well
    song.onChange('measures', info => console.log(info));
    beat.chord = 'G7'; // logs an object with info about the change
  }
```