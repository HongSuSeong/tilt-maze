import { describe, it, expect } from 'vitest';
import { ELEMENTS, ownedFor, defaultSlots } from '../src/elements.js';
import { createRun, startRun, tickRun, useSlot, setSlots, retry } from '../src/run.js';

const L = (o = {}) => ({ id: 'x', world: 2, time: 60, start: { x: 30, y: 80 }, hole: { x: 90, y: 150, r: 7.4 }, walls: [], coins: [], fires: [{ x: 75, y: 80, r: 5 }], ...o });
const play = (r, tilt, sec) => { for (let t = 0; t < sec; t += 1 / 60) tickRun(r, tilt, 1 / 60, 1); };
const flat = { x: 0, y: 0 };

describe('elements', () => {
  it('water lasts five seconds and comes back three after', () => expect(ELEMENTS.water).toMatchObject({ name: '물', dur: 5, cool: 3 }));
  it('each world brings its element', () => { expect(ownedFor(1)).toEqual([]); expect(ownedFor(2)).toEqual(['water']); });
  it('the slots fill with what is owned', () => { expect(defaultSlots({ world: 1 })).toEqual([null, null]); expect(defaultSlots({ world: 2 })).toEqual(['water', null]); });
  it('a slot coats the ball for five seconds, then rests three', () => {
    const r = createRun(L()); startRun(r);
    expect(useSlot(r, 0)).toBe(true); expect(r.coat).toEqual({ el: 'water', left: 5 });
    expect(useSlot(r, 0)).toBe(false);
    play(r, flat, 5.05); expect(r.coat).toBe(null);
    expect(useSlot(r, 0)).toBe(false); play(r, flat, 3); expect(useSlot(r, 0)).toBe(true);
  });
  it('an empty slot, or a stage not under way, does nothing', () => {
    const r = createRun(L()); expect(useSlot(r, 0)).toBe(false); startRun(r); expect(useSlot(r, 1)).toBe(false);
  });
  it('water worn puts the pillar out; worn off, the pillar burns', () => {
    const a = createRun(L()); startRun(a); useSlot(a, 0); play(a, { x: 12, y: 0 }, 2);
    expect(a.state.doused.has(0)).toBe(true); expect(a.phase).toBe('play');
    const b = createRun(L()); startRun(b); useSlot(b, 0); play(b, flat, 5.2); play(b, { x: 12, y: 0 }, 2);
    expect(b.phase).toBe('fail'); expect(b.reason).toBe('fire');
  });
  it('starting over keeps the slots chosen and clears the coat', () => {
    const r = createRun(L()); setSlots(r, [null, 'water']); startRun(r); useSlot(r, 1); retry(r);
    expect(r.slots).toEqual([null, 'water']); expect(r.coat).toBe(null); expect(r.cool).toEqual([0, 0]);
  });
});
