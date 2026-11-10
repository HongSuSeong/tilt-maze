import { describe, it, expect } from 'vitest';
import { SONGS, songFor, chordFor, melodyFor } from '../src/music.js';

const inKey = (song, midi) => song.scale.includes(((midi - song.root) % 12 + 12) % 12);

describe('music', () => {
  it('every world has a song of its own, calm in tempo', () => {
    for (let w = 0; w <= 10; w++) { const s = songFor(w); expect(s).toBeTruthy(); expect(s.tempo).toBeGreaterThanOrEqual(56); expect(s.tempo).toBeLessThanOrEqual(96); }
    expect(songFor(2)).not.toEqual(songFor(3)); expect(Object.keys(SONGS).length).toBeGreaterThanOrEqual(10);
  });
  it('the chords stay in the key and walk through the progression', () => {
    const s = songFor(2);
    for (let bar = 0; bar < 8; bar++) { const c = chordFor(s, bar); expect(c).toHaveLength(3); for (const n of c) expect(inKey(s, n)).toBe(true); }
    expect(chordFor(s, 0)).toEqual(chordFor(s, s.prog.length));
  });
  it('the tune picks notes of the key, sometimes rests, the same way for the same luck', () => {
    const s = songFor(9), notes = Array.from({ length: 64 }, (_, k) => melodyFor(s, k, (k * 0.618) % 1));
    expect(notes.some(n => n === null)).toBe(true); expect(notes.some(n => n !== null)).toBe(true);
    for (const n of notes) if (n !== null) expect(inKey(s, n)).toBe(true);
    expect(melodyFor(s, 5, 0.3)).toBe(melodyFor(s, 5, 0.3));
  });
});
