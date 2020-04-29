export default class PlaybackStyle {
    private mainPath;
    private ASTs;
    private initialized;
    private main;
    /**
     * Set the main ast (the one that plays all its instruments by default).
     * @param {ast.GlobalScope} main the main ast
     * @param {Map.<string: ast.GlobalScope>} asts A map of asts by their path
     */
    constructor(mainPath: any);
    /**
     * Parse each file, pull its dependencies, put it all in a cache, rinse and
     * repeat.
     * @private
     */
    _loadDependencies(): Promise<void>;
    _link(): void;
    /**
     * Initialize the style, which includes loading dependencies and linking
     * track/pattern calls. Must be called before compiling/playing.
     */
    init(): Promise<void>;
    /**
     * Compile a song into a set of MIDI-like note instructions.
     * @param {Song} song A Playback Song (notochord????)
     * @returns {NoteSet.<Note>} An array-like object containing MIDI-like note
     * instructions.
     */
    compile(song: any): Map<any, any>;
    getInstruments(): Set<string>;
}
