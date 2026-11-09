// The quarry: thick walls only a ball wearing stone breaks, from a short roll; stone breaks cracked walls the same way.
// A ball of stone sinks in a puddle, so the coat has to be off before the water.
import { W, C, V, E, T, coins } from './build.js';

const F = (x, y, r = 5) => ({ x, y, r }), Z = (x, y, w, h) => ({ x, y, w, h }), S = (x, y, ...open) => ({ x, y, open }), N = (x, y, speed = 22) => ({ x, y, speed });
const s = (index, o) => ({ id: `w6-${index}`, world: 6, index, name: `돌 채석장 ${index}`, start: { x: 15, y: 15 }, kit: ['stone'], walls: [], pools: [], fires: [], deep: [], lava: [], switches: [], zaps: [], enemies: [], ...o });
const tr = (...xy) => ({ traps: xy.map(([x, y, r = 4]) => ({ x, y, r })) });

export const WORLD6 = [
  s(1, {
    time: 50, hole: { x: 50, y: 140, r: 7.4 }, walls: [T(3, 80, 94, 6)],
    coins: coins([80, 30], [20, 60], [80, 120]),
    hint: '돌을 두르면 무거워져서 두꺼운 벽도 살짝 굴러 부딪히면 깨져요. 대신 물에는 가라앉아요',
    normal: tr([40, 40, 5], [30, 125, 5]),
  }),
  s(2, {
    time: 50, hole: { x: 85, y: 145, r: 7.4 }, walls: [W(3, 50, 80, 6), T(83, 50, 14, 6), W(17, 100, 80, 6), T(3, 100, 14, 6)], pools: [Z(55, 18, 26, 20)],
    coins: coins([30, 30], [50, 75], [40, 130]),
    normal: tr([40, 75, 4], [60, 130, 4]),
  }),
  s(3, {
    time: 48, hole: { x: 50, y: 145, r: 7.4 }, walls: [C(3, 40, 94, 6), C(3, 70, 94, 6), T(3, 110, 94, 6)],
    coins: coins([70, 22], [30, 56], [70, 90], [25, 135]),
    normal: tr([40, 20, 4], [60, 90, 4], [75, 135, 4]),
  }),
  s(4, {
    time: 47, kit: ['stone', 'water'], hole: { x: 50, y: 145, r: 7.4 }, walls: [W(3, 40, 80, 6), T(3, 95, 94, 6)], fires: [F(90, 43)],
    coins: coins([45, 20], [40, 70], [80, 130]),
    normal: tr([30, 25, 4], [60, 70, 4], [25, 130, 4]),
  }),
  s(5, {
    time: 46, kit: ['stone', 'fire'], hole: { x: 20, y: 145, r: 7.4 }, walls: [W(3, 45, 80, 6), V(83, 45, 14, 6), T(3, 100, 94, 6)], pools: [Z(30, 60, 30, 20)],
    coins: coins([50, 25], [80, 75], [60, 130]),
    normal: tr([30, 25, 4], [20, 85, 4], [70, 130, 4]),
  }),
  s(6, {
    time: 45, kit: ['stone', 'spark'], hole: { x: 50, y: 148, r: 7.4 }, walls: [E(3, 50, 94, 4), T(3, 100, 94, 6)], switches: [S(50, 25, 0)], enemies: [N(20, 140)],
    coins: coins([80, 25], [50, 75], [80, 130]),
    normal: tr([25, 30, 4], [30, 78, 4], [70, 78, 4]),
  }),
  s(7, {
    time: 44, hole: { x: 84, y: 145, r: 7.4 }, walls: [T(33, 3, 6, 154), T(66, 3, 6, 154)], pools: [Z(42, 60, 20, 40)],
    coins: coins([15, 80], [52, 30], [52, 130], [84, 60]),
    normal: tr([15, 120, 4], [52, 110, 4], [84, 100, 4]),
  }),
  s(8, {
    time: 43, kit: ['stone', 'ice'], hole: { x: 50, y: 145, r: 7.4 }, walls: [T(3, 105, 94, 6)], deep: [Z(3, 55, 94, 14)],
    coins: coins([50, 30], [30, 88], [70, 88], [80, 135]),
    normal: tr([70, 30, 4], [50, 88, 4], [25, 135, 4]),
  }),
  s(9, {
    time: 42, kit: ['stone', 'spark'], hole: { x: 50, y: 145, r: 7.4 }, walls: [T(3, 75, 94, 6), E(3, 115, 94, 4)], switches: [S(50, 95, 1)], zaps: [Z(3, 40, 94, 20)],
    enemies: [N(20, 145, 18), N(85, 145, 18)],
    coins: coins([50, 25], [50, 50], [25, 95], [75, 95]),
    normal: tr([30, 25, 4], [70, 25, 4]),
  }),
  s(10, {
    time: 40, kit: ['stone', 'water'], hole: { x: 85, y: 148, r: 7.4 }, walls: [T(3, 70, 94, 6), W(17, 120, 80, 6)], lava: [Z(3, 35, 94, 12)], pools: [Z(3, 90, 94, 10)], fires: [F(10, 123)],
    coins: coins([50, 20], [50, 58], [30, 108], [70, 108], [50, 145]),
    normal: tr([75, 20, 4], [25, 58, 4], [50, 108, 4]),
  }),
];
