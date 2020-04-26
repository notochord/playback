import { NoteSet } from '../MIDI/Note';
import Scope from './Scope';
import { MetaStatement, OptionsStatement, ImportStatement } from './ConfigStatements';
import { TrackStatement, TrackCall } from './Track';
import SongIterator from 'notochord-song/types/songiterator';
declare type Statement = MetaStatement | OptionsStatement | ImportStatement | TrackStatement | TrackCall;
export default class GlobalScope extends Scope {
    statements: Statement[];
    metaStatements: (MetaStatement | OptionsStatement)[];
    importedStyles: Map<string, string>;
    dependencies: string[];
    tracks: Map<string, TrackStatement>;
    trackCalls: TrackCall[];
    metadata?: Map<string, any>;
    constructor(statements: any);
    init(): void;
    link(ASTs: any): void;
    execute(songIterator: SongIterator): Map<string, NoteSet>;
    getInstruments(): Set<string>;
}
export {};
