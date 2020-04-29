import tonal from '../lib/tonal.min.js';
import {AwaitingDrum, Note, NoteSet} from '../MIDI/Note';
import Scope from './Scope';
import { Measure } from './BeatGroups';
import { getAnchorChord, anchorChordToRoot } from './music_utils';
import { PlaybackMelodicBeatValue, PlaybackDrumBeatValue } from '../values/values';
import SongIterator from 'notochord-song/types/songiterator';

export class MelodicBeatLiteral {
  public value: PlaybackMelodicBeatValue;
  public scope: Scope;
  public parentMeasure: Measure;
  public indexInMeasure: number;
  public cachedAnchor: any;

  constructor(opts) {
    this.value = new PlaybackMelodicBeatValue(opts.time, opts.pitch, opts.octave);
    this.scope = null;
    this.parentMeasure = null;
    this.indexInMeasure = null;
    this.cachedAnchor = null; // used for STEP/ARPEGGIATE interpolation
  }
  init(scope: Scope, parentMeasure: Measure, indexInMeasure: number) {
    this.scope = scope;
    this.parentMeasure = parentMeasure;
    this.indexInMeasure = indexInMeasure;
  }
  getTime() {
    if(this.value.time.time === 'auto') {
      return this.indexInMeasure + 1;
    } else {
      return this.value.time.time;
    }
  }
  handleInversion(songIterator: SongIterator, pitches: string[]) {
    let tonicPC = songIterator.song.getTransposedKey();
    let tonicNote = tonal.Note.from({oct: this.getOctave()}, tonicPC);
    let tonic = tonal.Note.midi(tonicNote);
    let outPitches = [];
    for(let pitchNote of pitches) {
      let pitch = tonal.Note.midi(pitchNote);
      if(pitch - tonic >= 6) pitch -= 12;
      outPitches.push(tonal.Note.fromMidi(pitch));
    }
    return outPitches;
  }
  getAnchorData(songIterator: SongIterator) {
    let anchorChord = getAnchorChord(
      this.value.pitch.anchor, songIterator, this.getTime()
    );

    let root = anchorChordToRoot(
      anchorChord, this.value.pitch.degree, this.getOctave()
    );
    return [anchorChord, root];
  }
  getPitches(songIterator: SongIterator) {
    let [anchorChord, root] = this.getAnchorData(songIterator);

    let pitches: string[];
    if(this.value.pitch.chord) {
      // this feels extremely incorrect
      // why would anyone need it to work this way
      let anchorChordType = tonal.Chord.tokenize(anchorChord)[1];
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
  isDynamic() {
    return ['STEP', 'ARPEGGIATE'].includes(this.value.pitch.anchor);
  }
  getOctave() {
    if(this.value.octave === 'inherit') {
      return this.scope.vars.get('octave').value as number;
    } else {
      return this.value.octave;
    }
  }
  getDuration() {
    let duration;
    duration = this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
    if(this.value.time.flag === 'STACCATO') {
      return Math.min(0.25, duration);
    } else {
      return duration;
    }
  }
  getVolume() {
    let volume = this.scope.vars.get('volume').value as number;
    if(this.value.time.flag === 'ACCENTED') volume = Math.min(1, volume += .1);
    return volume;
  }
  execute(songIterator: SongIterator) {
    let notes = new NoteSet();
    let time = this.getTime(); // @TODO: this varies with rolling
    let pitches = this.getPitches(songIterator);
    let duration = this.getDuration(); // @TODO: this varies with rolling
    let volume = this.getVolume();
    
    for(let pitch of pitches) {
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

export class DrumBeatLiteral {
  public value: PlaybackDrumBeatValue;
  public scope: Scope;
  public parentMeasure: Measure;
  public indexInMeasure: number;

  constructor(opts) {
    this.value = new PlaybackDrumBeatValue(opts.time, opts.accented);
    this.scope = null;
    this.parentMeasure = null;
    this.indexInMeasure = null;
  }
  init(scope: Scope, parentMeasure: Measure, indexInMeasure: number) {
    this.scope = scope;
    this.parentMeasure = parentMeasure;
    this.indexInMeasure = indexInMeasure;
  }
  getTime() {
    return this.value.time;
  }
  getDuration() {
    let duration;
    duration = this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
    return duration;
  }
  getVolume() {
    let volume = this.scope.vars.get('volume').value as number;
    if(this.value.accented) volume = Math.min(1, volume += .1);
    return volume;
  }
  execute(songIterator) {
    let time = this.getTime();
    let duration = this.getDuration();
    let volume = this.getVolume();
    
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
