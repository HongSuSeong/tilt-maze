import { describe, it, expect } from 'vitest';
import { defaultSave, loadSave, writeSave, recordClear, isOpen, markOpened, reachedOf } from '../src/save.js';
import { nextLevel } from '../src/levels/index.js';
import { levelsFor } from '../src/difficulty.js';

const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
const KEY = 'tilt-maze:v1';
const fields = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`w1-${i + 1}`, { stars: 1, time: 30 }]));   // the first n of the fields
const FIELD_IDS = levelsFor('easy').filter(l => l.world > 0).map(l => l.id);
const allFields = (less = 0) => Object.fromEntries(FIELD_IDS.slice(0, FIELD_IDS.length - less).map(id => [id, { stars: 1, time: 30 }]));

describe('save', () => {
  it('round-trips', () => {
    const st = mem(), s = { ...defaultSave(), coins: 12 };
    expect(writeSave(s, st)).toBe(true); expect(loadSave(st)).toEqual(s);
  });
  it('starts fresh when nothing is kept', () => expect(loadSave(mem())).toEqual(defaultSave()));
  it('starts fresh from broken data', () => { const st = mem(); st.setItem(KEY, '{nope'); expect(loadSave(st)).toEqual(defaultSave()); });
  it('starts fresh from an unknown version', () => { const st = mem(); st.setItem(KEY, JSON.stringify({ ...defaultSave(), v: 9 })); expect(loadSave(st)).toEqual(defaultSave()); });
  it('plays on when storage is blocked', () => {
    const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(loadSave(bad)).toEqual(defaultSave()); expect(writeSave(defaultSave(), bad)).toBe(false);
  });
  it('carries a version 1 save over to easy', () => {
    const st = mem(), opt = { sens: 1.2, snd: false, vib: true, dark: true };
    st.setItem(KEY, JSON.stringify({ v: 1, coins: 30, best: { t1: { stars: 3, time: 20 } }, reached: 'w1-2', opt }));
    const s = loadSave(st);
    expect(s.v).toBe(2); expect(s.coins).toBe(30); expect(s.opt).toEqual(opt); expect(s.diff).toBe('easy');
    expect(s.prog.easy).toEqual({ best: { t1: { stars: 3, time: 20 } }, reached: 'w1-2' });
    expect(s.prog.normal).toEqual({ best: {}, reached: 'w1-1' });
  });
  it('keeps the better result and adds the coins', () => {
    let s = recordClear(defaultSave(), 'easy', 'w1-1', 3, 20, 15);
    s = recordClear(s, 'easy', 'w1-1', 2, 30, 7);
    expect(s.prog.easy.best['w1-1']).toEqual({ stars: 3, time: 20 }); expect(s.coins).toBe(22);
  });
  it('keeps each difficulty apart', () => {
    const s = recordClear(defaultSave(), 'normal', 'w1-1', 2, 25, 5);
    expect(s.prog.normal.best['w1-1']).toEqual({ stars: 2, time: 25 }); expect(s.prog.easy.best).toEqual({});
    expect(s.prog.normal.reached).toBe('w1-2');
  });
  it('opens the next stage', () => {
    expect(recordClear(defaultSave(), 'easy', 't1', 1, 50, 0).prog.easy.reached).toBe('t2');
    const s = defaultSave(); s.prog.easy.reached = 'w1-5';
    expect(recordClear(s, 'easy', 'w1-2', 1, 50, 0).prog.easy.reached).toBe('w1-5');   // replaying an old stage keeps the furthest
  });
  it('normal opens once every stage on easy, practice aside, is cleared', () => {
    const s = defaultSave();
    expect(isOpen(s, 'easy')).toBe(true);
    s.prog.easy.best = allFields(1); expect(isOpen(s, 'normal')).toBe(false);
    s.prog.easy.best = allFields(); expect(isOpen(s, 'normal')).toBe(true);
    expect(isOpen(s, 'hard')).toBe(false);
  });
  it('the furthest stage moves past every stage already cleared', () => {
    const s = defaultSave(); s.prog.easy.best = { t1: { stars: 1, time: 9 }, t2: { stars: 1, time: 9 } };
    expect(reachedOf(s, 'easy')).toBe('t3');
    s.prog.easy.best = { ...s.prog.easy.best, t3: { stars: 1, time: 9 }, ...fields(10) }; s.prog.easy.reached = 'w1-10';
    expect(reachedOf(s, 'easy')).toBe(nextLevel('w1-10', 'easy')?.id ?? 'w1-10');   // a world added later opens after the last cleared
  });
  it('a difficulty once open stays open when stages are added', () => {
    const st = mem(), old = defaultSave(); delete old.opened; old.prog.easy.best = fields(10);
    st.setItem(KEY, JSON.stringify(old));
    const s = loadSave(st); expect(s.opened).toContain('normal');
    s.prog.easy.best = fields(3); expect(isOpen(s, 'normal')).toBe(true);
  });
  it('marks what has come open', () => {
    const s = defaultSave(); expect(s.opened).toEqual(['easy']);
    s.prog.easy.best = allFields(); expect(markOpened(s).opened).toEqual(['easy', 'normal']);
  });
});
