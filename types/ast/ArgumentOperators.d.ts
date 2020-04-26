import Scope from './Scope';
import SongIterator from 'notochord-song/types/songiterator';
declare type Anchor = 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
export declare class AnchorArgument {
    anchor: Anchor;
    constructor(anchor: Anchor);
}
declare class BooleanOperator {
    args: any[];
    scope: Scope;
    constructor(...args: any[]);
    link(ASTs: any, parentStyle: any, parentTrack: any): void;
    init(scope: Scope): void;
    resolve_args(songIterator: SongIterator): any[];
}
export declare class BooleanNot extends BooleanOperator {
    constructor(...args: any[]);
    execute(songIterator: SongIterator): boolean;
}
export declare class BooleanAnd extends BooleanOperator {
    constructor(...args: any[]);
    execute(songIterator: SongIterator): boolean;
}
export declare class BooleanOr extends BooleanOperator {
    constructor(...args: any[]);
    execute(songIterator: SongIterator): boolean;
}
export {};
