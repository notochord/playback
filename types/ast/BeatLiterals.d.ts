import { NoteSet } from '../MIDI/Note';
import Scope from './Scope';
import { Measure } from './BeatGroups';
import SongIterator from 'notochord-song/types/songiterator';
declare type TimePart = {
    time: 'auto' | number;
    flag?: 'STACCATO' | 'ACCENTED';
};
declare type PitchPart = {
    degree: number;
    anchor?: 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
    roll?: 'ROLL_UP' | 'ROLL_DOWN';
    chord: boolean;
};
export declare class MelodicBeatLiteral {
    time: TimePart;
    pitch: PitchPart;
    octave: number | 'inherit';
    scope: Scope;
    parentMeasure: Measure;
    indexInMeasure: number;
    cachedAnchor: any;
    constructor(opts: any);
    init(scope: any, parentMeasure: any, indexInMeasure: any): void;
    getTime(): number;
    /**
     * Normalize a chord into a form tonal can handle
     * @param {string} [chord='']
     * @return {string}
     */
    static normalizeChord(chord?: string): string;
    static chordToScaleName(chord: any): string;
    handleInversion(songIterator: any, pitches: any): any[];
    static getAnchorChord(anchor: any, songIterator: SongIterator, currentTime: any): string;
    static anchorChordToRoot(anchorChord: any, degree: any, octave: any): any;
    getAnchorData(songIterator: any): any[];
    getPitches(songIterator: SongIterator): any;
    /**
     * Returns true if the beat is anchored via STEP or ARPEGGIATE
     * @returns {boolean}
     */
    isDynamic(): boolean;
    getOctave(): any;
    getDuration(): any;
    getVolume(): any;
    execute(songIterator: any): NoteSet;
}
export declare class DrumBeatLiteral {
    time: number;
    accented: boolean;
    scope: Scope;
    parentMeasure: Measure;
    indexInMeasure: number;
    constructor(opts: any);
    init(scope: any, parentMeasure: any, indexInMeasure: any): void;
    getTime(): number;
    getDuration(): any;
    getVolume(): any;
    execute(songIterator: any): NoteSet;
}
export {};
