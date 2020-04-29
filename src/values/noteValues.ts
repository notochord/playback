import { PlaybackValueBase } from './valueBase';

export class NoteValue extends PlaybackValueBase {
  public type: 'note' = 'note';
  public value = null;
  public time: number; // The note's time, in beats.
  public pitch: string | 'AwaitingDrum'; // A string representing the pitch and octave of the note (e.g. A4)
  public duration: number; // The note's duration, in beats.
  public volume: number; // The note's volume, as a float 0-1 (inclusive).
  public toBoolean(): boolean { return true; }
  public toOutputString(): string { return '<note>'; }

  /**
   * @param {Object} opts Options object.
   * @param {number} opts.time The note's time, in beats.
   * @param {string | 'AwaitingDrum'} opts.pitch A string representing the pitch and octave of the note. e.x. 'A4'
   * @param {number} opts.duraion The note's duration, in beats.
   * @param {number} opts.volume The note's volume, as a float 0-1 (inclusive).
   */
  public constructor(opts: any) {
    super();
    this.time = opts.time;
    this.pitch = opts.pitch;
    this.duration = opts.duration;
    this.volume = opts.volume;
  }
}

export class NoteSetValue extends PlaybackValueBase {
  public type: 'note_set' = 'note_set';
  public value: NoteValue[] = [];
  public constructor(value: NoteValue[] = []) { super(); this.value = value; }
  public toBoolean(): boolean { return true; }
  public toOutputString(): string { return '<note set>'; }
  public push(...newItems: NoteValue[]): NoteSetValue {
    return new NoteSetValue([...this.value, ...newItems]);
  }
  public concat(newItems: NoteSetValue): NoteSetValue {
    return new NoteSetValue([...this.value, ...newItems.value]);
  }
}

export class TrackNoteMap extends PlaybackValueBase {
  public type: 'track_note_map' = 'track_note_map';
  public value = new Map<string, NoteSetValue>();
  public toBoolean(): boolean { return true; }
  public toOutputString(): string { return '<track note map>'; }
}