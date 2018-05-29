const playback = require('../src/index.js');
const parser = require('../src/parser/parser.js');

/**
 * Test that the parser isn't failing and check for ambiguities in the grammar.
 */
function test_parse_ambiguity(path) {
  playback.load(path)
    .then(parser.string_to_ast)
    .then(results => {
      if(results.length != 1) {
        throw new Error(`${results.length} parses for ${path}`);
      }
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = function() {
  /** test for ambiguities with:
   *  - "|" and "&"-separated lists
   *  - space-separated lists
   *  - multiple lines of // comments
   */
  test_parse_ambiguity('./test/styles/ambig.play');
  /**
   * Parser smoketest: try parsing an initial version of the swing style
   */
  test_parse_ambiguity('./test/styles/example.play');
};
