// The board in 3D: soft toy blocks on a mint board, seen from a little toward the player, leaning with the phone.
// It only draws what the run says; it decides nothing.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FEEL } from './feel.js';
import { drawBall } from './look.js';

const { BW, BH, RIM, R } = FEEL;
const U = 0.1, WALL_H = 1.0, BAR_TOP = 92, BAR_BOTTOM = 92, VIEW_DEG = 62;
const X = x => (x - BW / 2) * U, Z = y => (y - BH / 2) * U;

const PALETTE = {
  light: { bg: '#EAF8F1', floor: '#C7EFDB', dot: '#B1E4CB', wall: '#FFFFFF', base: '#FFFFFF', crack: '#FFD7A3', crackLine: '#E39B57', hole: '#0E2F2A', lip: '#FFFFFF', ring: '#7FD4B4', trap: '#FF8A65', glow: 0.35, hemi: ['#ffffff', '#9fd9bf', 1.15], sun: 1.9 },
  dark: { bg: '#0F1A1F', floor: '#15262B', dot: '#203A40', wall: '#2E474F', base: '#263C43', crack: '#B9824C', crackLine: '#6B4A2A', hole: '#000000', lip: '#3B5A62', ring: '#55E0AE', trap: '#FF7A59', glow: 0.9, hemi: ['#9fc6d8', '#0b1418', 0.75], sun: 0.9 },
};

