// special pitch value meaning the note will be set later by a DrumBeatGroup
let AwaitingDrum = Symbol('AwaitingDrum');
export {AwaitingDrum};

export class Note {
  constructor(opts) {
    this.time = opts.time;
    this.pitch = opts.pitch; // MIDI number???
    this.duration = opts.duration;
    this.volume = opts.volume; // Math.floor(opts.volume * 255) ?????
  }
}

export class NoteSet extends Array {
  constructor() {
    super();
    this.push(...arguments);
  }
}
