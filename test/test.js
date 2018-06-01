import parser_tests from '../src/parser/test/test.js';

//const verbose = process.argv.includes('--verbose');

// run parser tests
parser_tests();

// @TODO: have a set of tests directly on playback.js to make sure the apis
// export correctly cuz webpack is being iffy about that
