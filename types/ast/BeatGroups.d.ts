import { MelodicBeatLiteral } from './BeatLiterals';
import Scope from './Scope';
import SongIterator from 'notochord-song/types/songiterator';
export declare class BeatGroupLiteral {
    measures: Measure[];
    scope: Scope;
    parentBeatGroup: BeatGroupLiteral;
    constructor(measures: Measure[]);
    init(scope: any): void;
    link(): void;
    execute(songIterator: any): any;
    getNextStaticBeatRoot(measureIndex: any, beatIndex: any, songIterator: any): any;
}
export declare class Measure {
    beats: MelodicBeatLiteral[] | DrumBeatGroupLiteral[];
    beatsPerMeasure: number;
    scope: Scope;
    parentBeatGroup: BeatGroupLiteral;
    indexInBeatGroup: number;
    constructor(beats: MelodicBeatLiteral[] | DrumBeatGroupLiteral[]);
    calculateDurationAfter(beatIndex: any): number;
    getNextStaticBeatRoot(beatIndex: any, songIterator: any): any;
    init(scope: any, parentBeatGroup: any, indexInBeatGroup: any): void;
    execute(songIterator: SongIterator): any;
}
export declare class DrumBeatGroupLiteral {
    beatGroup: BeatGroupLiteral;
    scope: Scope;
    drum: string;
    constructor(drum: any, beatGroup: any);
    init(scope: any): void;
    link(): void;
    execute(songIterator: SongIterator): any;
}
