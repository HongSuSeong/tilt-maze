// Every stage in the order they are played.
import { TUTORIAL } from './tutorial.js';
import { WORLD1 } from './world1.js';
import { WORLD2 } from './world2.js';
import { WORLD3 } from './world3.js';
import { WORLD4 } from './world4.js';
import { WORLD5 } from './world5.js';
import { WORLD6 } from './world6.js';
import { WORLD7 } from './world7.js';
import { WORLD8 } from './world8.js';
import { WORLD9 } from './world9.js';
import { WORLD10 } from './world10.js';
import { levelsFor } from '../difficulty.js';

export const LEVELS = [...TUTORIAL, ...WORLD1, ...WORLD2, ...WORLD3, ...WORLD4, ...WORLD5, ...WORLD6, ...WORLD7, ...WORLD8, ...WORLD9, ...WORLD10];
export const levelById = id => LEVELS.find(l => l.id === id) || null;
export function nextLevel(id, diff = 'easy') { const ls = levelsFor(diff), i = ls.findIndex(l => l.id === id); return i >= 0 && i + 1 < ls.length ? ls[i + 1] : null; }
