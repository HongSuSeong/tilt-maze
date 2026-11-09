import { describe, it, expect } from 'vitest';
import { createBall, stepBall } from '../src/physics.js';

const lv = (o = {}) => ({ walls: [], coins: [], hole: null, ...o });
const fresh = () => ({ broken: new Set(), got: new Set(), doused: new Set(), lit: new Set(), cooled: new Set() });
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
  it('a trap hole swallows the ball and the stage is lost', () => {
    const ev = run(createBall(50, 100), { x: 0, y: 10 }, 3, lv({ hole: { x: 50, y: 150, r: 7.4 }, traps: [{ x: 50, y: 120, r: 6 }] }));
    const t = ev.findIndex(e => e.type === 'trap' && e.trap === 0), l = ev.findIndex(e => e.type === 'lost');
    expect(t).toBeGreaterThanOrEqual(0); expect(l).toBeGreaterThan(t);
    expect(ev.some(e => e.type === 'sunk' || e.type === 'hole')).toBe(false);
  });
  it('between a trap and the goal, the nearer one takes the ball', () => {
    const b = createBall(50, 80);
    const ev = stepBall(b, { x: 0, y: 0 }, 1 / 60, lv({ hole: { x: 56, y: 80, r: 7.4 }, traps: [{ x: 47, y: 80, r: 7.4 }] }), { broken: new Set(), got: new Set() }, 1);
    expect(ev.map(e => e.type)).toContain('trap'); expect(ev.map(e => e.type)).not.toContain('hole');
  });
  it('the rim of a trap pulls the ball in', () => {
    const b = createBall(50, 80);
    stepBall(b, { x: 0, y: 0 }, 1 / 60, lv({ traps: [{ x: 58, y: 80, r: 6 }] }), { broken: new Set(), got: new Set() }, 1);
    expect(b.vx).toBeGreaterThan(0);
  });
  it('a water puddle slows the ball', () => {
    const dry = createBall(10, 80), wet = createBall(10, 80), pool = { pools: [{ x: 3, y: 70, w: 94, h: 20 }] };
    run(dry, { x: 3, y: 0 }, 1, lv()); run(wet, { x: 3, y: 0 }, 1, lv(pool));   // gently, so neither reaches the rim
    expect(dry.x).toBeLessThan(90); expect(wet.x - 10).toBeLessThan((dry.x - 10) * 0.6);
  });
  it('a fire pillar burns a ball without water', () => {
    const b = createBall(30, 80), ev = run(b, { x: 10, y: 0 }, 2, lv({ fires: [{ x: 60, y: 80, r: 5 }] }));
    expect(ev.some(e => e.type === 'burn' && e.fire === 0)).toBe(true);
    expect(b.x).toBeLessThan(60 - 5);
  });
  it('water puts a fire pillar out, and the way is open after', () => {
    const b = createBall(30, 80), s = fresh(), ev = [];
    for (let t = 0; t < 2; t += 1 / 60) ev.push(...stepBall(b, { x: 10, y: 0 }, 1 / 60, lv({ fires: [{ x: 60, y: 80, r: 5 }] }), s, 1, 'water'));
    expect(ev.some(e => e.type === 'douse' && e.fire === 0)).toBe(true); expect(ev.some(e => e.type === 'burn')).toBe(false);
    expect(s.doused.has(0)).toBe(true); expect(b.x).toBeGreaterThan(70);
  });
  it('one coat of water puts out two pillars in a row', () => {
    const s = fresh(), ev = [], b = createBall(20, 80);
    for (let t = 0; t < 3; t += 1 / 60) ev.push(...stepBall(b, { x: 12, y: 0 }, 1 / 60, lv({ fires: [{ x: 45, y: 80, r: 5 }, { x: 70, y: 80, r: 5 }] }), s, 1, 'water'));
    expect([...s.doused].sort()).toEqual([0, 1]);
  });
  const roll = (b, tilt, sec, level, s, coat) => { const ev = []; for (let t = 0; t < sec; t += 1 / 60) ev.push(...stepBall(b, tilt, 1 / 60, level, s, 1, coat)); return ev; };
  it('fire burns a vine wall away; without fire it is a wall', () => {
    const level = lv({ walls: [{ x: 60, y: 60, w: 6, h: 40, kind: 'vine' }] });
    const s = fresh(), ev = roll(createBall(40, 80), { x: 8, y: 0 }, 1.5, level, s, 'fire');
    expect(ev.some(e => e.type === 'burnwall' && e.wall === 0)).toBe(true); expect(s.broken.has(0)).toBe(true);
    const b = createBall(40, 80); roll(b, { x: 8, y: 0 }, 1.5, level, fresh(), 'water'); expect(b.x).toBeLessThan(60);
  });
  it('fire melts an ice wall', () => {
    const s = fresh(); roll(createBall(40, 80), { x: 8, y: 0 }, 1.5, lv({ walls: [{ x: 60, y: 60, w: 6, h: 40, kind: 'ice' }] }), s, 'fire');
    expect(s.broken.has(0)).toBe(true);
  });
  it('a torch lit with fire opens its door', () => {
    const level = lv({ walls: [{ x: 70, y: 60, w: 6, h: 40, kind: 'door' }], torches: [{ x: 50, y: 80, door: 0 }] });
    const s = fresh(), b = createBall(30, 80), ev = roll(b, { x: 8, y: 0 }, 2, level, s, 'fire');
    expect(ev.some(e => e.type === 'light' && e.torch === 0)).toBe(true); expect(s.broken.has(0)).toBe(true); expect(b.x).toBeGreaterThan(76);
    const shut = createBall(30, 80); roll(shut, { x: 8, y: 0 }, 2, level, fresh(), null); expect(shut.x).toBeLessThan(70);
  });
  it('water cools lava into a path before the ball sinks in', () => {
    const level = lv({ lava: [{ x: 50, y: 60, w: 20, h: 40 }] });
    const s = fresh(), b = createBall(30, 80), ev = roll(b, { x: 8, y: 0 }, 2, level, s, 'water');
    expect(ev.some(e => e.type === 'cool' && e.lava === 0)).toBe(true); expect(ev.some(e => e.type === 'lava')).toBe(false); expect(b.x).toBeGreaterThan(70);
  });
  it('lava swallows a ball without water', () => {
    const b = createBall(30, 80), ev = roll(b, { x: 8, y: 0 }, 2, lv({ lava: [{ x: 50, y: 60, w: 20, h: 40 }] }), fresh(), 'fire');
    expect(ev.some(e => e.type === 'lava')).toBe(true); expect(b.x).toBeLessThan(70);
  });
  it('a puddle puts fire out', () => {
    const ev = roll(createBall(30, 80), { x: 0, y: 0 }, 0.1, lv({ pools: [{ x: 20, y: 70, w: 20, h: 20 }] }), fresh(), 'fire');
    expect(ev.some(e => e.type === 'quench')).toBe(true);
  });
  it('a ball keeps sliding on ice', () => {
    const dry = createBall(10, 80), icy = createBall(10, 80); dry.vx = icy.vx = 60;   // slow enough that neither reaches the rim
    roll(dry, { x: 0, y: 0 }, 1, lv(), fresh(), null); roll(icy, { x: 0, y: 0 }, 1, lv({ slick: [{ x: 3, y: 60, w: 94, h: 40 }] }), fresh(), null);
    expect(icy.x).toBeLessThan(90); expect(icy.vx).toBeGreaterThan(dry.vx * 1.5);
  });
  it('deep water drowns a ball', () => {
    const b = createBall(30, 80), ev = roll(b, { x: 8, y: 0 }, 2, lv({ deep: [{ x: 50, y: 60, w: 20, h: 40 }] }), fresh(), 'fire');
    expect(ev.some(e => e.type === 'drown' && e.deep === 0)).toBe(true); expect(b.x).toBeLessThan(70);
  });
  it('ice freezes deep water into a slippery bridge', () => {
    const s = fresh(), b = createBall(30, 80), ev = roll(b, { x: 8, y: 0 }, 2, lv({ deep: [{ x: 50, y: 60, w: 20, h: 40 }] }), s, 'ice');
    expect(ev.some(e => e.type === 'freeze' && e.deep === 0)).toBe(true); expect(ev.some(e => e.type === 'drown')).toBe(false);
    expect(s.frozen.has(0)).toBe(true); expect(b.x).toBeGreaterThan(70);
  });
  it('an electric fence shocks', () => {
    const b = createBall(40, 80), ev = roll(b, { x: 8, y: 0 }, 2, lv({ walls: [{ x: 60, y: 60, w: 4, h: 40, kind: 'fence' }] }), fresh(), 'fire');
    expect(ev.some(e => e.type === 'shock')).toBe(true); expect(b.x).toBeLessThan(60);
  });
  it('a switch touched with electricity turns its fence off', () => {
    const level = lv({ walls: [{ x: 70, y: 60, w: 4, h: 40, kind: 'fence' }], switches: [{ x: 50, y: 80, open: [0] }] });
    const s = fresh(), b = createBall(30, 80), ev = roll(b, { x: 8, y: 0 }, 2, level, s, 'spark');
    expect(ev.some(e => e.type === 'power' && e.sw === 0)).toBe(true); expect(ev.some(e => e.type === 'shock')).toBe(false); expect(b.x).toBeGreaterThan(74);
  });
  it('the electric floor shocks while on, not while off, and never a ball wearing electricity', () => {
    const zap = { zaps: [{ x: 40, y: 60, w: 20, h: 40 }] };
    const on = roll(createBall(50, 80), { x: 0, y: 0 }, 0.2, lv(zap), fresh(), null);   // on for the first two seconds
    expect(on.some(e => e.type === 'shock')).toBe(true);
    const s = fresh(); s.clock = 2.5;   // off from two to four
    expect(roll(createBall(50, 80), { x: 0, y: 0 }, 0.2, lv(zap), s, null).some(e => e.type === 'shock')).toBe(false);
    expect(roll(createBall(50, 80), { x: 0, y: 0 }, 0.2, lv(zap), fresh(), 'spark').some(e => e.type === 'shock')).toBe(false);
    const w = fresh(); w.clock = 2.5;
    expect(roll(createBall(50, 80), { x: 0, y: 0 }, 0.2, lv(zap), w, 'water').some(e => e.type === 'shock')).toBe(true);   // water carries it even off
  });
  it('an enemy comes after the ball and catches it', () => {
    const level = lv({ enemies: [{ x: 50, y: 130, speed: 28 }] }), s = fresh(), b = createBall(50, 40);
    roll(b, { x: 0, y: 0 }, 1, level, s, null);
    expect(s.foes[0].y).toBeLessThan(130 - 20);
    const ev = roll(b, { x: 0, y: 0 }, 6, level, s, null);
    expect(ev.some(e => e.type === 'caught')).toBe(true);
  });
  it('an enemy backs away from a ball wearing fire', () => {
    const s = fresh(); roll(createBall(50, 60), { x: 0, y: 0 }, 1, lv({ enemies: [{ x: 50, y: 100, speed: 28 }] }), s, 'fire');
    expect(s.foes[0].y).toBeGreaterThan(100);
  });
});
