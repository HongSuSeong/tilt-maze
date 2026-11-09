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
});
