// What a player keeps between visits, in the phone's browser. Anything unreadable, from another version, or a
// storage that refuses (private browsing) starts fresh and the game plays on without saving.
import { LEVELS, nextLevel } from './levels/index.js';

const KEY = 'tilt-maze:v1', V = 1;

export const defaultSave = () => ({ v: V, coins: 0, best: {}, reached: 't1', opt: { sens: 1, snd: true, vib: true, dark: false } });

export function loadSave(storage = globalThis.localStorage) {
  try {
    const s = JSON.parse(storage.getItem(KEY));
    return s && s.v === V ? s : defaultSave();
  } catch { return defaultSave(); }
}

export function writeSave(s, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}

const order = id => LEVELS.findIndex(l => l.id === id);

// A stage cleared: the better stars and the quicker time are kept, the coins added, and the next stage opened.
export function recordClear(s, id, stars, time, coins) {
  const was = s.best[id], best = was ? { stars: Math.max(was.stars, stars), time: Math.min(was.time, time) } : { stars, time };
  const next = nextLevel(id), reached = next && order(next.id) > order(s.reached) ? next.id : s.reached;
  return { ...s, coins: s.coins + coins, best: { ...s.best, [id]: best }, reached };
}
