import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import banner from 'rollup-plugin-banner';
import alias from 'rollup-plugin-alias';

const preamble = 'notochord-song by Jacob Bloom\nThis software is provided as-is, yadda yadda yadda';

export default [
  {
    input: './src/notochord-song.ts',
    output: {
      file: './dist/notochord-song.cjs',
      format: 'cjs'
    },
    external: ['tonal'],
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  {
    input: './src/notochord-song.ts',
    output: {
      file: './dist/notochord-song.node.mjs',
      format: 'esm'
    },
    external: ['tonal'],
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  {
    input: './src/notochord-song.ts',
    output: {
      file: './dist/notochord-song.web.mjs',
      format: 'esm'
    },
    external: ['https://dev.jspm.io/tonal@2.2.2'],
    plugins: [
      alias({tonal: 'https://dev.jspm.io/tonal@2.2.2'}),
      typescript(),
      banner(preamble)
    ]
  },
  /*{
    input: './src/notochord-song.ts',
    output: {
      file: './dist/notochord-song.min.js',
      name: 'Song',
      format: 'iife'
    },
    plugins: [
      alias({tonal: './../node_modules/tonal/build/transpiled.js'}),
      typescript(),
      terser(),
      banner(preamble)
    ]
  },*/
];