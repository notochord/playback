/**
 * Load a file.
 * 
 * Note: This version won't compile under webpack because import.meta isn't
 * supported by their parser
 * 
 * * Style locator algorithm:
 * 1. If the path begins with http:// or https://, look at that URL
 * 2. If the path begins with . or / look in the filesystem or at a relative URL
 * 3. Otherwise, look in the styles folder in this repo (which will move to its
 *    own repo eventually). For these built-in styles, the .play file extension
 *    is not required.
 * 
 * @param {string} path The path to the file to load.
 * @return {string} The content of the file.
 */
export async function load(stylePath) {
  let isHTTP = stylePath.startsWith('http://') || stylePath.startsWith('https://');
  let isRelative = stylePath.startsWith('.') || stylePath.startsWith('/');
  if (isHTTP || isRelative) {
    return await fetch(stylePath).then(r => r.text());
  } else {
    let modulePath = String(import.meta.url).replace(/[^\/]+$/, '');
    stylePath = modulePath + '../../styles/' + stylePath;
    if (!stylePath.endsWith('.play')) stylePath += '.play';
    return await fetch(stylePath).then(r => r.text());
  }
};
