// The spark works: electric fences turned off from switches by a ball wearing electricity, an electric floor that is on
// for two seconds and off for two, and the first enemies, which follow the ball round the maze (fire makes them back off).
import { W, V, D, E, coins } from './build.js';

const F = (x, y, r = 5) => ({ x, y, r }), Z = (x, y, w, h) => ({ x, y, w, h }), S = (x, y, ...open) => ({ x, y, open }), N = (x, y, speed = 22) => ({ x, y, speed });
const s = (index, o) => ({ id: `w5-${index}`, world: 5, index, name: `번개 공장 ${index}`, start: { x: 15, y: 15 }, kit: ['spark'], walls: [], switches: [], zaps: [], enemies: [], fires: [], lava: [], deep: [], ...o });
const tr = (...xy) => ({ traps: xy.map(([x, y, r = 4]) => ({ x, y, r })) });

export const WORLD5 = [
  s(1, {
    time: 50, hole: { x: 50, y: 140, r: 7.4 }, walls: [E(3, 80, 94, 4)], switches: [S(50, 40, 0)],
    coins: coins([80, 30], [20, 60], [80, 120]),
    hint: '전기를 두르고 노란 스위치에 닿으면 울타리가 꺼져요',
    normal: tr([30, 40, 5], [70, 125, 5]),
  }),
  s(2, {
    time: 50, hole: { x: 20, y: 140, r: 7.4 }, walls: [E(3, 110, 94, 4)], switches: [S(85, 97, 0)], zaps: [Z(3, 60, 94, 24)],
    coins: coins([50, 30], [50, 97], [70, 135]),
    hint: '전기 바닥은 켜졌다 꺼졌다 해요. 꺼졌을 때 지나가거나, 전기를 두르면 괜찮아요',
    normal: tr([70, 35, 4], [30, 97, 4], [50, 140, 4]),
  }),
  s(3, {
    time: 48, hole: { x: 50, y: 145, r: 7.4 }, walls: [W(3, 50, 80, 6), E(83, 50, 14, 4), W(17, 100, 80, 6)], switches: [S(40, 25, 1)], enemies: [N(85, 125)],
    coins: coins([70, 25], [50, 75], [30, 130]),
    hint: '보라색 적이 쫓아와요. 불을 두르면 물러나요',
    normal: tr([60, 75, 4], [25, 125, 4]),
  }),
  s(4, {
    time: 47, hole: { x: 15, y: 145, r: 7.4 }, walls: [E(3, 45, 94, 4), E(3, 105, 94, 4)], switches: [S(20, 28, 0), S(80, 75, 1)], enemies: [N(85, 145, 20)],
    coins: coins([60, 25], [30, 75], [50, 130]),
    normal: tr([50, 75, 4], [40, 140, 4]),
  }),
  s(5, {
    time: 46, kit: ['spark', 'water'], hole: { x: 50, y: 145, r: 7.4 }, walls: [W(3, 40, 80, 6), E(3, 95, 94, 4)], fires: [F(90, 43)], switches: [S(50, 70, 1)], zaps: [Z(3, 110, 94, 15)],
    coins: coins([40, 20], [25, 70], [75, 70], [80, 140]),
    normal: tr([60, 22, 4], [30, 85, 4], [20, 140, 4]),
  }),
  s(6, {
    time: 45, kit: ['spark', 'fire'], hole: { x: 50, y: 148, r: 7.4 }, walls: [W(3, 50, 80, 6), V(83, 50, 14, 6), E(3, 100, 94, 4)], switches: [S(20, 80, 2)], enemies: [N(80, 140)],
    coins: coins([50, 25], [60, 75], [30, 130]),
    normal: tr([40, 30, 4], [50, 78, 4], [75, 120, 4]),
  }),
  s(7, {
    time: 44, hole: { x: 85, y: 145, r: 7.4 }, walls: [W(3, 60, 40, 6), D(43, 60, 20, 6), W(63, 60, 34, 6), E(3, 120, 94, 4)], switches: [S(80, 30, 1), S(20, 105, 3)],
    zaps: [Z(3, 66, 94, 30)], enemies: [N(50, 145, 20)],
    coins: coins([40, 25], [50, 108], [20, 140]),
    normal: tr([55, 35, 4], [70, 105, 4]),
  }),
  s(8, {
    time: 43, kit: ['spark', 'ice'], hole: { x: 85, y: 145, r: 7.4 }, walls: [E(3, 110, 94, 4)], switches: [S(50, 90, 0)], deep: [Z(3, 55, 94, 14)], enemies: [N(20, 140)],
    coins: coins([50, 30], [25, 90], [60, 140]),
    normal: tr([70, 35, 4], [75, 90, 4], [45, 130, 4]),
  }),
  s(9, {
    time: 42, hole: { x: 50, y: 145, r: 7.4 }, walls: [E(3, 40, 94, 4), W(17, 95, 80, 6), E(3, 125, 94, 4)], switches: [S(85, 20, 0), S(50, 110, 2)],
    zaps: [Z(3, 60, 94, 20)], enemies: [N(20, 145, 18), N(85, 145, 18)],
    coins: coins([50, 22], [50, 70], [30, 110], [70, 140]),
    normal: tr([30, 85, 4], [75, 110, 4]),
  }),
  s(10, {
    time: 40, kit: ['spark', 'water'], hole: { x: 60, y: 148, r: 7.4 }, walls: [E(3, 80, 94, 4), W(3, 120, 80, 6)], switches: [S(50, 62, 0)],
    lava: [Z(3, 40, 94, 12)], zaps: [Z(3, 90, 94, 20)], fires: [F(90, 123)], enemies: [N(20, 145, 24)],
    coins: coins([50, 20], [30, 65], [70, 112], [30, 140]),
    normal: tr([75, 22, 4], [75, 65, 4], [40, 112, 4]),
  }),
];
