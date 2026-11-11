// What the ball turns into while it wears an element (the shapes are in forms.js), how it moves, the trail it leaves,
// and the burst when a slot is pressed.
import * as THREE from 'three';
import { FEEL } from './feel.js';
import { buildForm } from './forms.js';
import { addFlair } from './flair.js';

const r = FEEL.R * 0.1;   // the ball's radius on the board
const COLOR = { water: '#5BB8F5', fire: '#FF6A2E', ice: '#9FE3F7', spark: '#FFD23F', stone: '#A39A90', gas: '#B8E986', steam: '#EAF4FF', snow: '#F7FBFF', blast: '#FF5A3C' };

// Each form sits in a rig so it can move like something rolling while it stays upright: leaning the way it goes
// (yaw, tilt), stretched with speed and squashed by a knock (also tilt), hopping as it goes, its face kept toward the
// camera. The snowball simply rolls.
const ROLLS = new Set(['snow']);
const TRAIL = {   // what a form leaves behind: colour, size, how it moves (up, gravity), how long it lasts
  fire: { c: '#FF9A3D', s: 0.12, up: 1.6, g: 0, life: 0.55, grow: 0.5 }, water: { c: '#7CCBF5', s: 0.1, up: 1.6, g: 9, life: 0.5 },
  ice: { c: '#FFFFFF', s: 0.08, up: 0.6, g: 0, life: 0.6 }, spark: { c: '#FFE35C', s: 0.08, up: 1.0, g: 0, life: 0.3, jitter: 4 },
  stone: { c: '#B8ADA3', s: 0.1, up: 0.3, g: 0, life: 0.6, grow: 2.5 }, gas: { c: '#DDF5C4', s: 0.12, up: 0.5, g: 0, life: 0.8, grow: 2 },
  steam: { c: '#FFFFFF', s: 0.12, up: 0.9, g: 0, life: 0.8, grow: 2 }, snow: { c: '#FFFFFF', s: 0.07, up: 0.5, g: 5, life: 0.5 },
  blast: { c: '#FF8A3D', s: 0.16, up: 1.2, g: 0, life: 0.4, grow: 1 },
};

