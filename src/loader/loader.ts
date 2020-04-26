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
export async function load(stylePath) {
  let isHTTP = stylePath.startsWith('http://') || stylePath.startsWith('https://');
  let isRelative = stylePath.startsWith('.') || stylePath.startsWith('/');
  if (typeof process === 'undefined') {
    if (isHTTP || isRelative) {
      return fetch(stylePath).then(r => r.text());
    } else {
      let modulePath = ''; //String(import.meta.url).replace(/[^\/]+$/, '');
      stylePath = modulePath + '../../styles/' + stylePath;
      if (!stylePath.endsWith('.play')) stylePath += '.play';
      return fetch(stylePath).then(r => r.text());
    }
  } else {
    if (isHTTP) {
      const http = await import(stylePath.startsWith('https://') ? 'https' : 'http');
      return new Promise((resolve, reject) => {
        http.get(stylePath, res => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', data => body += data);
          res.on('end', () => resolve(body));
          res.on('error', reject);
        });
      });
    }
    if (!isRelative) {
      let path = await import('path');
      try {
        stylePath = path.join(__dirname, '../../styles/', stylePath);
      } catch {}
      if (!stylePath.endsWith('.play')) stylePath += '.play';
    }
    let fs = await import('fs');
    return (new Promise((resolve, reject) => {
      fs.readFile(stylePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }));
  }
};
