import { PlaybackValueBase } from './valueBase';
import { MelodicBeatValue, DrumBeatValue, AnchorValue } from './beatValues';
import { NoteValue, NoteSetValue, TrackNoteMap } from './noteValues';

export class NilValue extends PlaybackValueBase {
  public type: 'Nil' = 'Nil';
  public value = null;
  public toBoolean(): boolean { return false; }
  public toOutputString(): string { return 'Nil'; }
}

export class StringValue extends PlaybackValueBase {
  public type: 'string' = 'string';
  public value: string;
  public constructor(value: string) { super(); this.value = value; }
  public toBoolean(): boolean { return this.value !== ''; }
  public toOutputString(): string {
    // @TODO: store raw value from tokenizer? (which may not always exist for programmatically-generated strings)
    // At least this is consistent...
    return `"${this.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
}

export class NumberValue extends PlaybackValueBase {
  public type: 'number' = 'number';
  public value: number;
  public constructor(value: number) { super(); this.value = value; }
  public toInteger(): number { return Math.floor(this.value); }
  public toBoolean(): boolean { return this.value !== 0; }
  public toOutputString(): string { return this.value.toString(); }
}

export class BooleanValue extends PlaybackValueBase {
  public type: 'boolean' = 'boolean';
  public value: boolean;
  public constructor(value: boolean) { super(); this.value = value; }
  public toBoolean(): boolean { return this.value; }
  public toOutputString(): string { return this.value ? 'true' : 'false'; }
}

export class TimeSignatureValue extends PlaybackValueBase {
  public type: 'time_signature' = 'time_signature';
  public value: [number, number];
  public constructor(value: [number, number]) { super(); this.value = value; }
  public toBoolean(): boolean { return true; }
  public toOutputString(): string { return `${this.value[0]} / ${this.value[1]}`; }
}

export {
  MelodicBeatValue, DrumBeatValue, AnchorValue,
  NoteValue, NoteSetValue, TrackNoteMap,
};

export type PlaybackValue =
  | NilValue
  | StringValue
  | NumberValue
  | BooleanValue
  | MelodicBeatValue
  | DrumBeatValue
  | AnchorValue
  | TimeSignatureValue
  | NoteValue
  | NoteSetValue
  | TrackNoteMap;
