// Quiet background music, played rather than recorded: a soft pad of chords, a low root, and now and then a clear
// note picked from the key. Each world has its own key, pace and how often the tune speaks.
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
export const SONGS = {
  fields: { root: 60, scale: MAJOR, prog: [0, 5, 3, 4], tempo: 76, talk: 0.45, high: 12 },   // C major: plain and bright
  water: { root: 62, scale: MAJOR, prog: [0, 3, 5, 4], tempo: 72, talk: 0.55, high: 12 },    // D major, many drops
  fire: { root: 57, scale: MINOR, prog: [0, 5, 2, 6], tempo: 84, talk: 0.5, high: 12 },      // A minor, a little urgent
  ice: { root: 64, scale: MAJOR, prog: [0, 4, 5, 3], tempo: 66, talk: 0.4, high: 24 },       // E major, high and glassy
  spark: { root: 65, scale: MAJOR, prog: [0, 4, 5, 3], tempo: 92, talk: 0.6, high: 12 },     // F major, busy
  stone: { root: 55, scale: MAJOR, prog: [0, 3, 0, 4], tempo: 70, talk: 0.35, high: 12 },    // G major, low and steady
  gas: { root: 58, scale: MAJOR, prog: [0, 5, 1, 4], tempo: 80, talk: 0.5, high: 12 },       // B♭ major, airy
  mixed: { root: 62, scale: MINOR, prog: [0, 6, 5, 4], tempo: 78, talk: 0.5, high: 12 },     // D minor
  dark: { root: 52, scale: MINOR, prog: [0, 5, 3, 6], tempo: 60, talk: 0.25, high: 12 },     // E minor, slow and sparse
  last: { root: 60, scale: MAJOR, prog: [0, 3, 4, 5], tempo: 88, talk: 0.6, high: 12 },      // C major, for the end
};
const BY_WORLD = ['fields', 'fields', 'water', 'fire', 'ice', 'spark', 'stone', 'gas', 'mixed', 'dark', 'last'];
export const songFor = world => SONGS[BY_WORLD[world] || 'fields'];

const note = (s, degree, octave = 0) => s.root + s.scale[((degree % 7) + 7) % 7] + 12 * (octave + Math.floor(degree / 7));
// the bar's chord: a triad on the progression's degree
export const chordFor = (s, bar) => { const d = s.prog[bar % s.prog.length]; return [note(s, d), note(s, d + 2), note(s, d + 4)]; };
// one beat of the tune: a note of the chord or a step beside it, up high; or a rest. `r` is the beat's luck (0–1).
export function melodyFor(s, beat, r) {
  if (r > s.talk) return null;
  const d = s.prog[Math.floor(beat / 4) % s.prog.length], steps = [0, 2, 4, 5, 7];
  return note(s, d + steps[Math.floor(r / s.talk * steps.length) % steps.length]) + s.high;
}

const hz = m => 440 * 2 ** ((m - 69) / 12);

// Plays on an AudioContext the sound module owns. `on()` says whether music is wanted (the setting).
export function createMusic(context, on) {
  let ac = null, out = null, song = songFor(1), nextSong = null, t = 0, beat = 0, timer = 0;
  function wire() {
    ac = context(); if (!ac || out) return;
    out = ac.createGain(); out.gain.value = on() ? 0.5 : 0;
    const echo = ac.createDelay(1), back = ac.createGain(), wet = ac.createGain();   // a little room around it
    echo.delayTime.value = 0.36; back.gain.value = 0.3; wet.gain.value = 0.22;
    out.connect(ac.destination); out.connect(echo); echo.connect(back).connect(echo); echo.connect(wet).connect(ac.destination);
  }
  function voice(type, freq, at, len, vol, attack, cutoff = 1800) {
    const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(f).connect(g).connect(out); o.start(at); o.stop(at + len + 0.05);
  }
  function tick() {   // schedule what falls in the next half second
    if (!ac || ac.state !== 'running') return;
    const spb = 60 / song.tempo;
    if (t < ac.currentTime) t = ac.currentTime + 0.05;
    while (t < ac.currentTime + 0.5) {
      if (beat % 4 === 0) {   // a new bar: the pad and the root (and a new song, if one is waiting)
        if (nextSong) { song = nextSong; nextSong = null; }
        const bar = beat / 4, c = chordFor(song, bar), len = spb * 4 + 1.2;
        for (const n of c) { voice('triangle', hz(n), t, len, 0.035, 1.1, 1100); voice('sine', hz(n) * 1.003, t, len, 0.025, 1.3, 900); }
        voice('sine', hz(c[0] - 12), t, spb * 3.5, 0.06, 0.08, 500);
      }
      const m = melodyFor(song, beat, Math.random());
      if (m !== null) voice('sine', hz(m), t, 1.1, 0.05, 0.01, 2400);
      t += spb; beat++;
    }
  }
  return {
    start() { wire(); if (!timer) timer = setInterval(tick, 120); },
    setWorld(world) { const s = songFor(world); if (s !== song) nextSong = s; },
    setOn(yes) { if (out) out.gain.setTargetAtTime(yes ? 0.5 : 0, ac.currentTime, 0.4); },
  };
}