// each world tints the board; what it does not name comes from the palette above
const WORLD_TINT = {
  2: { light: { bg: '#EAF4FB', floor: '#CDEBFA', dot: '#B5DDF4', ring: '#7FC4E8' }, dark: { bg: '#0E1A22', floor: '#142630', dot: '#1E3A48', ring: '#6FD0FF' } },
  3: { light: { bg: '#FFF1E6', floor: '#FFE2CC', dot: '#FFD0AE', ring: '#FFB48A' }, dark: { bg: '#1A1210', floor: '#2A1A14', dot: '#3A2418', ring: '#FFB48A' } },
  4: { light: { bg: '#F2F8FC', floor: '#E3F1F8', dot: '#CFE6F2', ring: '#8FD8F0' }, dark: { bg: '#0D161C', floor: '#16242C', dot: '#22343E', ring: '#8FD8F0' } },
  5: { light: { bg: '#F3F6FF', floor: '#FFF8D9', dot: '#F4E9B5', ring: '#5B8CFF' }, dark: { bg: '#10131F', floor: '#1B1F2E', dot: '#2A3048', ring: '#7FA2FF' } },
  6: { light: { bg: '#F4F1EC', floor: '#E6DFD5', dot: '#D6CDC0', ring: '#9A8F86' }, dark: { bg: '#141210', floor: '#221E1A', dot: '#322C26', ring: '#C9BEB3' } },
  7: { light: { bg: '#EEF8F3', floor: '#DDF2E8', dot: '#C6E7D8', ring: '#9CD66A' }, dark: { bg: '#0E1712', floor: '#16241D', dot: '#22352B', ring: '#B8E986' } },
  8: { light: { bg: '#F5F2FB', floor: '#E7E0F5', dot: '#D6CCEB', ring: '#9C7BFF' }, dark: { bg: '#110F18', floor: '#1C1928', dot: '#2A2538', ring: '#B49CFF' } },
  9: { light: { bg: '#0B0D14', floor: '#1A1D2B', dot: '#242838', ring: '#9C7BFF' }, dark: { bg: '#05060A', floor: '#14161F', dot: '#1E2130', ring: '#B49CFF' } },
  10: { light: { bg: '#FBF6EA', floor: '#F2E6C8', dot: '#E6D6AE', ring: '#E0A100' }, dark: { bg: '#15120A', floor: '#231E12', dot: '#33291A', ring: '#FFC93C' } },
};
const ELEMENT_COLOR = { water: '#5BB8F5', fire: '#FF7A45', ice: '#8FD8F0', spark: '#FFD23F', stone: '#9A8F86', gas: '#B8E986' };

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
const ballTex = look => {   // the player's look (see look.js); a pattern shows the ball rolling
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; drawBall(c, look);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const LOOK0 = { mode: 'pattern', pattern: 'dots', base: 'coral', accent: 'cream', pixels: [] };

// Lava in the soft-toy look: a glossy orange jelly with pale round blobs drifting slowly across it and a soft sheen,
// smooth low-frequency noise only, so it sits with the rounded blocks rather than looking like real rock.
function lavaMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vP;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      void main() {
        vec2 p = vP * 0.9;
        float n = noise(p + vec2(uTime * 0.16, uTime * 0.1)) * 0.6 + noise(p * 1.7 - uTime * 0.12) * 0.4;
        float blob = smoothstep(0.6, 0.68, n);                                   // pale round spots, soft-edged
        vec3 col = mix(vec3(1.0, 0.195, 0.045), vec3(1.0, 0.56, 0.15), blob);    // #FF7A3C and #FFC56B, in linear
        float sheen = smoothstep(0.82, 1.0, 0.5 + 0.5 * sin(vP.x * 0.7 + vP.y * 0.5 + uTime * 0.7));
        col += vec3(0.35, 0.25, 0.15) * sheen * 0.35;                            // a gloss passing over it
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

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
    ball: new THREE.MeshStandardMaterial({ map: ballTex(LOOK0), roughness: 0.32 }),
    trail: new THREE.MeshBasicMaterial({ color: '#FF9A55', transparent: true, depthWrite: false }),
    pool: new THREE.MeshStandardMaterial({ color: '#8FD3FF', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.8 }),
    vent: new THREE.MeshStandardMaterial({ color: '#8B5A48', roughness: 0.8 }),
    flame: new THREE.MeshStandardMaterial({ color: '#FF8A3D', emissive: '#FF5A1E', emissiveIntensity: 1.2, transparent: true, opacity: 0.92 }),
    core: new THREE.MeshStandardMaterial({ color: '#FFE08A', emissive: '#FFC23D', emissiveIntensity: 1.4 }),
    steam: new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, depthWrite: false }),
    coat: new THREE.MeshStandardMaterial({ color: '#5BB8F5', transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }),
    vine: new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#6FBF5A'; g.fillRect(0, 0, w, h); g.fillStyle = '#4E9A3E'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse((i * 53) % w, (i * 29) % h, 9, 5, i, 0, 7); g.fill(); } }), roughness: 0.8 }),
    ice: new THREE.MeshStandardMaterial({ color: '#CFEFFF', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.78 }),
    door: new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#B07A4F'; g.fillRect(0, 0, w, h); g.fillStyle = '#8A5A36'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 4, h); }), roughness: 0.7 }),
    lava: lavaMaterial(),
    stone: new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => {   // lava gone cold: soft grey pebbles
      g.fillStyle = '#C2B8B0'; g.fillRect(0, 0, w, h); g.fillStyle = '#AEA39A';
      for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse((i * 71) % w, (i * 113) % h, 14 + (i % 3) * 6, 10 + (i % 4) * 4, i, 0, 7); g.fill(); }
    }), roughness: 0.85 }),
    rim: new THREE.MeshStandardMaterial({ color: '#E0784A', roughness: 0.6 }),
    bubble: new THREE.MeshStandardMaterial({ color: '#FFD089', emissive: '#FFB347', emissiveIntensity: 0.4, roughness: 0.3 }),
    post: new THREE.MeshStandardMaterial({ color: '#6B4A35', roughness: 0.8 }),
    slick: new THREE.MeshStandardMaterial({ color: '#F4FBFF', roughness: 0.04, metalness: 0.25, transparent: true, opacity: 0.85 }),
    deep: new THREE.MeshStandardMaterial({ color: '#2F7FB8', roughness: 0.1, metalness: 0.1 }),
    fence: new THREE.MeshStandardMaterial({ map: canvasTex(128, 32, (g, w, h) => { g.fillStyle = '#FFD23F'; g.fillRect(0, 0, w, h); g.fillStyle = '#2B2F45'; for (let x = -32; x < w; x += 24) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 12, 0); g.lineTo(x + 24, 0); g.lineTo(x + 12, h); g.fill(); } }), emissive: '#FFB800', emissiveIntensity: 0.25, roughness: 0.5 }),
    zap: new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#DCE8FF'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7FA2FF'; g.lineWidth = 6; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); } }), emissive: '#5B8CFF', emissiveIntensity: 0.6, roughness: 0.6 }),
    box: new THREE.MeshStandardMaterial({ color: '#FFD23F', emissive: '#FFB800', emissiveIntensity: 0 }),
    foe: new THREE.MeshStandardMaterial({ color: '#8A6BFF', emissive: '#5A3FD9', emissiveIntensity: 0.35, roughness: 0.4 }),
    eye: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
    gap: new THREE.MeshBasicMaterial({ color: '#1E2A33' }),
    thick: new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#A39A90'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7E756C'; g.lineWidth = 4; for (let r = 0; r < 2; r++) for (let x = (r % 2) * 24; x < w; x += 48) g.strokeRect(x, r * h / 2, 48, h / 2); }), roughness: 0.95 }),
  };
  const WALL_MAT = { wall: mat.wall, crack: mat.crack, vine: mat.vine, ice: mat.ice, door: mat.door, fence: mat.fence, thick: mat.thick };
  const board = new THREE.Group(); scene.add(board);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R * U, 40, 24), mat.ball); ball.castShadow = true;
  const coat = new THREE.Mesh(new THREE.SphereGeometry(R * U * 1.28, 32, 20), mat.coat); coat.visible = false;   // the element the ball wears
  const lamp = new THREE.PointLight('#fff2dd', 0, 5.5, 1.6); lamp.castShadow = false;   // in the dark, the ball carries the only light
  const trail = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(R * U * 0.7, 12, 8), mat.trail.clone()); m.visible = false; return { m, t: 9 }; });
  const bitGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16), coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 28);
  let level = null, walls = [], coins = [], bits = [], fires = [], puffs = [], lavas = [], torches = [], deeps = [], switches = [], foes = [], winds = [], trailI = 0, dark = false, clock = 0;
  const q = new THREE.Quaternion(), axis = new THREE.Vector3();

  function paint() {
    const p = { ...(dark ? PALETTE.dark : PALETTE.light), ...WORLD_TINT[level?.world]?.[dark ? 'dark' : 'light'] };
    scene.background = new THREE.Color(p.bg);
    mat.floor.map?.dispose(); mat.floor.map = floorTex(p); mat.floor.needsUpdate = true;
    mat.crack.map?.dispose(); mat.crack.map = crackTex(p); mat.crack.emissiveIntensity = dark ? 0.15 : 0; mat.crack.needsUpdate = true;
    mat.wall.color.set(p.wall); mat.base.color.set(p.base); mat.hole.color.set(p.hole); mat.lip.color.set(p.lip); mat.ring.color.set(p.ring); mat.trap.color.set(p.trap);
    mat.coin.emissiveIntensity = p.glow;
    hemi.color.set(p.hemi[0]); hemi.groundColor.set(p.hemi[1]); hemi.intensity = p.hemi[2]; sun.intensity = p.sun;
    if (level?.dim) { hemi.intensity = 0.05; sun.intensity = 0.03; lamp.intensity = 5; } else lamp.intensity = 0;
  }

  function block(w, m) {
    const g = new RoundedBoxGeometry(w.w * U, WALL_H, w.h * U, 3, Math.min(0.22, Math.min(w.w, w.h) * U * 0.45));
    const mesh = new THREE.Mesh(g, m); mesh.position.set(X(w.x + w.w / 2), WALL_H / 2, Z(w.y + w.h / 2)); mesh.castShadow = mesh.receiveShadow = true;
    board.add(mesh); return mesh;
  }

  function clear() {
    for (const o of [...board.children]) { board.remove(o); if (o !== ball && !trail.some(t => t.m === o) && o.geometry !== coinGeo && o.geometry !== bitGeo) o.geometry?.dispose(); }
    walls = []; coins = []; bits = []; fires = []; puffs = []; lavas = []; torches = []; deeps = []; switches = []; foes = []; winds = [];
  }

  function load(lv) {
    clear(); level = lv;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(BW * U, BH * U), mat.floor); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; board.add(floor);
    const base = new THREE.Mesh(new RoundedBoxGeometry(BW * U + 0.5, 0.8, BH * U + 0.5, 4, 0.25), mat.base); base.position.y = -0.41; base.receiveShadow = true; board.add(base);
    for (const w of [{ x: 0, y: 0, w: BW, h: RIM }, { x: 0, y: BH - RIM, w: BW, h: RIM }, { x: 0, y: 0, w: RIM, h: BH }, { x: BW - RIM, y: 0, w: RIM, h: BH }]) block(w, mat.wall);
    walls = lv.walls.map(w => block(w, WALL_MAT[w.kind] || mat.wall));
    coins = lv.coins.map(c => { const m = new THREE.Mesh(coinGeo, mat.coin); m.rotation.z = Math.PI / 2; m.position.set(X(c.x), 0.45, Z(c.y)); m.castShadow = true; board.add(m); return m; });
    // the goal wears a mint ring; trap holes an orange-red one
    for (const [h, ringMat] of [[lv.hole, mat.ring], ...(lv.traps || []).map(t => [t, mat.trap])]) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(h.r * U, 40), mat.hole);
      hole.rotation.x = -Math.PI / 2; hole.position.set(X(h.x), 0.008, Z(h.y)); board.add(hole);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(h.r * U + 0.04, 0.07, 10, 40), mat.lip); lip.rotation.x = Math.PI / 2; lip.position.copy(hole.position); board.add(lip);
      const ring = new THREE.Mesh(new THREE.RingGeometry(h.r * U + 0.12, h.r * U + 0.3, 40), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(X(h.x), 0.006, Z(h.y)); board.add(ring);
    }
    for (const p of lv.pools || []) {
      const m = new THREE.Mesh(roundRect(p.w * U, p.h * U, Math.min(p.w, p.h) * U * 0.45), mat.pool); m.rotation.x = -Math.PI / 2; m.position.set(X(p.x + p.w / 2), 0.01, Z(p.y + p.h / 2)); m.receiveShadow = true; board.add(m);
    }
    fires = (lv.fires || []).map(f => {   // a vent with a flame standing on it
      const g = new THREE.Group(); g.position.set(X(f.x), 0, Z(f.y));
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(f.r * U * 0.85, f.r * U, 0.16, 20), mat.vent); vent.position.y = 0.08; vent.receiveShadow = true; g.add(vent);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(f.r * U * 0.8, 1.5, 18), mat.flame); flame.position.y = 0.9; g.add(flame);
      const core = new THREE.Mesh(new THREE.ConeGeometry(f.r * U * 0.4, 0.9, 14), mat.core); core.position.y = 0.6; g.add(core);
      board.add(g); return { g, flame, core, f };
    });
    const flat = (r, m, y) => { const g = new THREE.Mesh(roundRect(r.w * U, r.h * U, Math.min(r.w, r.h) * U * 0.25), m); g.rotation.x = -Math.PI / 2; g.position.set(X(r.x + r.w / 2), y, Z(r.y + r.h / 2)); g.receiveShadow = true; board.add(g); return g; };
    for (const r of lv.slick || []) flat(r, mat.slick, 0.006);
    deeps = (lv.deep || []).map(r => flat(r, mat.deep, 0.009));
    for (const z of lv.zaps || []) flat(z, mat.zap, 0.007);
    for (const g of lv.gaps || []) flat(g, mat.gap, 0.011);
    winds = (lv.winds || []).map(a => {   // stripes that run the way the wind blows
      const t = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5; for (let y = 8; y < h; y += 21) { g.beginPath(); g.moveTo(8, y); g.lineTo(40, y); g.lineTo(32, y - 6); g.moveTo(40, y); g.lineTo(32, y + 6); g.stroke(); } });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(a.w / 22, a.h / 22); t.center.set(0.5, 0.5); t.rotation = -Math.atan2(a.dy, a.dx);
      const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.75, depthWrite: false, color: "#5FA88A" });
      flat(a, m, 0.013); return { t, a };
    });
    switches = (lv.switches || []).map(w => {   // a post with a box that lights when powered
      const g = new THREE.Group(); g.position.set(X(w.x), 0, Z(w.y));
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 10), mat.post); post.position.y = 0.35; g.add(post);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.36), mat.box.clone()); box.position.y = 0.8; box.castShadow = true; g.add(box);
      board.add(g); return box;
    });
    foes = (lv.enemies || []).map(() => {   // a purple ball with two cross eyes
      const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 16), mat.foe); body.castShadow = true; g.add(body);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.05), mat.eye); e.position.set(sx * 0.11, 0.1, 0.33); e.rotation.z = sx * 0.4; g.add(e); }
      board.add(g); return g;
    });
    lavas = (lv.lava || []).map(L => {   // a dark stone lip, the molten surface inside it, and bubbles that swell and burst
      const cr = Math.min(L.w, L.h) * U * 0.3;
      const rim = new THREE.Mesh(roundRect(L.w * U + 0.3, L.h * U + 0.3, cr + 0.15), mat.rim); rim.rotation.x = -Math.PI / 2; rim.position.set(X(L.x + L.w / 2), 0.008, Z(L.y + L.h / 2)); rim.receiveShadow = true; board.add(rim);
      const m = new THREE.Mesh(roundRect(L.w * U, L.h * U, cr), mat.lava); m.rotation.x = -Math.PI / 2; m.position.set(X(L.x + L.w / 2), 0.014, Z(L.y + L.h / 2)); board.add(m);
      const bubbles = Array.from({ length: Math.max(2, Math.round(L.w * L.h / 250)) }, (_, k) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat.bubble); board.add(b); return { b, t: -k * 0.37, L };
      });
      return { m, bubbles };
    });
    torches = (lv.torches || []).map(t => {   // a post with a bowl; a flame once lit
      const g = new THREE.Group(); g.position.set(X(t.x), 0, Z(t.y));
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.9, 10), mat.post); post.position.y = 0.45; post.castShadow = true; g.add(post);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.14, 0.18, 14), mat.vent); bowl.position.y = 0.95; g.add(bowl);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 14), mat.flame); flame.position.y = 1.35; flame.visible = false; g.add(flame);
      board.add(g); return { g, flame };
    });
    board.add(ball); board.add(coat); board.add(lamp); for (const t of trail) { t.m.visible = false; board.add(t.m); }
    ball.quaternion.identity(); ball.visible = true; ball.scale.setScalar(1); coat.visible = false;
    paint();
  }
  function roundRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return new THREE.ShapeGeometry(s, 8);
  }
  function steam(f) {
    for (let k = 0; k < 10; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.14, 10, 8), mat.steam.clone()); m.position.set(X(f.x) + (Math.random() - 0.5) * 0.5, 0.3, Z(f.y) + (Math.random() - 0.5) * 0.5);
      board.add(m); puffs.push({ m, t: 0, v: 1.2 + Math.random() });
    }
  }

  function shatter(i, b) {
    const w = level.walls[i], m0 = WALL_MAT[w.kind] || mat.crack;
    for (let k = 0; k < 22; k++) {
      const m = new THREE.Mesh(bitGeo, m0); m.castShadow = true;
      m.position.set(X(w.x + Math.random() * w.w), Math.random() * WALL_H, Z(w.y + Math.random() * w.h)); board.add(m);
      bits.push({ m, v: new THREE.Vector3(b.vx * U * 0.25 + (Math.random() - 0.5) * 4, 2 + Math.random() * 3, b.vy * U * 0.25 + (Math.random() - 0.5) * 4), s: [Math.random() * 9, Math.random() * 9], t: 0 });
    }
  }

  function update(run, tilt, dt, events = []) {
    clock += dt;
    const b = run.ball, k = FEEL.lean * Math.PI / 180;
    board.rotation.x += (tilt.y * k - board.rotation.x) * 0.35; board.rotation.z += (-tilt.x * k - board.rotation.z) * 0.35;
    for (const e of events) {
      if (e.type === 'break' || e.type === 'burnwall') shatter(e.wall, b);
      if (e.type === 'douse') steam(level.fires[e.fire]);
      if (e.type === 'boom') { const at = e.torch != null ? level.torches[e.torch] : level.fires[e.fire]; steam(at); steam(at); }
      if (e.type === 'cool') { const L = level.lava[e.lava]; steam({ x: L.x + L.w / 2, y: L.y + L.h / 2 }); }
      if (e.type === 'freeze') { const D = level.deep[e.deep]; steam({ x: D.x + D.w / 2, y: D.y + D.h / 2 }); }
    }
    lavas.forEach((p, i) => {
      const cold = run.state.cooled?.has(i); p.m.material = cold ? mat.stone : mat.lava;
      for (const B of p.bubbles) {   // a bubble swells for a while, bursts, and comes up somewhere else
        B.t += dt; if (B.t > 1.1 || B.t < 0) { if (B.t > 1.1) B.t = -Math.random() * 0.8; B.b.visible = false; continue; }
        if (B.t - dt <= 0) B.b.position.set(X(B.L.x + 2 + Math.random() * (B.L.w - 4)), 0.03, Z(B.L.y + 2 + Math.random() * (B.L.h - 4)));
        B.b.visible = !cold; const k = B.t < 0.95 ? B.t / 0.95 : 1 + (B.t - 0.95) * 6; B.b.scale.set(k, k * 0.6, k);
      }
    });
    mat.lava.uniforms.uTime.value = clock;
    deeps.forEach((m, i) => { m.material = run.state.frozen?.has(i) ? mat.slick : mat.deep; });
    switches.forEach((b, i) => { b.material.emissiveIntensity = run.state.powered?.has(i) ? 1.2 : 0; });
    mat.zap.emissiveIntensity = (run.state.clock || 0) % 4 < 2 ? 0.7 + 0.3 * Math.sin(clock * 30) : 0.05;   // on for two seconds, off for two
    foes.forEach((g, i) => { const f = run.state.foes?.[i] || level.enemies[i]; g.position.set(X(f.x), 0.36 + 0.05 * Math.sin(clock * 6 + i), Z(f.y)); g.lookAt(ball.position.x, g.position.y, ball.position.z); });
    torches.forEach((t, i) => { t.flame.visible = !!run.state.lit?.has(i); t.flame.scale.set(1, 1 + 0.15 * Math.sin(clock * 11 + i), 1); });
    for (const w of winds) { const sp = Math.hypot(w.a.dx, w.a.dy) / 600 * dt; w.t.offset.x -= sp; }   // the stripes drift with the wind
    fires.forEach((F, i) => {   // flames sway; put out, only the vent is left
      const out = run.state.doused?.has(i); F.flame.visible = F.core.visible = !out;
      const k = 1 + 0.12 * Math.sin(clock * 9 + i) + 0.06 * Math.sin(clock * 23 + i * 2); F.flame.scale.set(1, k, 1); F.core.scale.set(1, 2 - k, 1);
    });
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]; p.t += dt; p.m.position.y += p.v * dt; p.m.scale.setScalar(1 + p.t * 1.5); p.m.material.opacity = Math.max(0, 0.7 * (1 - p.t / 1.4));
      if (p.t > 1.4) { board.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); puffs.splice(i, 1); }
    }
    walls.forEach((m, i) => { m.visible = !run.state.broken.has(i); });
    coins.forEach((m, i) => { m.visible = !run.state.got.has(i); m.rotation.y += dt * 2.4; });
    // rolling: turned about the axis across its path by the distance over its radius
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0.01 && b.fall === 0) { axis.set(b.vy, 0, -b.vx).normalize(); q.setFromAxisAngle(axis, sp * dt / R); ball.quaternion.premultiply(q); }
    const sink = b.fall > 0 ? Math.min(1, b.fall / 0.5) : 0;
    ball.position.set(X(b.x), R * U - sink * R * U * 2.4, Z(b.y)); ball.scale.setScalar(1 - sink * 0.3); ball.visible = b.fall < 0.9;
    coat.visible = !!run.coat && ball.visible; coat.position.copy(ball.position); lamp.position.set(ball.position.x, 1.4, ball.position.z);
    if (run.coat) { const k = run.coat.el === 'stone' ? 0.8 : 0.38; mat.coat.color.set(ELEMENT_COLOR[run.coat.el] || '#ffffff'); mat.coat.opacity = run.coat.left < 1.5 ? k * (0.5 + 0.5 * (Math.sin(clock * 18) > 0)) : k; }   // stone all but hides the ball   // blinks as it wears off
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
  function setLook(look) { mat.ball.map?.dispose(); mat.ball.map = ballTex(look); mat.ball.needsUpdate = true; }
  function destroy() { clear(); renderer.dispose(); renderer.domElement.remove(); }

  paint(); resize();
  return { load, update, setDark, setLook, resize, destroy };
}
