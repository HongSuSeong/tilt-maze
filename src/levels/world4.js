// The ice field: slick floors that hardly stop the ball, and deep water a ball only crosses once ice has frozen it
// into a (slippery) bridge. Every stage needs ice; some also fire (ice walls, vines) or water (fire pillars, lava).
import { W, C, V, I, coins } from './build.js';

const F = (x, y, r = 5) => ({ x, y, r }), Z = (x, y, w, h) => ({ x, y, w, h });
const s = (index, o) => ({ id: `w4-${index}`, world: 4, index, name: `얼음 들판 ${index}`, start: { x: 15, y: 15 }, kit: ['ice'], walls: [], slick: [], deep: [], pools: [], fires: [], lava: [], ...o });
const tr = (...xy) => ({ traps: xy.map(([x, y, r = 4]) => ({ x, y, r })) });

export const WORLD4 = [
  s(1, {
    time: 50, hole: { x: 50, y: 140, r: 7.4 }, deep: [Z(3, 70, 94, 16)], slick: [Z(3, 86, 94, 20)],
    coins: coins([50, 30], [20, 55], [80, 120]),
    hint: '얼음을 두르고 깊은 물에 닿으면 얼어서 건널 수 있어요. 얼음 위는 미끄러워요',
    normal: tr([45, 40, 5], [25, 125, 5]),
  }),
  s(2, {
    time: 50, hole: { x: 80, y: 145, r: 7.4 }, walls: [W(17, 50, 80, 6)], slick: [Z(3, 3, 94, 44)], deep: [Z(3, 90, 94, 14)],
    coins: coins([60, 25], [50, 70], [30, 130]),
    normal: tr([40, 25, 4], [70, 72, 4], [40, 125, 4]),
  }),
  s(3, {
    time: 48, kit: ['ice', 'fire'], hole: { x: 20, y: 145, r: 7.4 }, deep: [Z(3, 60, 94, 14)], walls: [W(3, 110, 80, 6), I(83, 110, 14, 6)],
    coins: coins([50, 30], [40, 90], [60, 140]),
    normal: tr([60, 35, 4], [30, 92, 4], [70, 135, 4]),
  }),
  s(4, {
    time: 47, hole: { x: 80, y: 148, r: 7.4 }, deep: [Z(3, 45, 94, 12), Z(3, 105, 94, 12)], slick: [Z(3, 57, 94, 48)],
    coins: coins([50, 25], [30, 80], [70, 80], [40, 135]),
    normal: tr([70, 25, 4], [50, 80, 5], [30, 135, 4]),
  }),
  s(5, {
    time: 46, kit: ['ice', 'water'], hole: { x: 50, y: 145, r: 7.4 }, walls: [W(3, 40, 80, 6)], fires: [F(90, 43)], deep: [Z(3, 90, 94, 14)],
    coins: coins([45, 20], [40, 65], [80, 125]),
    normal: tr([30, 25, 4], [60, 65, 4], [25, 125, 4]),
  }),
  s(6, {
    time: 45, hole: { x: 20, y: 148, r: 7.4 }, walls: [W(3, 40, 80, 6), W(17, 80, 80, 6), W(3, 120, 80, 6)], slick: [Z(3, 3, 94, 154)], deep: [Z(83, 114, 14, 14)],
    coins: coins([50, 20], [50, 60], [50, 100], [60, 140]),
    normal: tr([40, 22, 4], [60, 62, 4], [40, 102, 4]),
  }),
  s(7, {
    time: 44, kit: ['ice', 'fire'], hole: { x: 20, y: 148, r: 7.4 }, deep: [Z(3, 50, 94, 14)], walls: [C(3, 100, 94, 6), W(3, 130, 80, 6), I(83, 130, 14, 6)],
    coins: coins([50, 25], [30, 80], [70, 118], [60, 148]),
    normal: tr([30, 30, 4], [70, 80, 4], [40, 118, 4]),
  }),
  s(8, {
    time: 43, hole: { x: 82, y: 142, r: 7.4 }, walls: [W(3, 60, 70, 6)], deep: [Z(55, 112, 42, 8), Z(55, 112, 8, 45)], slick: [Z(3, 66, 94, 46)],
    coins: coins([50, 25], [85, 70], [30, 90], [30, 140]),
    normal: tr([40, 35, 4], [60, 90, 4], [30, 120, 4]),
  }),
  s(9, {
    time: 42, kit: ['ice', 'water'], hole: { x: 80, y: 145, r: 7.4 }, walls: [W(17, 80, 80, 6)], lava: [Z(3, 55, 94, 12)], deep: [Z(3, 105, 94, 12)],
    coins: coins([50, 25], [50, 70], [30, 93], [40, 140]),
    normal: tr([70, 30, 4], [70, 93, 4], [30, 140, 4]),
  }),
  s(10, {
    time: 40, kit: ['ice', 'fire'], hole: { x: 85, y: 148, r: 7.4 }, walls: [W(3, 35, 80, 6), V(83, 35, 14, 6), W(17, 124, 80, 6), I(3, 124, 14, 6)],
    deep: [Z(3, 70, 94, 14)], slick: [Z(3, 84, 94, 40)],
    coins: coins([50, 18], [50, 55], [30, 105], [70, 105], [50, 145]),
    normal: tr([30, 52, 4], [50, 104, 5], [40, 145, 4]),
  }),
];
