import {Nil} from './type_utils.js';
import {AwaitingDrum, Note, NoteSet} from '../MIDI/Note.js';

export class MelodicBeatLiteral {
  constructor(opts) {
    this.time = opts.time || {time: 'auto'};
    this.pitch = opts.pitch;
    this.octave = opts.octave || 'inherit';
    this.scope = null;
    this.parentMeasure = null;
    this.indexInMeasure = null;
  }
  init(scope, parentMeasure, indexInMeasure) {
    this.scope = scope;
    this.parentMeasure = parentMeasure;
    this.indexInMeasure = indexInMeasure;
  }
  getTime() {
    if(this.time.time === 'auto') {
      return this.indexInMeasure + 1;
    } else {
      return this.time.time;
    }
  }
  getPitches(songIterator) { // should current chord be requested from measure?
    let root;
    
    switch(this.pitch.anchor) {
      case 'KEY': {
        root = songIterator.song.getKey();
        break;
      }
      case 'NEXT': {
        root = songIterator.getRelative(1)[0];
        break;
      }
      default: {
        root = 59;
      }
    }
    
    if(this.pitch.chord) {
      return [root, 60];
    } else {
      return [root];
    }
  }
  getOctave() {
    if(this.octave === 'inherit') {
      return this.scope.vars.get('octave');
    } else {
      return this.octave;
    }
  }
  getDuration() {
    let duration;
    duration = this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
    if(this.time.flag === 'STACCATO') {
      // @TODO: how does one calculate staccatoness?
    }
    return duration;
  }
  getVolume() {
    let volume = this.scope.vars.get('volume');
    if(this.time.flag === 'ACCENTED') volume = Math.min(1, volume += .1);
    return volume;
  }
  execute(songIterator) {
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
  constructor(opts) {
    this.time = opts.time;
    this.accented = opts.accented || false;
    this.scope = null;
    this.parentMeasure = null;
    this.indexInMeasure = null;
  }
  init(scope, parentMeasure, indexInMeasure) {
    this.scope = scope;
    this.parentMeasure = parentMeasure;
    this.indexInMeasure = indexInMeasure;
  }
  getTime() {
    return this.time;
  }
  getDuration() {
    let duration;
    duration = this.parentMeasure.calculateDurationAfter(this.indexInMeasure);
    return duration;
  }
  getVolume() {
    let volume = this.scope.vars.get('volume');
    if(this.accented) volume = Math.min(1, volume += .1);
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
