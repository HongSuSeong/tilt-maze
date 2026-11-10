// One go at a stage: the clock, the coins picked up, clearing and failing, and the rest after three fails in a row.
import { createBall, stepBall } from './physics.js';
import { recordClear } from './save.js';
import { nextLevel } from './levels/index.js';
import { ELEMENTS, FUSIONS, fusionOf, defaultSlots } from './elements.js';

export const REST = 30, SKIP_COST = 10, FAILS_TO_REST = 3, DASH_V = 520;

const fresh = run => Object.assign(run, {
  ball: createBall(run.level.start.x, run.level.start.y), state: { broken: new Set(), got: new Set(), doused: new Set() }, left: run.level.time, coins: 0, reason: null,
  coat: null, cool: [0, 0],
});

// `level` is the stage as the difficulty makes it (see difficulty.js); `diff` says where the result is kept.
export function createRun(level, diff = 'easy', slots) {
  slots ??= defaultSlots(level);
  return fresh({ level, diff, slots: [...slots], phase: 'ready', fails: 0, restLeft: 0 }); }
export function setSlots(run, slots) { run.slots = [...slots]; }

// Wear the element in slot i: it lasts its time, and the slot can be used again its rest after that. Pressed while the
// other slot's element is worn, and the two have a recipe, they fuse: both slots rest the fusion's time and three more.
export function useSlot(run, i) {
  const el = run.slots[i];
  if (run.phase !== 'play' || !el || run.cool[i] > 0) return false;
  if (canFuse(run, i)) {
    const f = fusionOf(run.coat.el, el), dur = FUSIONS[f].dur + (run.boost || 0);
    run.coat = { el: f, left: dur, dur, of: [run.coat.el, el], fused: true, ...(f === 'blast' && { kick: true }) };
    run.cool = run.cool.map(() => dur + 3); run.state.snow = 0;
    return true;
  }
  const dur = ELEMENTS[el].dur + (run.boost || 0);   // the shop's boost: a second longer a step
  run.coat = { el, left: dur, dur, slot: i }; run.cool[i] = dur + ELEMENTS[el].cool;
  return true;
}
// Would pressing slot i now make a fusion? (The slot glows when it would.)
export function canFuse(run, i) {
  const c = run.coat;
  return run.phase === 'play' && !!c && !c.fused && c.slot !== i && run.cool[i] <= 0 && !!fusionOf(c.el, run.slots[i]);
}
// The blast's throw: the way the board leans, or on a level board the way the ball was going.
function kick(run, tilt) {
  const b = run.ball, t = Math.hypot(tilt.x, tilt.y), v = Math.hypot(b.vx, b.vy);
  const [dx, dy] = t >= 2 ? [tilt.x / t, tilt.y / t] : v > 0 ? [b.vx / v, b.vy / v] : [0, 0];
  b.vx = dx * DASH_V; b.vy = dy * DASH_V; run.coat.kick = false;
}
export function startRun(run) { if (run.phase === 'ready') run.phase = 'play'; }
export function pauseRun(run) { if (run.phase === 'play') run.phase = 'paused'; }
export function resumeRun(run) { if (run.phase === 'paused') run.phase = 'play'; }

export function tickRun(run, tilt, dt, sens) {
  if (run.phase !== 'play') return [];
  if (run.coat?.kick) kick(run, tilt);
  const ev = stepBall(run.ball, tilt, dt, run.level, run.state, sens, run.coat?.el ?? null);
  if (run.coat && (run.coat.left -= dt) <= 0) run.coat = null;
  run.cool = run.cool.map(c => Math.max(0, c - dt));
  for (const e of ev) {
    if (e.type === 'coin') run.coins++;
    if (e.type === 'sunk') run.phase = 'clear';
    if (e.type === 'lost') { run.phase = 'fail'; run.reason = 'trap'; }
    if (e.type === 'burn') { run.phase = 'fail'; run.reason = 'fire'; }
    if (e.type === 'lava') { run.phase = 'fail'; run.reason = 'lava'; }
    if (e.type === 'drown') { run.phase = 'fail'; run.reason = 'drown'; }
    if (e.type === 'shock') { run.phase = 'fail'; run.reason = 'shock'; }
    if (e.type === 'caught') { run.phase = 'fail'; run.reason = 'caught'; }
    if (e.type === 'fall') { run.phase = 'fail'; run.reason = 'fall'; }
    if (e.type === 'boom') run.coat = null;
    if (e.type === 'quench') run.coat = null;
  }
  if (run.phase === 'play' && run.ball.fall === 0 && (run.left -= dt) <= 0) {   // the clock stops once the ball is dropping in
    run.left = 0; run.phase = 'fail'; run.reason = 'timeout'; ev.push({ type: 'timeout' });
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
// the coins picked up, and a coin for each star better than the stage's best so far (all of them the first time)
export function rewardFor(run, best = null) { return run.coins + Math.max(0, starsFor(run) - (best?.stars ?? 0)); }


// A stage cleared: what the save keeps, and the stage that comes next (null after the last).
export function afterClear(save, run) {
  const stars = starsFor(run), reward = rewardFor(run, save.prog[run.diff].best[run.level.id]);
  return { save: recordClear(save, run.diff, run.level.id, stars, run.level.time - run.left, reward), stars, reward, next: nextLevel(run.level.id, run.diff) };
}
