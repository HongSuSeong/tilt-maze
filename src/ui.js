// Everything on screen but the board: the bars while playing, the cards between goes, the home screen, settings.
// It shows what it is told and hands every tap to the handlers; it keeps no game state of its own.
import { T } from './text.js';
import { DIFFS, levelsFor } from './difficulty.js';
import { isOpen } from './save.js';

const STAR = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="${on ? 'var(--star)' : 'var(--star-off)'}" stroke="${on ? '#E9A91A' : 'none'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const PAUSE = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>';
const LOCK = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="margin-right:4px;vertical-align:-1px"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createUI(root, h) {
  root.insertAdjacentHTML('beforeend', `
    <div class="hud" id="hud" hidden>
      <div class="pill"><small id="hudWorld"></small><b id="hudStage"></b></div>
      <div class="pill time"><div class="row"><small>${T.left}</small><b id="hudTime"></b></div><div class="track" id="hudTrack"><i id="hudBar"></i></div></div>
      <div class="pill coins"><span class="coin"></span><span id="hudCoins">0</span></div>
    </div>
    <div class="hint" id="hint" hidden></div>
    <div class="dock" id="dock" hidden>
      <button class="slot" disabled aria-label="원소 칸 1, ${T.slotEmpty}"></button>
      <button class="slot" disabled aria-label="원소 칸 2, ${T.slotEmpty}"></button>
      <span class="note">${T.slotEmpty}</span>
      <button class="round go" id="pauseBtn" aria-label="${T.pause}">${PAUSE}</button>
    </div>
    <div class="scrim" id="scrim" hidden><div class="card" id="card"></div></div>
    <div class="home" id="home" hidden></div>
    <div class="sheet" id="sheet" hidden></div>
    <div class="toast" id="toast" hidden></div>`);
  const $ = id => root.querySelector('#' + id);
  $('pauseBtn').addEventListener('click', h.pause);
  let toastT = 0;

  function card(html, see = true) {   // see: the board stays clear behind the card
    $('card').innerHTML = html; $('scrim').classList.toggle('clear-bg', see); $('scrim').hidden = false;
    for (const b of $('card').querySelectorAll('[data-do]')) b.addEventListener('click', () => h[b.dataset.do]());
  }
  const bars = on => { $('hud').hidden = $('dock').hidden = !on; };
  let diffName = '';
  const label = l => { $('hudWorld').textContent = T.worlds[l.world] + (diffName ? ` · ${diffName}` : ''); $('hudStage').textContent = T.stage(l); };

  function home({ save, notice }) {
    const diff = save.diff, ls = levelsFor(diff), p = save.prog[diff], at = Math.max(0, ls.findIndex(l => l.id === p.reached));
    diffName = DIFFS.find(d => d.id === diff).name;
    const chip = d => {
      const open = isOpen(save, d.id);
      return `<button class="chip" data-diff="${d.id}" aria-pressed="${d.id === diff}" ${open ? '' : 'data-locked="1"'} aria-label="${d.name}${open ? '' : ', ' + T.locked}">${open ? '' : LOCK}${d.name}</button>`;
    };
    const cell = (l, i) => {
      const best = p.best[l.id], open = i <= at;
      return `<button data-id="${l.id}" ${open ? '' : 'disabled'} aria-label="${esc(l.name)}${open ? '' : ', ' + T.locked}">${l.index}<small class="${best ? '' : 'none'}">${'★'.repeat(best?.stars || 0)}${'☆'.repeat(3 - (best?.stars || 0))}</small></button>`;
    };
    const worlds = [...new Set(ls.map(l => l.world))];
    const group = w => `<section><h3>${T.worlds[w]}</h3><div class="grid">${ls.map((l, i) => [l, i]).filter(([l]) => l.world === w).map(([l, i]) => cell(l, i)).join('')}</div></section>`;
    $('home').innerHTML = `<div class="inner">
      <header><h1>${T.title}</h1><span class="purse"><span class="coin"></span>${save.coins}</span></header>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
      <div class="chips" role="group" aria-label="${T.diffPick}">${DIFFS.map(chip).join('')}</div>
      <div class="row2"><button class="go" data-id="${ls[at].id}">${T.continue} · ${esc(ls[at].name)}</button><button data-do="openSettings">${T.settings}</button></div>
      ${worlds.map(group).join('')}
    </div>`;
    for (const b of $('home').querySelectorAll('[data-id]')) b.addEventListener('click', () => h.play(b.dataset.id));
    for (const b of $('home').querySelectorAll('[data-diff]')) b.addEventListener('click', () => {
      if (b.dataset.locked) return toastFn(['easy', 'normal'].includes(b.dataset.diff) ? T.diffLocked : T.diffSoon);
      h.pickDiff(b.dataset.diff);
    });
    $('home').querySelector('[data-do]').addEventListener('click', h.openSettings);
    $('home').hidden = false;
  }

  function show(screen, d = {}) {
    if (screen !== 'settings') { $('scrim').hidden = true; $('home').hidden = true; $('hint').hidden = true; }
    switch (screen) {
      case 'home': bars(false); home(d); break;
      case 'ready':
        bars(true); label(d.level);
        card(`<h2>${esc(d.level.name)}</h2>${d.level.hint ? `<p>${esc(d.level.hint)}</p>` : ''}<p>${T.readyHold}</p><button class="go" data-do="start">${T.start}</button>`);
        break;
      case 'play':
        bars(true); label(d.level); if (d.level.hint) { $('hint').textContent = d.level.hint; $('hint').hidden = false; }
        break;
      case 'pause':
        card(`<h2>${T.pause}</h2><button class="go" data-do="resume">${T.resume}</button><div class="row"><button data-do="retry">${T.retry}</button><button data-do="openSettings">${T.settings}</button></div><button data-do="home">${T.home}</button>`, false);
        break;
      case 'clear':
        card(`<h2>${T.clear}</h2><div class="stars">${[1, 2, 3].map(n => STAR(n <= d.stars)).join('')}</div><p class="big"><span class="coin"></span> ${T.reward(d.reward)}</p>
          ${d.next ? `<button class="go" data-do="next">${T.next}</button>` : `<p>${T.lastDone}</p><button class="go" data-do="home">${T.home}</button>`}`);
        break;
      case 'fail':
        card(`<h2>${esc(T.fail[d.reason] || d.reason)}</h2><button class="go" data-do="retry">${T.retry}</button><button data-do="home">${T.home}</button>`, false);
        break;
      case 'rest':
        bars(true);
        card(`<h2>${T.rest}</h2><p>${T.restWhy}</p><p class="big" id="restLeft"></p><p>${T.restLater}</p><button class="go" data-do="skipRest" id="skipBtn"><span class="coin"></span> ${T.restSkip}</button><button data-do="home">${T.home}</button>`, false);
        rest(d.left, d.canSkip);
        break;
      case 'settings': settings(d.opt); break;
    }
  }

  function rest(left, canSkip) {
    const el = root.querySelector('#restLeft'); if (!el) return;
    el.textContent = T.restLeft(Math.ceil(left)); root.querySelector('#skipBtn').disabled = !canSkip;
  }

  function settings(opt) {
    const tg = (k, f) => `<button data-opt="${k}" aria-pressed="${opt[k]}">${f(opt[k])}</button>`;
    $('sheet').innerHTML = `<h2>${T.settings}</h2>
      <div class="field"><div class="row"><label for="sens">${T.sens}</label><output id="sensV">${Math.round(opt.sens * 100)}%</output></div>
        <input id="sens" type="range" min="0.5" max="1.5" step="0.05" value="${opt.sens}"><p>${T.sensNote}</p></div>
      <div class="toggles">${tg('snd', T.sound)}${tg('vib', T.vib)}${tg('dark', T.dark)}</div>
      <div class="row" style="display:flex;gap:10px"><button id="zeroBtn" style="flex:1">${T.zero}</button><button class="go" id="closeBtn" style="flex:1">${T.close}</button></div>`;
    $('sheet').querySelector('#sens').addEventListener('input', e => { h.setOpt('sens', +e.target.value); $('sheet').querySelector('#sensV').textContent = `${Math.round(e.target.value * 100)}%`; });
    for (const b of $('sheet').querySelectorAll('[data-opt]')) b.addEventListener('click', () => {
      const k = b.dataset.opt, on = b.getAttribute('aria-pressed') !== 'true';
      h.setOpt(k, on); b.setAttribute('aria-pressed', String(on)); b.textContent = { snd: T.sound, vib: T.vib, dark: T.dark }[k](on);
    });
    $('sheet').querySelector('#zeroBtn').addEventListener('click', h.zero);
    $('sheet').querySelector('#closeBtn').addEventListener('click', h.closeSettings);
    $('sheet').hidden = false;
  }

  return {
    show,
    rest,
    closeSettings() { $('sheet').hidden = true; },
    hud(run) {
      const s = Math.max(0, Math.ceil(run.left)), k = run.left / run.level.time;
      $('hudTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      $('hudBar').style.width = `${Math.max(0, k) * 100}%`; $('hudTrack').classList.toggle('low', k < 0.25);
      $('hudCoins').textContent = run.coins;
    },
    toast(text) { toastFn(text); },
  };
  function toastFn(text) {
      const el = $('toast'); el.textContent = text; el.hidden = false; el.style.opacity = 1;
      clearTimeout(toastT); toastT = setTimeout(() => { el.style.opacity = 0; setTimeout(() => { el.hidden = true; }, 260); }, 1400);
  }
}
