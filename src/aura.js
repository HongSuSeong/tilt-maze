// What the ball turns into while it wears an element, in the soft-toy look: chunky shapes with a dark outline
// (a slightly larger copy drawn from the back), like stickers. And the burst when a slot is pressed.
import * as THREE from 'three';
import { FEEL } from './feel.js';

const r = FEEL.R * 0.1;   // the ball's radius on the board
const COLOR = { water: '#5BB8F5', fire: '#FF6A2E', ice: '#9FE3F7', spark: '#FFD23F', stone: '#A39A90', gas: '#B8E986' };

const lathe = (pts, s) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x * s, y * s)), 20);
function sticker(geo, color, line, { opacity = 1, emissive = 0, outline = 1.1, flat = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.45, flatShading: flat, transparent: opacity < 1, opacity, emissive: color, emissiveIntensity: emissive, depthWrite: opacity >= 1 }));
  const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: line, side: THREE.BackSide }));
  edge.scale.setScalar(outline); g.add(edge, body); g.userData.body = body; return g;
}

const FLAME = [[0, 0], [0.26, 0.05], [0.34, 0.2], [0.3, 0.42], [0.18, 0.68], [0.07, 0.9], [0, 1]];
const DROP = [[0, -0.6], [0.36, -0.5], [0.58, -0.18], [0.55, 0.16], [0.38, 0.48], [0.14, 0.8], [0, 0.98]];
function bolt() {
  const s = new THREE.Shape(); [[0.05, 0.5], [-0.14, 0.02], [0.02, 0.02], [-0.06, -0.5], [0.16, 0.08], [0, 0.08], [0.12, 0.5]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 });
}

// Each form takes the ball's place: ball-sized, standing on the board where the ball is (its centre one radius up).
const P = (pts, k = r) => pts.map(([x, y]) => [x * k, y * k]);
const FIRE = [[0, -1], [0.55, -0.9], [0.95, -0.5], [1, 0], [0.85, 0.5], [0.55, 1.1], [0.25, 1.6], [0, 2.1]];
const DROP2 = [[0, -1], [0.6, -0.85], [0.95, -0.45], [1, 0], [0.8, 0.55], [0.45, 1.1], [0.15, 1.55], [0, 1.75]];
const lathe1 = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 24);

function build(el) {
  const g = new THREE.Group();
  if (el === 'fire') {   // a ball of flame: round below, a point above, a yellow heart showing in front, two licks at the sides
    const body = sticker(lathe1(P(FIRE)), '#FF6A2E', '#7A2410', { emissive: 0.35, outline: 1.08 }); g.add(body);
    const heart = new THREE.Mesh(lathe1(P(FIRE, r * 0.6)), new THREE.MeshStandardMaterial({ color: '#FFD24A', emissive: '#FFB800', emissiveIntensity: 0.7 }));
    heart.position.set(0, -r * 0.3, r * 0.82); heart.scale.set(1.1, 1, 0.35); g.add(heart);   // on the side facing the camera
    for (const sx of [-1, 1]) { const lick = sticker(lathe1(P(FIRE, r * 0.45)), '#FF8A3D', '#7A2410', { emissive: 0.3, outline: 1.12 }); lick.position.set(sx * r * 0.85, -r * 0.4, 0); lick.rotation.z = -sx * 0.5; g.add(lick); }
  }
  if (el === 'water') {   // a drop of water, with a gleam
    g.add(sticker(lathe1(P(DROP2)), '#5BB8F5', '#2F7FB8', { opacity: 0.88, outline: 1.07 }));
    const gleam = new THREE.Mesh(new THREE.SphereGeometry(r * 0.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
    gleam.scale.set(1, 1.7, 0.5); gleam.position.set(-r * 0.4, r * 0.25, r * 0.78); g.add(gleam);
  }
  if (el === 'ice') {   // a crystal of ice: a six-sided prism with points, and two small ones beside it
    const crystal = (k, x, tilt) => {
      const c = new THREE.Group();
      c.add(sticker(new THREE.CylinderGeometry(0.62 * k, 0.62 * k, 1.1 * k, 6), '#9FDDF5', '#2F7FB8', { opacity: 0.95, flat: true, outline: 1.08 }));
      for (const sy of [-1, 1]) { const tip = sticker(new THREE.ConeGeometry(0.62 * k, 0.55 * k, 6), '#CFF3FF', '#2F7FB8', { opacity: 0.95, flat: true, outline: 1.08 }); tip.position.y = sy * 0.82 * k; if (sy < 0) tip.rotation.x = Math.PI; c.add(tip); }
      c.position.set(x, 0, 0); c.rotation.z = tilt; return c;
    };
    g.add(crystal(r * 1.25, 0, 0), crystal(r * 0.6, r * 0.95, -0.6), crystal(r * 0.55, -r * 0.95, 0.6));
  }
  if (el === 'spark') {   // a ball of lightning with bolts sticking out of it
    g.add(sticker(new THREE.SphereGeometry(r * 0.85, 24, 16), '#FFE35C', '#3B4778', { emissive: 0.8, outline: 1.09 }));
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2, b = sticker(bolt(), '#FFD23F', '#3B4778', { emissive: 0.6, outline: 1.14 });
      b.scale.setScalar(1.1); b.position.set(Math.cos(a) * r * 1.05, r * 0.15, Math.sin(a) * r * 1.05); b.rotation.set(0, -a + Math.PI / 2, 0.5); g.add(b);
    }
  }
  if (el === 'stone') g.add(sticker(new THREE.DodecahedronGeometry(r * 1.15, 0), '#A39A90', '#4A403C', { flat: true, outline: 1.07 }));   // a lump of rock
  if (el === 'gas') {   // a puffy little cloud of gas, with wisps of haze drifting round it (no face: it is not anyone)
    const puff = (k, x, y, z) => { const p = sticker(new THREE.SphereGeometry(k, 20, 14), '#B8E986', '#5E9B3A', { opacity: 0.96, outline: 1.08 }); p.position.set(x, y, z); return p; };
    g.add(puff(r * 0.8, 0, 0, 0), puff(r * 0.5, r * 0.6, r * 0.3, 0.1), puff(r * 0.5, -r * 0.6, r * 0.25, 0.05), puff(r * 0.45, 0, r * 0.7, -0.05), puff(r * 0.4, r * 0.3, -r * 0.4, r * 0.4));
    const haze = new THREE.Group(); haze.userData.haze = true;
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2, w = new THREE.Mesh(new THREE.SphereGeometry(r * (0.22 + 0.08 * (k % 3)), 12, 8), new THREE.MeshBasicMaterial({ color: '#DDF5C4', transparent: true, opacity: 0.45, depthWrite: false }));
      w.position.set(Math.cos(a) * r * 1.35, r * (0.1 * (k % 4) - 0.1), Math.sin(a) * r * 1.35); haze.add(w);
    }
    g.add(haze);
  }
  g.visible = false; return g;
}

