import { describe, it, expect } from 'vitest';
import { applyDifficulty, levelsFor, DIFFS, BUILT } from '../src/difficulty.js';
import { levelById, nextLevel } from '../src/levels/index.js';

describe('difficulty', () => {
  it('names five, of which two are built', () => {
    expect(DIFFS.map(d => d.name)).toEqual(['쉬움', '보통', '어려움', '지옥', '신']); expect(BUILT).toEqual(['easy', 'normal']);
  });
  it('easy is the stage as made', () => { const l = levelById('w1-3'); expect(applyDifficulty(l, 'easy')).toEqual(l); });
  it('normal: three quarters of the time, thicker walls, its trap holes', () => {
    const l = levelById('w1-3'), n = applyDifficulty(l, 'normal');
    expect(n.time).toBe(Math.round(l.time * 0.75));
    expect(n.walls[3]).toMatchObject({ x: l.walls[3].x - 1, y: l.walls[3].y - 1, w: l.walls[3].w + 2, h: l.walls[3].h + 2 });   // a wall clear of the rim
    expect(n.traps).toEqual(l.normal.traps); expect(n.traps.length).toBeGreaterThan(0);
  });
  it('thicker walls stay inside the rim', () => {
    const n = applyDifficulty(levelById('w1-1'), 'normal');   // its first wall starts at the rim (x 3)
    expect(n.walls[0].x).toBe(3);
  });
  it('normal has no practice stages', () => {
    expect(levelsFor('normal').map(l => l.id)).toEqual([1, 2, 3, 4].flatMap(w => Array.from({ length: 10 }, (_, i) => `w${w}-${i + 1}`)));
    expect(levelsFor('easy')[0].id).toBe('t1');
  });
  it('the next stage follows the chosen difficulty', () => {
    expect(nextLevel('t3', 'easy').id).toBe('w1-1'); expect(nextLevel('w4-10', 'normal')).toBe(null);
    expect(nextLevel('w1-2', 'normal').time).toBe(Math.round(levelById('w1-3').time * 0.75));
  });
});
