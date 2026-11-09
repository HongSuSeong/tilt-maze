// Wiring: the saved progress, the sensor, the board, the screens and the frame loop.
import './style.css';
import { createView } from './render3d.js';
import { createTilt } from './tilt.js';
import { createUI } from './ui.js';
import { createSound } from './sound.js';
import { T } from './text.js';
import { levelById } from './levels/index.js';
import { levelsFor } from './difficulty.js';
import { loadSave, writeSave, markOpened, reachedOf, isOpen } from './save.js';
import { createRun, startRun, tickRun, retry, tickRest, skipRest, pauseRun, resumeRun, afterClear, useSlot, setSlots, SKIP_COST } from './run.js';
import { ownedFor } from './elements.js';

let save = loadSave();
const tilt = createTilt(), keys = {}, view = createView(document.body), sound = createSound(() => save.opt);
let run = null, mode = 'home', unlocked = false, notice = '', wake = null;
const unlockAll = new URLSearchParams(location.search).has('unlock');   // for trying any stage: opens everything built, keeps none of it
const keep = () => writeSave(save);
const angle = () => (window.screen.orientation?.angle ?? window.orientation ?? 0);
const theme = () => { document.documentElement.dataset.theme = save.opt.dark ? 'dark' : 'light'; view.setDark(save.opt.dark); };

addEventListener('deviceorientation', e => { if (e.beta != null) tilt.feed(e); });
addEventListener('keydown', e => { keys[e.key] = true; if ((e.key === '1' || e.key === '2') && run && useSlot(run, +e.key - 1)) sound.coat(); });   // number keys stand in for the slots on a computer
addEventListener('keyup', e => { keys[e.key] = false; });
addEventListener('resize', () => view.resize());

// The first tap opens the sensor (iPhones ask), the sound, and keeps the mode awake while playing.
async function unlock() {
  if (unlocked) return; unlocked = true; sound.unlock();
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') notice = T.sensorDenied; } catch { notice = T.sensorDenied; }
  }
  setTimeout(() => { if (!tilt.hasSensor && !notice) { notice = T.noSensor; if (mode === 'home') goHome(); } }, 1500);
}
async function stayAwake() { try { wake = await navigator.wakeLock?.request('mode'); } catch { wake = null; } }

function load(id) {
  const ls = levelsFor(save.diff), level = ls.find(l => l.id === id) || ls[0];
  run = createRun(level, save.diff); view.load(level); theme();
}
function goHome() {
  mode = 'home'; save = markOpened(save);
  if (!unlockAll && !isOpen(save, save.diff)) save = { ...save, diff: 'easy' };   // a difficulty chosen while unlocked is not kept open
  keep(); if (!run) load(reachedOf(save, save.diff)); ui.show('home', { save, notice, unlock: unlockAll });
}
function ready() { mode = 'ready'; ui.show('ready', { level: run.level, slots: run.slots }); ui.hud(run); }

const ui = createUI(document.body, {
  async play(id) { await unlock(); stayAwake(); load(id); ready(); },
  start() { tilt.calibrate(); startRun(run); mode = 'play'; ui.show('play', { level: run.level }); },
  pause() { if (run?.phase !== 'play') return; pauseRun(run); mode = 'pause'; ui.show('pause'); },
  resume() { tilt.calibrate(); resumeRun(run); mode = 'play'; ui.show('play', { level: run.level }); },
  retry() { retry(run); view.load(run.level); run.phase === 'rest' ? showRest() : ready(); },
  next() { const n = clearOut?.next; if (n) { load(n.id); ready(); } else goHome(); },
  home() { run = null; wake?.release?.(); goHome(); },
  pickDiff(d) { save = { ...save, diff: d }; keep(); run = null; goHome(); },
  skipRest() { if (skipRest(run, save)) { keep(); ready(); } },
  openSettings() { ui.show('settings', { opt: save.opt }); },
  closeSettings() { ui.closeSettings(); if (mode === 'home') goHome(); },
  setOpt(k, v) { save.opt = { ...save.opt, [k]: v }; keep(); if (k === 'dark') theme(); },
  zero() { tilt.calibrate(); ui.toast(T.zeroDone); },
  useSlot(i) { if (run && useSlot(run, i)) sound.coat(); },
  cycleSlot(i) {   // empty → each owned element → empty
    const opts = [null, ...ownedFor(run.level.world)], next = opts[(opts.indexOf(run.slots[i]) + 1) % opts.length], sl = [...run.slots];
    sl[i] = next; if (next && sl[1 - i] === next) sl[1 - i] = null;   // one element is worn from one slot
    setSlots(run, sl); ready();
  },
});

