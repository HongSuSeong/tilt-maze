// The phone's tilt, read against the pose it had when the stage began and turned to match the screen.
// deviceorientation gives beta (front-back) and gamma (left-right) for the phone held in portrait.
import { FEEL } from './feel.js';

const KEY_DEG = 14, KEY_SMOOTH = 0.2;   // with no sensor (a computer), the arrow keys stand in for the hand

export function mapTilt(raw, ref, angle) {
  const x = raw.gamma - ref.gamma, y = raw.beta - ref.beta, a = ((angle % 360) + 360) % 360;
  if (a === 90) return { x: y, y: -x };
  if (a === 270) return { x: -y, y: x };
  if (a === 180) return { x: -x, y: -y };
  return { x, y };
}

export const deadZone = (v, dead) => Math.sign(v) * Math.max(0, Math.abs(v) - dead) || 0;

export function createTilt() {
  let raw = null, ref = null;
  const now = { x: 0, y: 0 };
  return {
    get hasSensor() { return raw !== null; },
    feed(r) { raw = { beta: r.beta, gamma: r.gamma }; if (!ref) ref = { ...raw }; },
    calibrate() { if (raw) ref = { ...raw }; now.x = now.y = 0; },
    read(angle, keys) {
      let to, k;
      if (raw) { const t = mapTilt(raw, ref, angle); to = { x: deadZone(t.x, FEEL.dead), y: deadZone(t.y, FEEL.dead) }; k = FEEL.smooth; }
      else { to = { x: (keys.ArrowRight ? KEY_DEG : 0) - (keys.ArrowLeft ? KEY_DEG : 0), y: (keys.ArrowDown ? KEY_DEG : 0) - (keys.ArrowUp ? KEY_DEG : 0) }; k = KEY_SMOOTH; }
      now.x += (to.x - now.x) * k; now.y += (to.y - now.y) * k;
      return { x: now.x, y: now.y };
    },
  };
}
