import loader from './loader/loader.js';
import parser from './parser/parser.js';

export default {
  load: loader.load,
  /**
   * is there a way to link here to the jsdoc where the function is defined?
   */
  parse: parser.parse
}
