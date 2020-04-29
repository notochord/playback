/**
 * Load a file.
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
export declare function load(stylePath: any): Promise<unknown>;
