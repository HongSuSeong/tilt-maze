// Everything on screen but the board: the bars while playing, the cards between goes, the home screen, settings.
// It shows what it is told and hands every tap to the handlers; it keeps no game state of its own.
import { T } from './text.js';
import { DIFFS, BUILT, levelsFor } from './difficulty.js';
import { isOpen, reachedOf } from './save.js';
import { ELEMENTS, ownedFor } from './elements.js';
import { COLORS, PATTERNS, THEMES, BOOST_PRICES, paintPalette, nextPaintAt, clears } from './shop.js';
import { drawBall, drawPreview, DOT_W, DOT_H } from './look.js';

const STAR = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="${on ? 'var(--star)' : 'var(--star-off)'}" stroke="${on ? '#E9A91A' : 'none'}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const PAUSE = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>';
const LOCK = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="margin-right:4px;vertical-align:-1px"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
const DROP = c => `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="${c}" stroke="#2F7FB8" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const FLAME = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1 2.6 2 3-.5-2.8.2-5.6.5-8z" fill="#FFB36B" stroke="#E2552E" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const FLAKE = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#3E9EDB" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/></svg>';
const BOLT = '<svg width="26" height="26" viewBox="0 0 24 30" aria-hidden="true"><path d="M14 1 3 17h8l-2 12 12-17h-8z" fill="#FFE35C" stroke="#3B4778" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const ROCK = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l3-8 6-3 6 4 1 8-6 3H8z" fill="#C9BEB3" stroke="#6E655C" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 10l3 3 5-2" fill="none" stroke="#6E655C" stroke-width="1.2"/></svg>';
const CLOUD = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 18z" fill="#DDF5C4" stroke="#6AA84F" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const ICON = { water: DROP('#BFE7FF'), fire: FLAME, ice: FLAKE, spark: BOLT, stone: ROCK, gas: CLOUD };
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
      <button class="slot" id="slot0"></button>
      <button class="slot" id="slot1"></button>
      <span class="note" id="slotNote"></span>
      <button class="round go" id="pauseBtn" aria-label="${T.pause}">${PAUSE}</button>
    </div>
    <div class="scrim" id="scrim" hidden><div class="card" id="card"></div></div>
    <div class="home" id="home" hidden></div>
    <div class="home" id="shop" hidden></div>
    <div class="scrim ask" id="ask" hidden><div class="card" id="askCard" role="dialog" aria-modal="true"></div></div>
    <div class="sheet" id="sheet" hidden></div>
    <div class="toast" id="toast" hidden></div>`);
  const $ = id => root.querySelector('#' + id);
  $('pauseBtn').addEventListener('click', h.pause);
  for (const i of [0, 1]) $('slot' + i).addEventListener('pointerdown', e => { e.preventDefault(); h.useSlot(i); });   // on touch, not release: it is a reflex
  let toastT = 0;

  function card(html, see = true) {   // see: the board stays clear behind the card
    $('card').innerHTML = html; $('card').classList.remove('compact'); $('scrim').classList.toggle('clear-bg', see); $('scrim').hidden = false;
    for (const b of $('card').querySelectorAll('[data-do]')) b.addEventListener('click', () => h[b.dataset.do]());
  }
  const bars = on => { $('hud').hidden = $('dock').hidden = !on; };
  let diffName = '';
  const label = l => { $('hudWorld').textContent = T.worlds[l.world] + (diffName ? ` · ${diffName}` : ''); $('hudStage').textContent = T.stage(l); };

  function home({ save, notice, unlock }) {
    const diff = save.diff, ls = levelsFor(diff), p = save.prog[diff], at = Math.max(0, ls.findIndex(l => l.id === reachedOf(save, diff)));
    diffName = DIFFS.find(d => d.id === diff).name;
    const chip = d => {
      const open = unlock ? BUILT.includes(d.id) : isOpen(save, d.id);
      return `<button class="chip" data-diff="${d.id}" aria-pressed="${d.id === diff}" ${open ? '' : 'data-locked="1"'} aria-label="${d.name}${open ? '' : ', ' + T.locked}">${open ? '' : LOCK}${d.name}</button>`;
    };
    const cell = (l, i) => {
      const best = p.best[l.id], open = unlock || i <= at;
      return `<button data-id="${l.id}" ${open ? '' : 'disabled'} aria-label="${esc(l.name)}${open ? '' : ', ' + T.locked}">${l.index}<small class="${best ? '' : 'none'}">${'★'.repeat(best?.stars || 0)}${'☆'.repeat(3 - (best?.stars || 0))}</small></button>`;
    };
    const worlds = [...new Set(ls.map(l => l.world))];
    const group = w => `<section><h3>${T.worlds[w]}</h3><div class="grid">${ls.map((l, i) => [l, i]).filter(([l]) => l.world === w).map(([l, i]) => cell(l, i)).join('')}</div></section>`;
    $('home').innerHTML = `<div class="inner">
      <header><h1>${T.title}</h1><span class="purse"><span class="coin"></span>${save.coins}</span></header>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}${unlock ? `<p class="notice">${T.unlockNote}</p>` : ''}
      <div class="chips" role="group" aria-label="${T.diffPick}">${DIFFS.map(chip).join('')}</div>
      <button class="go" data-id="${ls[at].id}">${T.continue} · ${esc(ls[at].name)}</button>
      <div class="row2 halves"><button data-do="openShop">${T.dress}</button><button data-do="openSettings">${T.settings}</button></div>
      ${worlds.map(group).join('')}
    </div>`;
    for (const b of $('home').querySelectorAll('[data-id]')) b.addEventListener('click', () => h.play(b.dataset.id));
    for (const b of $('home').querySelectorAll('[data-diff]')) b.addEventListener('click', () => {
      if (b.dataset.locked) return toastFn(BUILT.includes(b.dataset.diff) ? T.diffLocked : T.diffSoon);
      h.pickDiff(b.dataset.diff);
    });
    for (const b of $('home').querySelectorAll('[data-do]')) b.addEventListener('click', () => h[b.dataset.do]());
    $('home').hidden = false;
  }

  function show(screen, d = {}) {
    if (screen !== 'settings') { $('scrim').hidden = true; $('home').hidden = true; $('shop').hidden = true; $('hint').hidden = true; stopSpin(); }
    switch (screen) {
      case 'home': bars(false); home(d); break;
      case 'ready':
        bars(true); label(d.level);
        // small, so the board stays in view while the elements are chosen: a name, a line of advice, then the slots beside Start
        card(`<h2>${esc(d.level.name)}</h2><p>${esc(d.level.hint || (d.level.lock ? T.lockHint : d.level.traps?.some(t => t.to) ? T.moveHint : T.readyHold))}</p>
          <div class="go-row">${equip(d.level, d.slots)}<button class="go" data-do="start">${T.start}</button></div>`);
        $('card').classList.add('compact');
        for (const b of root.querySelectorAll('[data-slot]')) b.addEventListener('click', () => h.cycleSlot(+b.dataset.slot));
        slots(d.slots, null, [0, 0]);
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
      case 'shop': bars(false); shop(d.save); break;
    }
  }

  // the two slots on the ready card: tap one to change what goes in it
  function equip(level, chosen) {
    if (!ownedFor(level.world).length) return '';
    return `<div class="equip" aria-label="${T.equip}">${chosen.map((el, i) => el
      ? `<button data-slot="${i}" aria-label="칸 ${i + 1}: ${ELEMENTS[el].name}">${ICON[el]}${ELEMENTS[el].name}</button>`
      : `<button data-slot="${i}" class="empty" aria-label="칸 ${i + 1}: ${T.none}">${T.none}</button>`).join('')}</div>`;
  }
  // the slots in the dock: what each holds, how long the coat has left, how long until it can be used again
  function slots(chosen, coat, cool) {
    chosen.forEach((el, i) => {
      const b = $('slot' + i), E = el && ELEMENTS[el];
      b.disabled = !el; b.classList.toggle('has', !!el); b.style.setProperty('--el', E?.color || '');
      b.setAttribute('aria-label', el ? `칸 ${i + 1}: ${E.name}` : `칸 ${i + 1}: ${T.none}`);
      const wearing = coat && coat.el === el && cool[i] > E?.cool, wait = !wearing && cool[i] > 0;
      const html = el ? `<span class="fill" style="height:${wearing ? Math.min(1, coat.left / E.dur) * 100 : 0}%"></span><span class="ico">${ICON[el]}${E.name}</span>${wait ? `<span class="wait">${Math.ceil(cool[i])}</span>` : ''}` : '';
      if (b.dataset.html !== html) { b.innerHTML = html; b.dataset.html = html; }
    });
    const any = chosen.some(Boolean); $('slotNote').textContent = any ? T.slotUse : T.slotEmpty;
  }

  // the dress-up page: a turning ball on top, then the ball's pattern and colours, the dot drawing, or the boost
  let tab = 'ball', spinRaf = 0, paint = 'ink', draft = null;
  const skin = document.createElement('canvas'); skin.width = 256; skin.height = 128;
  function stopSpin() { cancelAnimationFrame(spinRaf); spinRaf = 0; }
  function spinPreview(look) {
    stopSpin(); drawBall(skin, look); const c = root.querySelector('#preview'); if (!c) return;
    const t0 = performance.now(), go = now => { drawPreview(c, skin, (now - t0) / 1400); spinRaf = requestAnimationFrame(go); }; spinRaf = requestAnimationFrame(go);
  }
  let shown = null;
  function shop(save) {
    shown = save;
    const look = save.look, hexOf = id => COLORS.find(x => x.id === id).hex; draft ??= [...look.pixels];   // an empty cell shows the ball's own colour
    const owned = (k, id) => save.owned[k].includes(id), price = p => `<small class="price"><span class="coin"></span>${p}</small>`;
    const swatches = slot => COLORS.map(c => `<button class="sw" data-color="${c.id}" data-slot="${slot}" aria-pressed="${look[slot] === c.id}" aria-label="${c.name}${owned('colors', c.id) ? '' : `, ${c.price} 코인`}" style="--sw:${c.hex}">${owned('colors', c.id) ? '' : price(c.price)}</button>`).join('');
    const pal = paintPalette(save), next = nextPaintAt(save);
    const body = {
      ball: `<div class="row2 seg"><button data-mode="pattern" aria-pressed="${look.mode === 'pattern'}">${T.modePattern}</button><button data-mode="pixels" aria-pressed="${look.mode === 'pixels'}">${T.modePixels}</button></div>
        <h3>${T.pattern}</h3><div class="pick">${PATTERNS.map(p => `<button data-pattern="${p.id}" aria-pressed="${look.mode === 'pattern' && look.pattern === p.id}">${p.name}${owned('patterns', p.id) ? '' : price(p.price)}</button>`).join('')}</div>
        <h3>${T.base}</h3><div class="sws">${swatches('base')}</div><h3>${T.accent}</h3><div class="sws">${swatches('accent')}</div>`,
      draw: `<div class="dots" id="dots" style="--dw:${DOT_W}">${draft.map((c, i) => `<i data-i="${i}" style="background:${hexOf(c || look.base)}"></i>`).join('')}</div>
        <div class="sws paint">${pal.map(c => `<button class="sw" data-paint="${c.id}" aria-pressed="${paint === c.id}" aria-label="${c.name}" style="--sw:${c.hex}"></button>`).join('')}<button class="sw eraser" data-paint="" aria-pressed="${paint === ''}" aria-label="${T.eraser}">✕</button></div>
        <p class="note">${next ? T.paintMore(next - clears(save)) : T.paintAll}</p>
        <div class="row2"><button id="clearDots">${T.clearAll}</button><button class="go" id="wearDots">${look.mode === 'pixels' && draft.every((c, i) => c === look.pixels[i]) ? T.wearing : T.wear}</button></div>`,
      theme: `<div class="themes">${THEMES.map(t => `<button data-theme="${t.id}" aria-pressed="${save.theme === t.id}"><span class="look ${t.id}" aria-hidden="true"><i></i><i></i><i></i></span><b>${t.name}</b>${save.owned.themes.includes(t.id) ? `<small>${save.theme === t.id ? T.themeOn : T.themeUse}</small>` : price(t.price)}</button>`).join('')}</div>`,
      boost: `<div class="card flat"><h2>${T.boostName}</h2><p>${T.boostNow(save.boost)}</p>
        ${save.boost < BOOST_PRICES.length ? `<button class="go" id="buyBoost"><span class="coin"></span> ${T.boostNext(save.boost, BOOST_PRICES[save.boost])}</button>` : `<p>${T.boostMax}</p>`}</div>`,
    }[tab];
    $('shop').innerHTML = `<div class="inner">
      <header><button data-do="closeShop">← ${T.back}</button><span class="purse"><span class="coin"></span>${save.coins}</span></header>
      <canvas id="preview" class="preview" width="132" height="132" aria-hidden="true"></canvas>
      <div class="chips tabs" role="tablist">${[['ball', T.tabBall], ['draw', T.tabDraw], ['theme', T.tabTheme], ['boost', T.tabBoost]].map(([k, n]) => `<button role="tab" data-tab="${k}" aria-pressed="${tab === k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      <section>${body}</section></div>`;
    const S = $('shop'), on = (sel, f) => { for (const b of S.querySelectorAll(sel)) b.addEventListener('click', () => f(b)); };
    on('[data-do]', b => h[b.dataset.do]());
    on('[data-tab]', b => { tab = b.dataset.tab; shop(save); });
    on('[data-mode]', b => h.setLook({ mode: b.dataset.mode }));
    on('[data-pattern]', b => h.buyOrUse('patterns', b.dataset.pattern));
    on('[data-color]', b => h.buyOrUse('colors', b.dataset.color, b.dataset.slot));
    on('[data-paint]', b => { paint = b.dataset.paint; shop(save); });
    on('#clearDots', () => { draft = Array(DOT_W * DOT_H).fill(null); shop(save); });
    on('#wearDots', () => h.setLook({ mode: 'pixels', pixels: [...draft] }));
    on('#buyBoost', () => h.buyBoost());
    on('[data-theme]', b => h.buyOrUse('themes', b.dataset.theme));
    const dots = S.querySelector('#dots');
    if (dots) {   // paint by touching and dragging over the cells
      let down = false;
      const at = e => { const el = document.elementFromPoint(e.clientX, e.clientY); if (el?.parentNode !== dots) return; const i = +el.dataset.i; draft[i] = paint || null; el.style.background = hexOf(paint || look.base); drawBall(skin, { ...look, mode: 'pixels', pixels: draft }); };
      dots.addEventListener('pointerdown', e => { down = true; dots.setPointerCapture(e.pointerId); at(e); });
      dots.addEventListener('pointermove', e => { if (down) at(e); });
      dots.addEventListener('pointerup', () => { down = false; });
    }
    $('shop').hidden = false;
    spinPreview(tab === 'draw' ? { ...look, mode: 'pixels', pixels: draft } : look);
  }

  // a purchase asks first; meanwhile the turning ball wears what is being bought
  function ask(text, tryLook, yes) {
    $('askCard').innerHTML = `<h2>${esc(text)}</h2><div class="row"><button id="askNo">${T.cancel}</button><button class="go" id="askYes">${T.buy}</button></div>`;
    $('ask').hidden = false; if (tryLook) spinPreview(tryLook);
    const done = ok => { $('ask').hidden = true; if (ok) yes(); else if (shown) shop(shown); };
    $('askCard').querySelector('#askNo').addEventListener('click', () => done(false));
    $('askCard').querySelector('#askYes').addEventListener('click', () => done(true));
    $('askCard').querySelector('#askYes').focus();
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
    ask,
    closeSettings() { $('sheet').hidden = true; },
    hud(run) {
      const s = Math.max(0, Math.ceil(run.left)), k = run.left / run.level.time;
      $('hudTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      $('hudBar').style.width = `${Math.max(0, k) * 100}%`; $('hudTrack').classList.toggle('low', k < 0.25);
      $('hudCoins').textContent = run.level.lock ? `${run.state.got.size}/${run.level.coins.length}` : run.coins;   // god: how many of the coins the hole waits for
      slots(run.slots, run.coat, run.cool);
    },
    toast(text) { toastFn(text); },
  };
  function toastFn(text) {
      const el = $('toast'); el.textContent = text; el.hidden = false; el.style.opacity = 1;
      clearTimeout(toastT); toastT = setTimeout(() => { el.style.opacity = 0; setTimeout(() => { el.hidden = true; }, 260); }, 1400);
  }
}
