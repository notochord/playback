import fs from 'fs'; // lol this shouldn't be allowed

/**
 * Load a file.
 * (node is working on implementing fs promises but they're behind a flag iirc)
 * @param {string} path The path to the file to load.
 * @return {Promise.<string>} Resolves to the content of the file.
 */
let load = function load(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', (err, data) => err ? reject(err) : resolve(data));
  });
}

export default {
  load: load
};
