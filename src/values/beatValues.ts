import { PlaybackValueBase } from './valueBase';

type Anchor = 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
const anchorReverseMap = { 'KEY': 'k', 'NEXT': 'n', 'STEP': 's', 'ARPEGGIATE': 'a' };

export class AnchorValue extends PlaybackValueBase {
  public type: 'anchor' = 'anchor';
  public value: Anchor;
  public constructor(value: Anchor) { super(); this.value = value; }
  public toBoolean(): boolean { return true; }
  public toOutputString(): string { return anchorReverseMap[this.value]; }
}

abstract class PlaybackBeatValue extends PlaybackValueBase {
  public type: string;
  public value: any;
  public toBoolean(): boolean { return true; }
  public abstract toOutputString(): string;
}
type TimePart = {
  time: 'auto' | number;
  flag?: 'STACCATO' | 'ACCENTED';
};
type PitchPart = {
  degree: number;
  anchor?: Anchor;
  roll?: 'ROLL_UP' | 'ROLL_DOWN';
  chord: boolean;
};

type OctavePart = number | 'inherit';

export class MelodicBeatValue extends PlaybackBeatValue {
  public type: 'melodic_beat' = 'melodic_beat';
  public value: {
    time: TimePart;
    pitch: PitchPart;
    octave: OctavePart;
  };
  public constructor(time: TimePart = { time: 'auto' }, pitch: PitchPart, octave: OctavePart = 'inherit') {
    super();
    this.value = { time, pitch, octave };
  }
  public toOutputString(): string {
    const timeFlag = this.time.flag ? (this.time.flag === 'ACCENTED' ? 'a' : 's') : '';
    const timePart = `${this.time.time === 'auto' ? '' : this.time.time}${timeFlag}`;
    const pitchAnchor = this.pitch.anchor ? anchorReverseMap[this.pitch.anchor]: '';
    const pitchRoll = this.pitch.roll ? (this.pitch.roll === 'ROLL_UP' ? 'r' : 'rd') : '';
    const pitchPart = `:${pitchAnchor}${this.pitch.degree || ''}${this.pitch.chord ? 'c' : ''}${pitchRoll}`;
    const octavePart = this.octave === 'inherit' ? '' : `:${this.octave}`;
    return `${timePart}${pitchPart}${octavePart}`;
  }
  public get time(): TimePart { return this.value.time; }
  public get pitch(): PitchPart { return this.value.pitch; }
  public get octave(): OctavePart { return this.value.octave; }
}

export class DrumBeatValue extends PlaybackBeatValue {
  public type: 'drum_beat' = 'drum_beat';
  public value: {
    time: number;
    accented: boolean;
  };
  public constructor(time: number, accented = false) {
    super();
    this.value = { time, accented };
  }
  public toOutputString(): string {
    return `${this.time}${this.accented ? 'a' : ''}`;
  }
  public get time(): number { return this.value.time; }
  public get accented(): boolean { return this.value.accented; }
}