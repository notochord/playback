import Scope from './Scope';
import FunctionCall from './FunctionCall';
import { PatternStatement, PatternCall } from './Pattern';
import SongIterator from 'notochord-song/types/songiterator';
export declare class TrackStatement extends Scope {
    instrument: string;
    identifier: string;
    members: (FunctionCall | PatternStatement | PatternCall)[];
    functionCalls: FunctionCall[];
    patterns: Map<string, PatternStatement | PatternCall>;
    patternCalls: PatternCall[];
    constructor(opts: any);
    init(scope: any): void;
    link(ASTs: any, parentStyle: any): void;
    execute(songIterator: any): any;
}
export declare class TrackCall {
    import: string;
    track: string;
    trackStatement: TrackStatement;
    constructor(opts: any);
    execute(songIterator: SongIterator): void;
}
