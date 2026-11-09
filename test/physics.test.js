import { describe, it, expect } from 'vitest';
import { createBall, stepBall } from '../src/physics.js';

const lv = (o = {}) => ({ walls: [], coins: [], hole: null, ...o });
const fresh = () => ({ broken: new Set(), got: new Set() });
function run(ball, tilt, sec, level, state = fresh(), dt = 1 / 60) {
  const ev = [];
  for (let t = 0; t < sec; t += dt) ev.push(...stepBall(ball, tilt, dt, level, state, 1));
  return ev;
}

describe('physics', () => {
  it('rests in the corner it is tilted to', () => {
    const b = createBall(50, 80);
    run(b, { x: 8, y: 8 }, 3, lv());
    expect(b.x).toBeCloseTo(92.8, 0); expect(Math.abs(b.x - 92.8)).toBeLessThan(0.2);
    expect(Math.abs(b.y - 152.8)).toBeLessThan(0.2);
    expect(Math.hypot(b.vx, b.vy)).toBeLessThan(1);
  });
  it('a level board leaves the ball where it is', () => {
    const b = createBall(40, 60);
    run(b, { x: 0, y: 0 }, 2, lv());
    expect([b.x, b.y]).toEqual([40, 60]);
  });
  it('a cracked wall breaks from a long run at 15°', () => {
    const level = lv({ walls: [{ x: 20, y: 38, w: 6, h: 28, kind: 'crack' }] }), s = fresh(), b = createBall(90, 52);
    const ev = run(b, { x: -15, y: 0 }, 1, level, s);
    expect(ev.some(e => e.type === 'break' && e.wall === 0)).toBe(true);
    expect(s.broken.has(0)).toBe(true);
  });
  it('...but only knocks at 10°', () => {
    const level = lv({ walls: [{ x: 20, y: 38, w: 6, h: 28, kind: 'crack' }] }), b = createBall(90, 52);
    const ev = run(b, { x: -10, y: 0 }, 2, level);
    expect(ev.some(e => e.type === 'break')).toBe(false);
    expect(ev.some(e => e.type === 'knock')).toBe(true);
  });
  it('does not tunnel through the rim at top speed, even after a long pause', () => {
    const b = createBall(85, 80); b.vx = 1400;
    stepBall(b, { x: 0, y: 0 }, 0.5, lv(), fresh(), 1);
    expect(b.x).toBeLessThanOrEqual(100 - 3 - 4.2 + 0.01);
  });
  it('picks up a coin once', () => {
    const ev = run(createBall(50, 80), { x: 10, y: 0 }, 1, lv({ coins: [{ x: 60, y: 80 }] }));
    expect(ev.filter(e => e.type === 'coin' && e.coin === 0)).toHaveLength(1);
  });
  it('drops into the hole', () => {
    const ev = run(createBall(50, 100), { x: 0, y: 10 }, 3, lv({ hole: { x: 50, y: 120, r: 7.4 } }));
    const h = ev.findIndex(e => e.type === 'hole'), s = ev.findIndex(e => e.type === 'sunk');
    expect(h).toBeGreaterThanOrEqual(0); expect(s).toBeGreaterThan(h);
    expect(ev.filter(e => e.type === 'sunk')).toHaveLength(1);
  });
});
