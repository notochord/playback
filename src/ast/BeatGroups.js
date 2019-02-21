import {
  MelodicBeatInDrumBeatGroupError
} from './errors.js';
import {Nil} from './type_utils.js';
import {AwaitingDrum, Note, NoteSet} from '../MIDI/Note.js';
import {MelodicBeatLiteral} from './BeatLiterals.js';
import FunctionCall from './FunctionCall.js';

export class BeatGroupLiteral {
  constructor(measures) {
    this.measures = measures;
    this.scope = null;
  }
  init(scope) {
    this.scope = scope;
    this.measures.forEach((measure, i) => measure.init(scope, this, i));
  }
  link() {return;}
  execute(songIterator) {
    let joinedMeasures = new NoteSet();
    for(let i = 0; i < this.measures.length; i++) {
      let offset = i * 4; // @TODO: pull in actual meter somehow
      let measureNotes = this.measures[i].execute(songIterator);
      if(measureNotes === Nil) return Nil; // lets a/s abort the beatgroup
      for(let measureNote of measureNotes) {
        measureNote.time += offset;
        joinedMeasures.push(measureNote);
      }
    }
    return joinedMeasures;
  }
  getNextStaticBeatRoot(measureIndex, beatIndex, songIterator) {
    // first, try every subsequent beat in the beatGroup
    // (including subsequent measures)
    let measure, beat;
    while(measure = this.parentBeatGroup.measures[measureIndex++]) {
      while(beat = measure.beats[++beatIndex]) {
        if(!beat.isDynamic()) {
          return beat.getAnchorData(songIterator)[1];
        }
      }
      beatIndex = -1;
    }
    // if there are no non-dynamic beats in the rest of the beat-group, return
    // the first note of the next measure (@TODO: could be multiple measures
    // later if it's a multi-measure beatgroup)
    // @TODO: wtf?
    return MelodicBeatLiteral.normalizeChord(songIterator.getRelative(1)[0]);
  }
}

export class Measure {
  constructor(beats) {
    this.beats = beats;
    this.beatsPerMeasure = null;
    this.scope = null;
  }
  calculateDurationAfter(beatIndex) {
    let currentBeat = this.beats[beatIndex];
    let currentBeatTime = currentBeat.getTime();
    
    let nextBeatTime;
    if(beatIndex + 1 >= this.beats.length) {
      nextBeatTime = this.beatsPerMeasure + 1;
    } else {
      let nextBeat = this.beats[beatIndex + 1];
      nextBeatTime = nextBeat.getTime();
    }
    return nextBeatTime - currentBeatTime;
  }
  getNextStaticBeatRoot(beatIndex, songIterator) {
    return this.parentBeatGroup.getNextStaticBeatRoot(
      this.indexInBeatGroup,
      beatIndex,
      songIterator
    );
  }
  init(scope, parentBeatGroup, indexInBeatGroup) {
    this.scope = scope;
    this.parentBeatGroup = parentBeatGroup;
    this.indexInBeatGroup = indexInBeatGroup;
    this.beatsPerMeasure = this.scope.vars.get('time-signature')[0];
    // @TODO does this need more math?
    this.beats.forEach((beat, i) => {
      beat.init(scope, this, i);
    });
  }
  execute(songIterator) {
    // clear cached notes (used for STEP/ARPEGGIATE interpolation)
    for(let beat of this.beats) {
      beat.cachedAnchor = null;
    }
    // each beat returns a NoteSet since it could be a chord or whatever
    let joined = new NoteSet();
    for(let beat of this.beats) {
      let notes = beat.execute(songIterator);
      if(notes === Nil) return Nil; // lets a and s abort the beatgroup.
      joined.push(...notes);
    }
    return joined;
  }
}

export class DrumBeatGroupLiteral {
  constructor(drum, beatGroup) {
    this.drum = drum;
    this.beatGroup = beatGroup; // for now there's no diff in functionality...
    // @TODO make sure our beats are all drummy
  }
  init(scope) {
    this.scope = scope;
    if(this.beatGroup.init) this.beatGroup.init(scope);
  }
  link() {return;} // @TODO: I think patterncalls are allowed here?
  execute(songIterator) {
    let notes = this.beatGroup.execute(songIterator);
    for(let note of notes) {
      if(note.pitch === AwaitingDrum) {
        note.pitch = this.drum; // @TODO: convert to number?
      } else {
        throw new MelodicBeatInDrumBeatGroupError(this.scope);
      }
    }
    return notes;
  }
}
