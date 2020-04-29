import Soundfont from '../lib/soundfont-player.js';
import PlaybackStyle from '../PlaybackStyle/PlaybackStyle';

export default class Player {
  private style: PlaybackStyle
  private initialized: boolean;

  public soundfonts: Map<string, any>;
  public context: AudioContext;
  /**
   * Loads the necessary soundfonts and plays a song in a PlaybackStyle in the
   * browser.
   * @param {AudioContext=} context If you pass it an AudioContext it'll use
   * it. Otherwise it'll make its own.
   */
  constructor(context) {
    this.style = null;
    this.context = context || new AudioContext({latencyHint: "playback"});
    this.initialized = false;
    (window as any).player = this;
  }
  async setStyle(style) {
    this.style = style;
    if(!style._initialized) {
      await style.init();
    }
    this.initialized = false;
    this.soundfonts = new Map();
    let promises = [];
    for(let instrument of style.getInstruments()) {
      let sfpromise;
      if(instrument.startsWith('http://') || instrument.startsWith('https://')) {
        // Soundfont has a bug where you can't just pass it a URL
        // @TODO: open an issue there
        sfpromise = Soundfont.instrument(this.context, instrument, {
          isSoundfontUrl: () => true,
          nameToUrl: () => instrument
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
    this.initialized = true;
  }
  play(song) {
    if(!this.style) {
      throw new Error('No style selected');
    }
    if(!this.initialized) {
      throw new Error('A style hasn\'t finished loading');
    }

    if(this.context.state == 'suspended') {
      this.context.resume();
    }

    let compiledSong = this.style.compile(song);

    let tempoCoef = 0.4; // WHATEVER IDC HOW ANYTHING WORKS
    let startTime = this.context.currentTime + 1;
    for(let [instrument, notes] of compiledSong) {
      let soundfont = this.soundfonts.get(instrument);
      for(let note of notes) {
        let start = startTime + (tempoCoef * note.time);
        let dur = tempoCoef * note.duration - 0.05;
        soundfont.play(note.midi, start, {
          duration: dur,
          gain: note.volume
        })
      }
    }
  }
}