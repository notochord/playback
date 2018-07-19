import loader from '../loader/loader.js';
import parser from '../parser/parser.js';

export default class PlaybackStyle {
  /**
   * Set the main ast (the one that plays all its instruments by default).
   * @param {ast.GlobalScope} main the main ast
   * @param {Map.<string: ast.GlobalScope>} asts A map of asts by their path
   */
  constructor(mainPath) {
    this._mainPath = mainPath;
    this._ASTs = new Map();
    this._initialized = false;
  }
  /**
   * Parse each file, pull its dependencies, put it all in a cache, rinse and
   * repeat.
   * @private
   */
  async _loadDependencies() {
    let pendingDependencies = [this._mainPath];
    let dependencyPath;
    // @TODO: verify that dependencies have compatible time signature to main
    while(dependencyPath = pendingDependencies.pop()) {
      let rawfile;
      try {
        rawfile = await loader.load(dependencyPath);
      } catch(e) {
        throw new Error(`Couldn't locate imported style "${dependencyPath}".`);
      }
      let ast = await parser.parse(rawfile);
      this._ASTs.set(dependencyPath, ast);
      ast.init();
      for(let newDependency of ast.dependencies) {
        if(!this._ASTs.has(newDependency)) {
          pendingDependencies.push(newDependency);
        }
      }
    }
    this._main = this._ASTs.get(this._mainPath);
  }
  _link() {
    this._main.link(this._ASTs);
  }
  /**
   * Initialize the style, which includes loading dependencies and linking
   * track/pattern calls. Must be called before compiling/playing.
   */
  async init() {
    await this._loadDependencies();
    this._link();
    this._initialized = true;
  }
  /**
   * Compile a song into a set of MIDI-like note instructions.
   * @param {Song} song A Playback Song (notochord????)
   * @returns {NoteSet.<Note>} An array-like object containing MIDI-like note
   * instructions.
   */
  compile(song) {
    if(!this._initialized) {
      throw new Error('PlayBack style must be initialized before compiling');
    }
    let songIterator = song[Symbol.iterator]();
    let nextValue = songIterator.next();
    console.log('nextValue', nextValue)
    let notes = this._main.execute(songIterator);
    console.log('---final result---');
    console.log(notes);
    
    /*
    while(nextValue = songIterator.next(), !nextValue.done) {
      this._main.execute(songIterator);
    }
    */
  }
  async play(song) {
    this.compile(song);
    // @TODO: take the MIDI events and play them
  }
}
