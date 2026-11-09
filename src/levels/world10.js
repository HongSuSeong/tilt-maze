// Every element: four bands a stage, enemies, wind and the electric floor between them.
import { mixed } from './bands.js';

const m = (i, time, kit, bands, extra) => mixed(10, '원소의 끝', i, time, kit, bands, extra);
const Z = (x, y, w, h) => ({ x, y, w, h }), A = (x, y, w, h, dx, dy) => ({ x, y, w, h, dx, dy }), N = (x, y, speed = 22) => ({ x, y, speed });

export const WORLD10 = [
  m(1, 42, ['water', 'stone'], [['lava'], ['thick'], ['pillar', 'r'], ['thick']], { enemies: [N(80, 145)] }),
  m(2, 42, ['gas', 'spark'], [['gap'], ['fence', 'r'], ['gap'], ['fence', 'l']]),
  m(3, 41, ['ice', 'fire'], [['deep'], ['vine', 'l'], ['deep'], ['door', 'r']], { enemies: [N(20, 145)] }),
  m(4, 40, ['water', 'gas'], [['lava'], ['gap'], ['lava'], ['gap']], { winds: [A(3, 3, 94, 28, 200, 0)] }),
  m(5, 39, ['spark', 'stone'], [['fence', 'l'], ['thick'], ['fence', 'r'], ['thick']], { zaps: [Z(3, 3, 94, 28)] }),
  m(6, 38, ['fire', 'gas'], [['vine', 'r'], ['gap'], ['door', 'l'], ['gap']], { enemies: [N(80, 145, 24)] }),
  m(7, 37, ['ice', 'water'], [['deep'], ['lava'], ['pillar', 'l'], ['deep']], { winds: [A(3, 132, 94, 25, -200, 0)] }),
  m(8, 36, ['stone', 'ice'], [['thick'], ['deep'], ['thick'], ['deep']], { enemies: [N(20, 145, 24), N(80, 145, 24)] }),
  m(9, 36, ['spark', 'fire'], [['fence', 'r'], ['door', 'r'], ['fence', 'l'], ['vine', 'l']], { zaps: [Z(3, 130, 94, 27)] }),
  m(10, 35, ['gas', 'water'], [['gap'], ['lava'], ['gap'], ['lava']], { enemies: [N(20, 145, 26), N(80, 145, 26)], winds: [A(3, 3, 94, 28, -200, 0)] }),
];
