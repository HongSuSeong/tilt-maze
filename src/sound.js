// Small synthesized sounds and, where the phone allows (Android), a buzz. Both follow the player's settings.
export function createSound(opt) {
  let ac = null;
  const tone = (f0, f1, dur, vol, type = 'sine') => {
    if (!ac || !opt().snd) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  };
  const buzz = p => { if (opt().vib && navigator.vibrate) navigator.vibrate(p); };
  return {
    unlock() { if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } ac?.resume?.(); },
    context: () => ac,   // shared with the music
    hush(away) { if (away) ac?.suspend?.(); else ac?.resume?.(); },   // silent while the page is not shown
    knock(speed) { const k = Math.min(1, speed / 600); if (k < 0.05) return; tone(170 + 140 * k, 60, 0.1, 0.45 * k); buzz(Math.round(8 + 22 * k)); },
    crash() {
      buzz([30, 20, 40]); if (!ac || !opt().snd) return;
      const n = ac.sampleRate * 0.3 | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = 0.55; s.connect(g).connect(ac.destination); s.start();
    },
    ding() { tone(1320, 1760, 0.12, 0.18, 'triangle'); buzz(12); },
    plop() { tone(560, 90, 0.4, 0.35); buzz(70); },
    coat() { tone(420, 760, 0.18, 0.2, 'triangle'); buzz(15); },
    hiss() {
      buzz(25); if (!ac || !opt().snd) return;
      const n = ac.sampleRate * 0.5 | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.5) * 0.6;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = 2500;
      src.buffer = b; g.gain.value = 0.35; src.connect(f).connect(g).connect(ac.destination); src.start();
    },
    fail() { tone(330, 140, 0.45, 0.3, 'triangle'); buzz([60, 40, 60]); },
    win() { tone(660, 990, 0.18, 0.25, 'triangle'); setTimeout(() => tone(990, 1320, 0.22, 0.22, 'triangle'), 140); },
  };
}
