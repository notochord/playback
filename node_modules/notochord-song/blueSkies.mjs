/**
 * Test song, which is used by other projects as well
 */
export default {
  title: 'Blue Skies',
  composedOn: -1357318800000,
  composer: 'Irving Berlin',
  updatedOn: 1558727197107,
  updatedBy: 'Jacob Bloom',
  tempo: 160,
  style: 'samba',
  key: 'C',
  transpose: 0,
  timeSignature: [4,4],
  measureContainer: {
    type: 'repeat',
    repeatInfo: {
      repeatCount: 2
    },
    measures: [
      ['A-', null, null, null],
      ['E', null, null, null],
      ['A-7', null, null, null],
      ['A-6', null, null, null],
      ['CM7', null, 'A7', null],
      ['D-7', null, 'G7', null],

      {
        type: 'ending',
        repeatInfo: {
          ending: 1
        },
        measures: [
          ['C6', null, null, null],
          ['Bdim7', null, 'E7', null],
        ]
      },

      {
        type: 'ending',
        repeatInfo: {
          ending: 2
        },
        measures: [
          ['C6', null, null, null],
          ['C6', null, null, null],
        ]
      }
    ]
  }
};