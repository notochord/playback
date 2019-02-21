# Creating a style

A style is a text file that describes how to play a song in a musical style. We
recommend the file extension `.play`, but you can use any file extension you
like (see the API documentation) (TODO link)

## Overview

A .play file will look something like this:

```
@meta {
	name("My Awesome Style") // style name, description, etc...
}

@options {
	time-signature(4 4) // global defaults and settings
}

@import "standard-library" as stdlib
// other imported styles

@track(stdlib.drums) // import the "drums" instrument from "standard-library"

@track "acoustic_grand_piano" as piano { // each track represents an instrument
	volume(1) // track-level settings -- if unset, inherited from @options block
	
	@pattern my-pattern { // a pattern is 1 measure (usually) that MIGHT play any given measure
    volume (.3) // pattern-level settings -- if unset, inherited from the track
    <1.5s:1c 2:1c 3.5:1c> // this is a representation of notes and beats. See below.
	}
  
  @pattern my-dynamic-pattern {
    // you can also use the special choose() function to choose between a number
    // of beat patterns (or anything else)
    choose(
			<1.5s:1c 2:1c 3.5:1c>
			<1:1c 2.5s:1c 3.5:1c>
			<1:1c 2.5:1c 3.5:1c 4.5:1c>
		)
  }
  
  // a pattern can have a condition and only run when that happens
	@pattern my-conditional-pattern if(progression(< :1 | :5 >)) {
    <1:1c:4 2.5:1c:4>
  }
	
}

// more tracks can go down here...
```

See below for more explanation of what each section does.

## Stuff that goes everywhere

### Comments

A comment is a note to yourself. It doesn't do anything in the code and goes
until the end of a line. It starts with 2 slashes (`//`). For example:

```
@meta {} // after these slashes, everything I write is ignored
```

### Functions

Functions take the form `function-name(argument1 argument2)`. They have a number
of uses:

* Describing the style inside the `@meta` block
* Settings
  * There is a special kind of settings function called a "Boolean function". It
    has 2 forms. For example, let's use the `swing()` function. Without an
    argument, it turns swing on (sets it to true). It can also have 1 Boolean
    argument (`swing(true)` or `swing(false)`) which sets swing to that value.
* Choosing -- the `choose(a b c)` function randomly returns one of whatever
  you've passed to it. `choose()` is not allowed in `@meta` or `@options`.
* Conditions -- there are several functions that can be used in the condition of
  a `@pattern` block. This includes `choose()`. Most of these functions are not
  allowed in `@meta` or `@options`.

## Configuration blocks

Configuration blocks are spaces where you declare things that apply to the
entire style.

You can have 0 or any number of `@options` blocks or `@import` statements.

### `@meta` block

At the top of every file is a section where you'll put some information about
the style. A typical meta block might look like this:

```
@meta {
	name("Swing")
	author("Jacob Bloom")
	description("You know the drill")
	playback-version(0.1) // this defaults to the latest version so watch out
}
```

For a full list of functions you can and should put in your `@meta`, see
(TODO link)

### `@options` block

The options block is a place for global settings (like `time-signature` or
`swing`) as well as defaults that are inherited by `@track` blocks (such as
`volume(0.5)`). It might look like this:

```
@options {
	time-signature(4 4)
	swing() // or swing(true)
}
```

### `@import` statement

An `@import` statement does not, by itself, change what your style sounds like.
Instead, it opens up tracks and patterns from that other style that you can later
take advantage of. It might look like this:

```
@import "standard-library" as stdlib
@import "./mystyle" as mystyle // local file
@import "./mystyle.play" as mystyle
@import "http://example.com/mystyle.play" as mystyle // downloaded from across the internet
```

## Tracks

A track represents an instrument. Of course, this doesn't hold up 100% (you might have
separate tracks for the left and right hands on piano).

The track plays samples from a soundfont, which you can choose in one of 3 ways:

* The name of a General MIDI instrument, as per MIDI.js's pre-built soundfonts.
  (TODO: link)
