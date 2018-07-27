import Soundfont from '../lib/soundfont-player.js';

export default class Player {
  /**
   * @param {AudioContext} context 
   */
  constructor(context) {
    this.context = context
    this._initialized = false;
    window.player = this;
  }
  async init(instruments) {
    this._initialized = true;
    this.soundfonts = new Map();
    let promises = [];
    for(let instrument of instruments) {
      let sfpromise;
      console.log(instrument);
      if(instrument.startsWith('http://') || instrument.startsWith('https://')) {
        // Soundfont has a bug where you can't just pass it a URL
        // @TODO: open an issue there
        sfpromise = Soundfont.instrument(this.context, instrument, {
          isSoundfontUrl: () => true,
          nameToUrl: () => url
        });
      } else if(instrument == 'percussion') {
        sfpromise = Soundfont.instrument(this.context, instrument, {soundfont: 'FluidR3_GM'});
      } else {
        sfpromise = Soundfont.instrument(this.context, instrument);
      }
      promises.push(
        await sfpromise.then(font => {
          this.soundfonts.set(instrument, font);
        })
      );
    }
    await Promise.all(promises);
  }
  play(compiledSong) {
    if(!this._initialized) {
      throw new Error('Player must be initialized before playing');
    }
    let tempoCoef = 0.4; // WHATEVER IDC HOW ANYTHING WORKS
    for(let [instrument, notes] of compiledSong) {
      let soundfont = this.soundfonts.get(instrument);
      for(let note of notes) {
        let start = this.context.currentTime + (tempoCoef * note.time);
        let dur = tempoCoef * note.duration - 0.05;
        soundfont.play(note.midi, start, {
          duration: dur,
          gain: note.volume
        })
      }
    }
  }
}