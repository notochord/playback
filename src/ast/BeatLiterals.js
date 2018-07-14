export class MelodicBeatLiteral {
  constructor(opts) {
    this.time = opts.time || {time: 'auto'};
    this.pitch = opts.pitch;
    this.octave = opts.octave || 'inherit';
  }
}

export class DrumBeatLiteral {
  constructor(opts) {
    this.time = opts.time;
    this.accented = opts.accented || false;
  }
}
