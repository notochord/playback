import SongIterator from 'notochord-song/types/songiterator';
import tonal from '@tonaljs/tonal';

export function normalizeChordForTonal(chord = ''): string {
  return chord
    .replace(/-/g, '_') // tonal uses _ over - for minor7
    .replace(/minor|min/g, 'm'); // tonal is surprisingly bad at identifying minor chords??
}

type Anchor = 'KEY' | 'NEXT' | 'STEP' | 'ARPEGGIATE';
export function getAnchorChord(anchor: Anchor | null | undefined, songIterator: SongIterator, currentTime: number): string {
  let anchorChord = '';
  switch(anchor) {
    case 'KEY': {
      anchorChord = songIterator.song.getTransposedKey();
      break;
    }
    case 'NEXT': {
      const nextMeasure = songIterator.getRelative(1);
      if(nextMeasure) {
        anchorChord = nextMeasure.beats[0].chord || '';
      } else {
        anchorChord = songIterator.song.getTransposedKey();
      }
      break;
    }
    /* case 'STEP':
    case 'ARPEGGIATE': {
      let prev = songIterator.getRelative(0)[0]; //???
      if(!this.parentMeasure) console.log('tttttttt', this);
      let next = this.parentMeasure.getNextStaticBeatRoot(
        this.indexInMeasure,
        songIterator
      );
    } */
    default: {
      // crawl backward through this measure to get the last set beat
      let lastSetBeat = Math.floor(currentTime);
      const iteratorMeasure = songIterator.getRelative(0);
      if(!iteratorMeasure) break;
      do {
        const beat = iteratorMeasure.beats[lastSetBeat]
        anchorChord = (beat && beat.chord) ? beat.chord : '';
        lastSetBeat--;
      } while(!anchorChord);
      break;
    }
  }
  return normalizeChordForTonal(anchorChord);
}

export function anchorChordToRoot(anchorChord: string, degree: number, octave: number): string {
  const anchorTonic = tonal.Chord.tokenize(anchorChord)[0];
  const anchorScaleName = chordToScaleName(anchorChord);
  const scalePCs = tonal.Scale.notes(anchorTonic, anchorScaleName);
  const rootPC = scalePCs[degree - 1];
  return tonal.Note.from({ oct: octave }, rootPC);
}

export function chordToScaleName(chord: string): string {
  const chordType = tonal.Chord.tokenize(chord)[1];

  // @TODO: make this more robust
  const names: string[] = tonal.Chord.props(chordType).names;
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