export function createAura() {
  const group = new THREE.Group(), forms = {}, rigs = {}, bursts = [], trail = [];
  for (const el of Object.keys(COLOR)) {
    forms[el] = buildForm(el); forms[el].visible = true;
    const wrap = new THREE.Group(), yaw = new THREE.Group(), tilt = new THREE.Group();
    wrap.add(yaw); yaw.add(tilt); tilt.add(forms[el]); wrap.visible = false; group.add(wrap); rigs[el] = { wrap, yaw, tilt }; addFlair(el, wrap);
  }
  const motion = { lean: 0, yaw: 0, squash: 0, hop: 0, gone: 0 };
  const dotGeo = new THREE.SphereGeometry(1, 8, 6);
  function drop(el, at) {   // one bit of trail
    const T = TRAIL[el], m = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: T.c, transparent: true, depthWrite: false }));
    m.scale.setScalar(T.s); m.position.set(at.x + (Math.random() - 0.5) * 0.3, at.y - r * 0.4 + Math.random() * 0.3, at.z + (Math.random() - 0.5) * 0.3);
    group.add(m); trail.push({ m, t: 0, T, v: new THREE.Vector3((Math.random() - 0.5) * 0.6, T.up * (0.5 + Math.random() * 0.5), (Math.random() - 0.5) * 0.6) });
  }
  let pop = 0;   // seconds since the last press, for the ball's little bounce

  function burst(el, at) {   // a ring that spreads and bits that fly, in the element's colour
    const c = COLOR[el] || '#FFFFFF';
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 40), new THREE.MeshBasicMaterial({ color: c, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(at.x, 0.03, at.z); group.add(ring); bursts.push({ m: ring, t: 0, ring: true });
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true }));
      m.position.set(at.x, at.y + 0.1, at.z); group.add(m); bursts.push({ m, t: 0, v: new THREE.Vector3(Math.cos(a) * 3, 2.5 + (k % 3), Math.sin(a) * 3) });
    }
    pop = 0;
  }

  // follow the ball; the shapes stay upright and face the camera, lean, flicker; blink as the coat wears off
  function update(run, ball, dt, clock, events = []) {
    pop += dt;
    const el = run.coat?.el, show = !!el && ball.visible && !(run.coat.left < 1.5 && Math.sin(clock * 18) < 0);   // near the end, form and ball take turns
    for (const [k, R0] of Object.entries(rigs)) R0.wrap.visible = show && k === el;
    api.wearing = show;
    if (el) {
      const f = forms[el], { wrap, yaw, tilt } = rigs[el], b = run.ball, sp = Math.hypot(b.vx, b.vy);
      for (const e of events) if (e.type === 'knock' && e.speed > 60) motion.squash = Math.min(1, e.speed / 400);   // a knock squashes it
      motion.squash = Math.max(0, motion.squash - dt * 4);
      wrap.position.copy(ball.position);
      if (ROLLS.has(el)) { yaw.rotation.y = 0; tilt.rotation.x = 0; tilt.scale.setScalar(1); f.quaternion.copy(ball.quaternion); }   // hard things roll
      else {
        if (sp > 15) { const want = Math.atan2(b.vx, b.vy); motion.yaw += Math.atan2(Math.sin(want - motion.yaw), Math.cos(want - motion.yaw)) * Math.min(1, dt * 10); }   // face the way it goes
        motion.lean += (Math.min(1, sp / 600) * 0.45 - motion.lean) * Math.min(1, dt * 8);                                               // lean into it, more the faster
        const k = 1 + Math.min(0.28, sp / 1400), q = motion.squash * 0.35;                                                                 // stretched by speed, squashed by a knock
        yaw.rotation.y = motion.yaw; tilt.rotation.x = motion.lean; tilt.scale.set((1 + q) / Math.sqrt(k), (1 - q) / Math.sqrt(k), k * (1 + q * 0.5));
        f.rotation.y = -motion.yaw;   // the icon keeps facing the camera while it leans the way it goes
        motion.hop += sp * dt / (r * 10 * 2.2); wrap.position.y += Math.abs(Math.sin(motion.hop * Math.PI)) * Math.min(0.14, sp / 3500);   // little hops as it goes
      }
      motion.gone += sp * dt;
      while (motion.gone > 9) { motion.gone -= 9; drop(el, ball.position); }   // a bit of trail every 9 units of travel
      if (el === 'fire') { const k = 1 + 0.1 * Math.sin(clock * 13); f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); }   // it flickers
      if (el === 'water') { const k = 1 + 0.05 * Math.sin(clock * 6); f.scale.set(k, 1 / k, k); }   // it wobbles
      if (el === 'spark') { const k = 1 + 0.06 * Math.sin(clock * 30); f.scale.setScalar(k); }   // it crackles
      if (el === 'steam') wrap.position.y += r * 0.5 + 0.04 * Math.sin(clock * 3);   // it floats
      if (el === 'snow') { const k = 1 + Math.min(0.5, (run.state.snow || 0) / 120); f.scale.setScalar(k); wrap.position.y += (k - 1) * r; }   // it grows as it rolls
      if (el === 'blast') { const k = 1 + 0.08 * Math.sin(clock * 20); f.scale.set(k, k, 1 / k); }
      if (el === 'gas' || el === 'steam') { const k = 1 + 0.06 * Math.sin(clock * 4); f.scale.setScalar(k); }   // it breathes
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i], T = p.T; p.t += dt;
      p.v.y -= T.g * dt; if (T.jitter) p.v.x += (Math.random() - 0.5) * T.jitter;
      p.m.position.addScaledVector(p.v, dt); p.m.scale.setScalar(T.s * (1 + (T.grow || 0) * p.t / T.life)); p.m.material.opacity = Math.max(0, 0.85 * (1 - p.t / T.life));
      if (p.t > T.life) { group.remove(p.m); p.m.material.dispose(); trail.splice(i, 1); }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.t += dt;
      if (b.ring) { b.m.scale.setScalar(1 + b.t * 9); b.m.material.opacity = Math.max(0, 0.9 - b.t * 2); }
      else { b.v.y -= 9 * dt; b.m.position.addScaledVector(b.v, dt); b.m.material.opacity = Math.max(0, 1 - b.t * 2.2); }
      if (b.t > 0.5) { group.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); bursts.splice(i, 1); }
    }
    return pop < 0.3 ? 1 + 0.35 * Math.sin(pop / 0.3 * Math.PI) : 1;   // how big the ball is this frame
  }
  const api = { group, burst, update, wearing: false };
  return api;
}
