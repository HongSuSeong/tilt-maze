import { describe, it, expect } from 'vitest';
import { defaultSave, loadSave, writeSave, recordClear } from '../src/save.js';

const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
const KEY = 'tilt-maze:v1';

describe('save', () => {
  it('round-trips', () => {
    const st = mem(), s = { ...defaultSave(), coins: 12 };
    expect(writeSave(s, st)).toBe(true); expect(loadSave(st)).toEqual(s);
  });
  it('starts fresh when nothing is kept', () => expect(loadSave(mem())).toEqual(defaultSave()));
  it('starts fresh from broken data', () => { const st = mem(); st.setItem(KEY, '{nope'); expect(loadSave(st)).toEqual(defaultSave()); });
  it('starts fresh from another version', () => { const st = mem(); st.setItem(KEY, JSON.stringify({ ...defaultSave(), v: 2 })); expect(loadSave(st)).toEqual(defaultSave()); });
  it('plays on when storage is blocked', () => {
    const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(loadSave(bad)).toEqual(defaultSave()); expect(writeSave(defaultSave(), bad)).toBe(false);
  });
  it('keeps the better result and adds the coins', () => {
    let s = recordClear(defaultSave(), 'w1-1', 3, 20, 15);
    s = recordClear(s, 'w1-1', 2, 30, 7);
    expect(s.best['w1-1']).toEqual({ stars: 3, time: 20 }); expect(s.coins).toBe(22);
  });
  it('opens the next stage', () => {
    expect(recordClear(defaultSave(), 't1', 1, 50, 0).reached).toBe('t2');
    expect(recordClear({ ...defaultSave(), reached: 'w1-5' }, 'w1-2', 1, 50, 0).reached).toBe('w1-5');   // replaying an old stage keeps the furthest
  });
});
