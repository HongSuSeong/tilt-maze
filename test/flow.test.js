import { describe, it, expect } from 'vitest';
import { createRun, afterClear } from '../src/run.js';
import { defaultSave } from '../src/save.js';
import { levelById } from '../src/levels/index.js';

describe('after a stage is cleared', () => {
  it('keeps the stars, adds the reward and opens the next stage', () => {
    const r = createRun(levelById('w1-1')); r.coins = 2; r.left = 35;   // 35 of 50 s left: three stars
    const out = afterClear(defaultSave(), r);
    expect(out.stars).toBe(3); expect(out.reward).toBe(5);
    expect(out.save.coins).toBe(5); expect(out.save.prog.easy.best['w1-1']).toEqual({ stars: 3, time: 15 });
    expect(out.save.prog.easy.reached).toBe('w1-2'); expect(out.next.id).toBe('w1-2');
  });
  it('after the last stage there is nothing next: back home', () => {
    const r = createRun(levelById('w3-10')); r.left = 1;
    expect(afterClear(defaultSave(), r).next).toBe(null);
  });
  it('records under the difficulty played', () => {
    const r = createRun(levelById('w1-1'), 'normal'); r.left = 10;
    const out = afterClear(defaultSave(), r);
    expect(out.save.prog.normal.best['w1-1']).toBeTruthy(); expect(out.save.prog.easy.best['w1-1']).toBeUndefined();
    expect(out.next.id).toBe('w1-2');
  });
  it('clearing again pays only the coins picked up, unless the stars get better', () => {
    const r = createRun(levelById('w1-1')); r.coins = 2; r.left = 35;
    const first = afterClear(defaultSave(), r).save, again = afterClear(first, r);
    expect(again.reward).toBe(2); expect(again.save.coins).toBe(7);
  });
});
