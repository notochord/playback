import {
  DrumBeatInMelodicBeatGroupError,
  MelodicBeatInDrumBeatGroupError
} from './errors.js';
import {Nil} from './type_utils.js';
import {AwaitingDrum, Note, NoteSet} from '../MIDI/Note.js';
import FunctionCall from './FunctionCall.js';

export class BeatGroupLiteral {
  constructor(measures) {
    this.measures = measures;
    this.scope = null;
  }
  init(scope) {
    this.scope = scope;
    this.measures.forEach(measure => measure.init(scope));
  }
  link() {return;}
  execute(songIterator) {
    let joinedMeasures = new NoteSet();
    for(let i = 0; i < this.measures.length; i++) {
      let offset = i * 4; // @TODO: pull in actual meter somehow
      let measureNotes = this.measures[i].execute(songIterator);
      if(measureNotes === Nil) return Nil; // lets a/s abort the beatgroup
      for(let measureNote of measureNotes) {
        /*if(measureNote.pitch === AwaitingDrum) {
          throw new DrumBeatInMelodicBeatGroupError({}); //@TODO: scope
        }*/
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
    this.scope = null;
  }
  calculateDurationAfter(beatIndex) {
    let currentBeat = this.beats[beatIndex];
    let currentBeatTime = currentBeat.getTime();
    
    let nextBeatTime;
    if(beatIndex + 1 >= this.beats.length) {
      nextBeatTime = this.beats.length + 1;
    } else {
      let nextBeat = this.beats[beatIndex + 1];
      nextBeatTime = nextBeat.getTime();
    }
    return nextBeatTime - currentBeatTime;
  }
  init(scope) {
    this.scope = scope;
    this.beats.forEach((beat, i) => {
      beat.init(scope, this, i);
    });
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
        note.pitch = this.drum;
      } else {
        throw new MelodicBeatInDrumBeatGroupError(this.scope);
      }
    }
    return notes;
  }
}
