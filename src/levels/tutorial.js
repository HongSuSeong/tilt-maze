// Three first boards: tilt every way, break a wall from a long run, drop into a hole.
import { W, C, coins } from './build.js';

const t = (index, o) => ({ id: `t${index}`, world: 0, index, name: `연습 ${index}`, ...o });

export const TUTORIAL = [
  t(1, {
    time: 90, start: { x: 50, y: 60 }, hole: { x: 75, y: 125, r: 7.4 }, walls: [],
    coins: coins([50, 10], [10, 60], [90, 60], [25, 148]),
    hint: '폰을 기울여 네 방향의 코인을 모아 보세요',
  }),
  t(2, {
    time: 90, start: { x: 12, y: 15 }, hole: { x: 50, y: 120, r: 7.4 },
    walls: [W(3, 30, 80, 6), C(70, 3, 6, 27)],
    coins: coins([40, 15], [90, 70]),
    hint: '길게 달려 세게 부딪히면 주황 벽이 깨져요',
  }),
  t(3, {
    time: 60, start: { x: 12, y: 15 }, hole: { x: 20, y: 140, r: 7.4 },
    walls: [W(3, 50, 60, 6), W(37, 95, 60, 6)],
    coins: coins([80, 30], [20, 75], [75, 125]),
    hint: '구멍에 넣으면 한 단계 내려가요',
  }),
];
