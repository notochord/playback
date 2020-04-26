import { NoteSet } from '../MIDI/Note';
import Scope from './Scope.js';
import FunctionCall from './FunctionCall.js';
import SongIterator from 'notochord-song/types/songiterator';
export declare class PatternExpressionGroup extends Scope {
    expressions: any[];
    functionCalls: FunctionCall[];
    nonFunctionCallExpressions: any[];
    patternStatement: PatternStatement;
    constructor(expressions: any);
    init(scope: any, patternStatement?: any): void;
    link(ASTs: any, parentStyle: any, parentTrack: any): void;
    execute(songIterator: any, callerIsTrack?: boolean): symbol | NoteSet;
}
export declare class PatternStatement extends PatternExpressionGroup {
    identifier: string;
    condition?: any;
    constructor(opts: any);
    getChance(): any;
    link(ASTs: any, parentStyle: any, parentTrack: any): void;
    init(scope: any): void;
    execute(songIterator: SongIterator, callerIsTrack?: boolean): symbol | NoteSet;
}
export declare class PatternCall {
    import?: string;
    track?: string;
    pattern: string;
    scope: Scope;
    patternStatement: PatternStatement;
    prettyprintname: string;
    constructor(opts: any);
    getChance(): any;
    init(scope: any): void;
    link(ASTs: any, parentStyle: any, parentTrack: any): void;
    execute(songIterator: SongIterator): symbol | NoteSet;
}
export declare class JoinedPatternExpression {
    patterns: any[];
    scope: Scope;
    constructor(patterns: any);
    init(scope: any): void;
    link(ASTs: any, parentStyle: any, parentTrack: any): void;
    execute(songIterator: SongIterator): symbol | any[];
}
