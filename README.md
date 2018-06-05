# playback

:warning: In progress, everything here may not work and may change :warning:

Playback is a language for declaratively describing a musical style, and a JS
library that can play a given set of chords in that style. It's a big part of
[Notochord](https://notochord.github.io/notochord/demo/), a lead-sheet editor
that is currently under construction.

## User Guide (this should move)

I recommend the file extension `.play` for styles, because how awesome is that?

More to come.

## Inspiration

Notochord's musical styles were originally described in monolithic JS files,
which led to a couple problems:
  * The styles were tedious to write, very repetitive, and hard to decipher
    after the fact.
  * There's no kosher method to do all of the following in JavaScript:
    * Dynamically load a file from the server
    * Execute code in that file as JavaScript
    * Avoid muddying the global scope and DOM
    ...sure, I could've just dynamically loaded the .js files and `eval()`'d
    them, but that'd pose a risk to both security and Douglas Crockford's
    well-being.

So I set off to create my very own language to define a playback style. The end.

## Navigating this repository

- `dist/playback.js` - the finished product
- `src/` - the unbundled source code
  - `index.js` - this doesn't do much except tie all the other bits together.
  - `loader/` - the loader loads files from the filesystem all promise-like.
    I'll probably remove the whole directory but forget to update the readme.
  - `lexer/` - the lexer takes a .play file as a string and figures out where
    one token ends and another begins. See
    [Wikipedia](https://en.wikipedia.org/wiki/Lexical_analysis) for a better
    explanation. Uses [moo](https://github.com/no-context/moo).
  - `parser` - uses the lexer to turn a .play file string into an Abstract
    Syntax Tree (AST), which is basically a bunch of objects that represent
    the contents of the file in a more useful way. This is done using 
    [nearley](https://github.com/kach/nearley). (If this had to run fast
    there might be a compilation step here but it doesn't so there's not.)
    - `grammar.ne` - the definition of the language's grammar. It's written in
      Nearley's BNF-like syntax.
    - `parser.js` - ties everything nicely together in a promise-y API so you
      don't have to talk to nearley at all.
  - `ast/` - the definitions for the nodes of the AST. This is where you'll
    find the code for what a style is actually doing when you're playing it.
- `styles/` - some styles. I might move these to their own repo later
- `test/` - Most directories in `src/` have their tests defined locally, but
  they're bundled together here. (run with `npm test` or `npm test -- -v` for
  verbose)

## Building and testing, etc.

- `npm test` - run the test suite, print nothing if all tests pass
- `npm run build` - compile the grammar and bundle the files into
  `dist/playback.js`. Also bundle the tests and run them
- `npm run build-watch` - rebuild (and rerun tests) every time you change a file

## Credits

The syntax isn't _particularly_ inspired by [MMA - Musical MIDI Accompinament](https://www.mellowood.ca/mma/index.html),
but I did look at some .mma files when I was designing the syntax, so don't be
surprised if I subconsciously borrowed something.

Some styles themselves may borrow elements from MMA or [iReal Pro](https://irealpro.com/)'s
styles until I get the hang of designing them myself, I apologize to Technimo
in advance.
