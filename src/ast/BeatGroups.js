import {Nil} from './type_utils.js';
import {Note, NoteSet} from '../MIDI/Note.js';
import FunctionCall from './FunctionCall.js';

export class BeatGroupLiteral {
  constructor(measures) {
    this.measures = measures;
  }
  // @TODO for non-drums, make sure I'm not in a drum literal
  // because of choose() I don't think this is possible 'till execution?
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
}

export class Measure {
  constructor(beats) {
    this.beats = beats;
  }
  execute(songIterator) {
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
    if(beatGroup instanceof FunctionCall) { // we were passed a function call (e.g. choose)
      this.beatGroup = beatGroup; // for now there's no diff in functionality...
    } else {
      this.beatGroup = beatGroup;
    }
    // @TODO make sure our beats are all drummy
  }
  link() {return;}
  execute(songIterator) {
    return this.beatGroup.execute(songIterator);
  }
}
