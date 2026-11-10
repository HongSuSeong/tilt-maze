// Wiring: the saved progress, the sensor, the board, the screens and the frame loop.
import './style.css';
import { createView } from './render3d.js';
import { createTilt } from './tilt.js';
import { createUI } from './ui.js';
import { createSound } from './sound.js';
import { createMusic } from './music.js';
import { T } from './text.js';
import { levelById } from './levels/index.js';
import { levelsFor } from './difficulty.js';
import { loadSave, writeSave, markOpened, reachedOf, isOpen, discover } from './save.js';
import { createRun, startRun, tickRun, retry, tickRest, skipRest, pauseRun, resumeRun, afterClear, useSlot, setSlots, SKIP_COST } from './run.js';
import { ownedFor, toggleElement, FUSIONS } from './elements.js';
import { buy, buyBoost, COLORS, PATTERNS, THEMES, BOOST_PRICES } from './shop.js';

let save = loadSave();
const tilt = createTilt(), keys = {}, view = createView(document.body), sound = createSound(() => save.opt);
const music = createMusic(() => sound.context(), () => save.opt.music !== false);
let run = null, mode = 'home', unlocked = false, notice = '', wake = null;
const unlockAll = new URLSearchParams(location.search).has('unlock');   // for trying any stage: opens everything built, keeps none of it
const keep = () => writeSave(save);
const angle = () => (window.screen.orientation?.angle ?? window.orientation ?? 0);
const applyTheme = () => { document.documentElement.dataset.look = save.theme; view.setTheme(save.theme); };   // the look bought in the shop
const theme = () => { document.documentElement.dataset.theme = save.opt.dark ? 'dark' : 'light'; view.setDark(save.opt.dark); };

addEventListener('deviceorientation', e => { if (e.beta != null) tilt.feed(e); });
addEventListener('keydown', e => { keys[e.key] = true; if (e.key === '1' || e.key === '2') wear(+e.key - 1); });   // number keys stand in for the slots on a computer
addEventListener('keyup', e => { keys[e.key] = false; });
addEventListener('resize', () => view.resize());

// The first tap opens the sensor (iPhones ask), the sound, and keeps the screen awake while playing.
async function unlock() {
  if (unlocked) return; unlocked = true; sound.unlock(); music.start();
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') notice = T.sensorDenied; } catch { notice = T.sensorDenied; }
  }
  setTimeout(() => { if (!tilt.hasSensor && !notice) { notice = T.noSensor; if (mode === 'home') goHome(); } }, 1500);
}
// Press a slot: the ball wears its element, or fuses it with the one worn. A fusion found the first time goes in the book.
function wear(i) {
  if (!run || !useSlot(run, i)) return;
  sound.coat(); const c = run.coat;
  if (!c.fused) return view.burst(c.el);
  for (const el of [...c.of, c.el]) view.burst(el);
  const d = discover(save, c.el);
  if (d.isNew) { save = d.save; keep(); sound.win(); ui.toast(T.found(FUSIONS[c.el].name)); } else ui.toast(T.fusedNow(FUSIONS[c.el].name));
}
async function stayAwake() { try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; } }

function load(id) {
  const ls = levelsFor(save.diff), level = ls.find(l => l.id === id) || ls[0];
  const owned = ownedFor(level.world), last = save.picks?.[level.id]?.map(e => (owned.includes(e) ? e : null));   // what was worn here last time
  run = createRun(level, save.diff, last); run.boost = save.boost; view.load(level); theme(); music.setWorld(level.world);
}
function goHome() {
  mode = 'home'; save = markOpened(save);
  if (!unlockAll && !isOpen(save, save.diff)) save = { ...save, diff: 'easy' };   // a difficulty chosen while unlocked is not kept open
  keep(); if (!run) load(reachedOf(save, save.diff)); ui.show('home', { save, notice, unlock: unlockAll });
}
function ready() { mode = 'ready'; ui.show('ready', { level: run.level, slots: run.slots }); ui.hud(run); }

