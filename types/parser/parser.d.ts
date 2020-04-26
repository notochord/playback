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
export declare function getPossibleParses(data: string): Promise<GlobalScope[]>;
/**
 * Parse a string into an Abstract Syntax Tree (AST) -- a tree of objects
 * representing the syntax of the file.
 * @param {string}  data The string to parse
 * @return {Promise.<GlobalScope>} The Abstract Systax Tree (AST).
 */
export declare function parse(data: string): Promise<GlobalScope>;
