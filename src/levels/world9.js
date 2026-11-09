// The dark: the same kind of mixed boards, but only what is near the ball can be seen (render3d dims the light).
import { mixed } from './bands.js';

const m = (i, time, kit, bands, extra) => mixed(9, '어둠', i, time, kit, bands, { dim: true, ...extra });
const N = (x, y, speed = 20) => ({ x, y, speed });

export const WORLD9 = [
  m(1, 45, ['water', 'ice'], [['lava'], ['deep']], { hint: '어둠 속에서는 공 둘레만 보여요. 천천히 살펴보며 가세요' }),
  m(2, 45, ['fire', 'gas'], [['vine', 'l'], ['gap']]),
  m(3, 44, ['spark', 'stone'], [['fence', 'r'], ['thick']]),
  m(4, 43, ['water', 'gas'], [['lava'], ['gap'], ['lava']]),
  m(5, 42, ['ice', 'fire'], [['deep'], ['door', 'l'], ['deep']]),
  m(6, 41, ['stone', 'spark'], [['thick'], ['fence', 'r'], ['thick']], { enemies: [N(80, 145)] }),
  m(7, 40, ['gas', 'ice'], [['gap'], ['deep'], ['gap']]),
  m(8, 40, ['fire', 'water'], [['vine', 'r'], ['pillar', 'l'], ['lava']]),
  m(9, 39, ['spark', 'ice'], [['fence', 'l'], ['deep'], ['fence', 'r'], ['deep']]),
  m(10, 38, ['stone', 'fire'], [['thick'], ['vine', 'l'], ['thick'], ['door', 'r']], { enemies: [N(20, 145)] }),
];
