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
    this.cachedAnchor = null; // used for STEP/ARPEGGIATE interpolation
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
   * @param {string} [chord='']
   * @return {string}
   */
  static normalizeChord(chord = '') {
    return chord
      .replace(/-/g, '_') // tonal uses _ over - for minor7
      .replace(/minor|min/g, 'm'); // tonal is surprisingly bad at identifying minor chords??
  }
  static chordToScaleName(chord) {
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
  }
  handleInversion(songIterator, pitches) {
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
  static getAnchorChord(anchor, songIterator, currentTime) {
    let anchorChord;
    switch(anchor) {
      case 'KEY': {
        anchorChord = songIterator.song.getTransposedKey();
      }
      case 'NEXT': {
        let nextMeasure = songIterator.getRelative(1);
        if(nextMeasure) {
          anchorChord = nextMeasure.beats[0].chord;
        } else {
          anchorChord = songIterator.song.getTransposedKey();
        }
      }
      case 'STEP':
      case 'ARPEGGIATE': {
        /*
        let prev = songIterator.getRelative(0)[0]; //???
        if(!this.parentMeasure) console.log('tttttttt', this);
        let next = this.parentMeasure.getNextStaticBeatRoot(
          this.indexInMeasure,
          songIterator
        );*/

      }
      default: {
        // crawl backward through this measure to get the last set beat
        let lastSetBeat = Math.floor(currentTime);
        let iteratorMeasure = songIterator.getRelative(0);
        do {
          const beat = iteratorMeasure.beats[lastSetBeat]
          anchorChord = beat && beat.chord;
          lastSetBeat--;
        } while(!anchorChord);
      }
    }
    return this.normalizeChord(anchorChord);
  }
  static anchorChordToRoot(anchorChord, degree, octave) {
    let anchorTonic = tonal.Chord.tokenize(anchorChord)[0];
    let anchorScaleName = this.chordToScaleName(anchorChord);
    let scalePCs = tonal.Scale.notes(anchorTonic, anchorScaleName);
    let rootPC = scalePCs[degree - 1];
    return tonal.Note.from({oct: octave}, rootPC);
  }
  getAnchorData(songIterator) {
    let anchorChord = this.constructor.getAnchorChord(
      this.pitch.anchor, songIterator, this.getTime()
    );

    let root = this.constructor.anchorChordToRoot(
      anchorChord, this.pitch.degree, this.getOctave()
    );
    return [anchorChord, root];
  }
  getPitches(songIterator) {
    let [anchorChord, root] = this.getAnchorData(songIterator);

    let pitches;
    if(this.pitch.chord) {
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
    return ['STEP', 'ARPEGGIATE'].includes(this.pitch.anchor);
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
      return Math.min(0.25, duration);
    } else {
      return duration;
    }
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
