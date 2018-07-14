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
    // @TODO: generate a globals object that gets passed down the ast
    // for throwing errors without using actual JS errors
    // and letting GlobalScopes request instruments from deps
    // and other things I'll think of later
    // (do we need an ASTNode class that all nodes inherit from?)
    
    //this._loadDependencies();
    // @TODO: complain when you try to play before loading is done
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
      console.log(dependencyPath, pendingDependencies);
      for(let newDependency of ast.dependencies) {
        if(!this._ASTs.has(newDependency)) {
          pendingDependencies.push(newDependency);
        } else {
        }
      }
    }
    this._main = this._ASTs.get(this._mainPath);
  }
  async play(song) {
    this._main.execute(song);
    /*
    for(measure of song) {
      let notes = this._main.execute(measure);
      await player.play(notes); // ????????????????????
    }*/
  }
}
