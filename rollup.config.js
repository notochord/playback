import typescript from 'rollup-plugin-typescript';
import banner from 'rollup-plugin-banner';

const preamble = 'playback by Jacob Bloom\nThis software is provided as-is, yadda yadda yadda';

export default [
  {
    input: './src/playback.ts',
    output: {
      file: './dist/playback.cjs',
      format: 'cjs'
    },
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  {
    input: './src/playback.ts',
    output: {
      file: './dist/playback.node.mjs',
      format: 'esm'
    },
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  {
    input: './src/playback.ts',
    output: {
      file: './dist/playback.web.js',
      format: 'esm'
    },
    plugins: [
      typescript(),
      banner(preamble)
    ]
  },
  /*{
    input: './src/playback.ts',
    output: {
      file: './dist/playback.min.js',
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