// Each form sits in a rig so it can move like something rolling while it stays upright: turned to face where it
// goes (yaw), leaning into it (tilt), stretched with speed and squashed by a knock (also tilt), hopping as it goes.
// Ice and stone are hard things, and simply roll.
const ROLLS = new Set(['ice', 'stone']);
const TRAIL = {   // what a form leaves behind: colour, size, how it moves (up, gravity), how long it lasts
  fire: { c: '#FF9A3D', s: 0.12, up: 1.6, g: 0, life: 0.55, grow: 0.5 }, water: { c: '#7CCBF5', s: 0.1, up: 1.6, g: 9, life: 0.5 },
  ice: { c: '#FFFFFF', s: 0.08, up: 0.6, g: 0, life: 0.6 }, spark: { c: '#FFE35C', s: 0.08, up: 1.0, g: 0, life: 0.3, jitter: 4 },
  stone: { c: '#B8ADA3', s: 0.1, up: 0.3, g: 0, life: 0.6, grow: 2.5 }, gas: { c: '#DDF5C4', s: 0.12, up: 0.5, g: 0, life: 0.8, grow: 2 },
};

export function createAura() {
  const group = new THREE.Group(), forms = {}, rigs = {}, bursts = [], trail = [];
  for (const el of Object.keys(COLOR)) {
    forms[el] = build(el); forms[el].visible = true;
    const wrap = new THREE.Group(), yaw = new THREE.Group(), tilt = new THREE.Group();
    wrap.add(yaw); yaw.add(tilt); tilt.add(forms[el]); wrap.visible = false; group.add(wrap); rigs[el] = { wrap, yaw, tilt };
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

  // follow the ball; the shapes stay upright (they do not roll), turn and flicker; blink as the coat wears off
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
        motion.hop += sp * dt / (r * 10 * 2.2); wrap.position.y += Math.abs(Math.sin(motion.hop * Math.PI)) * Math.min(0.14, sp / 3500);   // little hops as it goes
      }
      motion.gone += sp * dt;
      while (motion.gone > 9) { motion.gone -= 9; drop(el, ball.position); }   // a bit of trail every 9 units of travel
      if (el === 'fire') { const k = 1 + 0.1 * Math.sin(clock * 13); f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); }   // it flickers
      if (el === 'water') { const k = 1 + 0.05 * Math.sin(clock * 6); f.scale.set(k, 1 / k, k); }   // it wobbles
      if (el === 'spark') { f.rotation.y += dt * 5; f.children.forEach((c, i) => { if (i) c.visible = Math.sin(clock * 30 + i * 2) > -0.5; }); }
      if (el === 'gas') { const k = 1 + 0.06 * Math.sin(clock * 4); f.scale.setScalar(k); f.children.at(-1).rotation.y += dt * 2.2; f.children.at(-1).children.forEach((w, i) => { w.position.y = r * (0.1 * (i % 4) - 0.1) + 0.06 * Math.sin(clock * 3 + i); }); }
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
