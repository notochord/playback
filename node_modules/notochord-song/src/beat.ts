import Song from './notochord-song';
import { Measure } from './measure';
import * as _Tonal from 'tonal';
const Tonal = (_Tonal as any).default || _Tonal;

const SCALE_DEGREES = {
  1: {numeral: 'i',   flat: false},
  2: {numeral: 'ii',  flat: true},
  3: {numeral: 'ii',  flat: false},
  4: {numeral: 'iii', flat: true},
  5: {numeral: 'iii', flat: false},
  6: {numeral: 'iv',  flat: false},
  7: {numeral: 'v',   flat: true},
  8: {numeral: 'v',   flat: false},
  9: {numeral: 'vi',  flat: true},
 10: {numeral: 'vi',  flat: false},
 11: {numeral: 'vii', flat: true},
 12: {numeral: 'vii', flat: false}
};

export default class Beat {
  public song: Song;
  public measure: Measure;
  public index?: number;
  private _chord: string;

  constructor(song, measure, index, pseudoBeat) {
    this.song = song;
    this.measure = measure;
    this.index = index;
    this.chord = pseudoBeat;
  }
  /**
   * 
   * @param {?string} rawChord 
   */
  set chord(rawChord) {
    const oldChord = this._chord;
    this._chord = null;
    if(rawChord) {
      let parsed = rawChord.replace(/-/g, 'm');
      const chordParts = Tonal.Chord.tokenize(parsed);
      if(this.song.get('transpose') && chordParts[0]) {
        const transposeInt = Tonal.Interval.fromSemitones(this.song.get('transpose'));
        chordParts[0] = Tonal.Note.enharmonic(
          Tonal.transpose(
            chordParts[0],
            Tonal.Interval.invert(transposeInt)
          ) as string
        );
      }
      
      // get the shortest chord name
      if(chordParts[1]) {
        let names = Tonal.Chord.props(chordParts[1]).names;
        if(names && names.length) {
          chordParts[1] = names
            .reduce((l, r) => l.length <= r.length ? l : r)
            .replace(/_/g, 'm7');
        } else {
          chordParts[1] = '';
        }
      }
      parsed = chordParts.join('');
      this._chord = parsed;
    }
    this.song._emitChange('measures', {
      type: 'Beat.chord.set',
      beatObject: this,
      measureObject: this.measure,
      oldValue: oldChord,
      newValue: this._chord,
    });
  }
  get chord() {
    const transpose = this.song.get('transpose');
    const chord = this._chord;
    if(chord) {
      if(transpose) {
        const transposeInt = Tonal.Interval.fromSemitones(transpose);
        let chordParts = Tonal.Chord.tokenize(chord);
        chordParts[0] = Tonal.Note.enharmonic(
          Tonal.transpose(chordParts[0], transposeInt) as string
        );
        return chordParts.join('');
      } else {
        return chord;
      }
    } else {
      return null;
    }
  }
  get scaleDegree() {
    const chord = this._chord;
    if(!chord) return null;

    const chordParts = Tonal.Chord.tokenize(chord);
    // ignore transposition because it's relative to the 1
    const semis = Tonal.Distance.semitones(this.song.get('key'), chordParts[0]) + 1;
    const minorish = chordParts[1][0] == 'm' || chordParts[1][0] == 'o';
    const SD = SCALE_DEGREES[semis];
    return {
      numeral: minorish ? SD.numeral : SD.numeral.toUpperCase(),
      flat: SD.flat,
      quality: chordParts[1]
    };
  }
  set scaleDegree(rawScaleDegree) {
    throw new Error('scaleDegree must not be set');
  }
  serialize() {
    return this.chord;
  }
}