const ui = createUI(document.body, {
  async play(id) { await unlock(); stayAwake(); load(id); ready(); },
  start() { save = { ...save, picks: { ...save.picks, [run.level.id]: run.slots } }; keep(); tilt.calibrate(); startRun(run); mode = 'play'; ui.show('play', { level: run.level }); },
  pause() { if (run?.phase !== 'play') return; pauseRun(run); mode = 'pause'; ui.show('pause'); },
  resume() { tilt.calibrate(); resumeRun(run); mode = 'play'; ui.show('play', { level: run.level }); },
  retry() { retry(run); view.load(run.level); run.phase === 'rest' ? showRest() : ready(); },
  next() { const n = clearOut?.next; if (n) { load(n.id); ready(); } else goHome(); },
  home() { run = null; wake?.release?.(); goHome(); },
  pickDiff(d) { save = { ...save, diff: d }; keep(); run = null; goHome(); },
  skipRest() { if (skipRest(run, save)) { keep(); ready(); } },
  openSettings() { ui.show('settings', { opt: save.opt }); },
  closeSettings() { ui.closeSettings(); if (mode === 'home') goHome(); },
  setOpt(k, v) { save.opt = { ...save.opt, [k]: v }; keep(); if (k === 'dark') theme(); if (k === 'music') music.setOn(v); },
  zero() { tilt.calibrate(); ui.toast(T.zeroDone); },
  openShop() { mode = 'shop'; ui.show('shop', { save }); },
  closeShop() { goHome(); },
  setLook(patch) { save = { ...save, look: { ...save.look, ...patch } }; keep(); view.setLook(save.look); ui.show('shop', { save }); },
  buyOrUse(kind, id, slot) {   // a thing owned is put on; one not owned is bought first, if the coins are there
    const patch = kind === 'patterns' ? { mode: 'pattern', pattern: id } : { [slot]: id }, put = () => (kind === 'themes' ? this.setTheme(id) : this.setLook(patch));
    if (save.owned[kind].includes(id)) return put();
    const item = ({ colors: COLORS, patterns: PATTERNS, themes: THEMES })[kind].find(x => x.id === id);
    if (save.coins < item.price) return ui.toast(T.needCoins(item.price - save.coins));
    ui.ask(T.askBuy(kind, item.name, item.price), kind === 'themes' ? null : { ...save.look, ...patch }, () => {
      save = buy(save, kind, id).save; ui.toast(T.bought(item.name)); sound.ding(); put();
    });
  },
  setTheme(id) { save = { ...save, theme: id }; keep(); applyTheme(); ui.show('shop', { save });
  },
  buyBoost() {
    const price = BOOST_PRICES[save.boost];
    if (price == null) return;
    if (save.coins < price) return ui.toast(T.needCoins(price - save.coins));
    ui.ask(T.askBuy('boost', '', price), null, () => { save = buyBoost(save).save; keep(); sound.win(); ui.show('shop', { save }); });
  },
  useSlot(i) { wear(i); },
  pickElement(el) { setSlots(run, toggleElement(run.slots, el)); ready(); },
});

function showRest() { mode = 'rest'; ui.show('rest', { left: run.restLeft, canSkip: save.coins >= SKIP_COST }); }
let clearOut = null;

addEventListener('visibilitychange', () => {   // away from the game: stop the clock where it is
  sound.hush(document.hidden);
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
      else if (e.type === 'coin') { sound.ding(); if (run.level.lock && run.state.got.size === run.level.coins.length) { sound.win(); ui.toast(T.lockOpen); } }
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
  for (const d of ['hard', 'hell', 'god']) if (tok.has(d)) save.diff = d;
  for (const t of ['paper', 'toon']) if (tok.has(t)) { save.theme = t; applyTheme(); }
  if (shot[1] === 'shop') { save.coins = 128; save.owned.colors.push('sky', 'grape'); mode = 'shop'; ui.show('shop', { save }); save.found = ['steam']; for (const t of ['draw', 'theme', 'boost', 'book']) if (tok.has(t)) document.querySelector(`[data-tab="${t}"]`).click(); if (tok.has('ask')) document.querySelector('[data-pattern="stars"]').click(); }
  else if (shot[1] === 'home') {
    save.coins = 128; save.prog.easy = { reached: 'w1-10', best: Object.fromEntries(levelsFor('easy').map((l, i) => [l.id, { stars: 1 + i % 3, time: 20 }])) };
    goHome();
  } else {
    load(shot[1]);
    if (s === 'ready') ready();
    else { startRun(run); mode = 'play'; ui.show('play', { level: run.level }); run.left *= 0.7; run.coins = 2; if (tok.has('coat')) { useSlot(run, run.slots[1] ? 1 : 0); run.coat.left = 3.2; }
      const el = ['water', 'fire', 'ice', 'spark', 'stone', 'gas'].find(e => tok.has(e)); if (el) { run.slots = [el, null]; run.cool = [0, 0]; useSlot(run, 0); run.coat.left = 3.2; }
      const f = Object.keys(FUSIONS).find(e => tok.has(e)); if (f) { run.slots = [...FUSIONS[f].of]; run.cool = [0, 0]; useSlot(run, 0); useSlot(run, 1); run.coat.left = 3.2; run.coat.kick = false; run.state.snow = 60; }
      if (tok.has('glow')) { run.slots = ['water', 'fire']; run.cool = [0, 0]; useSlot(run, 0); }   // the slot that would fuse glows
      ui.hud(run); }
    if (s === 'pause') ui.show('pause');
    if (s === 'clear') { clearOut = { stars: 2, reward: 17, next: levelById('w1-4') }; ui.show('clear', clearOut); }
    if (s === 'fail') ui.show('fail', { reason: run.level.gaps?.length ? 'fall' : run.level.enemies?.length ? 'caught' : run.level.deep?.length ? 'drown' : run.level.lava?.length ? 'lava' : run.level.fires ? 'fire' : tok.has('normal') ? 'trap' : 'timeout' });
    if (s === 'rest') { run.phase = 'rest'; run.restLeft = 24; ui.show('rest', { left: 24, canSkip: true }); }
    if (s === 'settings') ui.show('settings', { opt: save.opt });
    if (s !== 'play' && s !== 'ready') mode = 'shot';
  }
} else goHome();
if (new URLSearchParams(location.search).has('test')) window.__tm = { get run() { return run; } };   // read-only peek for tools/smoke.mjs
view.setLook(save.look); applyTheme(); theme();
requestAnimationFrame(frame);
