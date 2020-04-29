import { PlaybackMelodicBeatValue, PlaybackDrumBeatValue, PlaybackAnchorValue } from './beatValues';

export abstract class PlaybackValueBase {
  public type: string;
  public value: any;
  public abstract toBoolean(): boolean;
  public abstract toOutputString(): string;
}

export class PlaybackNilValue implements PlaybackValueBase {
  public type: 'Nil' = 'Nil';
  public value: null = null;
  public toBoolean() { return false; }
  public toOutputString() { return 'Nil'; }
}

export class PlaybackStringValue implements PlaybackValueBase {
  public type: 'string' = 'string';
  public value: string;
  constructor(value: string) { this.value = value; }
  public toBoolean() { return this.value !== ''; }
  public toOutputString() {
    // @TODO: store raw value from tokenizer? (which may not always exist for programmatically-generated strings)
    // At least this is consistent...
    return `"${this.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
}

export class PlaybackNumberValue implements PlaybackValueBase {
  public type: 'number' = 'number';
  public value: number;
  constructor(value: number) { this.value = value; }
  public toInteger() { return Math.floor(this.value); }
  public toBoolean() { return this.value !== 0; }
  public toOutputString() { return this.value.toString(); }
}

export class PlaybackBooleanValue implements PlaybackValueBase {
  public type: 'boolean' = 'boolean';
  public value: boolean;
  constructor(value: boolean) { this.value = value; }
  public toBoolean() { return this.value; }
  public toOutputString() { return this.value ? 'true' : 'false'; }
}

export class PlaybackTimeSignatureValue implements PlaybackValueBase {
  public type: 'time_signature' = 'time_signature';
  public value: [number, number];
  constructor(value: [number, number]) { this.value = value; }
  public toBoolean() { return true; }
  public toOutputString() { return `${this.value[0]} / ${this.value[1]}`; }
}

export { PlaybackMelodicBeatValue, PlaybackDrumBeatValue, PlaybackAnchorValue };

export type PlaybackValue =
  | PlaybackNilValue
  | PlaybackStringValue
  | PlaybackNumberValue
  | PlaybackBooleanValue
  | PlaybackMelodicBeatValue
  | PlaybackDrumBeatValue
  | PlaybackAnchorValue
  | PlaybackTimeSignatureValue;
