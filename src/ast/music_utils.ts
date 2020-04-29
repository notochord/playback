import SongIterator from 'notochord-song/types/songiterator';
import tonal from '../lib/tonal.min.js';

export function normalizeChordForTonal(chord: string = ''): string {
  return chord
    .replace(/-/g, '_') // tonal uses _ over - for minor7
    .replace(/minor|min/g, 'm'); // tonal is surprisingly bad at identifying minor chords??
}

type Anchor = 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
export function getAnchorChord(anchor: Anchor, songIterator: SongIterator, currentTime: number) {
  let anchorChord: string;
  switch(anchor) {
    case 'KEY': {
      anchorChord = songIterator.song.getTransposedKey();
    }
    case 'NEXT': {
      let nextMeasure = songIterator.getRelative(1);
      if(nextMeasure) {
        anchorChord = nextMeasure.beats[0].chord;
      } else {
        anchorChord = songIterator.song.getTransposedKey();
      }
    }
    case 'STEP':
    case 'ARPEGGIATE': {
      /*
      let prev = songIterator.getRelative(0)[0]; //???
      if(!this.parentMeasure) console.log('tttttttt', this);
      let next = this.parentMeasure.getNextStaticBeatRoot(
        this.indexInMeasure,
        songIterator
      );*/

    }
    default: {
      // crawl backward through this measure to get the last set beat
      let lastSetBeat = Math.floor(currentTime);
      let iteratorMeasure = songIterator.getRelative(0);
      if(!iteratorMeasure) break;
      do {
        const beat = iteratorMeasure.beats[lastSetBeat]
        anchorChord = beat && beat.chord;
        lastSetBeat--;
      } while(!anchorChord);
    }
  }
  return normalizeChordForTonal(anchorChord);
}

export function anchorChordToRoot(anchorChord: string, degree: number, octave: number): string {
  let anchorTonic = tonal.Chord.tokenize(anchorChord)[0];
  let anchorScaleName = chordToScaleName(anchorChord);
  let scalePCs = tonal.Scale.notes(anchorTonic, anchorScaleName);
  let rootPC = scalePCs[degree - 1];
  return tonal.Note.from({oct: octave}, rootPC);
}

export function chordToScaleName(chord: string) {
  let chordType = tonal.Chord.tokenize(chord)[1];

  // @TODO: make this more robust
  let names = tonal.Chord.props(chordType).names;
  if(names.includes('dim')) return 'diminished';
  if(names.includes('aug')) return 'augmented';
  if(names.includes('Major')) return 'major';
  if(names.includes('minor')) return 'minor';
  if(names.includes('minor7')) return 'dorian';
  if(names.includes('Dominant')) return 'mixolydian';
  // if none of the above match, do our best to find the closest fit
  let closestScale = 'major'
  names.forEach(name => {
    if(name.startsWith('dim')) closestScale = 'diminished';
    if(name.startsWith('aug')) closestScale = 'augmented';
    if(name.startsWith('M')) closestScale = 'major';
    if(name.startsWith('m')) closestScale = 'minor';
  });
  return closestScale;
}