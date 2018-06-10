import FunctionCall from './FunctionCall.js';

export class BeatGroupLiteral {
  constructor(measures) {
    this.measures = measures;
  }
  // @TODO for non-drums, make sure I'm not in a drum literal
  // because of choose() I don't think this is possible 'till execution?
}

export class Measure {
  constructor(beats) {
    this.beats = beats;
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
}
