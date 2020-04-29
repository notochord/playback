import {NoteSet} from '../MIDI/Note';
import {NoSuchStyleError, NoSuchTrackError} from './errors';
import Scope from './Scope';
import {MetaStatement, OptionsStatement, ImportStatement} from './ConfigStatements';
import {TrackStatement, TrackCall} from './Track';
import * as values from '../values/values';
import SongIterator from 'notochord-song/types/songiterator';

type Statement = MetaStatement | OptionsStatement | ImportStatement | TrackStatement | TrackCall;

export default class GlobalScope extends Scope {
  public statements: Statement[];
  public metaStatements: (MetaStatement | OptionsStatement)[];
  public importedStyles: Map<string, string>;
  public dependencies: string[];
  public tracks: Map<string, TrackStatement>;
  public trackCalls: TrackCall[];
  public metadata?: Map<string, any>;

  constructor(statements) {
    super();
    
    this.name = 'global';
    this.type = 'global';
    
    this.statements = statements;
  }
  
  init() {
    // set some default values
    this.vars.set('time-signature', new values.PlaybackTimeSignatureValue([4, 4]));
    this.vars.set('tempo', new values.PlaybackNumberValue(120));
    
    this.tracks = new Map();
    this.metaStatements = [];
    // @TODO: stop circular dependencies? cache them and mark one as mom
    this.importedStyles = new Map();
    this.trackCalls = [];
    this.dependencies = [];
    
    for(let statement of this.statements) {
      if(statement instanceof MetaStatement
        || statement instanceof OptionsStatement) {
        // @TODO: make sure there's exactly 1 meta block
        this.metaStatements.push(statement);
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
    this.metaStatements.forEach(statement => statement.init(this));
    
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
    
    for(let [, track] of this.tracks) {
      track.link(ASTs, this);
    }
  }
  execute(songIterator: SongIterator) {
    let trackNoteMap = new Map<string, NoteSet>();
    for(let [, track] of this.tracks) {
      let trackNotes = track.execute(songIterator);
      if(trackNotes) trackNoteMap.set(track.instrument, trackNotes);
    }
    return trackNoteMap;
  }
  getInstruments() {
    let instruments = new Set<string>();
    for(let [, track] of this.tracks) {
      instruments.add(track.instrument);
    }
    return instruments;
  }
}
