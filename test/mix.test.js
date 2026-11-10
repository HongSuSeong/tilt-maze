import { describe, it, expect } from 'vitest';
import { createBall, stepBall } from '../src/physics.js';

const lv = (o = {}) => ({ walls: [], coins: [], hole: null, ...o });
const fresh = () => ({ broken: new Set(), got: new Set(), doused: new Set() });
const roll = (b, tilt, sec, level, s, coat) => { const ev = []; for (let t = 0; t < sec; t += 1 / 60) ev.push(...stepBall(b, tilt, 1 / 60, level, s, 1, coat)); return ev; };
const has = (ev, type) => ev.some(e => e.type === type);
const across = { x: 8, y: 0 }, patch = { x: 50, y: 60, w: 20, h: 40 };

describe('steam', () => {
  it('floats over a chasm, deep water and lava', () => {
    for (const k of ['gaps', 'deep', 'lava']) {
      const b = createBall(30, 80), ev = roll(b, across, 2, lv({ [k]: [patch] }), fresh(), 'steam');
      expect([k, has(ev, 'fall') || has(ev, 'drown') || has(ev, 'lava') || has(ev, 'cool') || has(ev, 'freeze')]).toEqual([k, false]); expect(b.x).toBeGreaterThan(75);
    }
  });
  it('goes by a fire pillar without burning, and a puddle does not put it out', () => {
    const s = fresh(), ev = roll(createBall(30, 80), across, 2, lv({ fires: [{ x: 60, y: 80, r: 5 }], pools: [{ x: 75, y: 60, w: 10, h: 40 }] }), s, 'steam');
    expect(has(ev, 'burn') || has(ev, 'douse') || has(ev, 'quench')).toBe(false);
  });
  it('the enemies lose the ball and stand still', () => {
    const s = fresh(); roll(createBall(50, 40), { x: 0, y: 0 }, 1, lv({ enemies: [{ x: 50, y: 50, speed: 28 }] }), s, 'steam');
    expect(s.foes[0]).toMatchObject({ x: 50, y: 50 });
  });
  it('the wind takes it like gas', () => {
    const wind = { winds: [{ x: 3, y: 60, w: 94, h: 40, dx: 300, dy: 0 }] }, a = createBall(20, 80), b = createBall(20, 80);
    roll(a, { x: 0, y: 0 }, 0.4, lv(wind), fresh(), 'gas'); roll(b, { x: 0, y: 0 }, 0.4, lv(wind), fresh(), 'steam');
    expect(b.x).toBeCloseTo(a.x, 5);
  });
});

describe('snowball', () => {
  const thick = lv({ walls: [{ x: 20, y: 38, w: 6, h: 28, kind: 'thick' }] });
  it('a small one bounces off a thick wall; rolled big it breaks it', () => {
    const small = fresh(); roll(createBall(45, 52), { x: -10, y: 0 }, 1.5, thick, small, 'snow'); expect(small.broken.has(0)).toBe(false);
    const big = fresh(); big.snow = 40; roll(createBall(45, 52), { x: -10, y: 0 }, 1.5, thick, big, 'snow'); expect(big.broken.has(0)).toBe(true);
  });
  it('grows with the way it rolls', () => {
    const s = fresh(); s.snow = 0; roll(createBall(80, 52), { x: -10, y: 0 }, 0.6, lv(), s, 'snow');
    expect(s.snow).toBeGreaterThan(40);
  });
  it('a big one breaks it from a gentle bump', () => {
    const s = fresh(); s.snow = 40; roll(createBall(36, 52), { x: -3, y: 0 }, 2, thick, s, 'snow'); expect(s.broken.has(0)).toBe(true);
  });
  it('puts a fire pillar out, as water does', () => {
    const s = fresh(), ev = roll(createBall(30, 80), across, 1.5, lv({ fires: [{ x: 60, y: 80, r: 5 }] }), s, 'snow');
    expect(has(ev, 'douse')).toBe(true); expect(has(ev, 'burn')).toBe(false);
  });
});

describe('blast', () => {
  it('breaks a thick wall it only touches', () => {
    const s = fresh(); roll(createBall(36, 52), { x: -3, y: 0 }, 2, lv({ walls: [{ x: 20, y: 38, w: 6, h: 28, kind: 'thick' }] }), s, 'blast');
    expect(s.broken.has(0)).toBe(true);
  });
  it('is fire too: burns a vine, goes out in a puddle', () => {
    const s = fresh(); roll(createBall(36, 52), { x: -3, y: 0 }, 2, lv({ walls: [{ x: 20, y: 38, w: 6, h: 28, kind: 'vine' }] }), s, 'blast'); expect(s.broken.has(0)).toBe(true);
    expect(has(roll(createBall(30, 80), across, 2, lv({ pools: [patch] }), fresh(), 'blast'), 'quench')).toBe(true);
  });
});

describe('puddles', () => {
  it('ice freezes a puddle: no more holding back, and stone does not sink in it', () => {
    const s = fresh(), ev = roll(createBall(30, 80), across, 1, lv({ pools: [patch] }), s, 'ice');
    expect(has(ev, 'icepool')).toBe(true); expect(s.iced.has(0)).toBe(true);
    const wide = lv({ pools: [{ x: 30, y: 60, w: 60, h: 40 }] }), wet = createBall(35, 80), iced = createBall(35, 80), s2 = fresh(); s2.iced = new Set([0]);
    roll(wet, across, 0.5, wide, fresh(), null); roll(iced, across, 0.5, wide, s2, null);
    expect(iced.x).toBeGreaterThan(wet.x + 10);
    expect(has(roll(createBall(30, 80), across, 2, lv({ pools: [patch] }), s2, 'stone'), 'drown')).toBe(false);
  });
  it('a frozen puddle does not put fire out', () => {
    const s = fresh(); s.iced = new Set([0]);
    expect(has(roll(createBall(30, 80), across, 2, lv({ pools: [patch] }), s, 'fire'), 'quench')).toBe(false);
  });
  const wired = () => lv({ pools: [{ x: 45, y: 60, w: 27, h: 40 }], walls: [{ x: 64, y: 60, w: 3, h: 40, kind: 'fence' }], switches: [{ x: 73, y: 80, open: [0] }] });
  it('electricity worn into a puddle runs to a switch it touches', () => {
    const s = fresh(), ev = roll(createBall(30, 80), across, 2, wired(), s, 'spark');
    expect(ev.find(e => e.type === 'power')).toMatchObject({ sw: 0, via: 0 }); expect(s.broken.has(0)).toBe(true); expect(has(ev, 'shock')).toBe(false);
  });
  it('not through ice', () => {
    const s = fresh(); s.iced = new Set([0]); const ev = roll(createBall(30, 80), across, 2, wired(), s, 'spark');
    expect(has(ev, 'power')).toBe(false); expect(has(ev, 'shock')).toBe(true);
  });
});
