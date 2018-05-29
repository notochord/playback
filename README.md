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
    
  ...sure, I could've just dynamically loaded the .js files and `eval()`'d them,
  but that'd pose a risk to both security and Douglas Crockford's well-being.

## Credits

The syntax isn't _particularly_ inspired by [MMA - Musical MIDI Accompinament](https://www.mellowood.ca/mma/index.html),
but I did look at some .mma files when I was designing the syntax, so don't be
surprised if I subconsciously borrowed something.

Some styles themselves may borrow elements from MMA or [iReal Pro](https://irealpro.com/)'s
styles until I get the hang of designing them myself, I apologize to Technimo
in advance.
