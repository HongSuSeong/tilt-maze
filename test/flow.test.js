import { describe, it, expect } from 'vitest';
import { createRun, afterClear } from '../src/run.js';
import { defaultSave } from '../src/save.js';
import { levelById } from '../src/levels/index.js';

describe('after a stage is cleared', () => {
  it('keeps the stars, adds the reward and opens the next stage', () => {
    const r = createRun(levelById('w1-1')); r.coins = 2; r.left = 35;   // 35 of 50 s left: three stars
    const out = afterClear(defaultSave(), r);
    expect(out.stars).toBe(3); expect(out.reward).toBe(22);
    expect(out.save.coins).toBe(22); expect(out.save.best['w1-1']).toEqual({ stars: 3, time: 15 });
    expect(out.save.reached).toBe('w1-2'); expect(out.next.id).toBe('w1-2');
  });
  it('after the last stage there is nothing next: back home', () => {
    const r = createRun(levelById('w1-10')); r.left = 1;
    expect(afterClear(defaultSave(), r).next).toBe(null);
  });
});
