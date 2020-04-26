/**
 * Special pitch value meaning the note will be set later by a DrumBeatGroup
 */
declare let AwaitingDrum: symbol;
export { AwaitingDrum };
export declare class Note {
    time: number;
    pitch: string | symbol;
    duration: number;
    volume: number;
    /**
     * @param {Object} opts Options object.
     * @param {number} opts.time The note's time, in beats.
     * @param {string | symbol} opts.pitch A string representing the pitch and octave of the note. e.x. 'A4'
     * @param {number} opts.duraion The note's duration, in beats.
     * @param {number} opts.volume The note's volume, as a float 0-1 (inclusive).
     */
    constructor(opts: any);
    /**
     * An integer representing the MIDI pitch value of the note.
     * @type {number}
     */
    readonly midi: any;
    /**
     * An integer 0-127 that roughly correlates to volume
     * @type {number}
     */
    readonly velocity: number;
}
export declare class NoteSet extends Array {
    constructor(...args: any[]);
}
