import { describe, it, expect } from 'vitest';
import { LEVELS, levelById, nextLevel } from '../src/levels/index.js';
import { validateLevel, requires } from '../src/levels/validate.js';
import { applyDifficulty, levelsFor } from '../src/difficulty.js';

describe('levels', () => {
  it.each(LEVELS.map(l => [l.id, l]))('%s passes the check', (id, l) => expect(validateLevel(l)).toEqual([]));
  it.each(levelsFor('normal').map(l => [l.id, l]))('%s on normal passes the check', (id, l) => expect(validateLevel(l)).toEqual([]));
  it('ids are unique and in order', () => {
    expect(LEVELS.map(l => l.id)).toEqual(['t1', 't2', 't3', ...[1, 2].flatMap(w => Array.from({ length: 10 }, (_, i) => `w${w}-${i + 1}`))]);
    expect(levelById('w1-3').name).toBe('들판 3');
  });
  it('the tutorial leads into the fields, and the fields end', () => {
    expect(nextLevel('t3').id).toBe('w1-1'); expect(nextLevel('w1-10').id).toBe('w2-1'); expect(nextLevel('w2-10')).toBe(null);
  });
  it('world 1 gets harder', () => {
    const w = LEVELS.filter(l => l.world === 1);
    expect(w[9].walls.length).toBeGreaterThan(w[0].walls.length);
    for (let i = 1; i < w.length; i++) expect(w[i].time).toBeLessThanOrEqual(w[i - 1].time);
    expect(w.slice(0, 2).every(l => l.walls.every(x => x.kind !== 'crack'))).toBe(true);
    expect(w.slice(6).every(l => l.walls.filter(x => x.kind === 'crack').length >= 2)).toBe(true);
  });
  it.each(LEVELS.filter(l => l.world === 2).map(l => [l.id, l]))('%s cannot be done without water', (id, l) => expect(requires(l, 'water')).toBe(true));
  it('the tutorial stages carry a hint', () => expect(LEVELS.filter(l => l.world === 0).every(l => l.hint)).toBe(true));
});
