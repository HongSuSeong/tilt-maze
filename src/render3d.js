// The board in 3D: soft toy blocks on a mint board, seen from a little toward the player, leaning with the phone.
// It only draws what the run says; it decides nothing.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FEEL } from './feel.js';

const { BW, BH, RIM, R } = FEEL;
const U = 0.1, WALL_H = 1.0, BAR_TOP = 92, BAR_BOTTOM = 92, VIEW_DEG = 62;
const X = x => (x - BW / 2) * U, Z = y => (y - BH / 2) * U;

const PALETTE = {
  light: { bg: '#EAF8F1', floor: '#C7EFDB', dot: '#B1E4CB', wall: '#FFFFFF', base: '#FFFFFF', crack: '#FFD7A3', crackLine: '#E39B57', hole: '#0E2F2A', lip: '#FFFFFF', ring: '#7FD4B4', trap: '#FF8A65', glow: 0.35, hemi: ['#ffffff', '#9fd9bf', 1.15], sun: 1.9 },
  dark: { bg: '#0F1A1F', floor: '#15262B', dot: '#203A40', wall: '#2E474F', base: '#263C43', crack: '#B9824C', crackLine: '#6B4A2A', hole: '#000000', lip: '#3B5A62', ring: '#55E0AE', trap: '#FF7A59', glow: 0.9, hemi: ['#9fc6d8', '#0b1418', 0.75], sun: 0.9 },
};

function canvasTex(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const floorTex = p => canvasTex(512, 820, (g, w, h) => {
  g.fillStyle = p.floor; g.fillRect(0, 0, w, h); g.fillStyle = p.dot;
  for (let y = 9; y < h; y += 18) for (let x = 9; x < w; x += 18) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
});
const crackTex = p => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = p.crack; g.fillRect(0, 0, w, h); g.strokeStyle = p.crackLine; g.lineWidth = 5;
  for (let x = -40; x < w + 40; x += 34) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 12, h * 0.45); g.lineTo(x + 2, h); g.stroke(); }
});
const ballTex = () => canvasTex(512, 256, (g, w, h) => {   // coral with cream dots, so its rolling shows
  g.fillStyle = '#FF6E5E'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFF1DC';
  for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 97) % w, 30 + ((i * 53) % (h - 60)), 16, 0, 7); g.fill(); }
  g.fillStyle = '#FFA396'; g.fillRect(0, h / 2 - 6, w, 12);
});

