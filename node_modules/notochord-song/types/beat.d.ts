import Song from './notochord-song';
import { Measure } from './measure';
export default class Beat {
    song: Song;
    measure: Measure;
    index?: number;
    private _chord;
    constructor(song: any, measure: any, index: any, pseudoBeat: any);
    /**
     *
     * @param {?string} rawChord
     */
    chord: any;
    scaleDegree: {
        numeral: any;
        flat: any;
        quality: any;
    };
    serialize(): any;
}
