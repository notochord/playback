# Functions

There are many functions defined in Playback. This document explains what each
one does and lists the version in which it was introduced.

All functions are limited in where they can be used. This is generally to
prevent unintended or unexpected behavior.

## Variable setters

Some functions set a variable. If they're in an `@options` block, they'll apply
to the whole style (until a setter in a more specific scope overrides them). If
they're in a `@track`, `@pattern`, or a pair of curly-brackets within a pattern
(an "anonymous pattern"), they'll apply to everything in that block.

For setters that accept a single boolean value, the argument may be ommitted and
is assumed to be true.

### `name(string)`

* **Default value:** ???? (TODO: required?)
* **Allowed in:** `@meta`
* **Version introduced:** 0

Set the name of the style.

### `author(string)`

* **Default value:** ????
* **Allowed in:** `@meta`
* **Version introduced:** 0

Set the author of the style.

### `description(string)`

* **Default value:** ????
* **Allowed in:** `@meta`
* **Version introduced:** 0

Add description of the style.

### `playback-version(number)`

* **Default value:** 0
* **Allowed in:** `@meta`
* **Version introduced:** 0

The minimum Playback version required by the style.

### `time-signature(number number)`

* **Default value:** 4 4
* **Allowed in:** `@options`
* **Version introduced:** 0

Sets the time signature for the style.

### `swing(boolean)` (or `swing()`)

* **Default value:** false
* **Allowed in:** `@options`
* **Version introduced:** 0

Toggles swing (8th notes become triplets).

### `volume(number)`

* **Default value:** 1
* **Allowed in:** `@options`, `@track`, `@pattern`, anonymous pattern
* **Version introduced:** 0

Sets the volume to a number 0-1 (inclusive).

### `octave(number)`

* **Default value:** 4
* **Allowed in:** `@options`, `@track`, `@pattern`, anonymous pattern
* **Version introduced:** 0

Accepts an integer 0-9 representing the octave number.

### `invertible(boolean)`

* **Default value:** false
* **Allowed in:** `@options`, `@track`, `@pattern`, anonymous pattern
* **Version introduced:** 0

If true, notes more than 6 semitones above the root of a chord may be flipped to
the octave below.

### `private(boolean)`

* **Default value:** false
* **Allowed in:** `@pattern`
* **Version introduced:** 0

A private pattern is not taken into consideration when the track picks a pattern
to play. Private patterns are ignored unless they're called somewhere else.

### `length(number)`

* **Default value:** (based on the time signature)
* **Allowed in:** `@pattern`
* **Version introduced:** 0

Sets the length of the pattern, in beats. Patterns can be shorter than a
measure and strung together (TODO: how?) or longer than a measure to create
phrase-long patterns.

### `chance(number)`

* **Default value:** 1
* **Allowed in:** `@pattern`
* **Version introduced:** 0

A value 0-1 (inclusive) that affects how likely the pattern is to be selected
when it's an option. (TODO: does this need to be clamped at 1?)

## Conditional functions

Conditional functions return true or false and can be used in the `if(...)` part
of a pattern. (TODO: They can technically be used anywhere but config blocks,
should that change? They're probably useless anywhere else)

### `progression(...)`

* **Version introduced:** 0

This function takes any number of numbers or note anchors. Returns true if the
preogression of the song matches what's given, starting with the current
measure. Each argument is one measure. (TODO: allow more detail?)

### `in-scale(number/anchor number/anchor)`

* **Version introduced:** 0

Returns whether the first argument is in the scale of the second argument

### `beat-defined(number)`

* **Version introduced:** 0

Returns whether a certain beat of the current measure is set in the song (TODO:
does this mean *different* from the previous beat? That's probably something the
Song class should worry about)

## Other

### `choose(...)`

* **Allowed in:** `@track`, `@pattern`, anonymous pattern
* **Version introduced:** 0

Returns one of its arguments at random. Patterns that fail to return notes
aren't factored in.

A note about `choose()`: All variable setters passed to it will set
their variables, and the last one will win. Thus, instead of this:

```
choose(
  volume(0.1)
  volume(0.2)
)
```

...which will always result in a volume value of 0.2,  do this:

```
volume(choose(0.1 0.2))
```


