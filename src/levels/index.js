// Every stage in the order they are played.
import { TUTORIAL } from './tutorial.js';
import { WORLD1 } from './world1.js';
import { WORLD2 } from './world2.js';
import { levelsFor } from '../difficulty.js';

export const LEVELS = [...TUTORIAL, ...WORLD1, ...WORLD2];
export const levelById = id => LEVELS.find(l => l.id === id) || null;
export function nextLevel(id, diff = 'easy') { const ls = levelsFor(diff), i = ls.findIndex(l => l.id === id); return i >= 0 && i + 1 < ls.length ? ls[i + 1] : null; }
