// @ts-ignore
import tonal from '../lib/tonal.min.js';
import { AwaitingDrum, Note, NoteSet } from '../MIDI/Note';
import { ASTNodeBase, Scope } from './ASTNodeBase';
import { Measure } from './BeatGroups';
import { getAnchorChord, anchorChordToRoot } from './musicUtils';
import { PlaybackMelodicBeatValue, PlaybackDrumBeatValue } from '../values/values';
import SongIterator from 'notochord-song/types/songiterator';

export class MelodicBeatLiteral extends ASTNodeBase {
  public value: PlaybackMelodicBeatValue;
  public parentMeasure: Measure;
  public indexInMeasure: number;
  public cachedAnchor: any = null; // used for STEP/ARPEGGIATE interpolation

  public constructor(opts) {
    super();
    this.value = new PlaybackMelodicBeatValue(opts.time, opts.pitch, opts.octave);
  }
  public init(scope: Scope, parentMeasure: Measure, indexInMeasure: number): void {
    super.init(scope);
    this.parentMeasure = parentMeasure;
    this.indexInMeasure = indexInMeasure;
  }
  public link(): void {}
  public getTime(): number {
    if(this.value.time.time === 'auto') {
      return this.indexInMeasure + 1;
    } else {
      return this.value.time.time;
    }
  }
  public handleInversion(songIterator: SongIterator, pitches: string[]): string[] {
    const tonicPC = songIterator.song.getTransposedKey();
    const tonicNote = tonal.Note.from({ oct: this.getOctave() }, tonicPC);
    const tonic = tonal.Note.midi(tonicNote);
    const outPitches = [];
    for(const pitchNote of pitches) {
      let pitch = tonal.Note.midi(pitchNote);
      if(pitch - tonic >= 6) pitch -= 12;
      outPitches.push(tonal.Note.fromMidi(pitch));
    }
    return outPitches;
  }
  public getAnchorData(songIterator: SongIterator): [string, string] {
    const anchorChord = getAnchorChord(
      this.value.pitch.anchor, songIterator, this.getTime()
    );

    const root = anchorChordToRoot(
      anchorChord, this.value.pitch.degree, this.getOctave()
    );
    return [anchorChord, root];
  }
  public getPitches(songIterator: SongIterator): string[] {
    const [anchorChord, root] = this.getAnchorData(songIterator);

    let pitches: string[];
    if(this.value.pitch.chord) {
      // this feels extremely incorrect
      // why would anyone need it to work this way
      const anchorChordType = tonal.Chord.tokenize(anchorChord)[1];
      pitches = tonal.Chord.notes(root, anchorChordType);
    } else {
      pitches = [root];
    }

    if(this.scope.vars.get('invertible')) {
      pitches = this.handleInversion(songIterator, pitches);
    }

    return pitches;
  }
  /**
   * Returns true if the beat is anchored via STEP or ARPEGGIATE
   * @returns {boolean}
   */
  public isDynamic(): boolean {
    return (['STEP', 'ARPEGGIATE'] as (string | undefined)[]).includes(this.value.pitch.anchor);
  }
  public getOctave(): number {
    if(this.value.octave === 'inherit') {
      return this.scope.vars.get('octave')!.value as number;
    } else {
      return this.value.octave;
    }
  }
  public getDuration(): number {
    const duration = this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
    if(this.value.time.flag === 'STACCATO') {
      return Math.min(0.25, duration);
    } else {
      return duration;
    }
  }
  public getVolume(): number {
    let volume = this.scope.vars.get('volume')!.value as number;
    if(this.value.time.flag === 'ACCENTED') volume = Math.min(1, volume += .1);
    return volume;
  }
  public execute(songIterator: SongIterator): NoteSet {
    const notes = new NoteSet();
    const time = this.getTime(); // @TODO: this varies with rolling
    const pitches = this.getPitches(songIterator);
    const duration = this.getDuration(); // @TODO: this varies with rolling
    const volume = this.getVolume();
    
    for(const pitch of pitches) {
      notes.push(new Note({
        time: time,
        pitch: pitch,
        duration: duration,
        volume: volume
      }));
    }
    
    return notes;
  }
}

export class DrumBeatLiteral extends ASTNodeBase {
  public value: PlaybackDrumBeatValue;
  public scope: Scope;
  public parentMeasure: Measure;
  public indexInMeasure: number;

  public constructor(opts) {
    super();
    this.value = new PlaybackDrumBeatValue(opts.time, opts.accented);
  }
  public init(scope: Scope, parentMeasure: Measure, indexInMeasure: number): void {
    super.init(scope);
    this.parentMeasure = parentMeasure;
    this.indexInMeasure = indexInMeasure;
  }
  public link(): void {}
  public getTime(): number {
    return this.value.time;
  }
  public getDuration(): number {
    return this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
  }
  public getVolume(): number {
    let volume = this.scope.vars.get('volume')!.value as number;
    if(this.value.accented) volume = Math.min(1, volume += .1);
    return volume;
  }
  public isDynamic(): boolean { return false; }
  public getAnchorData(): string[] { return []; }
  public execute(songIterator: SongIterator): NoteSet {
    const time = this.getTime();
    const duration = this.getDuration();
    const volume = this.getVolume();
    
    return new NoteSet(
      new Note({
        time: time,
        pitch: AwaitingDrum,
        duration: duration,
        volume: volume
      })
    );
  }
}
