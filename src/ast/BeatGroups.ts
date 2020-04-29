import {
  MelodicBeatInDrumBeatGroupError
} from './errors';
import { AwaitingDrum, NoteSet } from '../MIDI/Note';
import { MelodicBeatLiteral, DrumBeatLiteral } from './BeatLiterals';
import { Scope, ASTNodeBase } from './ASTNodeBase';
import SongIterator from 'notochord-song/types/songiterator';
import { normalizeChordForTonal } from './musicUtils';
import * as values from '../values/values';

export class BeatGroupLiteral extends ASTNodeBase {
  public measures: Measure[];
  public parentBeatGroup: BeatGroupLiteral;

  public constructor(measures: Measure[]) {
    super();
    this.measures = measures;
  }
  public init(scope: Scope): void {
    super.init(scope)
    this.measures.forEach((measure, i) => measure.init(scope, this, i));
  }
  public link(): void {return;}
  public execute(songIterator: SongIterator): NoteSet | null {
    const joinedMeasures = new NoteSet();
    for(let i = 0; i < this.measures.length; i++) {
      const offset = i * 4; // @TODO: pull in actual meter somehow
      const measureNotes = this.measures[i].execute(songIterator);
      if(measureNotes === null) return null; // lets a/s abort the beatgroup
      for(const measureNote of measureNotes as NoteSet) {
        measureNote.time += offset;
        joinedMeasures.push(measureNote);
      }
    }
    return joinedMeasures;
  }
  public getNextStaticBeatRoot(measureIndex: number, beatIndex: number, songIterator: SongIterator): string {
    // first, try every subsequent beat in the beatGroup
    // (including subsequent measures)
    let measure, beat;
    while(measure = this.parentBeatGroup.measures[measureIndex++]) {
      while(beat = measure.beats[++beatIndex]) {
        if(!beat.isDynamic()) {
          return beat.getAnchorData(songIterator)[1];
        }
      }
      beatIndex = -1;
    }
    // if there are no non-dynamic beats in the rest of the beat-group, return
    // the first note of the next measure (@TODO: could be multiple measures
    // later if it's a multi-measure beatgroup)
    // @TODO: wtf?
    const nextMeasure = songIterator.getRelative(1);
    return normalizeChordForTonal(nextMeasure && nextMeasure.beats[0].chord);
  }
}

export class Measure extends ASTNodeBase {
  public beats: MelodicBeatLiteral[] | DrumBeatLiteral[];
  public beatsPerMeasure: number;
  public parentBeatGroup: BeatGroupLiteral;
  public indexInBeatGroup: number;

  public constructor(beats: MelodicBeatLiteral[] | DrumBeatLiteral[]) {
    super();
    this.beats = beats;
    this.beatsPerMeasure = 0;
  }
  public calculateDurationAfter(beatIndex: number): number {
    const currentBeat = this.beats[beatIndex];
    const currentBeatTime = (currentBeat as MelodicBeatLiteral).getTime();
    
    let nextBeatTime;
    if(beatIndex + 1 >= this.beats.length) {
      nextBeatTime = this.beatsPerMeasure + 1;
    } else {
      const nextBeat = this.beats[beatIndex + 1];
      nextBeatTime = (nextBeat as MelodicBeatLiteral).getTime();
    }
    return nextBeatTime - currentBeatTime;
  }
  public getNextStaticBeatRoot(beatIndex: number, songIterator: SongIterator): string {
    return this.parentBeatGroup.getNextStaticBeatRoot(
      this.indexInBeatGroup,
      beatIndex,
      songIterator
    );
  }
  public link(): void {}
  public init(scope: Scope, parentBeatGroup: BeatGroupLiteral, indexInBeatGroup: number): void {
    super.init(scope);
    this.parentBeatGroup = parentBeatGroup;
    this.indexInBeatGroup = indexInBeatGroup;
    this.beatsPerMeasure = (this.scope.vars.get('time-signature') as values.PlaybackTimeSignatureValue).value[0];
    // @TODO does this need more math?
    this.beats.forEach((beat: MelodicBeatLiteral | DrumBeatLiteral, i: number) => {
      beat.init(scope, this, i);
    });
  }
  public execute(songIterator: SongIterator): NoteSet | null {
    // clear cached notes (used for STEP/ARPEGGIATE interpolation)
    for(const beat of this.beats) {
      if(beat instanceof MelodicBeatLiteral) beat.cachedAnchor = null;
    }
    // each beat returns a NoteSet since it could be a chord or whatever
    const joined = new NoteSet();
    for(const beat of this.beats) {
      const notes = beat.execute(songIterator);
      if(!notes) return null; // lets a and s abort the beatgroup.
      joined.push(...notes);
    }
    return joined;
  }
}

export class DrumBeatGroupLiteral extends ASTNodeBase {
  public beatGroup: BeatGroupLiteral;
  public drum: string;

  public constructor(drum: string, beatGroup: BeatGroupLiteral) {
    super();
    this.drum = drum;
    this.beatGroup = beatGroup; // for now there's no diff in functionality...
    // @TODO make sure our beats are all drummy
  }
  public init(scope: Scope): void {
    super.init(scope);
    if(this.beatGroup.init) this.beatGroup.init(scope);
  }
  public link(): void {return;} // @TODO: I think patterncalls are allowed here?
  public execute(songIterator: SongIterator): NoteSet | null {
    const notes = this.beatGroup.execute(songIterator);
    if (notes === null) return null;
    for(const note of notes) {
      if(note.pitch === AwaitingDrum) {
        note.pitch = this.drum; // @TODO: convert to number?
      } else {
        throw new MelodicBeatInDrumBeatGroupError(this.scope);
      }
    }
    return notes;
  }
}
