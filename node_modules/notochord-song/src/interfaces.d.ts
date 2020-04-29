type IKey = 'A' | 'A#' | 'Bb' | 'B' | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab'
         | 'Am' | 'A#m' | 'Bbm' | 'Bm' | 'Cm' | 'C#m' | 'Dbm' | 'Dm' | 'D#m' | 'Ebm' | 'Em' | 'Fm' | 'F#m' | 'Gbm' | 'Gm' | 'G#m' | 'Abm';
type ISongData = {
  title: string;
  composedOn?: number;
  composer?: string;
  updatedOn?: number;
  updatedBy?: string;
  tempo: number;
  style?: string;
  key: IKey;
  transpose: number;
  timeSignature: [number, number];
  measureContainer: ISongDataMeasureContainer;
  [key: string]: any; // future-compatible with any other song info stored on it
};
type ISongDataMeasureContainer = {
  type: 'repeat' | 'ending';
  repeatInfo: {
    repeatCount?: number;
    ending?: number;
  };
  measures: ( ISongDataMeasureContainer | (null | string)[] )[];
};