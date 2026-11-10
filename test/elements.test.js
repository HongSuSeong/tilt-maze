import { describe, it, expect } from 'vitest';
import { ELEMENTS, ownedFor, defaultSlots, toggleElement } from '../src/elements.js';
import { createRun, startRun, tickRun, useSlot, setSlots, retry } from '../src/run.js';

const L = (o = {}) => ({ id: 'x', world: 2, time: 60, start: { x: 30, y: 80 }, hole: { x: 90, y: 150, r: 7.4 }, walls: [], coins: [], fires: [{ x: 75, y: 80, r: 5 }], ...o });
const play = (r, tilt, sec) => { for (let t = 0; t < sec; t += 1 / 60) tickRun(r, tilt, 1 / 60, 1); };
const flat = { x: 0, y: 0 };

describe('elements', () => {
  it('water lasts five seconds and comes back three after', () => expect(ELEMENTS.water).toMatchObject({ name: '물', dur: 5, cool: 3 }));
  it('each world brings its element', () => { expect(ownedFor(1)).toEqual([]); expect(ownedFor(2)).toEqual(['water']); expect(ownedFor(3)).toEqual(['water', 'fire']); expect(ownedFor(4)).toEqual(['water', 'fire', 'ice']); expect(ownedFor(5)).toEqual(['water', 'fire', 'ice', 'spark']); });
  it('stone lasts five seconds too, from the sixth world', () => { expect(ELEMENTS.stone).toMatchObject({ name: '돌', dur: 5, cool: 3 }); expect(ownedFor(6)).toContain('stone'); });
  it('gas lasts five seconds too, from the seventh world', () => { expect(ELEMENTS.gas).toMatchObject({ name: '가스', dur: 5, cool: 3 }); expect(ownedFor(7)).toContain('gas'); });
  it('electricity lasts five seconds too', () => expect(ELEMENTS.spark).toMatchObject({ name: '전기', dur: 5, cool: 3 }));
  it('ice lasts five seconds too', () => expect(ELEMENTS.ice).toMatchObject({ name: '얼음', dur: 5, cool: 3 }));
  it('fire lasts five seconds too', () => expect(ELEMENTS.fire).toMatchObject({ name: '불', dur: 5, cool: 3 }));
  it('the slots fill with what is owned', () => { expect(defaultSlots({ world: 1 })).toEqual([null, null]); expect(defaultSlots({ world: 2 })).toEqual(['water', null]); expect(defaultSlots({ world: 3 })).toEqual(['water', 'fire']); expect(defaultSlots({ world: 4 })).toEqual(['fire', 'ice']); });
  it('a slot coats the ball for five seconds, then rests three', () => {
    const r = createRun(L()); startRun(r);
    expect(useSlot(r, 0)).toBe(true); expect(r.coat).toMatchObject({ el: 'water', left: 5 });
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
  it('fire worn into a puddle goes out, and a vine wall beyond stays', () => {
    const r = createRun(L({ world: 3, fires: [], pools: [{ x: 40, y: 70, w: 10, h: 20 }], walls: [{ x: 65, y: 60, w: 6, h: 40, kind: 'vine' }] }));
    startRun(r); useSlot(r, 1); play(r, { x: 8, y: 0 }, 2);
    expect(r.coat).toBe(null); expect(r.state.broken.has(0)).toBe(false); expect(r.ball.x).toBeLessThan(65);
  });
  it('lava loses the stage', () => {
    const r = createRun(L({ world: 3, fires: [], lava: [{ x: 50, y: 60, w: 20, h: 40 }] })); startRun(r); play(r, { x: 8, y: 0 }, 2);
    expect(r.phase).toBe('fail'); expect(r.reason).toBe('lava');
  });
  it('deep water loses the stage', () => {
    const r = createRun(L({ world: 4, fires: [], deep: [{ x: 50, y: 60, w: 20, h: 40 }] })); startRun(r); play(r, { x: 8, y: 0 }, 2);
    expect(r.phase).toBe('fail'); expect(r.reason).toBe('drown');
  });
  it('a fence or the electric floor loses the stage, and so does an enemy', () => {
    const a = createRun(L({ world: 5, fires: [], walls: [{ x: 60, y: 60, w: 4, h: 40, kind: 'fence' }] })); startRun(a); play(a, { x: 8, y: 0 }, 2);
    expect(a.reason).toBe('shock');
    const b = createRun(L({ world: 5, fires: [], enemies: [{ x: 30, y: 120, speed: 40 }] })); startRun(b); play(b, flat, 4);
    expect(b.reason).toBe('caught');
  });
  it('a chasm loses the stage; a blast takes the gas off', () => {
    const a = createRun(L({ world: 7, fires: [], gaps: [{ x: 50, y: 60, w: 20, h: 40 }] })); startRun(a); play(a, { x: 8, y: 0 }, 2);
    expect(a.reason).toBe('fall');
    const b = createRun(L({ world: 7 })); setSlots(b, ['gas', null]); startRun(b); useSlot(b, 0); play(b, { x: 12, y: 0 }, 1.5);
    expect(b.phase).toBe('play'); expect(b.coat).toBe(null);
  });
  it('a boost keeps each element on a second longer per step', () => {
    const r = createRun(L()); r.boost = 2; startRun(r); useSlot(r, 0);
    expect(r.coat.left).toBe(7); expect(r.cool[0]).toBe(10);
  });
  it('picking: a tap puts an element in the free slot, a second tap takes it out', () => {
    expect(toggleElement([null, null], 'fire')).toEqual(['fire', null]);
    expect(toggleElement(['fire', null], 'ice')).toEqual(['fire', 'ice']);
    expect(toggleElement(['fire', 'ice'], 'fire')).toEqual([null, 'ice']);
    expect(toggleElement([null, 'ice'], 'gas')).toEqual(['gas', 'ice']);
  });
  it('with both slots full, a third pick takes the place of the older one', () => expect(toggleElement(['fire', 'ice'], 'gas')).toEqual(['ice', 'gas']));
});
