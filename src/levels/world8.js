// The crossroads: no new element, the devices of the worlds before mixed. Choosing which two to wear is the puzzle.
import { mixed } from './bands.js';

const m = (i, time, kit, bands, extra) => mixed(8, '갈림길', i, time, kit, bands, extra);
const Z = (x, y, w, h) => ({ x, y, w, h }), A = (x, y, w, h, dx, dy) => ({ x, y, w, h, dx, dy });

export const WORLD8 = [
  m(1, 45, ['water', 'fire'], [['lava'], ['vine', 'r']], { hint: '이제 원소가 여섯 가지예요. 판을 보고 맞는 두 가지를 장착하세요' }),
  m(2, 45, ['ice', 'spark'], [['deep'], ['fence', 'l']]),
  m(3, 44, ['stone', 'gas'], [['thick'], ['gap']]),
  m(4, 43, ['fire', 'ice'], [['vine', 'l'], ['deep'], ['door', 'r']]),
  m(5, 42, ['water', 'spark'], [['pillar', 'r'], ['fence', 'l'], ['lava']]),
  m(6, 41, ['gas', 'fire'], [['gap'], ['vine', 'r'], ['gap']], { winds: [A(3, 3, 94, 30, 150, 0)] }),
  m(7, 40, ['stone', 'water'], [['thick'], ['lava'], ['pillar', 'l']]),
  m(8, 40, ['spark', 'gas'], [['fence', 'r'], ['gap'], ['fence', 'l']], { zaps: [Z(3, 3, 94, 25)] }),
  m(9, 39, ['ice', 'stone'], [['deep'], ['thick'], ['deep']]),
  m(10, 38, ['fire', 'spark'], [['door', 'l'], ['fence', 'r'], ['vine', 'r'], ['fence', 'l']]),
];
