// The same stages, harder: easy is each stage as made; normal gives it three quarters of the time, walls one unit
// thicker on every side (narrower ways), and the trap holes placed for it. Hard comes with maps of its own (levels/generate.js).
import { FEEL } from './feel.js';
import { LEVELS } from './levels/index.js';
import { hardLevels } from './levels/generate.js';

export const DIFFS = [
  { id: 'easy', name: '쉬움' }, { id: 'normal', name: '보통' }, { id: 'hard', name: '어려움' }, { id: 'hell', name: '지옥' }, { id: 'god', name: '신' },
];
export const BUILT = ['easy', 'normal', 'hard'];

const { BW, BH, RIM } = FEEL;
function thicker(w) {
  const x0 = Math.max(RIM, w.x - 1), y0 = Math.max(RIM, w.y - 1), x1 = Math.min(BW - RIM, w.x + w.w + 1), y1 = Math.min(BH - RIM, w.y + w.h + 1);
  return { ...w, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function applyDifficulty(level, diff) {
  if (diff !== 'normal') return level;
  return {
    ...level, time: Math.round(level.time * 0.75), walls: level.walls.map(thicker), traps: level.normal?.traps || [], ...(level.normal?.coins && { coins: level.normal.coins }),
    ...(level.enemies && { enemies: level.enemies.map(e => ({ ...e, speed: (e.speed ?? 28) * 1.25 })) }),   // and the enemies a quarter faster
  };
}

// the stages of a difficulty in playing order: practice belongs to easy only
export const levelsFor = diff => (diff === 'hard' ? hardLevels() : LEVELS.filter(l => diff === 'easy' || l.world > 0).map(l => applyDifficulty(l, diff)));   // hard has maps of its own
