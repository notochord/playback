//import {Nil} from './type_utils.js';
import tonal from '../lib/tonal.min.js';
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
  /**
   * Normalize a chord into a form tonal can handle
   * @param {string} chord
   * @return {string}
   */
  normalizeChord(chord) {
    return chord
      .replace(/-/g, '_') // tonal uses _ over - for minor7
      .replace(/minor|min/g, 'm'); // tonal is surprisingly bad at identifying minor chords??
  }
  chordToScaleName(chord) {
    let chordType = tonal.Chord.tokenize(chord)[1];

    // @TODO: make this more robust
    let names = tonal.Chord.props(chordType).names;
    if(names.includes('dim')) return 'diminished';
    if(names.includes('aug')) return 'augmented';
    if(names.includes('Major')) return 'major';
    if(names.includes('minor')) return 'minor';
    if(names.includes('minor7')) return 'dorian';
    if(names.includes('Dominant')) return 'mixolydian';
    // if none of the above match, do our best to find the closest fit
    let closestScale = 'major'
    names.forEach(name => {
      if(name.startsWith('dim')) closestScale = 'diminished';
      if(name.startsWith('aug')) closestScale = 'augmented';
      if(name.startsWith('M')) closestScale = 'major';
      if(name.startsWith('m')) closestScale = 'minor';
    });
    return closestScale;
  };
  getPitches(songIterator) { // should current chord be requested from measure?
    let anchorChord, root;
    
    switch(this.pitch.anchor) {
      case 'KEY': {
        anchorChord = songIterator.song.getKey();
        break;
      }
      case 'NEXT': {
        let nextMeasure = songIterator.getRelative(1);
        if(nextMeasure) {
          anchorChord = nextMeasure[0];
        } else {
          anchorChord = songIterator.song.getKey();
        }
        break;
      }
      case 'STEP':
      case 'ARPEGGIATE': { // @TODO
        anchorChord = songIterator.getRelative(0)[0];
        break;
      }
      default: {
        // crawl backward through this measure to get the last set beat
        let lastSetBeat = Math.floor(this.getTime());
        do {
          anchorChord = songIterator.getRelative(0)[lastSetBeat];
          lastSetBeat--;
        } while(!anchorChord);
      }
    }

    anchorChord = this.normalizeChord(anchorChord);

    let anchorTonic = tonal.Chord.tokenize(anchorChord)[0]; // does this always work? *shrug*
    let anchorScaleName = this.chordToScaleName(anchorChord);
    let scalePCs = tonal.Scale.notes(anchorTonic, anchorScaleName);
    let rootPC = scalePCs[this.pitch.degree - 1];
    root = tonal.Note.from({oct: this.getOctave()}, rootPC);

    if(this.pitch.chord) {
      // this feels extremely incorrect
      // why would anyone need it to work this way
      let anchorChordType = tonal.Chord.tokenize(anchorChord)[1];
      return tonal.Chord.notes(root, anchorChordType);
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
