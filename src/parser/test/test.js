import loader from '../../loader/loader.js';
import parser from '../parser.js';
import assert from 'assert';

export default function() {
  
  // load a couple test files
  // yes one promise can have multiple thens, I checked in chrome console
  let styles_dir = './src/parser/test/styles/';
  let file_ambig = loader.load(styles_dir + 'ambig.play');
  let file_example = loader.load(styles_dir + 'example.play');
  
  /**
   * Parser smoketest: try parsing an old/modified version of the swing style
   * (this is the file I add new features to when I'm modifying the grammar)
   */
  file_example.then(parser.parse).then(ast => {
    ast.init()
    // assert.ok(ast.tracks[0] typeof Track);
  });
  
  /** test for grammar ambiguities with:
   *  - "|" and "&"-separated lists
   *  - whitespace-separated lists
   *  - multiple lines of // comments
   */
  file_ambig
    .then(parser.string_to_ast)
    .then(results => {
      assert.equal(results.length, 1, 'expected 1 parse (grammar ambiguous)');
    });
};
