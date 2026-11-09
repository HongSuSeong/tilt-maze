import { describe, it, expect } from 'vitest';
import { defaultSave, loadSave, writeSave, recordClear, isOpen } from '../src/save.js';

const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
const KEY = 'tilt-maze:v1';
const fields = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`w1-${i + 1}`, { stars: 1, time: 30 }]));

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
  it('normal opens once every field stage on easy is cleared', () => {
    const s = defaultSave();
    expect(isOpen(s, 'easy')).toBe(true);
    s.prog.easy.best = fields(9); expect(isOpen(s, 'normal')).toBe(false);
    s.prog.easy.best = fields(10); expect(isOpen(s, 'normal')).toBe(true);
    expect(isOpen(s, 'hard')).toBe(false);
  });
});
