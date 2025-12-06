import type { TimedLyric } from './LyricsManager';

// Verses array - each will be displayed on subsequent loops
export const verses = [
  [
    'O come all ye faithful, joyful and triumphant,',
    'O come ye, O come ye, to Bethlehem.',
    'Come and behold him, born the King of angels;'
  ],
  [
    'O Sing, choirs of angels, sing in exultation;',
    'O sing, all ye citizens of heaven above!',
    'Glory to God, all glory in the highest;'
  ],
  [
    'O Child, for us sinners poor and in the manger,',
    'O We would embrace thee with love and awe.',
    'Who would not love thee, loving us so dearly?'
  ],
  [
    'O Yea, Lord, we greet thee, born this happy morning,',
    'O Jesus, to thee be all the glory given.',
    'Word of the Father, now in flesh appearing'
  ]
];

export const refrain = [
  'O come let us adore him,',
  'O come let us adore him,',
  'O come let us adore him,',
  'Christ the Lord.'
];

// Default lyrics (first verse + refrain) - timestamps based on 41s loop
const lyrics: TimedLyric[] = [
  // Verse lines (adjust timing based on actual audio)
  { start: 2, text: verses[0][0] },
  { start: 9, text: verses[0][1] },
  { start: 18, text: verses[0][2] },
  
  // Refrain
  { start: 25, text: refrain[0] },
  { start: 29, text: refrain[1] },
  { start: 33, text: refrain[2] },
  { start: 38, text: refrain[3] },
];

export default lyrics;
