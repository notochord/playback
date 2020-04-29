export default class Player {
    private style;
    private initialized;
    soundfonts: Map<string, any>;
    context: AudioContext;
    /**
     * Loads the necessary soundfonts and plays a song in a PlaybackStyle in the
     * browser.
     * @param {AudioContext=} context If you pass it an AudioContext it'll use
     * it. Otherwise it'll make its own.
     */
    constructor(context: any);
    setStyle(style: any): Promise<void>;
    play(song: any): void;
}
