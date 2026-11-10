import { describe, it, expect } from 'vitest';
import { validateLevel, requires } from '../src/levels/validate.js';

const base = (o = {}) => ({ id: 'x', time: 60, start: { x: 12, y: 15 }, hole: { x: 84, y: 143, r: 7.4 }, walls: [], coins: [], ...o });

describe('validateLevel', () => {
  it('a plain board passes', () => expect(validateLevel(base())).toEqual([]));
  it('a wall across the board blocks the hole', () => {
    expect(validateLevel(base({ walls: [{ x: 3, y: 80, w: 94, h: 6, kind: 'wall' }] }))).toContain('구멍에 갈 수 없음');
  });
  it('a cracked wall across the board does not block', () => {
    expect(validateLevel(base({ walls: [{ x: 3, y: 80, w: 94, h: 6, kind: 'crack' }] }))).toEqual([]);
  });
  it('a cracked wall needs a run-up', () => {
    const e = validateLevel(base({ walls: [{ x: 3, y: 30, w: 94, h: 6, kind: 'crack' }, { x: 3, y: 70, w: 94, h: 6, kind: 'crack' }] }));
    expect(e.some(m => m.startsWith('금 간 벽 0: 달릴 거리'))).toBe(true);
    expect(e.some(m => m.startsWith('금 간 벽 1'))).toBe(false);
  });
  it('a coin inside a wall is caught', () => {
    expect(validateLevel(base({ walls: [{ x: 40, y: 60, w: 20, h: 10, kind: 'wall' }], coins: [{ x: 50, y: 65 }] })).length).toBeGreaterThan(0);
  });
  it('the time limit stays between 20 and 120 seconds', () => {
    expect(validateLevel(base({ time: 10 })).length).toBeGreaterThan(0);
  });
  it('a trap hole across the way blocks the hole', () => {
    const e = validateLevel(base({ walls: [{ x: 3, y: 80, w: 40, h: 6, kind: 'wall' }, { x: 57, y: 80, w: 40, h: 6, kind: 'wall' }], traps: [{ x: 50, y: 83, r: 7 }] }));
    expect(e).toContain('구멍에 갈 수 없음');
  });
  it('the start may not sit in a trap', () => expect(validateLevel(base({ traps: [{ x: 12, y: 15, r: 6 }] }))).toContain('시작점이 함정 안'));
  it('a fire pillar across the way blocks, unless the stage gives water', () => {
    const walls = [{ x: 3, y: 80, w: 40, h: 6, kind: 'wall' }, { x: 57, y: 80, w: 40, h: 6, kind: 'wall' }], fires = [{ x: 50, y: 83, r: 5 }];
    expect(validateLevel(base({ walls, fires }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ walls, fires, kit: ['water'] }))).toEqual([]);
    expect(requires(base({ walls, fires, kit: ['water'] }), 'water')).toBe(true);
    expect(requires(base({ kit: ['water'] }), 'water')).toBe(false);
  });
  it('a puddle can be rolled through', () => expect(validateLevel(base({ pools: [{ x: 3, y: 70, w: 94, h: 30 }] }))).toEqual([]));
  const across = kind => [{ x: 3, y: 80, w: 94, h: 6, kind }];
  it('vines and ice walls block unless the stage gives fire', () => {
    for (const kind of ['vine', 'ice']) {
      expect(validateLevel(base({ walls: across(kind) }))).toContain('구멍에 갈 수 없음');
      expect(validateLevel(base({ walls: across(kind), kit: ['fire'] }))).toEqual([]);
      expect(requires(base({ walls: across(kind), kit: ['fire'] }), 'fire')).toBe(true);
    }
  });
  it('a door opens only with fire, and its torch must be reachable', () => {
    expect(validateLevel(base({ walls: across('door'), torches: [{ x: 50, y: 40, door: 0 }], kit: ['fire'] }))).toEqual([]);
    expect(validateLevel(base({ walls: across('door'), torches: [{ x: 50, y: 40, door: 0 }] }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ walls: across('door'), torches: [{ x: 50, y: 120, door: 0 }], kit: ['fire'] }))).toContain('구멍에 갈 수 없음');   // the torch is behind its own door
  });
  it('lava blocks unless the stage gives water', () => {
    const lava = [{ x: 3, y: 75, w: 94, h: 16 }];
    expect(validateLevel(base({ lava }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ lava, kit: ['water'] }))).toEqual([]);
  });
  it('deep water blocks unless the stage gives ice', () => {
    const deep = [{ x: 3, y: 75, w: 94, h: 16 }];
    expect(validateLevel(base({ deep }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ deep, kit: ['ice'] }))).toEqual([]);
    expect(requires(base({ deep, kit: ['ice'] }), 'ice')).toBe(true);
  });
  it('a fence opens only with electricity, from a switch that can be reached', () => {
    const walls = [{ x: 3, y: 80, w: 94, h: 4, kind: 'fence' }];
    expect(validateLevel(base({ walls, switches: [{ x: 50, y: 40, open: [0] }], kit: ['spark'] }))).toEqual([]);
    expect(validateLevel(base({ walls, switches: [{ x: 50, y: 40, open: [0] }] }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ walls, switches: [{ x: 50, y: 120, open: [0] }], kit: ['spark'] }))).toContain('구멍에 갈 수 없음');
  });
  it('a thick wall blocks unless the stage gives stone, and stone needs no run-up', () => {
    expect(validateLevel(base({ walls: [{ x: 3, y: 80, w: 94, h: 6, kind: 'thick' }] }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ walls: [{ x: 3, y: 80, w: 94, h: 6, kind: 'thick' }], kit: ['stone'] }))).toEqual([]);
    const short = { walls: [{ x: 3, y: 30, w: 94, h: 6, kind: 'crack' }, { x: 3, y: 70, w: 94, h: 6, kind: 'crack' }] };
    expect(validateLevel(base(short)).length).toBeGreaterThan(0); expect(validateLevel(base({ ...short, kit: ['stone'] }))).toEqual([]);
  });
  it('a chasm blocks unless the stage gives gas', () => {
    const gaps = [{ x: 3, y: 75, w: 94, h: 16 }];
    expect(validateLevel(base({ gaps }))).toContain('구멍에 갈 수 없음');
    expect(validateLevel(base({ gaps, kit: ['gas'] }))).toEqual([]);
  });
  it('with gas, a wall beside a fire pillar can be blown open', () => {
    const o = { walls: [{ x: 3, y: 80, w: 94, h: 6, kind: 'thick' }], fires: [{ x: 50, y: 70, r: 5 }], kit: ['gas'] };
    expect(validateLevel(base(o))).toEqual([]); expect(validateLevel(base({ ...o, kit: [] }))).toContain('구멍에 갈 수 없음');
  });
  it('a moving trap is not counted as a wall: it can be passed in time', () => {
    const walls = [{ x: 3, y: 80, w: 40, h: 6, kind: 'wall' }, { x: 57, y: 80, w: 40, h: 6, kind: 'wall' }];
    expect(validateLevel(base({ walls, traps: [{ x: 50, y: 83, r: 7, to: { x: 50, y: 60 }, period: 3 }] }))).toEqual([]);
  });
});
