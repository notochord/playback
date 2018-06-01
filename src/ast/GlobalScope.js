import Scope from './Scope.js';
import {MetaStatement, OptionsStatement} from './ConfigStatements.js';

export default class GlobalScope extends Scope {
  constructor(top_level_statements) {
    super();
    
    this.name = 'global';
    
    // set some default values
    //this.vars.set('imported', imported); // true = instruments default to silent
    this.vars.set('octave', 2);
    this.vars.set('volume', 1);
    this.vars.set('private', false);
    this.vars.set('time-signature', false);
    this.vars.set('tempo', 120);
    
    this.tracks = new Map();
    this.meta = [];
    // @TODO: stop circular dependencies? cache them and mark one as mom
    this.importedStyles = new Map();
    
    for(let statement of top_level_statements) {
      if(statement instanceof MetaStatement
        || statement instanceof OptionsStatement) {
        // config blocks are setting things in my scope so handle them first
        statement.init(this);
      } // else if(statement instanceof ImportStatement) {
      //} else {}
    }
  }
}
