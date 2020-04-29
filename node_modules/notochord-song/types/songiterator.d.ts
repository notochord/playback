import Song from "./notochord-song";
export default class SongIterator {
    song: Song;
    index?: number;
    constructor(song: any);
    /**
     * Get a measure by absolute index, without advancing the iterator.
     * @param {number} idx
     * @returns {Measure}
     */
    get(idx: any): import("./measure").Measure;
    /**
     * Get a measure relative to the current one, without advancing the iterator.
     * @param {number} [delta=0]
     * @returns {Measure}
     */
    getRelative(delta?: number): import("./measure").Measure;
    /**
     * Iterates over measures in playback order. See the Iterator Protocol.
     * @returns {{done: boolean, value: Measure|undefined}}
     */
    next(): {
        value: import("./measure").Measure;
        done: boolean;
    } | {
        done: boolean;
        value?: undefined;
    };
}
