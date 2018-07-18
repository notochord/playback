export class Note {
  constructor(opts) {
    this.time = opts.time;
    this.pitch = opts.pitch; // MIDI number???
    this.duration = opts.duration;
    this.velocity = opts.velocity; // Math.floor(opts.volume * 255) ?????
  }
  toString() {
    return 'Note'
  }
}

export class NoteSet extends Array {
  constructor() {
    super();
    this.push(...arguments);
  }
}
