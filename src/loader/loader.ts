/**
 * Load a file.
 * 
 * * Style locator algorithm:
 * 1. If the path starts with an @ symbol (preceeded by optional whitespace),
 *    return the path as file content.
 * 2. If the path begins with http:// or https://, look at that URL
 * 3. If the path begins with . or / look in the filesystem or at a relative URL
 * 4. Otherwise, look in the styles folder in this repo (which will move to its
 *    own repo eventually). For these built-in styles, the .play file extension
 *    is not required.
 * 
 * @param {string} path The path to the file to load.
 * @return {string} The content of the file.
 */
export async function load(stylePath: string): Promise<string> {
  if (stylePath.match(/^\s*@/)) {
    return stylePath;
  }
  const isHTTP = stylePath.startsWith('http://') || stylePath.startsWith('https://');
  const isRelative = stylePath.startsWith('.') || stylePath.startsWith('/');
  if (typeof process === 'undefined') {
    if (isHTTP || isRelative) {
      return fetch(stylePath).then(r => r.text());
    } else {
      const modulePath = ''; //String(import.meta.url).replace(/[^\/]+$/, '');
      stylePath = modulePath + '../../styles/' + stylePath;
      if (!stylePath.endsWith('.play')) stylePath += '.play';
      return fetch(stylePath).then(r => r.text());
    }
  } else {
    if (isHTTP) {
      // @ts-ignore
      const http = await import(stylePath.startsWith('https://') ? 'https' : 'http');
      return new Promise((resolve, reject) => {
        http.get(stylePath, (res: any) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (data: string) => body += data);
          res.on('end', () => resolve(body));
          res.on('error', reject);
        });
      });
    }
    if (!isRelative) {
      // @ts-ignore
      const path = await import('path');
      try {
        stylePath = path.join(__dirname, '../../styles/', stylePath);
      } catch {}
      if (!stylePath.endsWith('.play')) stylePath += '.play';
    }
    // @ts-ignore
    const fs = await import('fs');
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
}
