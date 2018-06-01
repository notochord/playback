import nearley from 'nearley';
import grammar from './grammar.ne';
/**
 * Parses a string into an abstract systax tree (AST) -- an array of objects
 * and other arrays representing the syntax of the file.
 * @param {string} data The string to parse
 * @return {Promise.<Array>} A promise that resolves to an array of parsings,
 * each of which is an AST. (Ideally there should be 1 parsing.)
 *
 * See ast_nodes.js or the grammar itself for an idea of what the nodes in the
 * tree might look like.
 * @private
 */
let string_to_ast = function string_to_ast(data) {
  // Create a Parser object from our grammar.
  // (I don't think you can reset the parser so make a new one each time)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  
  return new Promise(function(resolve, reject) {
    try {
      parser.feed(data);
    } catch(err) {
      // Because tabs screw up the formatting of SyntaxError messages.
      err.message = err.message.replace(/\t/g, ' ');
      reject(err);
    }
    resolve(parser.results);
  });
};

/**
 * Parse a string into a n AST.
 * @param {string}  data The string to parse
 * @return {Promise.<Array>} The abstract systax tree (AST) -- an array of\
 * objects and other arrays representing the syntax of the file.
 */
 let parse = function parse(data) {
   return new Promise(function(resolve, reject) {
     string_to_ast(data)
       .then(parses => {
         if(!parses.length) {
           throw new SyntaxError('Something went wrong, input not parseable.');
         }
         resolve(parses[0]);
       });
   });
 };
 
export default {
  string_to_ast: string_to_ast,
  parse: parse
};
