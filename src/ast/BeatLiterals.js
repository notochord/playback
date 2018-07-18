import {Nil} from './type_utils.js';
import {Note, NoteSet} from '../MIDI/Note.js';

export class MelodicBeatLiteral {
  constructor(opts) {
    this.time = opts.time || {time: 'auto'};
    this.pitch = opts.pitch;
    this.octave = opts.octave || 'inherit';
  }
  execute(songIterator) {
    return new NoteSet(new Note({time: 1, pitch: 60, duration: 1, velocity: 0.7}));
  }
}

export class DrumBeatLiteral {
  constructor(opts) {
    this.time = opts.time;
    this.accented = opts.accented || false;
  }
  execute(songIterator) {
    return new NoteSet(new Note({time: 1, pitch: 60, duration: 1, velocity: 0.7}));
  }
}
