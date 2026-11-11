// What the ball turns into while it wears an element: the shape everyone knows it by (a drop, a flame, an ice cube, a
// bolt, a rock, a cloud, wisps of steam, a snowball, a bang), drawn as an icon outline blown up into a soft sticker
// with a dark edge. Flat ones stand leaned back toward the camera, which looks down on the board, so they read.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FEEL } from './feel.js';

const r = FEEL.R * 0.1;
function sticker(geo, color, line, { opacity = 1, emissive = 0, outline = 1.1, flat = false } = {}) {   // a body and, behind it, a slightly bigger dark copy for its edge
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.45, flatShading: flat, transparent: opacity < 1, opacity, emissive: color, emissiveIntensity: emissive, depthWrite: opacity >= 1 }));
  const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: line, side: THREE.BackSide }));
  edge.scale.setScalar(outline); g.add(edge, body); return g;
}
const put = (o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { o.position.set(x * r, y * r, z * r); o.rotation.set(rx, ry, rz); return o; };
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const WHITE = basic('#FFFFFF');
const group = (...o) => { const g = new THREE.Group(); g.add(...o); return g; };

// a shape drawn with moveTo / lineTo / bezier steps: ['m', x, y], ['l', x, y], ['b', x1, y1, x2, y2, x, y]
function path(steps) { const s = new THREE.Shape(); for (const [k, ...a] of steps) (k === 'm' ? s.moveTo : k === 'l' ? s.lineTo : s.bezierCurveTo).apply(s, a); return s; }
// a flat outline blown up into a soft slab k radii across; returns the geometry and how far its front is
function puff(shape, k, depth = 0.16) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 5, curveSegments: 28 });
  g.center(); g.scale(r * k, r * k, r * k); return g;
}
const front = (k, depth = 0.16) => (depth / 2 + 0.14) * k + 0.02;
const S = (geo, color, line, o) => sticker(geo, color, line, { outline: 1.06, ...o });
const shine = (x, y, z, w = 0.22, h = 0.12, rz = 0.6) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), WHITE); m.scale.set(w, h, 0.05); return put(m, x, y, z, 0, 0, rz); };

const DROP = path([['m', 0, 1.05], ['b', 0.25, 0.6, 0.8, 0.1, 0.8, -0.3], ['b', 0.8, -0.78, 0.42, -1.02, 0, -1.02], ['b', -0.42, -1.02, -0.8, -0.78, -0.8, -0.3], ['b', -0.8, 0.1, -0.25, 0.6, 0, 1.05]]);
const FLAME = path([['m', 0, -1], ['b', 0.62, -1, 0.97, -0.55, 0.86, -0.05], ['b', 0.8, 0.3, 0.64, 0.45, 0.6, 0.78], ['b', 0.45, 0.58, 0.36, 0.48, 0.3, 0.38],
  ['b', 0.36, 0.78, 0.2, 1.08, -0.06, 1.32], ['b', -0.06, 0.96, -0.2, 0.72, -0.38, 0.56], ['b', -0.4, 0.72, -0.5, 0.82, -0.63, 0.88], ['b', -0.97, 0.46, -0.96, 0, -0.86, -0.3], ['b', -0.7, -0.82, -0.4, -1, 0, -1]]);
const CORE = path([['m', 0, -0.85], ['b', 0.42, -0.85, 0.56, -0.5, 0.46, -0.2], ['b', 0.38, 0.06, 0.2, 0.22, 0.12, 0.48], ['b', 0, 0.26, -0.16, 0.16, -0.3, 0.05], ['b', -0.52, -0.16, -0.5, -0.85, 0, -0.85]]);
const CURL = path([['m', 0, -1], ['b', 0.72, -1, 0.92, -0.4, 0.62, 0.2], ['b', 0.46, 0.52, 0.28, 0.74, 0.4, 1.25], ['b', 0, 0.94, -0.62, 0.62, -0.76, 0], ['b', -0.86, -0.6, -0.5, -1, 0, -1]]);
const BOLT = path([['m', 0.12, 1], ['l', -0.52, -0.08], ['l', -0.06, -0.08], ['l', -0.28, -1], ['l', 0.52, 0.14], ['l', 0.06, 0.14], ['l', 0.38, 1], ['l', 0.12, 1]]);