* `"percussion"` which imports our [percussion soundfont](https://github.com/notochord/percussion-soundfont.js).
  Drum tracks have some special properties we'll get to later.
* A soundfont URL, followed by a space, and then a number representing the
  instrument. Example:
  
  ```
  @track "http://example.com/myinstrument-mp3.js 0" as my-instrument { ... }
  ```
  
  (TODO: each file is its own instrument, right? I don't think the number is
  necessary)

Within the brackets are both settings functions and patterns. Tracks inherit
settings from the `@options` blocks.

### Calling an imported track

Tracks from imported styles don't play by default. After you've imported a
style, you can call it using the syntax `@track(style.track)`:

```
@import "./mystyle.play" as my-style
@track(my-style.my-track)
```

## Patterns

A pattern is a piece of music that may or may not play on any particular
measure. They're a measure long by default, and whenever a track is ready to
play a new measure, it chooses from the patterns that are currently available.
The most basic pattern might look something like this:

```
@pattern my-pattern {
  volume(0.1)
  <1:1 2:1 3:1>
}
```

### Conditional patterns

A pattern can have a condition on it and it's only available to the track when
that condition is true. That condition could be any number of things, but here
are a few common examples:

* A pattern that only plays when the third beat of a measure is different from
  the first.
* A pattern that only plays when the progression is a certain way:
  
  ```
  @pattern my-pattern if(progression(< :1 | :5 >)) { ... }
  ```

### Shorthand

If a pattern is only 1 beat-group or function call, you don't need the
curly-brackets:

```
@pattern my-pattern <1.5s:1c 2:1c 3.5:1c>

@pattern my-other-pattern choose(
  <1.5s:1c 2:1c 3.5:1c>
  <1:1c 2.5s:1c 3.5:1c>
  <1:1c 2.5:1c 3.5:1c 4.5:1c>
)
```

### Anonymous track scopes

You can create smaller, "anonymous" scopes that can have their own settings:

```
@pattern my-pattern {
  choose(
    {volume(1) <1.5s:1c 2:1c 3.5:1c>}
    {volume(0.5) <1:1c 2.5s:1c 3.5:1c>}
  )
}
```

### Calling a pattern

You can re-use a pattern using a Pattern Call. This could be a pattern local
to the current track:

```
@track "acoustic_grand_piano" as piano {
  @pattern piano1 {
    private() // won't play, only for use by calling
    <:1 :2 :3 :4>
  }
  
  @pattern my-pattern {
    <1.5:1> & @pattern(piano1)
  }
}
```

You can also use a pattern that is defined in a different instrument:

```
...

@track "marimba" as marimba {
  @pattern my-other-pattern {
    @pattern(piano.piano1)
  }
}
```

Or, probably more usefully, use a pattern that's defined in an imported style
(remember, nothing in an imported style plays until you tell it to):

```
@import "standard-library" as stdlib
@track "percussion" as drums {
  @pattern hi-hat {
    @pattern(stdlib.drums.hi-hat)
  }
}
```

You can also use a pattern call directly in a track definition:

```
@import "standard-library" as stdlib
@track "percussion" as drums {
  @pattern(stdlib.drums.hi-hat)
}
```

## Beat groups

A beat group represents the timing and pitch of actual played notes. It's
a pair of `<`angle brackets`>` containing a whitespace-separated list of "beats."
It can also contain a pipe character `|` which represents the start of a new
measure.

### Melodic beats

(TODO: rename to Melodic Beat in the grammar/ast, I like that better)

Melodic beats have 3 parts, 2 of which are optional:

```
(time part):(note/chord part):(octave part)
```

Each of these parts may have one or more flags. We'll get to flags later, but
first here's the different ways a melodic beat might look:

```
< 1:3:5 > // plays on beat 1, the note 3 (in the current chord), in octave 5
< 1:3 >   // plays on beat 1, the note 3, inherits octave from parent scope
< :3:5 >  // plays on beat 1 (when time is unspecified, it's the next integer
          // above the previous beat's time), note 3, octave 5
< :3 >    // plays on beat 1 per above, note 3, inherits octave from parent scope
```

Note that the colon between `(time part)` and `(note/chord part)` is NOT omitted
when `(time part)` is omitted, but when `(octave part)` is omitted you do omit
the colon between `(note/chord part)` and `(octave part)`.

#### Time part

The time part of a melodic beat is optional. If it's the first beat in the
beat group, time part defaults to 1. After that, it defaults to the next integer
after the time part of the previous beat. It may be any number between 1 and the
numerator of the time signature (inclusive).

This may be any mathematical expression using the arithmetic operators, which
makes it possible to do tuplets:

```
<1:1 4/3:2 5/3:3 2:3 3:3 4:3>
```

After the number, there are 2 flags allowed:

| Flag | Meaning |
| ---- | ------- |
| `s`  | Staccato (by default, notes are sustained until the next note) |
| `a`  | Accented (volume boost) |

(TODO: it feels valid for a note to be both accented and staccato)

If the number is omitted, a singleton flag is allowed.

#### Note/chord part

##### Single-note

The note part by default describes a note relative to the chord on the current
beat. This can be changed by using an "anchor":

| Anchor | Notes relative to |
| ------ | ----------------- |
| (none) | Chord in current beat of measure |
| `k`    | Key of the song |
| `n`    | Chord in first beat of the next measure |

A number is required if there's no anchor. If there's an anchor and the number
is omitted, it's implied to be the 1 of that chord. If there is a number, the
note is that many scale degrees above the root of the anchoring chord (in the
chord's scale, not the scale of the song's key.) For example:

```
< :1 >   // Root of the current chord
< :5 >   // 5th of the current chord
< :k >   // Root of the key of the song
< :k1 >  // Root of the key of the song
< :k5 >  // 5th in the scale of the song's key
< :n >   // Root of the first chord in the next measure
< :n5 >  // 5th of the first chord in the next measure
```

(TODO: `s` and `a` are not anchors and must not be combined with a number nor
with `c` -- or are passing chords fine? idc)

##### Chord

the `c` flag renders a chord. Alone, it plays the current beat's chord. If it's
preceded by a single-note anchor/number it plays the chord of that note, either
major or minor based on the scale of the song's key.

(TODO: way to override major/minor for `c`?)

The `c` flag may be followed by one of the following:

| Flag | Meaning |
| ---- | ------- |
| `r`  | Roll the chord upwards |
| `rd`  | Roll the chord downwards |

#### Octave part

The octave part allows the user to specify the octave of the note or chord. It
can be omitted completely, along with the preceding colon.

### Drum beat groups

In a track that has the special instrument `"percussion"`, you must use the
drum beat notation, which consists of the quoted name of a drum off
[this list](https://github.com/notochord/percussion-soundfont.js/blob/master/drums.json)
followed by a beat group containing only drum beats:

```
@track "percussion" as drums {
	@pattern hi-hat {
		"Open Hi-Hat" <1 2 2.5 3 4 4.5> &
		"Closed Hi Hat" <2 4>
		volume(0.1)
	}
}
```

Note that, unlike melodic beats, drum beats consist only of a time (in beats)
and 1 possible flag:

| Flag | Meaning |
| ---- | ------- |
| `a`  | Accented (volume boost) |

TODO case insensitivity? dash/space insensitivity? Would help with the
inconsistencies in the spec I guess

## Operators

### Arithmetic operators

There are 4 arithmetic operators:

| Operator | Name |
| -------- | ---- |
| `+`      | addition |
| `-`      | subtraction |
| `/`      | division |
| `*`      | multiplication |

They work as you probably imagine they would. `*` and `/` take precedence over
`+` and `-` but you may use parentheses to override that.

A numeric expression using arithmetic operators may be used anywhere where a
number is acceptable, but the returned value must conform to the rules that a
raw number would (e.x. `time-signature()` only accepts integers)

### The "join operator" (`&`)

(TODO: is the amp notation really necessary? What's the default functionality
when a pattern scope contains multiple beat-groups? Automatically joining is
probably wrong since I imagine it's usually an accident? I guess just throw an
error?)

The "join operator" overlays two (anonymous) pattern pieces together with the
same starting time. This is particularly useful for drum patterns, which
may involve multiple drums playing at the same time:

```
@pattern hi-hat {
  "Open Hi-Hat" <1 2 2.5 3 4 4.5> &
  "Closed Hi Hat" <2 4>
}
```

... but it can also be used to join together parts of melodic patterns that,
say, each make up half a measure:

```
@pattern first-half <1:1 2:1>
@pattern second-half <3:5 4:5>
@pattern both @pattern(first-half) & @pattern(second-half)
```

(TODO: make sure the grammar actually allows whatever tf that was)

## Primitive types

There are 3 primitive types: strings, numbers, and booleans. Strings are
enclosed in `"double quotes"`. Numbers are made up of digits and at most one
decimal point. Booleans are either `true` or `false`.

## Identifier rules

An identifier is the name given to an imported style, track, or pattern.
Identifiers must:

* Start with a letter (a-z or A-Z)
* may contain letters, digits, and dashes (`-`)
* must not end with a dash (this is for aesthetic reasons but it's written into
  the parser so don't try)
* must not be the strings `if`, `as`, `true`, `false`, or the name of any
  function (TODO: is that actually an ambiguity issue?)
