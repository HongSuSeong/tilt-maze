import { describe, it, expect } from 'vitest';
import { COLORS, PATTERNS, THEMES, BOOST_PRICES, buy, buyBoost, paintPalette, clears, nextPaintAt } from '../src/shop.js';
import { loadSave } from '../src/save.js';
import { defaultSave } from '../src/save.js';

const rich = (coins = 500) => ({ ...defaultSave(), coins });

describe('shop', () => {
  it('sixteen colours and six patterns, some free', () => {
    expect(COLORS).toHaveLength(16); expect(PATTERNS.map(p => p.id)).toEqual(['dots', 'stripes', 'check', 'half', 'stars', 'rainbow']);
    const s = defaultSave(); expect(s.owned.patterns).toEqual(['dots', 'stripes']); expect(s.owned.colors).toEqual(['coral', 'mint', 'cream']);
    expect(s.look).toEqual({ mode: 'pattern', pattern: 'dots', base: 'coral', accent: 'cream', pixels: Array(128).fill(null) });
  });
  it('buying takes the coins and keeps the thing', () => {
    const out = buy(rich(50), 'patterns', 'check');
    expect(out.ok).toBe(true); expect(out.save.coins).toBe(30); expect(out.save.owned.patterns).toContain('check');
  });
  it('not without the coins, and not twice', () => {
    expect(buy(rich(19), 'patterns', 'check').ok).toBe(false);
    const once = buy(rich(100), 'colors', 'sky').save; expect(buy(once, 'colors', 'sky').ok).toBe(false);
  });
  it('wearing elements longer: three steps at 50, 100 and 200', () => {
    expect(BOOST_PRICES).toEqual([50, 100, 200]);
    let s = rich(350); for (let i = 0; i < 3; i++) { const o = buyBoost(s); expect(o.ok).toBe(true); s = o.save; }
    expect(s.boost).toBe(3); expect(s.coins).toBe(0);
    expect(buyBoost({ ...s, coins: 999 }).ok).toBe(false);   // no fourth step
    expect(buyBoost(rich(49)).ok).toBe(false);
  });
  it('paint colours open as stages are cleared: four, then one each eight', () => {
    const s = defaultSave(); expect(paintPalette(s).map(c => c.id)).toEqual(['snow', 'ink', 'coral', 'mint']); expect(nextPaintAt(s)).toBe(8);
    s.prog.easy.best = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`w1-${i + 1}`, { stars: 1, time: 9 }]));
    s.prog.normal.best = { 'w1-1': { stars: 1, time: 9 }, 'w1-2': { stars: 1, time: 9 }, 'w1-3': { stars: 1, time: 9 }, 'w1-4': { stars: 1, time: 9 }, 'w1-5': { stars: 1, time: 9 }, 'w1-6': { stars: 1, time: 9 } };
    expect(clears(s)).toBe(16); expect(paintPalette(s)).toHaveLength(6); expect(nextPaintAt(s)).toBe(24);
  });
  it('three themes: the soft toy free, paper and cartoon at 80', () => {
    expect(THEMES.map(t => [t.id, t.price])).toEqual([['toy', 0], ['paper', 80], ['toon', 80]]);
    const s = defaultSave(); expect(s.theme).toBe('toy'); expect(s.owned.themes).toEqual(['toy']);
    const out = buy(rich(80), 'themes', 'paper'); expect(out.ok).toBe(true); expect(out.save.owned.themes).toEqual(['toy', 'paper']); expect(out.save.coins).toBe(0);
  });
  it('a save from before themes gets the soft toy, and keeps what it bought', () => {
    const old = { ...defaultSave(), owned: { patterns: ['dots', 'stripes', 'check'], colors: ['coral', 'mint', 'cream'] } }; delete old.theme;
    const st = { getItem: () => JSON.stringify(old), setItem() {} }, s = loadSave(st);
    expect(s.theme).toBe('toy'); expect(s.owned.themes).toEqual(['toy']); expect(s.owned.patterns).toContain('check');
  });
});
