import nearley from '../lib/nearley/nearley.js';
import grammar from './grammar';
import { GlobalScope } from '../ast/ast_nodes';
/**
 * Parses a string into a set of possible abstract systax trees (ASTs) trees of
 * objects representing the syntax of the file.
 * @param {string} data The string to parse
 * @return {Promise.<Array>.<GlobalScope>} A promise that resolves to an array
 * of parsings, each of which is an AST. (Ideally there should be 1 parsing.)
 *
 * See ast_nodes.js or the grammar itself for an idea of what the nodes in the
 * tree might look like.
 * @private
 */
export async function getPossibleParses(data: string): Promise<GlobalScope[]> {
  // Create a Parser object from our grammar.
  // (I don't think you can reset the parser so make a new one each time)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(data);
    return parser.results as GlobalScope[];
  } catch(err) {
    // Because tabs screw up the formatting of SyntaxError messages.
    err.message = err.message.replace(/\t/g, ' ');
    throw err;
  }
}

/**
 * Parse a string into an Abstract Syntax Tree (AST) -- a tree of objects
 * representing the syntax of the file.
 * @param {string}  data The string to parse
 * @return {Promise.<GlobalScope>} The Abstract Systax Tree (AST).
 */
export async function parse(data: string): Promise<GlobalScope> {
  const parses = await getPossibleParses(data);
  if(!parses.length) {
    throw new SyntaxError('Something went wrong, input not parseable.');
  }
  return parses[0];
}