// Wiring: the saved progress, the sensor, the board, the screens and the frame loop.
import './style.css';
import { createView } from './render3d.js';
import { createTilt } from './tilt.js';
import { createUI } from './ui.js';
import { createSound } from './sound.js';
import { T } from './text.js';
import { LEVELS, levelById } from './levels/index.js';
import { loadSave, writeSave } from './save.js';
import { createRun, startRun, tickRun, retry, tickRest, skipRest, pauseRun, resumeRun, afterClear } from './run.js';

let save = loadSave();
const tilt = createTilt(), keys = {}, view = createView(document.body), sound = createSound(() => save.opt);
let run = null, mode = 'home', unlocked = false, notice = '', wake = null;
const keep = () => writeSave(save);
const angle = () => (window.screen.orientation?.angle ?? window.orientation ?? 0);
const theme = () => { document.documentElement.dataset.theme = save.opt.dark ? 'dark' : 'light'; view.setDark(save.opt.dark); };

addEventListener('deviceorientation', e => { if (e.beta != null) tilt.feed(e); });
addEventListener('keydown', e => { keys[e.key] = true; });
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
  const level = levelById(id) || LEVELS[0];
  run = createRun(level); view.load(level); theme();
}
function goHome() { mode = 'home'; if (!run) load(save.reached); ui.show('home', { save, notice }); }
function ready() { mode = 'ready'; ui.show('ready', { level: run.level }); ui.hud(run); }

const ui = createUI(document.body, {
  async play(id) { await unlock(); stayAwake(); load(id); ready(); },
  start() { tilt.calibrate(); startRun(run); mode = 'play'; ui.show('play', { level: run.level }); },
  pause() { if (run?.phase !== 'play') return; pauseRun(run); mode = 'pause'; ui.show('pause'); },
  resume() { tilt.calibrate(); resumeRun(run); mode = 'play'; ui.show('play', { level: run.level }); },
  retry() { retry(run); view.load(run.level); run.phase === 'rest' ? showRest() : ready(); },
  next() { const n = clearOut?.next; if (n) { load(n.id); ready(); } else goHome(); },
  home() { run = null; wake?.release?.(); goHome(); },
  skipRest() { if (skipRest(run, save)) { keep(); ready(); } },
  openSettings() { ui.show('settings', { opt: save.opt }); },
  closeSettings() { ui.closeSettings(); if (mode === 'home') goHome(); },
  setOpt(k, v) { save.opt = { ...save.opt, [k]: v }; keep(); if (k === 'dark') theme(); },
  zero() { tilt.calibrate(); ui.toast(T.zeroDone); },
});

function showRest() { mode = 'rest'; ui.show('rest', { left: run.restLeft, canSkip: save.coins >= 20 }); }
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
    }
    if (mode === 'play') {
      ui.hud(run);
      if (run.phase === 'clear') {
        clearOut = afterClear(save, run); save = clearOut.save; keep(); sound.win();
        mode = 'clear'; ui.show('clear', clearOut);
      } else if (run.phase === 'fail') { sound.fail(); mode = 'fail'; ui.show('fail', { reason: 'timeout' }); }
    }
    if (mode === 'rest') {
      tickRest(run, dt);
      if (run.phase === 'ready') ready(); else ui.rest(run.restLeft, save.coins >= 20);
    }
    view.update(run, mode === 'home' ? { x: 0, y: 0 } : t, dt, ev);
  }
  requestAnimationFrame(frame);
}

// #shot=home or #shot=LEVEL[:SCREEN][:dark] — a still for checking the screens without a phone
const shot = location.hash.match(/^#shot=([\w-]+)(?::(ready|play|pause|clear|fail|rest|settings))?(?::(dark))?$/);
if (shot) {
  if (shot[3]) save.opt.dark = true;
  if (shot[1] === 'home') { save.coins = 128; save.reached = 'w1-4'; save.best = { t1: { stars: 3 }, t2: { stars: 2 }, t3: { stars: 3 }, 'w1-1': { stars: 1 }, 'w1-2': { stars: 3 }, 'w1-3': { stars: 2 } }; goHome(); }
  else {
    load(shot[1]); const s = shot[2] || 'play';
    if (s === 'ready') ready();
    else { startRun(run); mode = 'play'; ui.show('play', { level: run.level }); run.left *= 0.7; run.coins = 2; ui.hud(run); }
    if (s === 'pause') ui.show('pause');
    if (s === 'clear') { clearOut = { stars: 2, reward: 17, next: levelById('w1-4') }; ui.show('clear', clearOut); }
    if (s === 'fail') ui.show('fail', { reason: 'timeout' });
    if (s === 'rest') { run.phase = 'rest'; run.restLeft = 24; ui.show('rest', { left: 24, canSkip: true }); }
    if (s === 'settings') ui.show('settings', { opt: save.opt });
    if (s !== 'play' && s !== 'ready') mode = 'shot';
  }
} else goHome();
if (new URLSearchParams(location.search).has('test')) window.__tm = { get run() { return run; } };   // read-only peek for tools/smoke.mjs
theme();
requestAnimationFrame(frame);
