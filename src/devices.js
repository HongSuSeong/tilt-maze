// How the board's devices look: puddles, deep water, lava, fire vents, holes in the floor and electric fences. Each is
// drawn with an uneven outline the size of its rectangle, so it reads as the real thing; what they do is in physics.js.
import * as THREE from 'three';
import { flameIcon } from './forms.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function rnd(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
const around = (w, h) => [-w, 0, w].flatMap(ox => [-h, 0, h].map(oy => [ox, oy]));   // draw at every neighbour too, so a texture tiles

// textures are drawn once and shared by every device and level
const cache = {};
const once = (k, make) => (cache[k] ??= make());
const repeat = (t, per) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / per, 1 / per); return t; };   // shape UVs are in world units
const TEX = {
  glow: (inner, outer) => once(`glow${inner}${outer}`, () => tex(128, 128, (c, w, h) => { const q = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); q.addColorStop(0, inner); q.addColorStop(0.55, outer); q.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = q; c.fillRect(0, 0, w, h); })),
  lava: () => once('lava', () => repeat(tex(256, 256, (c, w, h) => { c.fillStyle = '#FF4E1C'; c.fillRect(0, 0, w, h); const q = rnd(37);   // cartoon lava: soft yellow blobs on red-orange
    for (let i = 0; i < 12; i++) { const x = q() * w, y = q() * h, rx = 14 + q() * 22, a = q() * 3; for (const [ox, oy] of around(w, h)) { c.fillStyle = '#FF8A26'; c.beginPath(); c.ellipse(x + ox, y + oy, rx, rx * 0.6, a, 0, 7); c.fill(); c.fillStyle = '#FFD04A'; c.beginPath(); c.ellipse(x + ox - 3, y + oy - 2, rx * 0.45, rx * 0.25, 0.4, 0, 7); c.fill(); } } }), 3)),
  stone: () => once('stone', () => repeat(tex(128, 128, (c, w, h) => { c.fillStyle = '#8C857E'; c.fillRect(0, 0, w, h); const q = rnd(3);   // lava gone cold
    for (let i = 0; i < 16; i++) { const x = q() * w, y = q() * h, r = 6 + q() * 10; for (const [ox, oy] of around(w, h)) { c.fillStyle = q() < 0.5 ? '#9E978F' : '#7A736C'; c.beginPath(); c.ellipse(x + ox, y + oy, r, r * 0.7, 0, 0, 7); c.fill(); } } }), 1.6)),
  ice: () => once('ice', () => repeat(tex(128, 128, (c, w, h) => { c.fillStyle = '#D6F0FF'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineCap = 'round';   // a frozen surface
    for (const [x, y, l] of [[20, 30, 40], [70, 80, 30], [90, 20, 22], [30, 100, 26]]) { c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y - l * 0.6); c.stroke(); } }), 2)),
  wave: () => once('wave', () => repeat(tex(128, 128, (g, w, h) => { g.fillStyle = '#1F5F99'; g.fillRect(0, 0, w, h); g.strokeStyle = '#CFEAFF'; g.lineWidth = 5; g.lineCap = 'round';   // deep water: little white wave marks
    for (const [x, y] of [[20, 30], [84, 62], [40, 104], [104, 14]]) for (const [ox, oy] of around(w, h)) { g.beginPath(); g.arc(x + ox, y + oy, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }), 1.4)),
  soil: () => once('soil', () => tex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h);   // the side of a hole: soil under the floor, darker the deeper
    g.addColorStop(0, '#9C7650'); g.addColorStop(0.08, '#8A6542'); g.addColorStop(0.1, '#6E4E33'); g.addColorStop(0.3, '#5A3F2A'); g.addColorStop(0.33, '#4A3322'); g.addColorStop(0.55, '#3A281A'); g.addColorStop(0.62, '#2E2015'); g.addColorStop(1, '#050302'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const q = rnd(5); c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 18; i++) { c.beginPath(); c.ellipse(q() * w, q() * h * 0.5, 2 + q() * 4, 1.5 + q() * 2, 0, 0, 7); c.fill(); } })),
  bank: () => once('bank', () => tex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9C7650'); g.addColorStop(0.15, '#7A5A3C'); g.addColorStop(0.5, '#4E3826'); g.addColorStop(1, '#2A1E14'); c.fillStyle = g; c.fillRect(0, 0, w, h); })),
  stripes: () => once('stripes', () => { const t = tex(128, 32, (c, w, h) => { c.fillStyle = '#FFD23F'; c.fillRect(0, 0, w, h); c.fillStyle = '#1E1E28'; for (let x = -32; x < w; x += 32) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 16, 0); c.lineTo(x + 32, 0); c.lineTo(x + 16, h); c.fill(); } }); t.wrapS = THREE.RepeatWrapping; return t; }),
  sign: () => once('sign', () => tex(128, 128, (c) => { c.fillStyle = '#FFD23F'; c.strokeStyle = '#1E1E28'; c.lineWidth = 8; c.lineJoin = 'round'; c.beginPath(); c.moveTo(64, 10); c.lineTo(120, 112); c.lineTo(8, 112); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#1E1E28'; c.beginPath(); for (const [x, y] of [[70, 34], [46, 76], [62, 76], [54, 102], [82, 60], [66, 60], [74, 34]]) c.lineTo(x, y); c.fill(); })),
};

// `margin`: how far inside its rectangle a device starts to catch the ball (world units); its outline always covers that,
// with corners rounded by `round`
// `box`: the part of the board (in board units) a device may reach, under the rim but never past it; `dim`: a level in the
// dark, where water glows a little by itself
export function makeDevices({ board, X, Z, U, margin = 0, round = 0, box, dim = false }) {
  const ticks = [], R = rnd(97);
  let seeds = 1;
  // a device's group sits at the middle of its rectangle; shapes are laid flat in it
  const group = (x, y) => { const g = new THREE.Group(); g.position.set(X(x), 0, Z(y)); board.add(g); return g; };
  const put = (g, o, v = null, h = 0) => { if (v) o.position.set(v.x, h, -v.y); else o.position.y = h; g.add(o); return o; };
  const lay = (g, pts, m, h) => { const o = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts), 1), m); o.rotation.x = -Math.PI / 2; return put(g, o, null, h); };
  const plane = (g, size, t, h, add = false) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), basic('#FFFFFF', { map: t, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); o.rotation.x = -Math.PI / 2; return put(g, o, null, h); };
  const scaled = (pts, k) => pts.map(v => v.clone().multiplyScalar(k));
  const along = (pts, every) => { const out = []; let need = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], d = a.distanceTo(b); let t = need; for (; t < d; t += every) out.push(a.clone().lerp(b, t / d)); need = t - d; } return out; };
  const rock = (r, color) => { const g = new THREE.DodecahedronGeometry(r, 0); g.scale(1, 0.55, 1); const m = new THREE.Mesh(g, std(color, { roughness: 0.95, flatShading: true })); m.rotation.y = R() * 6; m.castShadow = true; return m; };
  // an uneven, soft-cornered outline the size of w × h; it never leaves uncovered the part inside `margin` of the edge
  // keeps a point of a device centred on rectangle r on the board
  const fit = (r, v) => { if (!box) return v; const cx = r.x + r.w / 2, cy = r.y + r.h / 2; return v.set(Math.min(Math.max(v.x, (box.x0 - cx) * U), (box.x1 - cx) * U), Math.min(Math.max(v.y, (cy - box.y1) * U), (cy - box.y0) * U)); };
  function edge(r, seed, { wob = 0.06, sq = 3.2, grow = 0 } = {}) {
    const w = r.w * U, h = r.h * U, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const q = rnd(seed), waves = [[2 + Math.floor(q() * 2), q() * 6, wob], [5 + Math.floor(q() * 3), q() * 6, wob * 0.5], [11, q() * 6, wob * 0.2]], hx = w / 2 - margin, hy = h / 2 - margin, cr = Math.min(round, hx, hy);
    const inner = v => { const dx = Math.max(0, Math.abs(v.x) - (hx - cr)), dy = Math.max(0, Math.abs(v.y) - (hy - cr)); return Math.abs(v.x) < hx && Math.abs(v.y) < hy && dx * dx + dy * dy < cr * cr; };   // where the ball is caught, its corners rounded like the ball
    return Array.from({ length: 120 }, (_, i) => {
      const a = i / 120 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), b = (Math.abs(c) ** sq + Math.abs(s) ** sq) ** (-1 / sq), k = 1 + waves.reduce((t, [f, p, A]) => t + A * Math.sin(f * a + p), 0);
      const v = new THREE.Vector2(c * b * k * w / 2, s * b * k * h / 2);
      if (inner(v)) { let lo = 1, hi = 3; for (let n = 0; n < 16; n++) { const m = (lo + hi) / 2; if (inner(v.clone().multiplyScalar(m))) lo = m; else hi = m; } v.multiplyScalar(hi); }
      v.add(new THREE.Vector2(c * grow, s * grow));
      return fit(r, v);
    });
  }
  // the floor cut away over pts, its sides going `depth` down; what is drawn inside must come first (renderOrder -2)
  function cut(g, pts, depth, wall) {
    const t = wall.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1 / depth); t.needsUpdate = true;
    const sides = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: false, curveSegments: 1 }), std('#FFFFFF', { map: t, side: THREE.BackSide, roughness: 1 }));
    sides.geometry.rotateX(-Math.PI / 2); sides.geometry.translate(0, -depth, 0); sides.renderOrder = -2; g.add(sides);
    lay(g, pts, new THREE.MeshBasicMaterial({ colorWrite: false }), 0.004).renderOrder = -1;   // keeps the floor from drawing over the hole
  }
  const ripples = (g, w, h, n, y) => {   // rings that spread from somewhere on the water and fade
    const rings = Array.from({ length: n }, (_, k) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40), basic('#FFFFFF', { transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return { m: put(g, m, null, y), t: k / n }; });
    ticks.push(dt => { if (!g.visible) return; for (const q of rings) { q.t += dt * 0.45; if (q.t > 1) { q.t -= 1; q.m.position.x = (R() - 0.5) * w * 0.5; q.m.position.z = (R() - 0.5) * h * 0.5; } q.m.scale.setScalar(0.05 + q.t * 0.6); q.m.material.opacity = 0.7 * (1 - q.t); } });
  };
  const wet = (color, o = {}) => std(color, { emissive: dim ? color : '#000000', emissiveIntensity: 0.45, ...o });
  const ice = (g, pts, h) => { const m = lay(g, pts, std('#FFFFFF', { map: TEX.ice(), roughness: 0.08 }), h); m.visible = false; return m; };

  return {
    pool(r) {   // a puddle: wet ground round it, a shallow edge, a deeper middle, sky gleams and rings; frozen, ice
      const w = r.w * U, h = r.h * U, sd = seeds++, out = edge(r, sd, { wob: 0.07 }), g = group(r.x + r.w / 2, r.y + r.h / 2), water = new THREE.Group(); g.add(water);
      lay(g, edge(r, sd, { wob: 0.07, grow: 0.22 }), basic('#0B3A4A', { transparent: true, opacity: 0.16, depthWrite: false }), 0.004);
      lay(water, out, wet('#A6DCF6', { roughness: 0.1 }), 0.008); lay(water, scaled(out, 0.84), wet('#6DB8E6', { roughness: 0.08 }), 0.009); lay(water, scaled(edge(r, sd + 50, { wob: 0.1 }), 0.58), wet('#4A9AD6', { roughness: 0.06 }), 0.01);
      for (const [dx, dy, l] of [[-0.18, -0.2, 0.42], [-0.06, -0.08, 0.26], [0.2, 0.16, 0.16]]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), basic('#FFFFFF', { transparent: true, opacity: 0.8 })); m.scale.set(l * w, 0.07 * h, 1); m.rotation.set(-Math.PI / 2, 0, 0.6); put(water, m, new THREE.Vector2(dx * w, -dy * h), 0.011); }
      ripples(water, w, h, 2, 0.012);
      for (const v of [out[8], out[70]]) put(g, rock(0.09, '#9AA3A8'), v, 0.02);
      const frozen = ice(g, out, 0.01);
      return { set(iced) { water.visible = !iced; frozen.visible = iced; } };
    },
    deep(r) {   // a pond sunk below the floor, soil banks down to the water; frozen, a sheet of ice across it
      const w = r.w * U, h = r.h * U, out = edge(r, seeds++), g = group(r.x + r.w / 2, r.y + r.h / 2), water = new THREE.Group(); g.add(water);
      cut(g, out, 0.45, TEX.bank());
      lay(water, out, wet('#FFFFFF', { map: TEX.wave(), emissiveMap: TEX.wave(), roughness: 0.25 }), -0.32).renderOrder = -2;
      lay(water, scaled(out, 0.6), basic('#0E3460', { transparent: true, opacity: 0.35, depthWrite: false }), -0.315).renderOrder = -2;
      const frozen = ice(g, out, 0.012);
      return { set(iced) { frozen.visible = iced; } };
    },
    lava(r) {   // cartoon lava in a dark rim, heat on the floor round it, bubbles and sparks; cooled, grey stone
      const w = r.w * U, h = r.h * U, sd = seeds++, out = edge(r, sd), g = group(r.x + r.w / 2, r.y + r.h / 2), hot = new THREE.Group(); g.add(hot);
      plane(hot, [w + 1.2, h + 1.2], TEX.glow('rgba(255,110,30,.45)', 'rgba(255,90,20,.14)'), 0.003);
      lay(g, edge(r, sd, { grow: 0.16 }), basic('#4A1E14'), 0.006);
      lay(hot, out, basic('#FFFFFF', { map: TEX.lava() }), 0.008);
      plane(hot, [w * 0.75, h * 0.75], TEX.glow('rgba(255,230,130,.4)', 'rgba(255,170,40,.1)'), 0.01, true);
      const stone = lay(g, out, std('#FFFFFF', { map: TEX.stone(), roughness: 0.9 }), 0.008); stone.visible = false;
      const pops = [0, 1, 2].map(k => ({ m: put(hot, new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), basic('#FFC24A')), null, 0.008), t: k / 3 }));
      const sparks = Array.from({ length: 6 }, (_, k) => ({ m: put(hot, new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), basic('#FFE08A', { transparent: true }))), t: k / 6 }));
      ticks.push(dt => {
        if (!hot.visible) return;
        for (const q of pops) { q.t += dt * 0.5; if (q.t > 1) { q.t -= 1; q.m.position.x = (R() - 0.5) * w * 0.6; q.m.position.z = (R() - 0.5) * h * 0.6; } q.m.scale.setScalar(q.t < 0.85 ? 0.3 + q.t * 1.4 : 0.001); }
        for (const q of sparks) { q.t += dt * 0.4; if (q.t > 1) { q.t -= 1; q.m.position.x = (R() - 0.5) * w * 0.7; q.m.position.z = (R() - 0.5) * h * 0.7; } q.m.position.y = 0.05 + q.t * 1.1; q.m.material.opacity = 1 - q.t; }
      });
      return { set(cold) { hot.visible = !cold; stone.visible = cold; } };
    },
    fire(f) {   // a round vent with a grate and a flame standing out of it; put out, the vent is cold and dark
      const r0 = f.r * U, g = group(f.x, f.y);
      const heat = plane(g, [r0 * 4, r0 * 4], TEX.glow('rgba(255,120,30,.5)', 'rgba(255,90,20,.15)'), 0.003);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(r0 * 0.95, r0 * 1.05, 0.14, 28), std('#7C8492')), line = new THREE.Mesh(rim.geometry, basic('#2A2E38', { side: THREE.BackSide }));
      line.scale.setScalar(1.06); rim.castShadow = true; put(g, line, null, 0.07); put(g, rim, null, 0.07);
      const pit = new THREE.Mesh(new THREE.CircleGeometry(r0 * 0.78, 28), basic('#2A0E06')); pit.rotation.x = -Math.PI / 2; put(g, pit, null, 0.142);
      for (let i = -2; i <= 2; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(r0 * 1.5 * Math.sqrt(1 - (i / 2.6) ** 2), 0.03, 0.04), std('#4A505C')); put(g, bar, new THREE.Vector2(0, -i * r0 * 0.3), 0.16); }
      const flame = flameIcon(), k = r0 / 0.42 * 0.7; flame.scale.setScalar(k); flame.castShadow = true; put(g, flame, null, 0.14 + 0.42 * k);
      ticks.push((dt, c) => { if (flame.visible) flame.scale.set(k * (1 + 0.05 * Math.sin(c * 9 + f.x)), k * (1 + 0.1 * Math.sin(c * 11 + f.y)), k); });
      return { set(out) { flame.visible = heat.visible = !out; pit.material.color.set(out ? '#2B2B2E' : '#2A0E06'); } };
    },
    gap(r) {   // a hole: the floor is cut away and its soil sides go down into the dark
      const w = r.w * U, h = r.h * U, D = 1.4, out = edge(r, seeds++, { wob: 0.05, sq: 4.5 }), g = group(r.x + r.w / 2, r.y + r.h / 2);
      cut(g, out, D, TEX.soil());
      lay(g, out, basic('#000000'), -D + 0.01).renderOrder = -2;
      for (const v of along(out, 0.5)) if (R() < 0.6) put(g, rock(0.05 + R() * 0.05, '#B9AE9F'), fit(r, v.clone().multiplyScalar(1.06 + R() * 0.08)), 0.02);
      for (const v of [out[15], out[50], out[95]]) { const l = 0.25 + R() * 0.2, m = new THREE.Mesh(new THREE.PlaneGeometry(l, 0.025), basic('#5C4A3A', { transparent: true, opacity: 0.6 })); m.rotation.set(-Math.PI / 2, 0, Math.atan2(v.y, v.x)); put(g, m, fit(r, v.clone().setLength(v.length() + l / 2)), 0.005); }
    },
    fence(w) {   // a low striped bar with a live wire along the top and warning signs; the caller places it
      const g = new THREE.Group(), across = w.w >= w.h, L = (across ? w.w : w.h) * U, at = (o, y) => new THREE.Vector3(across ? o : 0, y, across ? 0 : o);
      const stripes = TEX.stripes().clone(); stripes.repeat.set(L / 0.9, 1); stripes.needsUpdate = true;
      const geo = new THREE.BoxGeometry(across ? L : 0.16, 0.34, across ? 0.16 : L), bar = new THREE.Mesh(geo, std('#FFFFFF', { map: stripes })), line = new THREE.Mesh(geo, basic('#1E1E28', { side: THREE.BackSide }));
      line.scale.setScalar(1.04); bar.castShadow = true; bar.position.y = line.position.y = 0.17; g.add(line, bar);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, L, 8), basic('#FFF59A')); wire.rotation.set(across ? 0 : Math.PI / 2, 0, across ? Math.PI / 2 : 0); wire.position.y = 0.44; g.add(wire);
      for (const o of [-L / 2 + 0.1, L / 2 - 0.1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), std('#2A2E38')); p.position.copy(at(o, 0.38)); g.add(p); }
      const signs = Math.max(1, Math.round(L / 2));
      for (let i = 0; i < signs; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), basic('#FFFFFF', { map: TEX.sign(), transparent: true, side: THREE.DoubleSide })); m.position.copy(at(-L / 2 + (i + 0.5) * L / signs, 0.62)); m.rotation.x = -0.5; g.add(m); }
      ticks.push((dt, c) => wire.material.color.setHSL(0.15, 1, 0.6 + 0.3 * Math.abs(Math.sin(c * 13 + w.x))));
      g.position.set(X(w.x + w.w / 2), 0, Z(w.y + w.h / 2)); board.add(g); return g;
    },
    tick(dt, clock) { TEX.lava().offset.x += 0.03 * dt; TEX.lava().offset.y += 0.012 * dt; TEX.wave().offset.x += 0.05 * dt; TEX.wave().offset.y += 0.02 * dt; for (const t of ticks) t(dt, clock); },
  };
}
