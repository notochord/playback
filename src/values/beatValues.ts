import { PlaybackValueBase } from './values';

type Anchor = 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
const anchorReverseMap = {'KEY': 'k', 'NEXT': 'n', 'STEP': 's', 'ARPEGGIATE': 'a'};

export class PlaybackAnchorValue implements PlaybackValueBase {
  public type: 'anchor' = 'anchor';
  public value: Anchor;
  constructor(value: Anchor) { this.value = value; }
  public toBoolean() { return true; }
  public toOutputString() { return anchorReverseMap[this.value]; }
}

abstract class PlaybackBeatValue implements PlaybackValueBase {
  public type = null;
  public value: any;
  public toBoolean() { return true; }
  public abstract toOutputString(): string;
}
type TimePart = {
  time: 'auto' | number;
  flag?: 'STACCATO' | 'ACCENTED'
};
type PitchPart = {
  degree: number;
  anchor?: Anchor;
  roll?: 'ROLL_UP' | 'ROLL_DOWN';
  chord: boolean;
};

type OctavePart = number | 'inherit';

export class PlaybackMelodicBeatValue extends PlaybackBeatValue {
  public type: 'melodic_beat' = 'melodic_beat';
  public value = {
    time: null as TimePart,
    pitch: null as PitchPart,
    octave: null as OctavePart,
  }
  constructor(time: TimePart = {time: 'auto'}, pitch: PitchPart, octave: OctavePart = 'inherit') {
    super();
    this.value.time = time;
    this.value.pitch = pitch;
    this.value.octave = octave;
  }
  public toOutputString() {
    const timeFlag = this.time.flag ? (this.time.flag === 'ACCENTED' ? 'a' : 's') : '';
    const timePart = `${this.time.time === 'auto' ? '' : this.time.time}${timeFlag}`;
    const pitchAnchor = this.pitch.anchor ? anchorReverseMap[this.pitch.anchor]: '';
    const pitchRoll = this.pitch.roll ? (this.pitch.roll === 'ROLL_UP' ? 'r' : 'rd') : '';
    const pitchPart = `:${pitchAnchor}${this.pitch.degree || ''}${this.pitch.chord ? 'c' : ''}${pitchRoll}`;
    const octavePart = this.octave === 'inherit' ? '' : `:${this.octave}`;
    return `${timePart}${pitchPart}${octavePart}`;
  }
  get time() { return this.value.time; }
  get pitch() { return this.value.pitch; }
  get octave() { return this.value.octave; }
}

export class PlaybackDrumBeatValue extends PlaybackBeatValue {
  public type: 'drum_beat' = 'drum_beat';
  public value = {
    time: null as number,
    accented: null as boolean,
  }
  constructor(time: number, accented: boolean = false) {
    super();
    this.value.time = time;
    this.value.accented = accented;
  }
  public toOutputString() {
    return `${this.time}${this.accented ? 'a' : ''}`;
  }
  get time() { return this.value.time; }
  get accented() { return this.value.accented; }
}