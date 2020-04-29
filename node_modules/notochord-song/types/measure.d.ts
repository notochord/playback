import Beat from './beat';
import Song from './notochord-song';
/**
 * Handles repeats and stuff
 */
export declare class MeasureContainer {
    type: 'repeat' | 'ending';
    measures: (Measure | MeasureContainer)[];
    repeatInfo: {
        repeatCount?: number;
        ending?: number;
    };
    private static DEFAULTS;
    constructor(song: any, pseudoContainer?: ISongDataMeasureContainer, fill?: boolean);
    serialize(): any;
    [Symbol.iterator](): Iterator<Measure>;
}
export declare class Measure {
    song: Song;
    index?: number;
    length: number;
    beats: Beat[];
    constructor(song: any, pseudoMeasure: any);
    serialize(): any[];
}