function lumpy(k, seed, { flat = false, detail = 2, squash = 0.78, bump = 0.13 } = {}) {   // a rounded lump, the same every time
  const g = new THREE.IcosahedronGeometry(r * k, detail), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const d = v.clone().normalize(), n = Math.sin(d.x * 7.1 + seed) * Math.sin(d.y * 5.3 + seed * 2) * Math.sin(d.z * 6.7 + seed * 3);
    v.multiplyScalar(1 + bump * n); v.y = Math.max(v.y * squash, -r * k * 0.62); p.setXYZ(i, v.x, v.y, v.z);
  }
  if (flat) { g.computeVertexNormals(); return g; }
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); const m = mergeVertices(g); m.computeVertexNormals(); return m;   // smooth: corners shared
}
const cloud = (color, line, puffs, o) => group(...puffs.map(([k, x, y]) => { const m = S(new THREE.SphereGeometry(r * k, 22, 16), color, line, o); m.scale.z = 0.62; return put(m, x, y, 0); }));
function wave(x0, h, amp, rad, color, line) {   // a wavy line rising, round at both ends, with its own dark edge
  const pts = Array.from({ length: 9 }, (_, i) => { const t = i / 8, y = -h / 2 + t * h; return new THREE.Vector3((x0 + amp * Math.sin(t * Math.PI * 2.2)) * r, y * r, 0); });
  const curve = new THREE.CatmullRomCurve3(pts), g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r * (rad + 0.045), 10), basic(line, { side: THREE.BackSide })), new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r * rad, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.45 })));
  for (const p of [pts[0], pts[8]]) { g.add(put(new THREE.Mesh(new THREE.SphereGeometry(r * (rad + 0.045), 10, 8), basic(line, { side: THREE.BackSide })), p.x / r, p.y / r, 0), put(new THREE.Mesh(new THREE.SphereGeometry(r * rad, 10, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.45 })), p.x / r, p.y / r, 0)); }
  return g;
}
function flake(k, color, line, depth = 0.22) {   // a snowflake: six arms, each with two little branches
  const g = new THREE.Group(), bar = (len, w, x, y, rz) => put(S(new THREE.BoxGeometry(r * len * k, r * w * k, r * depth * k), color, line, { outline: 1.12 }), x * k, y * k, 0, 0, 0, rz);
  for (let i = 0; i < 3; i++) g.add(bar(2, 0.2, 0, 0, i * Math.PI / 3));
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, cx = Math.cos(a) * 0.6, cy = Math.sin(a) * 0.6; for (const s of [-1, 1]) { const b = a + s * 0.8; g.add(bar(0.5, 0.16, cx + Math.cos(b) * 0.2, cy + Math.sin(b) * 0.2, b)); } }
  return g;
}
const blob = (shape, k, color, line, o) => S(puff(shape, k), color, line, o);

const FORMS = {
  water: () => group(blob(DROP, 1.05, '#5BB8F5', '#2F7FB8'), shine(-0.32, -0.15, front(1.05), 0.2, 0.32, 0.35), shine(-0.12, -0.6, front(1.05), 0.07, 0.07)),   // 💧 a drop
  fire: () => group(blob(FLAME, 1.05, '#FF6A2E', '#7A2410', { emissive: 0.35 }), put(blob(CORE, 0.9, '#FFD24A', '#E8862A', { emissive: 0.45, outline: 1.03 }), 0, -0.22, front(1.05) - 0.02)),   // 🔥 a flame with a yellow heart
  ice: () => { const c = S(new RoundedBoxGeometry(r * 1.5, r * 1.5, r * 1.5, 4, r * 0.28), '#AEE6FA', '#2F7FB8', { opacity: 0.92 }); c.rotation.set(0.15, 0.55, 0.08); return group(c, put(new THREE.Mesh(new RoundedBoxGeometry(r * 0.16, r * 0.8, r * 0.1, 2, r * 0.05), WHITE), -0.42, 0.1, 0.78, 0.15, 0.55, 0.1)); },   // 🧊 an ice cube
  spark: () => group(blob(BOLT, 1.15, '#FFD23F', '#3B4778', { emissive: 0.45 }), shine(-0.15, 0.35, front(1.15), 0.06, 0.18, -0.6)),   // ⚡ a bolt
  stone: () => S(lumpy(1.05, 1.3), '#A39A90', '#4A403C'),   // 🪨 a rock
  gas: () => cloud('#B8E986', '#5E9B3A', [[0.62, 0, 0.15], [0.46, -0.62, -0.12], [0.5, 0.6, -0.08], [0.44, -0.24, -0.32], [0.44, 0.26, -0.34]]),   // ☁️ a cloud
  steam: () => group(wave(-0.5, 1.9, 0.16, 0.12, '#F4F9FF', '#7FA3C4'), wave(0, 2.2, 0.16, 0.12, '#F4F9FF', '#7FA3C4'), wave(0.5, 1.9, 0.16, 0.12, '#F4F9FF', '#7FA3C4')),   // ♨️ three wisps rising
  snow: () => S(lumpy(0.98, 5.1, { squash: 0.95, bump: 0.08 }), '#F7FBFF', '#7FA7C9'),   // a snowball
  blast: () => { const pts = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2, q = i % 2 ? 0.55 + 0.08 * Math.sin(i * 3) : 1 + 0.12 * Math.sin(i * 1.7); return [Math.cos(a) * q, Math.sin(a) * q]; }), inner = pts.map(([x, y], i) => [x * (i % 2 ? 0.62 : 0.5), y * (i % 2 ? 0.62 : 0.5)]);
      const sh = p => path(p.map(([x, y], i) => [i ? 'l' : 'm', x, y]).concat([['l', p[0][0], p[0][1]]]));
      return group(blob(sh(pts), 1.1, '#FF5A3C', '#7A2410', { emissive: 0.35 }), put(blob(sh(inner), 1.1, '#FFD24A', '#E8862A', { emissive: 0.5, outline: 1.03 }), 0, 0, front(1.1) - 0.02)); },   // 💥 a bang
};
// The form for an element, hidden until worn. Flat ones lean back toward the camera and keep facing it (`front`); the
// snowball rolls, and grows as it goes (aura.js).
export function buildForm(el) {
  const g = new THREE.Group(), shape = FORMS[el]();
  if (el === 'snow') g.add(shape);
  else { const lean = new THREE.Group(); lean.rotation.x = -0.8; lean.add(shape); g.add(lean); g.userData.front = true; }
  g.visible = false; return g;
}
