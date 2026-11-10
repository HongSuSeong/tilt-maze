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

function build(el) {
  const g = new THREE.Group();
  if (el === 'fire') {   // tongues of flame rising round the ball, each with a yellow heart
    const flame = (h, x, z, tilt) => {
      const f = sticker(lathe(FLAME, h), '#FF6A2E', '#7A2410', { emissive: 0.35, outline: 1.12 });
      const core = new THREE.Mesh(lathe(FLAME, h * 0.55), new THREE.MeshStandardMaterial({ color: '#FFD24A', emissive: '#FFB800', emissiveIntensity: 0.6 })); core.position.y = 0.02; f.add(core);
      f.position.set(x, -r * 0.4, z); f.rotation.set(tilt * Math.sin(Math.atan2(z, x)), 0, -tilt * Math.cos(Math.atan2(z, x))); return f;
    };
    g.add(flame(1.9, 0, 0, 0));   // tall, since the camera looks down on it
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.add(flame(1.25, Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, 0.32)); }
  }
  if (el === 'water') {   // a glossy drop round the ball, with a gleam
    const d = sticker(lathe(DROP, 1.2), '#7CCBF5', '#2F7FB8', { opacity: 0.55, outline: 1.06 }); d.position.y = 0.12; d.scale.y = 1.35; g.add(d);   // the point stands up out of the view
    const gleam = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); gleam.scale.set(1, 1.6, 0.6); gleam.position.set(-0.22, 0.3, 0.38); g.add(gleam);
  }
  if (el === 'ice') {   // a faceted shell of ice with crystals standing out of it
    g.add(sticker(new THREE.IcosahedronGeometry(r * 1.4, 0), '#BFEFFF', '#3E9EDB', { opacity: 0.6, outline: 1.08, flat: true }));
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2, c = sticker(new THREE.OctahedronGeometry(0.16, 0), '#E8FBFF', '#3E9EDB', { flat: true, outline: 1.18 });
      c.scale.set(1, 2.6, 1); c.position.set(Math.cos(a) * r * 1.25, 0.12, Math.sin(a) * r * 1.25); c.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); g.add(c);
    }
  }
  if (el === 'spark') {   // zigzag bolts circling the ball
    for (let k = 0; k < 3; k++) {
      const b = sticker(bolt(), '#FFD23F', '#3B4778', { emissive: 0.5, outline: 1.14 }), a = k / 3 * Math.PI * 2;
      b.scale.setScalar(1.7); b.position.set(Math.cos(a) * r * 1.9, 0.35, Math.sin(a) * r * 1.9); b.rotation.y = -a + Math.PI / 2; g.add(b);
    }
  }
  if (el === 'stone') g.add(sticker(new THREE.DodecahedronGeometry(r * 1.55, 0), '#A39A90', '#4A403C', { flat: true, outline: 1.07 }));   // a rock round the ball
  if (el === 'gas') {   // ribbons of wind wound round the ball
    [[0.3, 0], [1.2, 1.4], [-0.6, 2.6]].forEach(([tilt, turn]) => {
      const t = sticker(new THREE.TorusGeometry(r * 1.45, 0.06, 8, 32, Math.PI * 1.4), '#B8E986', '#5E9B3A', { opacity: 0.9, outline: 1.25 });
      t.rotation.set(Math.PI / 2 + tilt, turn, 0); g.add(t);
    });
  }
  g.visible = false; return g;
}

export function createAura() {
  const group = new THREE.Group(), forms = {}, bursts = [];
  for (const el of Object.keys(COLOR)) { forms[el] = build(el); group.add(forms[el]); }
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
  function update(run, ball, dt, clock) {
    pop += dt;
    const el = run.coat?.el, show = !!el && ball.visible && !(run.coat.left < 1.5 && Math.sin(clock * 18) < 0);
    for (const [k, f] of Object.entries(forms)) f.visible = show && k === el;
    if (el) {
      const f = forms[el]; f.position.copy(ball.position);
      if (el === 'fire') f.children.forEach((c, i) => c.scale.set(1, 1 + 0.18 * Math.sin(clock * 12 + i * 1.7), 1));
      if (el === 'spark') { f.rotation.y += dt * 4; f.children.forEach((c, i) => { c.visible = Math.sin(clock * 30 + i * 2) > -0.6; }); }
      if (el === 'ice' || el === 'water') f.rotation.y += dt * 0.6;
      if (el === 'gas') f.rotation.y += dt * 3;
      if (el === 'stone') f.quaternion.copy(ball.quaternion);   // a rock rolls with the ball
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.t += dt;
      if (b.ring) { b.m.scale.setScalar(1 + b.t * 9); b.m.material.opacity = Math.max(0, 0.9 - b.t * 2); }
      else { b.v.y -= 9 * dt; b.m.position.addScaledVector(b.v, dt); b.m.material.opacity = Math.max(0, 1 - b.t * 2.2); }
      if (b.t > 0.5) { group.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); bursts.splice(i, 1); }
    }
    return pop < 0.3 ? 1 + 0.35 * Math.sin(pop / 0.3 * Math.PI) : 1;   // how big the ball is this frame
  }
  return { group, burst, update };
}
