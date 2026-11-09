// One go at a stage: the clock, the coins picked up, clearing and failing, and the rest after three fails in a row.
import { createBall, stepBall } from './physics.js';
import { recordClear } from './save.js';
import { nextLevel } from './levels/index.js';

const REST = 30, SKIP_COST = 20, FAILS_TO_REST = 3;

const fresh = run => Object.assign(run, {
  ball: createBall(run.level.start.x, run.level.start.y), state: { broken: new Set(), got: new Set() }, left: run.level.time, coins: 0,
});

export function createRun(level) { return fresh({ level, phase: 'ready', fails: 0, restLeft: 0 }); }
export function startRun(run) { if (run.phase === 'ready') run.phase = 'play'; }
export function pauseRun(run) { if (run.phase === 'play') run.phase = 'paused'; }
export function resumeRun(run) { if (run.phase === 'paused') run.phase = 'play'; }

export function tickRun(run, tilt, dt, sens) {
  if (run.phase !== 'play') return [];
  const ev = stepBall(run.ball, tilt, dt, run.level, run.state, sens);
  for (const e of ev) {
    if (e.type === 'coin') run.coins++;
    if (e.type === 'sunk') run.phase = 'clear';
  }
  if (run.phase === 'play' && run.ball.fall === 0 && (run.left -= dt) <= 0) {   // the clock stops once the ball is dropping in
    run.left = 0; run.phase = 'fail'; ev.push({ type: 'timeout' });
  }
  return ev;
}

// Start the stage over. The third fail in a row brings a rest.
export function retry(run) {
  fresh(run);
  if (++run.fails >= FAILS_TO_REST) { run.phase = 'rest'; run.restLeft = REST; } else run.phase = 'ready';
}
export function tickRest(run, dt) {
  if (run.phase === 'rest' && (run.restLeft -= dt) <= 0) { run.restLeft = 0; run.fails = 0; run.phase = 'ready'; }
}
// Pay to skip the rest; spends from the save it is given.
export function skipRest(run, save) {
  if (run.phase !== 'rest' || save.coins < SKIP_COST) return false;
  save.coins -= SKIP_COST; run.restLeft = 0; run.fails = 0; run.phase = 'ready'; return true;
}

export function starsFor(run) { const k = run.left / run.level.time; return k >= 0.5 ? 3 : k >= 0.25 ? 2 : 1; }
export function rewardFor(run) { return run.coins + 5 + 5 * starsFor(run); }


// A stage cleared: what the save keeps, and the stage that comes next (null after the last).
export function afterClear(save, run) {
  const stars = starsFor(run), reward = rewardFor(run);
  return { save: recordClear(save, run.level.id, stars, run.level.time - run.left, reward), stars, reward, next: nextLevel(run.level.id) };
}
