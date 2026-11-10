import { describe, it, expect } from 'vitest';
import { validateLevel } from '../src/levels/validate.js';

// the board cut in two across the middle; the way through, at x 40–60, is whatever `plug` is
const cut = (plug, o = {}) => ({
  time: 60, start: { x: 50, y: 30 }, hole: { x: 50, y: 130, r: 7.4 }, coins: [],
  walls: [{ x: 3, y: 78, w: 37, h: 4, kind: 'wall' }, { x: 60, y: 78, w: 37, h: 4, kind: 'wall' }, ...(plug ? [{ x: 40, y: 78, w: 20, h: 4, kind: plug }] : [])], ...o,
});
const ok = (l, opt) => validateLevel(l, opt).length === 0;

describe('the check knows the fusions', () => {
  const water = cut(null, { deep: [{ x: 3, y: 70, w: 94, h: 20 }] });
  it('steam crosses deep water', () => {
    expect(ok({ ...water, kit: ['water', 'fire'] })).toBe(true);
    expect(ok({ ...water, kit: ['water'] })).toBe(false);
    expect(ok({ ...water, kit: ['water', 'fire'] }, { fuse: false })).toBe(false);
  });
  it('a snowball or a blast breaks a thick wall', () => {
    expect(ok({ ...cut('thick'), kit: ['water', 'ice'] })).toBe(true);
    expect(ok({ ...cut('thick'), kit: ['fire', 'gas'] })).toBe(true);
    expect(ok({ ...cut('thick'), kit: ['water', 'fire'] })).toBe(false);
    expect(ok({ ...cut('thick'), kit: ['water', 'ice'] }, { fuse: false })).toBe(false);
  });
});

describe('the check knows the puddles', () => {
  const sunk = cut('thick', { pools: [{ x: 40, y: 56, w: 20, h: 22 }] });
  it('stone sinks in the puddle before the wall, unless ice freezes it first', () => {
    expect(ok({ ...cut('thick'), kit: ['stone'] })).toBe(true);
    expect(ok({ ...sunk, kit: ['stone'] })).toBe(false);
    expect(ok({ ...sunk, kit: ['ice', 'stone'] })).toBe(true);
    expect(ok({ ...sunk, kit: ['ice', 'stone'] }, { trace: false })).toBe(false);
  });
  const wired = cut('fence', { pools: [{ x: 40, y: 60, w: 20, h: 26 }], switches: [{ x: 50, y: 88, open: [2] }] });
  it('electricity runs through a puddle to the switch across the fence', () => {
    expect(ok({ ...wired, kit: ['water', 'spark'] })).toBe(true);
    expect(ok({ ...wired, kit: ['water', 'spark'] }, { trace: false })).toBe(false);
    expect(ok({ ...wired, kit: ['water'] })).toBe(false);
  });
});
