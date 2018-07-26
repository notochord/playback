import * as tonal from 'tonal';

// special pitch value meaning the note will be set later by a DrumBeatGroup
let AwaitingDrum = Symbol('AwaitingDrum');
export {AwaitingDrum};

export class Note {
  /**
   * @param {Object} opts Options object.
   * @param {number} opts.time The note's time, in beats.
   * @param {string} opts.pitch A string representing the pitch and octave of the note. e.x. 'A4'
   * @param {number} opts.duraion The note's duration, in beats.
   * @param {number} opts.volume The note's volume, as a float 0-1 (inclusive).
   */
  constructor(opts) {
    /**
     * The note's time, in beats.
     * @type {number}
     */
    this.time = opts.time;
    /**
     * A string representing the pitch and octave of the note.
     * @type {string}
     * @example 'A4'
     */
    this.pitch = opts.pitch;
    /**
     * The note's duration, in beats.
     * @type {number}
     */
    this.duration = opts.duration;
    /**
     * The note's volume, as a float 0-1 (inclusive).
     * @type {number}
     */
    this.volume = opts.volume;
  }
  /**
   * An integer representing the MIDI pitch value of the note.
   * @type {number}
   */
  get midi() {
    if(this.pitch === AwaitingDrum) {
      return null;
    } else {
      return tonal.Note.midi(this.pitch);
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

export class NoteSet extends Array {
  constructor() {
    super();
    this.push(...arguments);
  }
}
