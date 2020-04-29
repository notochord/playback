import Song from "./notochord-song";

export default class SongIterator {
  public song: Song;
  public index?: number;

  constructor(song) {
    this.song = song;
    this.index = 0;
  }
  /**
   * Get a measure by absolute index, without advancing the iterator.
   * @param {number} idx 
   * @returns {Measure}
   */
  get(idx) {
    return this.song.measures[idx];
  }
  /**
   * Get a measure relative to the current one, without advancing the iterator.
   * @param {number} [delta=0] 
   * @returns {Measure}
   */
  getRelative(delta = 0) {
    const idx = this.index + delta;
    return this.song.measures[idx];
  }
  /**
   * Iterates over measures in playback order. See the Iterator Protocol.
   * @returns {{done: boolean, value: Measure|undefined}}
   */
  next() {
    if(this.index < this.song.measures.length) {
      return {value: this.song.measures[this.index++], done: false};
    } else {
      this.index++;
      return {done: true};
    }
  }
}