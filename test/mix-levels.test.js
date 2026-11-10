import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/levels/index.js';
import { levelsFor } from '../src/difficulty.js';
import { madeLevels } from '../src/levels/generate.js';
import { validateLevel } from '../src/levels/validate.js';
import { FUSIONS } from '../src/elements.js';

const KIT = { steam: ['water', 'fire'], snow: ['water', 'ice'], blast: ['fire', 'gas'], freeze: ['ice', 'stone'], wire: ['water', 'spark'] };
const MIXED = LEVELS.filter(l => l.combo), NORMAL = levelsFor('normal').filter(l => l.combo);
const off = l => (FUSIONS[l.combo] ? { fuse: false } : { trace: false });

describe('stages that mix', () => {
  it('each mixed world has three fusions and two puddle tricks', () => {
    for (const w of [8, 9, 10]) expect(MIXED.filter(l => l.world === w).map(l => l.combo).sort()).toEqual(['blast', 'freeze', 'snow', 'steam', 'wire']);
    expect(MIXED.every(l => l.world >= 8)).toBe(true);
  });
  it.each([...MIXED, ...NORMAL].map(l => [l.id, l.walls.length, l]))('%s (%i walls) passes, and not without its mix', (id, n, l) => {
    expect(l.kit).toEqual(KIT[l.combo]);
    expect(validateLevel(l)).toEqual([]);
    expect(validateLevel(l, off(l))).toContain('구멍에 갈 수 없음');
  });
  it('the first of each kind in world 8 says how', () => {
    for (const c of ['steam', 'freeze', 'wire']) expect(MIXED.find(l => l.combo === c).hint).toBeTruthy();
  });
  it('hard, hell and god have none yet', () => { for (const d of ['hard', 'hell', 'god']) expect(madeLevels(d).some(l => l.combo)).toBe(false); });
});
