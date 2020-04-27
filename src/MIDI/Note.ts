import drumJson from './drums.json.js';
import * as _Tonal from 'tonal';
const tonal = (_Tonal as any).default || _Tonal;

/**
 * There are some inconsistencies with the official MIDI drum names, this
 * transformation will hopefully ease the pain there.
 * Note: What's the more general word for case-folding? Just "normalizing"? Eh
 * @param {string} name
 * @return {string}
 */
function normalizeDrumName(name) {
  return name.toLowerCase().replace(/ |-|_/g, ' ');
}

// make a map of drum names, which is the inverse of the given JSON file
let DRUM_MAP = new Map();
for(let midi in drumJson) {
  let name = normalizeDrumName(drumJson[midi])
  DRUM_MAP.set(name, midi);
}

/**
 * Special pitch value meaning the note will be set later by a DrumBeatGroup
 */
let AwaitingDrum = Symbol('AwaitingDrum');
export {AwaitingDrum};

export class Note {
  public time: number; // The note's time, in beats.
  public pitch: string | symbol; // A string representing the pitch and octave of the note (e.g. A4)
  public duration: number; // The note's duration, in beats.
  public volume: number; // The note's volume, as a float 0-1 (inclusive).

  /**
   * @param {Object} opts Options object.
   * @param {number} opts.time The note's time, in beats.
   * @param {string | symbol} opts.pitch A string representing the pitch and octave of the note. e.x. 'A4'
   * @param {number} opts.duraion The note's duration, in beats.
   * @param {number} opts.volume The note's volume, as a float 0-1 (inclusive).
   */
  constructor(opts) {
    this.time = opts.time;
    this.pitch = opts.pitch;
    this.duration = opts.duration;
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
      let drumValue = DRUM_MAP.get(normalizeDrumName(this.pitch));
      if(drumValue) {
        return drumValue;
      } else {
        return tonal.Note.midi(this.pitch);
      }
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
  constructor(...args) {
    super();
    this.push(...args);
  }
}