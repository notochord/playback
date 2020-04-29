import { PlaybackMelodicBeatValue, PlaybackDrumBeatValue, PlaybackAnchorValue } from './beatValues';

export abstract class PlaybackValueBase {
  public type: string;
  public value: any;
  public abstract toBoolean(): boolean;
  public abstract toOutputString(): string;
}

export class PlaybackNilValue implements PlaybackValueBase {
  public type: 'Nil' = 'Nil';
  public value = null;
  public toBoolean(): boolean { return false; }
  public toOutputString(): string { return 'Nil'; }
}

export class PlaybackStringValue implements PlaybackValueBase {
  public type: 'string' = 'string';
  public value: string;
  public constructor(value: string) { this.value = value; }
  public toBoolean(): boolean { return this.value !== ''; }
  public toOutputString(): string {
    // @TODO: store raw value from tokenizer? (which may not always exist for programmatically-generated strings)
    // At least this is consistent...
    return `"${this.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
}

export class PlaybackNumberValue implements PlaybackValueBase {
  public type: 'number' = 'number';
  public value: number;
  public constructor(value: number) { this.value = value; }
  public toInteger(): number { return Math.floor(this.value); }
  public toBoolean(): boolean { return this.value !== 0; }
  public toOutputString(): string { return this.value.toString(); }
}

export class PlaybackBooleanValue implements PlaybackValueBase {
  public type: 'boolean' = 'boolean';
  public value: boolean;
  public constructor(value: boolean) { this.value = value; }
  public toBoolean(): boolean { return this.value; }
  public toOutputString(): string { return this.value ? 'true' : 'false'; }
}

export class PlaybackTimeSignatureValue implements PlaybackValueBase {
  public type: 'time_signature' = 'time_signature';
  public value: [number, number];
  public constructor(value: [number, number]) { this.value = value; }
  public toBoolean(): boolean { return true; }
  public toOutputString(): string { return `${this.value[0]} / ${this.value[1]}`; }
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
