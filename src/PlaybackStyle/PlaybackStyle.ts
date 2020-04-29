import {load} from '../loader/loader';
import {parse} from '../parser/parser';
import {NoteSet} from '../MIDI/Note';
import GlobalScope from '../ast/GlobalScope';

export default class PlaybackStyle {

  private mainPath: string;
  private ASTs: Map<string, GlobalScope>;
  private initialized: boolean;
  private main: GlobalScope;

  /**
   * Set the main ast (the one that plays all its instruments by default).
   * @param {ast.GlobalScope} main the main ast
   * @param {Map.<string: ast.GlobalScope>} asts A map of asts by their path
   */
  constructor(mainPath) {
    this.mainPath = mainPath;
    this.ASTs = new Map();
    this.initialized = false;
  }
  /**
   * Parse each file, pull its dependencies, put it all in a cache, rinse and
   * repeat.
   * @private
   */
  async _loadDependencies() {
    let pendingDependencies = [this.mainPath];
    let dependencyPath;
    // @TODO: verify that dependencies have compatible time signature to main
    while(dependencyPath = pendingDependencies.pop()) {
      let rawfile;
      try {
        rawfile = await load(dependencyPath);
      } catch(e) {
        throw new Error(`Couldn't locate imported style "${dependencyPath}".`);
      }
      let ast = await parse(rawfile);
      this.ASTs.set(dependencyPath, ast);
      ast.init();
      for(let newDependency of ast.dependencies) {
        if(!this.ASTs.has(newDependency)) {
          pendingDependencies.push(newDependency);
        }
      }
    }
    this.main = this.ASTs.get(this.mainPath);
  }
  _link() {
    this.main.link(this.ASTs);
  }
  /**
   * Initialize the style, which includes loading dependencies and linking
   * track/pattern calls. Must be called before compiling/playing.
   */
  async init() {
    await this._loadDependencies();
    this._link();
    this.initialized = true;
  }
  /**
   * Compile a song into a set of MIDI-like note instructions.
   * @param {Song} song A Playback Song (notochord????)
   * @returns {NoteSet.<Note>} An array-like object containing MIDI-like note
   * instructions.
   */
  compile(song) {
    if(!this.initialized) {
      throw new Error('PlayBack style must be initialized before compiling');
    }
    let songIterator = song[Symbol.iterator]();
    let instruments = this.getInstruments();
    let notes = new Map();
    let beatsPerMeasure = this.main.vars.get('time-signature')[0];
    let totalPastBeats = 0;
    for(let instrument of instruments) notes.set(instrument, new NoteSet());
    let nextValue;
    while(nextValue = songIterator.next(), nextValue.done == false) {
      let thisMeasureTracks = this.main.execute(songIterator);
      for(let [instrument, thisMeasureNotes] of thisMeasureTracks) {
        for(let note of thisMeasureNotes) {
          note.time += totalPastBeats;
          if(this.main.vars.get('swing')) {
            let int_part = Math.floor(note.time);
            let float_part = note.time - int_part;
            if(float_part <= 0.5) {
              float_part *= 2;
              float_part = (2/3) * float_part;
            } else {
              float_part = 2 * (float_part - 0.5);
              float_part = (2/3) + ((1/3) * float_part);
            }
            note.time = int_part + float_part;
          }
        }
        notes.get(instrument).push(...thisMeasureNotes);
      }
      totalPastBeats += beatsPerMeasure;
    }
    
    return notes;
  }
  getInstruments() {
    return this.main.getInstruments();
  }
}
