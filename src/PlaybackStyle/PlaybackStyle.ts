import { load } from '../loader/loader';
import { parse } from '../parser/parser';
import { NoteSet } from '../MIDI/Note';
import GlobalScope from '../ast/GlobalScope';
import Song from 'notochord-song/types/notochord-song';
import * as values from '../values/values'

export default class PlaybackStyle {
  private mainPath: string;
  private ASTs: Map<string, GlobalScope>;
  public initialized: boolean;
  private main: GlobalScope; // the main AST (as opposed to imported ones)

  public constructor(mainPath: string) {
    this.mainPath = mainPath;
    this.ASTs = new Map();
    this.initialized = false;
  }
  /**
   * Parse each file, pull its dependencies, put it all in a cache, rinse and
   * repeat.
   */
  private async loadDependencies(): Promise<void> {
    const pendingDependencies = [this.mainPath];
    let dependencyPath: string | undefined;
    // @TODO: verify that dependencies have compatible time signature to main
    while(dependencyPath = pendingDependencies.pop()) {
      let rawfile: string;
      try {
        rawfile = await load(dependencyPath);
      } catch(e) {
        throw new Error(`Couldn't locate imported style "${dependencyPath}".`);
      }
      const ast = await parse(rawfile);
      this.ASTs.set(dependencyPath, ast);
      ast.init();
      for(const newDependency of ast.dependencies) {
        if(!this.ASTs.has(newDependency)) {
          pendingDependencies.push(newDependency);
        }
      }
    }
    this.main = this.ASTs.get(this.mainPath)!;
  }
  private link(): void {
    this.main.link(this.ASTs);
  }
  /**
   * Initialize the style, which includes loading dependencies and linking
   * track/pattern calls. Must be called before compiling/playing.
   */
  public async init(): Promise<void> {
    await this.loadDependencies();
    this.link();
    this.initialized = true;
  }
  /**
   * Compile a song into a set of MIDI-like note instructions.
   * @param {Song} song A Playback Song (notochord????)
   * @returns {Map<string, NoteSet>} A map of instrument names to array-like
   * objects containing MIDI-like note instructions.
   */
  public compile(song: Song): Map<string, NoteSet> {
    if(!this.initialized) {
      throw new Error('PlayBack style must be initialized before compiling');
    }
    const songIterator = song[Symbol.iterator]();
    const instruments = this.getInstruments();
    const notes = new Map<string, NoteSet>();
    const beatsPerMeasure = (this.main.vars.get('time-signature') as values.PlaybackTimeSignatureValue).value[0];
    let totalPastBeats = 0;
    for(const instrument of instruments) notes.set(instrument, new NoteSet());
    let nextValue;
    while(nextValue = songIterator.next(), nextValue.done === false) {
      const thisMeasureTracks = this.main.execute(songIterator);
      for(const [instrument, thisMeasureNotes] of thisMeasureTracks) {
        for(const note of thisMeasureNotes) {
          note.time += totalPastBeats;
          if(this.main.vars.get('swing')) {
            const intPart = Math.floor(note.time);
            let floatPart = note.time - intPart;
            if(floatPart <= 0.5) {
              floatPart *= 2;
              floatPart = (2/3) * floatPart;
            } else {
              floatPart = 2 * (floatPart - 0.5);
              floatPart = (2/3) + ((1/3) * floatPart);
            }
            note.time = intPart + floatPart;
          }
        }
        notes.get(instrument)!.push(...thisMeasureNotes);
      }
      totalPastBeats += beatsPerMeasure;
    }
    
    return notes;
  }
  public getInstruments(): Set<string> {
    return this.main.getInstruments();
  }
}
