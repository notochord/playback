/*
* Everything in this file will move soon, this is just for testing rn
*/

/**
 * An array-like object that represents a song
 */
export class Song extends Array {
  constructor(measures) {
    super(...measures);
    this._idx = -1;
  }
  getKey() {
    return this[0][0];
  }
  [Symbol.iterator]() {
    return new SongIterator(this);
  }
}

/**
 * An extension to the Iterator protocol with some extra bits for our enjoyment
 */
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