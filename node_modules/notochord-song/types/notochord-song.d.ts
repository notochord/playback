import SongIterator from './songiterator.js';
import { Measure, MeasureContainer } from './measure';
export default class Song {
    private props;
    private callbackMap;
    measureContainer: MeasureContainer;
    measures: Measure[];
    private static DEFAULTS;
    constructor(pseudoSong?: ISongData);
    /**
     * Get the transposed key of the song
     * @returns {string}
     */
    getTransposedKey(): any;
    /**
     * Subscribe to changes to a property of the song (except measureContainer)
     * @param {string} property Property to subscribe to changes to
     * @param {function} callback Function that is passed the new value when the property updates
     */
    onChange(property: any, callback: any): void;
    /**
     * Get a property of the song (except measureContainer)
     * @param {string} property
     * @returns {*} The value of that property (or undefined)
     */
    get(property: any): any;
    /**
     * Set a property of the song, and notify those subscribed to changes to that property.
     * @param {string} property
     * @param {*} value
     */
    set(property: any, value: any): void;
    /**
     * Generate default prop values. Can't just use a constant because the dates
     * change per runtime
     * @returns {Object}
     * @private
     */
    _makeDefaultProps(): {
        title: string;
        composedOn: number;
        composer: string;
        updatedOn: number;
        updatedBy: string;
        tempo: number;
        style: string;
        key: string;
        transpose: number;
        timeSignature: number[];
    };
    _emitChange(prop: any, value: any): void;
    serialize(): ISongData;
    [Symbol.iterator](): SongIterator;
}
