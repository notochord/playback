import {} from 'mocha';
import { expect } from 'chai';
import * as fs from 'fs';
import {promisify} from 'util';

import * as parser from '../src/parser/parser';

const readFile = promisify(fs.readFile);

// const readFile = (path) => new Promise((r, s) => fs.readFile(path, (err, data) => err ? s(err) : r(data)));

describe('Parser suite', async () => {
  let exampleFile = String(await readFile('./styles/example.play'));

  it('Parser smoketest: parser works with latest grammar features', async (done) => {
    const ast1 = await parser.parse(exampleFile);
    ast1.init();
    //assert.ok(ast1.tracks[0] typeof Track)
    done();
  })
  describe.skip('Grammar ambiguities', () => {
    it('"&"-separated lists are unambiguous', async (done) => {
      const file = `
      @track "p" as d {
        @pattern b {
          @pattern(a) & @pattern(a) & @pattern(a) &
          @pattern(a) & @pattern(a) & @pattern(a)
        }
      }`;
      const parses = await parser.getPossibleParses(file);
      expect(parses).to.have.lengthOf(1);
      done();
    });

    it('"|"-separated lists are unambiguous', async (done) => {
      const file = `
      @track "p" as d {
        @pattern b {
          < 1 | 2 | 3 | 4 | 5 | 6 >
        }
      }`;
      const parses = await parser.getPossibleParses(file);
      expect(parses).to.have.lengthOf(1);
      done();
    });

    it('whitespace-separated lists are unambiguous', async (done) => {
      const file = `
      @track "p" as d {
        @pattern b {
          <1> <1> <1> <1> <1>
        }
      }`;
      const parses = await parser.getPossibleParses(file);
      expect(parses).to.have.lengthOf(1);
      done();
    });

    it('consecutive line comments are unambiguous', async (done) => {
      const file = `
      @track "p" as d {
        @pattern b {
          // comment 1
          // comment 2
          // comment 3
        }
      }`;
      const parses = await parser.getPossibleParses(file);
      expect(parses).to.have.lengthOf(1);
      done();
    });
  });
});