function showRest() { mode = 'rest'; ui.show('rest', { left: run.restLeft, canSkip: save.coins >= SKIP_COST }); }
let clearOut = null;

addEventListener('visibilitychange', () => {   // away from the game: stop the clock where it is
  if (document.hidden && run?.phase === 'play') { pauseRun(run); mode = 'pause'; ui.show('pause'); }
  if (!document.hidden && run && (mode === 'play' || mode === 'pause')) stayAwake();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const t = tilt.read(angle(), keys);
  let ev = [];
  if (run) {
    ev = tickRun(run, t, dt, save.opt.sens);
    for (const e of ev) {
      if (e.type === 'knock') sound.knock(e.speed);
      else if (e.type === 'break') sound.crash();
      else if (e.type === 'coin') sound.ding();
      else if (e.type === 'hole') sound.plop();
      else if (e.type === 'douse' || e.type === 'cool' || e.type === 'freeze') sound.hiss();
      else if (e.type === 'burnwall' || e.type === 'boom') sound.crash();
      else if (e.type === 'light' || e.type === 'power') sound.coat();
      else if (e.type === 'quench') { sound.hiss(); ui.toast(T.quench); }
    }
    if (mode === 'play') {
      ui.hud(run);
      if (run.phase === 'clear') {
        clearOut = afterClear(save, run); save = markOpened(clearOut.save); keep(); sound.win();
        mode = 'clear'; ui.show('clear', clearOut);
      } else if (run.phase === 'fail') { sound.fail(); mode = 'fail'; ui.show('fail', { reason: run.reason }); }
    }
    if (mode === 'rest') {
      tickRest(run, dt);
      if (run.phase === 'ready') ready(); else ui.rest(run.restLeft, save.coins >= SKIP_COST);
    }
    view.update(run, mode === 'home' ? { x: 0, y: 0 } : t, dt, ev);
  }
  requestAnimationFrame(frame);
}

// #shot=home or #shot=LEVEL, then any of :SCREEN :normal :dark — a still for checking the screens without a phone
const shot = location.hash.match(/^#shot=([\w-]+)((?::\w+)*)$/);
if (shot) {
  const tok = new Set(shot[2].split(':').filter(Boolean)), s = ['ready', 'play', 'pause', 'clear', 'fail', 'rest', 'settings'].find(t => tok.has(t)) || 'play';
  if (tok.has('dark')) save.opt.dark = true;
  if (tok.has('normal')) save.diff = 'normal';
  if (tok.has('hard')) save.diff = 'hard';
  if (shot[1] === 'home') {
    save.coins = 128; save.prog.easy = { reached: 'w1-10', best: Object.fromEntries(levelsFor('easy').map((l, i) => [l.id, { stars: 1 + i % 3, time: 20 }])) };
    goHome();
  } else {
    load(shot[1]);
    if (s === 'ready') ready();
    else { startRun(run); mode = 'play'; ui.show('play', { level: run.level }); run.left *= 0.7; run.coins = 2; if (tok.has('coat')) { useSlot(run, run.slots[1] ? 1 : 0); run.coat.left = 3.2; } ui.hud(run); }
    if (s === 'pause') ui.show('pause');
    if (s === 'clear') { clearOut = { stars: 2, reward: 17, next: levelById('w1-4') }; ui.show('clear', clearOut); }
    if (s === 'fail') ui.show('fail', { reason: run.level.gaps?.length ? 'fall' : run.level.enemies?.length ? 'caught' : run.level.deep?.length ? 'drown' : run.level.lava?.length ? 'lava' : run.level.fires ? 'fire' : tok.has('normal') ? 'trap' : 'timeout' });
    if (s === 'rest') { run.phase = 'rest'; run.restLeft = 24; ui.show('rest', { left: 24, canSkip: true }); }
    if (s === 'settings') ui.show('settings', { opt: save.opt });
    if (s !== 'play' && s !== 'ready') mode = 'shot';
  }
} else goHome();
if (new URLSearchParams(location.search).has('test')) window.__tm = { get run() { return run; } };   // read-only peek for tools/smoke.mjs
theme();
requestAnimationFrame(frame);