export function createView(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const hemi = new THREE.HemisphereLight(); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff6e8'); sun.position.set(-5, 14, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const mat = {
    floor: new THREE.MeshStandardMaterial({ roughness: 0.9 }), base: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    wall: new THREE.MeshStandardMaterial({ roughness: 0.55 }), crack: new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: '#FF9A55', emissiveIntensity: 0 }),
    hole: new THREE.MeshBasicMaterial(), lip: new THREE.MeshStandardMaterial({ roughness: 0.5 }), ring: new THREE.MeshBasicMaterial(), trap: new THREE.MeshBasicMaterial(),
    coin: new THREE.MeshStandardMaterial({ color: '#FFD34E', metalness: 0.05, roughness: 0.35, emissive: '#E0A100' }),
    ball: new THREE.MeshStandardMaterial({ map: ballTex(), roughness: 0.32 }),
    trail: new THREE.MeshBasicMaterial({ color: '#FF9A55', transparent: true, depthWrite: false }),
  };
  const board = new THREE.Group(); scene.add(board);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R * U, 40, 24), mat.ball); ball.castShadow = true;
  const trail = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(R * U * 0.7, 12, 8), mat.trail.clone()); m.visible = false; return { m, t: 9 }; });
  const bitGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16), coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 28);
  let level = null, walls = [], coins = [], bits = [], trailI = 0, dark = false, clock = 0;
  const q = new THREE.Quaternion(), axis = new THREE.Vector3();

  function paint() {
    const p = dark ? PALETTE.dark : PALETTE.light;
    scene.background = new THREE.Color(p.bg);
    mat.floor.map?.dispose(); mat.floor.map = floorTex(p); mat.floor.needsUpdate = true;
    mat.crack.map?.dispose(); mat.crack.map = crackTex(p); mat.crack.emissiveIntensity = dark ? 0.15 : 0; mat.crack.needsUpdate = true;
    mat.wall.color.set(p.wall); mat.base.color.set(p.base); mat.hole.color.set(p.hole); mat.lip.color.set(p.lip); mat.ring.color.set(p.ring); mat.trap.color.set(p.trap);
    mat.coin.emissiveIntensity = p.glow;
    hemi.color.set(p.hemi[0]); hemi.groundColor.set(p.hemi[1]); hemi.intensity = p.hemi[2]; sun.intensity = p.sun;
  }

  function block(w, m) {
    const g = new RoundedBoxGeometry(w.w * U, WALL_H, w.h * U, 3, Math.min(0.22, Math.min(w.w, w.h) * U * 0.45));
    const mesh = new THREE.Mesh(g, m); mesh.position.set(X(w.x + w.w / 2), WALL_H / 2, Z(w.y + w.h / 2)); mesh.castShadow = mesh.receiveShadow = true;
    board.add(mesh); return mesh;
  }

  function clear() {
    for (const o of [...board.children]) { board.remove(o); if (o !== ball && !trail.some(t => t.m === o) && o.geometry !== coinGeo && o.geometry !== bitGeo) o.geometry?.dispose(); }
    walls = []; coins = []; bits = [];
  }

  function load(lv) {
    clear(); level = lv;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(BW * U, BH * U), mat.floor); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; board.add(floor);
    const base = new THREE.Mesh(new RoundedBoxGeometry(BW * U + 0.5, 0.8, BH * U + 0.5, 4, 0.25), mat.base); base.position.y = -0.41; base.receiveShadow = true; board.add(base);
    for (const w of [{ x: 0, y: 0, w: BW, h: RIM }, { x: 0, y: BH - RIM, w: BW, h: RIM }, { x: 0, y: 0, w: RIM, h: BH }, { x: BW - RIM, y: 0, w: RIM, h: BH }]) block(w, mat.wall);
    walls = lv.walls.map(w => block(w, w.kind === 'crack' ? mat.crack : mat.wall));
    coins = lv.coins.map(c => { const m = new THREE.Mesh(coinGeo, mat.coin); m.rotation.z = Math.PI / 2; m.position.set(X(c.x), 0.45, Z(c.y)); m.castShadow = true; board.add(m); return m; });
    // the goal wears a mint ring; trap holes an orange-red one
    for (const [h, ringMat] of [[lv.hole, mat.ring], ...(lv.traps || []).map(t => [t, mat.trap])]) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(h.r * U, 40), mat.hole);
      hole.rotation.x = -Math.PI / 2; hole.position.set(X(h.x), 0.008, Z(h.y)); board.add(hole);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(h.r * U + 0.04, 0.07, 10, 40), mat.lip); lip.rotation.x = Math.PI / 2; lip.position.copy(hole.position); board.add(lip);
      const ring = new THREE.Mesh(new THREE.RingGeometry(h.r * U + 0.12, h.r * U + 0.3, 40), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(X(h.x), 0.006, Z(h.y)); board.add(ring);
    }
    board.add(ball); for (const t of trail) { t.m.visible = false; board.add(t.m); }
    ball.quaternion.identity(); ball.visible = true; ball.scale.setScalar(1);
  }

  function shatter(i, b) {
    const w = level.walls[i];
    for (let k = 0; k < 22; k++) {
      const m = new THREE.Mesh(bitGeo, mat.crack); m.castShadow = true;
      m.position.set(X(w.x + Math.random() * w.w), Math.random() * WALL_H, Z(w.y + Math.random() * w.h)); board.add(m);
      bits.push({ m, v: new THREE.Vector3(b.vx * U * 0.25 + (Math.random() - 0.5) * 4, 2 + Math.random() * 3, b.vy * U * 0.25 + (Math.random() - 0.5) * 4), s: [Math.random() * 9, Math.random() * 9], t: 0 });
    }
  }

  function update(run, tilt, dt, events = []) {
    clock += dt;
    const b = run.ball, k = FEEL.lean * Math.PI / 180;
    board.rotation.x += (tilt.y * k - board.rotation.x) * 0.35; board.rotation.z += (-tilt.x * k - board.rotation.z) * 0.35;
    for (const e of events) if (e.type === 'break') shatter(e.wall, b);
    walls.forEach((m, i) => { m.visible = !run.state.broken.has(i); });
    coins.forEach((m, i) => { m.visible = !run.state.got.has(i); m.rotation.y += dt * 2.4; });
    // rolling: turned about the axis across its path by the distance over its radius
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0.01 && b.fall === 0) { axis.set(b.vy, 0, -b.vx).normalize(); q.setFromAxisAngle(axis, sp * dt / R); ball.quaternion.premultiply(q); }
    const sink = b.fall > 0 ? Math.min(1, b.fall / 0.5) : 0;
    ball.position.set(X(b.x), R * U - sink * R * U * 2.4, Z(b.y)); ball.scale.setScalar(1 - sink * 0.3); ball.visible = b.fall < 0.9;
    if (sp > FEEL.brk && b.fall === 0) { const t = trail[trailI++ % trail.length]; t.t = 0; t.m.position.copy(ball.position); t.m.visible = true; }
    for (const t of trail) if (t.m.visible) { t.t += dt; t.m.material.opacity = Math.max(0, 0.55 * (1 - t.t / 0.28)); t.m.scale.setScalar(Math.max(0.05, 1 - t.t * 2)); if (t.t > 0.28) t.m.visible = false; }
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i]; p.t += dt; p.v.y -= 14 * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += p.s[0] * dt; p.m.rotation.y += p.s[1] * dt;
      if (p.m.position.y < 0.08) { p.m.position.y = 0.08; p.v.y *= -0.35; p.v.x *= 0.7; p.v.z *= 0.7; }
      if (p.t > 1.4) { board.remove(p.m); bits.splice(i, 1); } else if (p.t > 1) p.m.scale.setScalar((1.4 - p.t) / 0.4);
    }
    if (dark) mat.ring.color.setHSL(0.44, 0.68, 0.6 + 0.06 * Math.sin(clock * 3));   // the hole breathes a little in the dark
    mat.trap.color.set(dark ? PALETTE.dark.trap : PALETTE.light.trap).offsetHSL(0, 0, 0.06 * Math.sin(clock * 5));   // trap holes flicker
    renderer.render(scene, camera);
  }

  function resize() {
    const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
    renderer.setSize(w, h); camera.aspect = w / h;
    // fit the board (and a little margin) between the bars at the top and bottom
    const a = VIEW_DEG * Math.PI / 180, share = Math.max(0.3, (h - BAR_TOP - BAR_BOTTOM) / h), f = Math.tan(camera.fov * Math.PI / 360);
    const d = Math.max((BH * U + 1.2) / share / (2 * f), (BW * U + 1.2) / (2 * f * camera.aspect)) + 1.2;
    camera.position.set(0, Math.sin(a) * d, Math.cos(a) * d); camera.lookAt(0, 0, 0.35); camera.updateProjectionMatrix();
  }

  function setDark(on) { dark = !!on; paint(); }
  function destroy() { clear(); renderer.dispose(); renderer.domElement.remove(); }

  paint(); resize();
  return { load, update, setDark, resize, destroy };
}
