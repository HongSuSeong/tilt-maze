// What a player keeps between visits, in the phone's browser: coins, settings, and for each difficulty the best
// result of every stage and how far they have come. Anything unreadable, from an unknown version, or a storage that
// refuses (private browsing) starts fresh and the game plays on without saving. A version 1 save becomes easy.
import { nextLevel } from './levels/index.js';
import { levelsFor, BUILT, DIFFS } from './difficulty.js';

const KEY = 'tilt-maze:v1', V = 2;
const startOf = diff => levelsFor(diff)[0]?.id ?? null;
const progFresh = () => Object.fromEntries(BUILT.map(d => [d, { best: {}, reached: startOf(d) }]));

// the ball's look, what has been bought, and how far elements are boosted: added after version 2 began, so a save
// without them takes these
const extras = () => ({
  look: { mode: 'pattern', pattern: 'dots', base: 'coral', accent: 'cream', pixels: Array(128).fill(null) },
  owned: { patterns: ['dots', 'stripes'], colors: ['coral', 'mint', 'cream'], themes: ['toy'] }, boost: 0, theme: 'toy', picks: {}, found: [],   // picks: the elements last worn on each stage; found: the fusions in the book
});
export const defaultSave = () => ({ v: V, coins: 0, diff: 'easy', prog: progFresh(), opened: ['easy'], opt: { sens: 1, snd: true, vib: true, dark: false }, ...extras() });

// Saves from before `opened` was kept were made when the fields were the only world: open what they had opened then.
const openedThen = s => ['easy', ...(levelsFor('easy').filter(l => l.world === 1).every(l => s.prog.easy.best[l.id]) ? ['normal'] : [])];

function migrate(s) {
  if (s?.v === V) { const x = extras(), m = { ...x, ...s, owned: { ...x.owned, ...s.owned }, prog: { ...progFresh(), ...s.prog } }; return m.opened ? m : { ...m, opened: openedThen(m) }; }   // a difficulty added later starts empty
  if (s?.v === 1) {
    const d = defaultSave(), m = { ...d, coins: s.coins ?? 0, opt: { ...d.opt, ...s.opt }, prog: { ...d.prog, easy: { best: s.best || {}, reached: s.reached || 't1' } } };
    return { ...m, opened: openedThen(m) };
  }
  return defaultSave();
}

export function loadSave(storage = globalThis.localStorage) {
  try { return migrate(JSON.parse(storage.getItem(KEY))); } catch { return defaultSave(); }
}

export function writeSave(s, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}

const order = (diff, id) => levelsFor(diff).findIndex(l => l.id === id);

// A stage cleared: the better stars and the quicker time are kept, the coins added, and the next stage opened.
export function recordClear(s, diff, id, stars, time, coins) {
  const p = s.prog[diff], was = p.best[id], best = was ? { stars: Math.max(was.stars, stars), time: Math.min(was.time, time) } : { stars, time };
  const next = nextLevel(id, diff), reached = next && order(diff, next.id) > order(diff, p.reached) ? next.id : p.reached;
  return { ...s, coins: s.coins + coins, prog: { ...s.prog, [diff]: { best: { ...p.best, [id]: best }, reached } } };
}

// A fusion made for the first time goes in the book, with coins for finding it.
export const FIND_REWARD = 10;
export function discover(s, id) {
  if (s.found.includes(id)) return { save: s, isNew: false };
  return { save: { ...s, found: [...s.found, id], coins: s.coins + FIND_REWARD }, isNew: true };
}

// Easy is always open; each next one opens when every stage of the one before (practice aside) is cleared, and once
// open it stays open however many stages are added later.
export function isOpen(s, diff) {
  const i = DIFFS.findIndex(d => d.id === diff);
  if (i === 0 || s.opened?.includes(diff)) return true;
  if (!BUILT.includes(diff)) return false;
  const before = DIFFS[i - 1].id;
  return levelsFor(before).filter(l => l.world > 0).every(l => s.prog[before]?.best[l.id]);
}

export const markOpened = s => ({ ...s, opened: DIFFS.map(d => d.id).filter(d => isOpen(s, d)) });

// The stage to go on from: past every stage already cleared, so a world added later opens after the last one done.
export function reachedOf(s, diff) {
  const p = s.prog[diff]; let id = p.reached, n;
  while (p.best[id] && (n = nextLevel(id, diff))) id = n.id;
  return id;
}
