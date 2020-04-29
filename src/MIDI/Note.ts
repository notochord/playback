// @ts-ignore
import drumJson from './drums.json.js';
// @ts-ignore
import * as _Tonal from 'tonal';
const tonal = (_Tonal as any).default || _Tonal;

/**
 * There are some inconsistencies with the official MIDI drum names, this
 * transformation will hopefully ease the pain there.
 * Note: What's the more general word for case-folding? Just "normalizing"? Eh
 * @param {string} name
 * @return {string}
 */
function normalizeDrumName(name: string): string {
  return name.toLowerCase().replace(/ |-|_/g, ' ');
}

// make a map of drum names, which is the inverse of the given JSON file
const DRUM_MAP = new Map();
for(const midi in drumJson) {
  const name = normalizeDrumName(drumJson[midi])
  DRUM_MAP.set(name, midi);
}

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
  public constructor(opts: any, measureOffset: number) {
    this.time = opts.time + measureOffset;
    this.pitch = opts.pitch;
    this.duration = opts.duration;
    this.volume = opts.volume;
  }
  /**
   * An integer representing the MIDI pitch value of the note.
   * @type {number}
   */
  public get midi(): string {
    // Special pitch value meaning the note will be set later by a DrumBeatGroup
    if(this.pitch === 'AwaitingDrum') {
      return '';
    } else {
      const drumValue = DRUM_MAP.get(normalizeDrumName(this.pitch as string));
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
  public get velocity(): number {
    return Math.floor(this.volume * 127);
  }

  public swing(): void {
    const intPart = Math.floor(this.time);
    let floatPart = this.time - intPart;
    if(floatPart <= 0.5) {
      floatPart *= 2;
      floatPart = (2/3) * floatPart;
    } else {
      floatPart = 2 * (floatPart - 0.5);
      floatPart = (2/3) + ((1/3) * floatPart);
    }
    this.time = intPart + floatPart;
  }
}