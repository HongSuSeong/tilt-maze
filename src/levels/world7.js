// The windy cliffs: chasms only a ball wearing gas floats over, winds that push it (gas three times as hard, stone
// not at all), and gas worn into fire, which blows the walls near the fire apart.
import { W, V, E, T, coins } from './build.js';

const F = (x, y, r = 5) => ({ x, y, r }), Z = (x, y, w, h) => ({ x, y, w, h }), S = (x, y, ...open) => ({ x, y, open }), N = (x, y, speed = 22) => ({ x, y, speed });
const A = (x, y, w, h, dx, dy) => ({ x, y, w, h, dx, dy });
const s = (index, o) => ({ id: `w7-${index}`, world: 7, index, name: `바람 절벽 ${index}`, start: { x: 15, y: 15 }, kit: ['gas'], walls: [], gaps: [], winds: [], fires: [], lava: [], deep: [], switches: [], enemies: [], ...o });
const tr = (...xy) => ({ traps: xy.map(([x, y, r = 4]) => ({ x, y, r })) });

export const WORLD7 = [
  s(1, {
    time: 50, hole: { x: 50, y: 140, r: 7.4 }, gaps: [Z(3, 75, 94, 16)],
    coins: coins([80, 30], [20, 60], [80, 120]),
    hint: '가스를 두르면 가벼워져서 틈 위로 떠서 건너요. 바람에도 세 배로 밀려요',
    normal: tr([40, 40, 5], [30, 125, 5]),
  }),
  s(2, {
    time: 50, hole: { x: 80, y: 145, r: 7.4 }, winds: [A(3, 40, 94, 30, 250, 0)], gaps: [Z(3, 100, 94, 14)],
    coins: coins([50, 25], [30, 55], [70, 85], [30, 135]),
    normal: tr([60, 85, 4], [45, 135, 4]),
  }),
  s(3, {
    time: 48, hole: { x: 50, y: 145, r: 7.4 }, winds: [A(3, 60, 94, 40, 0, -200)], gaps: [Z(3, 110, 94, 14)],
    coins: coins([50, 30], [25, 80], [75, 80], [80, 140]),
    hint: '맞바람 속에서 가스를 두르면 밀려나요. 바람을 벗어난 다음에 두르세요',
    normal: tr([30, 35, 4], [50, 104, 4], [25, 140, 4]),
  }),
  s(4, {
    time: 47, hole: { x: 50, y: 140, r: 7.4 }, walls: [T(3, 90, 94, 6)], fires: [F(50, 82)],
    coins: coins([25, 40], [75, 40], [50, 120]),
    hint: '가스를 두르고 불기둥에 닿으면 펑! 가까운 벽이 부서지고 공은 튕겨 나가요',
    normal: tr([30, 60, 4], [70, 60, 4], [25, 125, 4]),
  }),
  s(5, {
    time: 46, kit: ['gas', 'water'], hole: { x: 50, y: 145, r: 7.4 }, lava: [Z(3, 40, 94, 12)], gaps: [Z(3, 95, 94, 14)],
    coins: coins([50, 22], [30, 75], [70, 75], [80, 135]),
    normal: tr([70, 22, 4], [50, 75, 4], [25, 135, 4]),
  }),
  s(6, {
    time: 45, kit: ['gas', 'spark'], hole: { x: 50, y: 145, r: 7.4 }, walls: [E(3, 50, 94, 4)], switches: [S(50, 25, 0)], winds: [A(3, 60, 94, 30, -200, 0)], gaps: [Z(3, 100, 94, 14)], enemies: [N(80, 140)],
    coins: coins([80, 25], [30, 75], [20, 135]),
    normal: tr([25, 30, 4], [60, 75, 4]),
  }),
  s(7, {
    time: 44, kit: ['gas', 'ice'], hole: { x: 50, y: 145, r: 7.4 }, deep: [Z(3, 45, 94, 14)], winds: [A(3, 65, 94, 25, 200, 0)], gaps: [Z(3, 100, 94, 14)],
    coins: coins([50, 25], [30, 77], [70, 77], [80, 135]),
    normal: tr([70, 25, 4], [50, 77, 4], [25, 135, 4]),
  }),
  s(8, {
    time: 43, hole: { x: 50, y: 145, r: 7.4 }, walls: [T(3, 60, 94, 6)], fires: [F(80, 52)], gaps: [Z(3, 105, 94, 14)],
    coins: coins([30, 30], [50, 85], [80, 135]),
    normal: tr([50, 30, 4], [25, 85, 4], [25, 135, 4]),
  }),
  s(9, {
    time: 42, kit: ['gas', 'fire'], hole: { x: 50, y: 148, r: 7.4 }, walls: [W(3, 40, 80, 6), V(83, 40, 14, 6)], gaps: [Z(3, 90, 94, 14)], winds: [A(3, 104, 94, 20, 250, 0)],
    coins: coins([50, 22], [50, 68], [30, 114], [70, 140]),
    normal: tr([30, 22, 4], [70, 68, 4], [25, 140, 4]),
  }),
  s(10, {
    time: 40, kit: ['gas', 'stone'], hole: { x: 85, y: 148, r: 7.4 }, walls: [T(3, 45, 94, 6)], gaps: [Z(3, 90, 94, 14)], winds: [A(3, 105, 94, 25, -250, 0)],
    coins: coins([50, 22], [30, 70], [70, 70], [50, 117], [40, 145]),
    normal: tr([75, 25, 4], [50, 70, 4], [60, 145, 4]),
  }),
];
