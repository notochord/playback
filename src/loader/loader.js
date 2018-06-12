import fs from 'fs'; // lol this shouldn't be allowed

/**
 * Style locator algorithm:
 * if the path begins with . or / look in the filesystem
 * If the path begins with a protocol, look on the internet
 * otherwise, look in:
 * 1. styles folder in this repo
 * 2. (node_modules equivalent?)
 * 3. a styles repo to be created later
 * (in either case, if the path doesn't end in .play it's implied, but other
 * file names are respected)
 * note to self: that means no dots in style names
 * @TODO: deal with relative paths outside of the repo vs inside
 * @TODO: windows/unix - https://nodejs.org/api/path.html#path_windows_vs_posix
 */

/**
 * Load a file.
 * (node is working on implementing fs promises but they're behind a flag iirc)
 * @param {string} path The path to the file to load.
 * @return {Promise.<string>} Resolves to the content of the file.
 */
let load = function load(path) {
  return new Promise(function(resolve, reject) {
    if(path.startsWith('.') || path.startsWith('/'))
    fs.readFile(path, 'utf8', (err, data) => err ? reject(err) : resolve(data));
  });
}

export default {
  load: load
};
