const assert = require('assert').strict;
const Song = require('../dist/notochord-song.cjs');
const blueSkies = require('../blueSkies.cjs');

describe('Song', () => {
  describe('#getTransposedKey()', () => {
    it('returns key when transpose == 0', () => {
      const song = new Song(blueSkies);
      assert.equal(song.get('key'), song.getTransposedKey());
    });

    it('returns transposed key', () => {
      const song = new Song(blueSkies);
      song.set('transpose', 1);
      assert.equal(song.getTransposedKey(), 'Db');
    });
  });

  describe('#get()', () => {
    it('returns value for properties that exist', () => {
      const song = new Song(blueSkies);
      assert.equal(song.get('key'), 'C');
      assert.equal(song.get('transpose'), 0);
      assert.deepEqual(song.get('timeSignature'), [4, 4]);
    });
    it('returns undefined for properties that do not exist', () => {
      const song = new Song(blueSkies);
      assert.equal(song.get('foo'), undefined);
    });
  });

  describe('#set()', () => {
    it('should change the value returned by #get()', () => {
      const song = new Song(blueSkies);
      song.set('key', 'F');
      assert.equal(song.get('key'), 'F');
    });
    it('should call callbacks registered with #onChange() with matching property', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = value => {
        assert.equal(value, 'G');
        ran = true;
      };
      song.onChange('key', cb);
      song.set('key', 'G');
      assert(ran);
    });
    it('should not call callbacks registered with #onChange() with non-matching property', () => {
      const song = new Song(blueSkies);
      const cb = () => {
        throw new assert.AssertionError('this should not be called');
      };
      song.onChange('composer', cb);
      song.set('updatedOn', 12345);
    });
  });

  describe('#onChange()', () => {
    it('should register a callback that runs on #set() with matching property', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = value => {
        assert.equal(value, 'G');
        ran = true;
      };
      song.onChange('key', cb);
      song.set('key', 'G');
      assert(ran);
    });
    it('property=="measures" registers a callback that runs on a chord change', () => {
      const song = new Song(blueSkies);
      let ran = false;
      const cb = value => {
        assert.equal(value.oldValue, 'Am');
        assert.equal(value.newValue, 'D7');
        ran = true;
      };
      song.onChange('measures', cb);
      song.measures[0].beats[0].chord = 'D7';
      assert(ran);
    })
  });
  
  describe('#serialize()', () => {
    it('returns a similar value to the imported pseudosong', () => {
      const song = new Song(blueSkies);
      const origKeys = new Set(Object.keys(blueSkies));
      const serializedKeys = new Set(Object.keys(song.serialize()));
      // deepEqual on the serialized thing itself fails because of chord aliases
      assert.deepEqual(serializedKeys, origKeys);
    });
  });
});

describe('SongIterator', () => {
  describe('#get()', () => {
    it('returns same value as song.measures[idx]', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      assert.equal(songIterator.get(0), song.measures[0]);
    });
  });

  describe('#getRelative()', () => {
    it('returns value relative to iterator index', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      assert.equal(songIterator.getRelative(1), song.measures[1]);
      songIterator.next();
      assert.equal(songIterator.getRelative(1), song.measures[2]);
    });
  });

  describe('#next()', () => {
    it('iterates over song.measures following the Iterator Protocol', () => {
      const song = new Song(blueSkies);
      const songIterator = song[Symbol.iterator]();
      for(const measure of song.measures) {
        const {done, value} = songIterator.next();
        assert.equal(done, false);
        assert.equal(value, measure);
      }
      const {done, value} = songIterator.next();
      assert.equal(done, true);
      assert.equal(value, undefined);
    });
  });
});

describe('Measure', () => {
  describe('#index', () => {
    it('is the absolute index of the measure the first time it appears in song.measures', () => {
      const {measures} = new Song(blueSkies);
      const measure = measures[0];
      assert.equal(measure.index, measures.indexOf(measure));
    })
  });
});

describe('Beat', () => {
  describe('#index', () => {
    it('matches the beat\'s index in the measure, 0-indexed', () => {
      const beats = (new Song(blueSkies)).measures[0].beats;
      assert.equal(beats[0].index, 0);
      assert.equal(beats[1].index, 1);
      assert.equal(beats[2].index, 2);
      assert.equal(beats[3].index, 3);
    })
  });

  describe('#measure', () => {
    it('matches the beat\'s parent measure', () => {
      const measure = (new Song(blueSkies)).measures[0];
      const beat = measure.beats[0];
      assert.equal(beat.measure, measure);
    })
  });

  describe('#chord', () => {
    describe('get', () => {
      it('returns null if the beat is empty', () => {
        const beat = (new Song(blueSkies)).measures[0].beats[1];
        assert.strictEqual(beat.chord, null);
      });
      it('respects transpose', () => {
        const song = new Song(blueSkies);
        const beat = song.measures[0].beats[0];
        assert.equal(beat.chord, 'Am');
        song.set('transpose', 2);
        assert.equal(beat.chord, 'Bm');
      });
    });
    describe('set', () => {
      it('aliases chords', () => {
        const beat = (new Song(blueSkies)).measures[0].beats[0];
        beat.chord = 'C-';
        assert.equal(beat.chord, 'Cm');
        beat.chord = 'Caug7';
        assert.equal(beat.chord, 'C+7');
      });
      it('respects transpose', () => {
        const song = new Song(blueSkies);
        const beat = song.measures[0].beats[0];
        song.set('transpose', 1);
        beat.chord = 'G#m';
        song.set('transpose', 0);
        assert.equal(beat.chord, 'Gm');
      });
    });
  });

  describe('#scaleDegree', () => {
    it('ignores transpose', () => {
      const song = new Song(blueSkies);
      const beat = song.measures[0].beats[0];
      const expected = {
        flat: false,
        numeral: 'vi',
        quality: 'm'
      }
      assert.deepEqual(beat.scaleDegree, expected);
      song.set('transpose', 1);
      assert.deepEqual(beat.scaleDegree, expected);
    });
    it('capitalizes based on quality of chord', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[0];
      beat.chord = 'C';
      assert.equal(beat.scaleDegree.numeral, 'I');
      beat.chord = 'C-';
      assert.equal(beat.scaleDegree.numeral, 'i');
      beat.chord = 'C+';
      assert.equal(beat.scaleDegree.numeral, 'I');
      beat.chord = 'Co';
      assert.equal(beat.scaleDegree.numeral, 'i');
    });
    it('includes quality of chord', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[0];
      const expected = {
        flat: false,
        numeral: 'vi',
        quality: 'm'
      }
      assert.deepEqual(beat.scaleDegree, expected);
    });
    it('returns null if the beat is empty', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[1];
      assert.strictEqual(beat.scaleDegree, null);
    });
    it('throws when set (for now)', () => {
      const beat = (new Song(blueSkies)).measures[0].beats[0];
      assert.throws(() => {
        beat.scaleDegree = 'C';
      });
    });
  });
});