import { describe, it, expect } from 'vitest';
import { generate } from '../src/levels/generate.js';
import { validateLevel, requires } from '../src/levels/validate.js';
import { levelsFor, BUILT } from '../src/difficulty.js';
import { nextLevel, levelById } from '../src/levels/index.js';
import { defaultSave, isOpen } from '../src/save.js';

const HARD = levelsFor('hard');

describe('hard maps', () => {
  it('the same stage comes out the same every time', () => expect(generate(3, 5)).toEqual(generate(3, 5)));
  it('a hundred of them, after the built difficulties', () => {
    expect(BUILT).toEqual(['easy', 'normal', 'hard']);
    expect(HARD.map(l => l.id)).toEqual(Array.from({ length: 10 }, (_, w) => Array.from({ length: 10 }, (_, i) => `h${w + 1}-${i + 1}`)).flat());
    expect(nextLevel('h1-10', 'hard').id).toBe('h2-1'); expect(nextLevel('h10-10', 'hard')).toBe(null);
  });
  it.each(HARD.map(l => [l.id, l]))('%s passes the check and needs its kit', (id, l) => {
    expect(validateLevel(l)).toEqual([]);
    for (const el of l.kit) expect(requires(l, el)).toBe(true);
  });
  it('each world asks for its own element', () => {
    const want = { 2: 'water', 3: 'fire', 4: 'ice', 5: 'spark', 6: 'stone', 7: 'gas' };
    for (const [w, el] of Object.entries(want)) expect(HARD.filter(l => l.world === +w).every(l => l.kit.includes(el))).toBe(true);
    expect(HARD.filter(l => l.world >= 8).every(l => l.kit.length === 2)).toBe(true);
  });
  it('the way is long, the dead ends hold traps, and the dark stays dark', () => {
    for (const l of HARD) { expect(l.path).toBeGreaterThanOrEqual(10); expect(l.traps.length).toBeGreaterThan(0); }
    expect(HARD.filter(l => l.world === 9).every(l => l.dim)).toBe(true);
  });
  it('is not the easy map', () => expect(generate(1, 3).walls).not.toEqual(levelById('w1-3').walls));
  it('opens once every stage on normal is cleared', () => {
    const s = defaultSave(); expect(isOpen(s, 'hard')).toBe(false);
    s.prog.normal.best = Object.fromEntries(levelsFor('normal').map(l => [l.id, { stars: 1, time: 30 }]));
    expect(isOpen(s, 'hard')).toBe(true);
  });
});
