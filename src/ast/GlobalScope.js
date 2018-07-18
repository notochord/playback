import {NoSuchStyleError, NoSuchTrackError} from './errors.js';
import Scope from './Scope.js';
import {MetaStatement, OptionsStatement, ImportStatement} from './ConfigStatements.js';
import {TrackStatement, TrackCall} from './Track.js';

export default class GlobalScope extends Scope {
  constructor(statements) {
    super();
    
    this.name = 'global';
    this.type = 'global';
    
    this.statements = statements;
  }
  
  init() {
    // set some default values
    this.vars.set('octave', 2);
    this.vars.set('volume', 1);
    this.vars.set('private', false);
    this.vars.set('time-signature', [4, 4]);
    this.vars.set('tempo', 120);
    
    this.tracks = new Map();
    this.meta = [];
    // @TODO: stop circular dependencies? cache them and mark one as mom
    this.importedStyles = new Map();
    this.trackCalls = [];
    this.dependencies = [];
    
    for(let statement of this.statements) {
      if(statement instanceof MetaStatement
        || statement instanceof OptionsStatement) {
        // @TODO: make sure there's exactly 1 meta block
        this.meta.push(statement);
      } else if(statement instanceof ImportStatement) {
        this.importedStyles.set(statement.identifier, statement.path);
        this.dependencies.push(statement.path);
      } else if(statement instanceof TrackStatement) {
        this.tracks.set(statement.name, statement);
      } else if(statement instanceof TrackCall) {
        this.trackCalls.push(statement);
      }
    }
    // handle meta blocks first since they set variables in own scope
    this.meta.forEach(statement => statement.init(this));
    
    // -- handle importing before statements --
    
    this.tracks.forEach(statement => statement.init(this));
  }
  link(ASTs) {
    for(let trackCall of this.trackCalls) {
      // get path name of style
      let importPath = this.importedStyles.get(trackCall.import);
      
      let ast = ASTs.get(importPath);
      if(!ast) throw new NoSuchStyleError(trackCall.import, this);
      let trackStatement = ast.tracks.get(trackCall.track);
      if(!trackStatement) throw new NoSuchTrackError(
        trackCall.import,
        trackCall.track,
        this);
      //trackCall.trackStatement = trackStatement;
      this.tracks.set(`${trackCall.import}.${trackCall.track}`, trackStatement);
    }
    
    for(let [trackname, track] of this.tracks) {
      track.link(ASTs, this);
    }
  }
  execute(songIterator) {
    for(let [trackname, track] of this.tracks) {
      track.execute(songIterator);
    }
  }
}
