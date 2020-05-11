import Soundfont from '../lib/soundfont-player.js';
import PlaybackStyle from '../PlaybackStyle/PlaybackStyle';
import { Song } from 'notochord-song';

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
  public constructor(context: AudioContext = new AudioContext({ latencyHint: "playback" })) {
    this.style = null;
    this.context = context;
    this.initialized = false;
    (window as any).player = this;
  }
  public async setStyle(style: PlaybackStyle): Promise<void> {
    this.style = style;
    if(!style.initialized) {
      await style.init();
    }
    this.initialized = false;
    this.soundfonts = new Map();
    const promises = [];
    for(const instrument of style.getInstruments()) {
      let sfpromise;
      if(instrument.startsWith('http://') || instrument.startsWith('https://')) {
        // Soundfont has a bug where you can't just pass it a URL
        // @TODO: open an issue there
        sfpromise = Soundfont.instrument(this.context, instrument, {
          isSoundfontUrl: () => true,
          nameToUrl: () => instrument
        });
      } else if(instrument === 'percussion') {
        sfpromise = Soundfont.instrument(this.context, instrument, { soundfont: 'FluidR3_GM' });
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
  public play(song: Song): void {
    if(!this.style) {
      throw new Error('No style selected');
    }
    if(!this.initialized) {
      throw new Error('A style hasn\'t finished loading');
    }

    if(this.context.state === 'suspended') {
      this.context.resume();
    }

    const compiledSong = this.style.compile(song);

    const tempoCoef = 0.4; // WHATEVER IDC HOW ANYTHING WORKS
    const startTime = this.context.currentTime + 1;
    for(const [instrument, notes] of compiledSong) {
      const soundfont = this.soundfonts.get(instrument);
      for(const note of notes) {
        const start = startTime + (tempoCoef * note.time);
        const dur = tempoCoef * note.duration - 0.05;
        soundfont.play(note.midi, start, {
          duration: dur,
          gain: note.volume
        })
      }
    }
  }
}