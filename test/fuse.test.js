import { describe, it, expect } from 'vitest';
import { FUSIONS, fusionOf } from '../src/elements.js';
import { createRun, startRun, tickRun, useSlot, canFuse, DASH_V } from '../src/run.js';

const L = { id: 'x', world: 8, time: 60, start: { x: 50, y: 80 }, hole: { x: 90, y: 150, r: 7.4 }, walls: [], coins: [] };
const go = slots => { const r = createRun(L, 'easy', slots); startRun(r); return r; };

describe('fusing', () => {
  it('three recipes, either way round', () => {
    expect(Object.keys(FUSIONS)).toEqual(['steam', 'snow', 'blast']);
    expect([fusionOf('water', 'fire'), fusionOf('fire', 'water'), fusionOf('ice', 'water'), fusionOf('gas', 'fire')]).toEqual(['steam', 'steam', 'snow', 'blast']);
    expect(fusionOf('water', 'spark')).toBe(null); expect(fusionOf('water', 'water')).toBe(null);
    expect([FUSIONS.steam.dur, FUSIONS.snow.dur, FUSIONS.blast.dur]).toEqual([4, 5, 1.5]);
  });
  it('the other slot pressed while one is worn makes the fusion, and both rest', () => {
    const r = go(['water', 'fire']);
    expect(canFuse(r, 1)).toBe(false);   // nothing worn yet
    useSlot(r, 0); expect(canFuse(r, 1)).toBe(true); expect(canFuse(r, 0)).toBe(false);
    expect(useSlot(r, 1)).toBe(true);
    expect(r.coat).toMatchObject({ el: 'steam', left: 4, dur: 4, of: ['water', 'fire'], fused: true });
    expect(r.cool).toEqual([7, 7]);
    expect(canFuse(r, 1)).toBe(false);   // a fusion does not fuse again
  });
  it('the boost lasts a fusion longer too', () => {
    const r = go(['water', 'ice']); r.boost = 2; useSlot(r, 0); useSlot(r, 1);
    expect(r.coat).toMatchObject({ el: 'snow', left: 7 }); expect(r.cool).toEqual([10, 10]);
  });
  it('no recipe: the new element simply takes over', () => {
    const r = go(['water', 'spark']); useSlot(r, 0);
    expect(canFuse(r, 1)).toBe(false);
    useSlot(r, 1); expect(r.coat).toMatchObject({ el: 'spark', left: 5 }); expect(r.coat.fused).toBeFalsy();
  });
  it('a resting slot cannot fuse', () => {
    const r = go(['water', 'fire']); useSlot(r, 1); r.coat = null; useSlot(r, 0);
    expect(canFuse(r, 1)).toBe(false); expect(useSlot(r, 1)).toBe(false); expect(r.coat.el).toBe('water');
  });
  it('a new snowball starts small', () => {
    const r = go(['water', 'ice']); r.state.snow = 99; useSlot(r, 0); useSlot(r, 1); expect(r.state.snow).toBe(0);
  });
  it('the blast throws the ball the way the board leans', () => {
    const r = go(['gas', 'fire']); useSlot(r, 0); useSlot(r, 1);
    tickRun(r, { x: 0, y: -10 }, 1 / 60, 1);
    expect(r.ball.vy).toBeLessThan(-DASH_V * 0.9); expect(Math.abs(r.ball.vx)).toBeLessThan(1);
    expect(DASH_V).toBe(520);
  });
  it('on a level board it goes the way the ball was going', () => {
    const r = go(['fire', 'gas']); r.ball.vx = 40; useSlot(r, 0); useSlot(r, 1);
    tickRun(r, { x: 0, y: 0 }, 1 / 60, 1); expect(r.ball.vx).toBeGreaterThan(DASH_V * 0.9);
  });
});
