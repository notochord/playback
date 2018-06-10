import loader from './loader/loader.js';
import parser from './parser/parser.js';
import PlaybackStyle from './PlaybackStyle/PlaybackStyle.js';

export default {
  load: loader.load,
  PlaybackStyle: PlaybackStyle,
  /**
   * is there a way to link here to the jsdoc where the function is defined?
   */
  parse: parser.parse
}
