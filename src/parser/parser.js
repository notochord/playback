const nearley = require('nearley');
const grammar = require('./grammar.js');
/**
 * Parses a string into an abstract systax tree (AST) -- an array of objects
 * and other arrays representing the syntax of the file.
 * @param {string} data The file to parse
 * @return {Promise.<Array>} A promise that resolves to an array of parsings,
 * each of which is an AST. (Ideally there should be 1 parsing.)
 *
 * See ast_nodes.js or the grammar itself for an idea of what the nodes in the
 * tree might look like.
 */
var string_to_ast = function parse(data) {
  // Create a Parser object from our grammar.
  // (I don't think you can reset the parser so make a new one each time)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  
  return new Promise(function(resolve, reject) {
    try {
      parser.feed(data);
    } catch(err) {
      // because tabs screw up the formatting of the error message
      err.message = err.message.replace(/\t/g, ' ');
      reject(err);
    }
    resolve(parser.results);
  });
}

module.exports = {
  string_to_ast: string_to_ast
};
