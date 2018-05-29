const fse = require('fs-extra');
const parser = require('./parser/parser.js');

/**
 * Load a file.
 * (node is working on implementing fs promises but they're behind a flag iirc)
 * @param {string} path The path to the file to load.
 * @return {Promise.<string>} Resolves to the content of the file.
 */
var load = function load(path) {
  return fse.readFile(path, 'utf8');
}

module.exports = {
  load: load,
  /**
   * is there a way to link here to the jsdoc where the function is defined?
   */
  parse: parser.parse
}
