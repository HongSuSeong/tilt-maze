import { describe, it, expect } from 'vitest';
import { createRun, startRun, tickRun, retry, tickRest, skipRest, starsFor, rewardFor, pauseRun, resumeRun } from '../src/run.js';

const L = { id: 'x', time: 40, start: { x: 50, y: 80 }, hole: { x: 90, y: 80, r: 7.4 }, walls: [], coins: [{ x: 60, y: 80 }, { x: 70, y: 80 }] };
const play = (run, tilt, sec) => { const ev = []; for (let t = 0; t < sec; t += 1 / 60) ev.push(...tickRun(run, tilt, 1 / 60, 1)); return ev; };
const flat = { x: 0, y: 0 };

describe('run', () => {
  it('runs out of time', () => {
    const r = createRun(L); startRun(r);
    expect(play(r, flat, 41).some(e => e.type === 'timeout')).toBe(true); expect(r.phase).toBe('fail');
  });
  it('clears when the ball drops into the hole, picking up coins on the way', () => {
    const r = createRun(L); startRun(r); play(r, { x: 10, y: 0 }, 4);
    expect(r.phase).toBe('clear'); expect(r.coins).toBe(2);
  });
  it('gives stars for the time left', () => {
    const r = createRun(L);
    r.left = 20; expect(starsFor(r)).toBe(3); r.left = 10; expect(starsFor(r)).toBe(2); r.left = 9.9; expect(starsFor(r)).toBe(1);
  });
  it('rewards the coins picked up, five for clearing and five a star', () => {
    const r = createRun(L); r.coins = 2; r.left = 40; expect(rewardFor(r)).toBe(22);
  });
  it('three fails in a row bring a rest of thirty seconds', () => {
    const r = createRun(L); startRun(r);
    retry(r); expect(r.phase).toBe('ready'); retry(r); expect(r.phase).toBe('ready');
    retry(r); expect(r.phase).toBe('rest'); expect(r.restLeft).toBe(30);
    tickRest(r, 29); expect(r.phase).toBe('rest'); tickRest(r, 1.5); expect(r.phase).toBe('ready'); expect(r.fails).toBe(0);
  });
  it('twenty coins skip the rest, nineteen do not', () => {
    const r = createRun(L); for (let i = 0; i < 3; i++) retry(r);
    const poor = { coins: 19 }; expect(skipRest(r, poor)).toBe(false); expect(r.phase).toBe('rest');
    const rich = { coins: 25 }; expect(skipRest(r, rich)).toBe(true); expect(rich.coins).toBe(5); expect(r.phase).toBe('ready');
  });
  it('time stands still while paused', () => {
    const r = createRun(L); startRun(r); pauseRun(r); play(r, { x: 10, y: 0 }, 5);
    expect(r.left).toBe(40); expect(r.ball.x).toBe(50); resumeRun(r); expect(r.phase).toBe('play');
  });
  it('starting over puts the ball back and the coins back', () => {
    const r = createRun(L); startRun(r); play(r, { x: 10, y: 0 }, 0.6); retry(r);
    expect([r.ball.x, r.ball.y, r.coins, r.left, r.state.got.size]).toEqual([50, 80, 0, 40, 0]);
  });
  it('a trap hole loses the stage', () => {
    const r = createRun({ ...L, traps: [{ x: 60, y: 80, r: 6 }] }, 'normal'); startRun(r); play(r, { x: 10, y: 0 }, 3);
    expect(r.phase).toBe('fail'); expect(r.reason).toBe('trap'); expect(r.diff).toBe('normal');
  });
  it('running out of time says so', () => { const r = createRun(L); startRun(r); play(r, flat, 41); expect(r.reason).toBe('timeout'); expect(r.diff).toBe('easy'); });
});
