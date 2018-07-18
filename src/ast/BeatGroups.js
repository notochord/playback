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
    return new NoteSet(new Note({beat: 1, pitch: 50, duration: 1, velocity: 0.4}));
  }
}

export class Measure {
  constructor(beats) {
    this.beats = beats;
  }
  execute(songIterator) {
    // @TODO: combine NoteSets somehow :o
    return this.beats[0].execute(songIterator);
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
