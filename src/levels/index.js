// Every stage in the order they are played.
import { TUTORIAL } from './tutorial.js';
import { WORLD1 } from './world1.js';

export const LEVELS = [...TUTORIAL, ...WORLD1];
export const levelById = id => LEVELS.find(l => l.id === id) || null;
export function nextLevel(id) { const i = LEVELS.findIndex(l => l.id === id); return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1] : null; }
