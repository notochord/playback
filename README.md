# playback

:warning: In progress, everything here may not work and may change :warning:

Playback is a language for declaratively describing a musical style, and a JS
library that can play a given set of chords in that style. It's a big part of
[Notochord](https://notochord.github.io/notochord/demo/), a lead-sheet editor
that is currently under construction.

It's written in TypeScript with a parser written in
[nearley](https://github.com/kach/nearley).

## Documentation (this should move)

### API

Playback is built to work with [notochord-song](https://github.com/notochord/notochord-song)
songs. The package exports two constructors:

- `Player`, which handles playing the song.
  - `new Player()` or `new Player(AudioContext)`
  - `player.setStyle(PlaybackStyle): Promise`
  - `player.play(mySong)` - takes a notochord-song. Don't call this until
    `setStyle` has finished
- `PlaybackStyle`, which represents a style
  - `new PlaybackStyle(pathToStyle)` or `new PlaybackStyle(styleAsText)` - takes a string that is either a style in plaintext, a relative filepath, or a URL
    (see the [resolution algorithm](https://github.com/notochord/playback/blob/master/src/loader/loader.js))

```javascript
import Song from 'notochord-song';
import { Player, PlaybackStyle } from 'playback';

const mySong = new Song(/* serialized song, see notochord-song docs */);

const player = new Player();
const style = new PlaybackStyle('./styles/swing.play');

player.setStyle(style)
  .then(() => {
    // note that browsers may prevent playing audio if the user hasn't initiated it
    player.play(mySong);
  });
```

### How to write a style

For the documentation on how to write a style, see
[https://github.com/notochord/playback/tree/master/docs/styles](). I recommend
the file extension `.play` for styles, because how awesome is that?

## Inspiration

Notochord's musical styles were originally described in monolithic JS files,
which led to a couple problems:
  * The styles were tedious to write, very repetitive, and hard to decipher
    after the fact.
  * There's no kosher method to do all of the following in JavaScript:
    * Dynamically load a file from the server
    * Avoid muddying the global scope and DOM
    * Execute code in that file as JavaScript (sure, I could've just fetched the
      .js files and `eval()`'d them, but that'd pose a risk to both security and
      Douglas Crockford's well-being)

So I set off to create my very own language to define a playback style. The end.

## Navigating this repository

- `dist/` - the finished product, compiled to diferent kinds of JS as needed
- `src/` - the unbundled source code
  - `playback.ts` - this doesn't do much except tie all the other bits together.
  - `loader/` - the loader loads files from the filesystem and/or via http
    request, per a resolution algorithm laid out in a comment at the top of that
    file. It's real hacky and probably needs to change significantly.
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
    - `grammar.js` - ignore this, it's compiled from the `.ne` file.
    - `parser.ts` - ties everything nicely together in a promise-y API so you
      don't have to talk to nearley at all.
  - `ast/` - the definitions for the nodes of the AST. This is where you'll
    find the code for what a style is actually doing when you're playing it.
  - `values/` - a bunch of classes that represent different kinds of values in
    Playback, like strings, numbers, etc.
- `styles/` - some styles. I might move these to their own repo later
- `test/` - Most directories in `src/` have their tests defined locally, but
  they're bundled together here. (run with `npm test` or `npm test -- -v` for
  verbose)

## Building and testing, etc.

- `npm test` - run the test suite
- `npm run build` - compile and bundle
- `npm run playground` - open the playground

## Credits

The syntax isn't _particularly_ inspired by [MMA - Musical MIDI Accompinament](https://www.mellowood.ca/mma/index.html),
but I did look at some .mma files when I was designing the syntax, so don't be
surprised if I subconsciously borrowed something.

Some styles themselves may borrow elements from MMA or [iReal Pro](https://irealpro.com/)'s
styles until I get the hang of designing them myself, I apologize to Technimo
in advance.
