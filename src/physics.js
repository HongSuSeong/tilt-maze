// The ball on the board, in board units. Pure: no drawing, no sensors. The caller keeps `state` (walls broken, coins
// taken) so the level data is never changed and a stage can start over by making a new state.
import { FEEL } from './feel.js';

const { BW, BH, RIM, R } = FEEL;
const RIM_WALLS = [
  { x: 0, y: 0, w: BW, h: RIM }, { x: 0, y: BH - RIM, w: BW, h: RIM },
  { x: 0, y: 0, w: RIM, h: BH }, { x: BW - RIM, y: 0, w: RIM, h: BH },
];
const FALL_DONE = 1.1;
const STONE_BRK = 60;
const BOOM_R = 18, BOOM_V = 400;   // a blast breaks every wall this near the fire, and throws the ball this fast   // a ball of stone is heavy: a short roll breaks cracked and thick walls   // seconds from dropping into the hole to the stage being over

export function createBall(x, y) { return { x, y, vx: 0, vy: 0, fall: 0 }; }

// One frame. Returns what happened in it: knock {speed}, break {wall}, coin {coin}, hole, sunk, for a trap hole
// trap {trap} then lost, at a fire pillar douse {fire} (the ball wears water) or burn {fire} (it does not), burnwall
// {wall} (fire takes a vine or ice wall), light {torch} (fire lights a torch and its door opens), cool {lava} (water
// turns lava to stone) or lava {lava} (the ball sinks in), quench (fire worn into a puddle goes out), and in deep
// water freeze {deep} (ice turns it to a slippery bridge) or drown {deep}, shock (an electric fence, or the electric
// floor while it is on), power {sw} (electricity worn turns a switch on: its fences go off, its doors open), and caught
// (an enemy reached the ball), fall (into a chasm; gas floats over it) and boom {fire} (gas worn meets fire: the walls
// near it break and the ball is thrown back).
// `coat` is the element the ball wears this frame, or null.
export function stepBall(ball, tilt, dt, level, state, sens, coat = null) {
  const ev = [];
  if (ball.burnt) return ev;
  state.doused ??= new Set(); state.lit ??= new Set(); state.cooled ??= new Set(); state.frozen ??= new Set(); state.powered ??= new Set();
  state.clock = (state.clock || 0) + dt;
  const shock = () => { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'shock' }); return ev; };
  dt = Math.min(dt, 1 / 30);   // after a pause the frame gap can be long; a long step would carry the ball through walls
  if (ball.fall > 0) {   // dropping: drawn toward the middle of the hole until it is gone
    const h = ball.into, k = Math.min(1, dt * 10);
    ball.x += (h.x - ball.x) * k; ball.y += (h.y - ball.y) * k;
    if (!ball.sunk && (ball.fall += dt) > FALL_DONE) { ball.sunk = true; ev.push({ type: h.goal ? 'sunk' : 'lost' }); }
    return ev;
  }
  const rad = Math.PI / 180, ax = FEEL.G * sens * Math.sin(tilt.x * rad), ay = FEEL.G * sens * Math.sin(tilt.y * rad);
  const h = dt / FEEL.sub, fires = level.fires || [];
  const wet = (level.pools || []).some(p => ball.x > p.x && ball.x < p.x + p.w && ball.y > p.y && ball.y < p.y + p.h);
  const inside = (r, x = ball.x, y = ball.y) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  const deep = level.deep || [], icy = (level.slick || []).some(r => inside(r)) || deep.some((r, i) => state.frozen.has(i) && inside(r));
  const fric = FEEL.fric * (wet ? 5 : icy ? 0.1 : 1);   // a puddle holds the ball back; ice hardly does
  if (wet && coat === 'fire') { coat = null; ev.push({ type: 'quench' }); }   // ...and puts fire out
  if (wet && coat === 'stone') { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'drown' }); return ev; }   // a ball of stone sinks
  for (let i = 0; i < FEEL.sub; i++) {
    ball.vx += ax * h; ball.vy += ay * h;
    for (const wd of level.winds || []) if (inside(wd)) { const k = coat === 'gas' ? 3 : coat === 'stone' ? 0 : 1; ball.vx += wd.dx * k * h; ball.vy += wd.dy * k * h; }   // gas is light, stone heavy
    const damp = Math.exp(-fric * h); ball.vx *= damp; ball.vy *= damp;
    const sp = Math.hypot(ball.vx, ball.vy); if (sp > FEEL.vmax) { ball.vx *= FEEL.vmax / sp; ball.vy *= FEEL.vmax / sp; }
    ball.x += ball.vx * h; ball.y += ball.vy * h;
    for (const w of RIM_WALLS) collide(ball, w, -1, ev);
    level.walls.forEach((w, i) => { if (!state.broken.has(i)) collide(ball, w, i, ev, state, coat); });
    if (ball.burnt) return ev;   // an electric fence
    for (const g of level.gaps || []) {
      const m = R * 0.4;
      if (coat !== 'gas' && ball.x > g.x + m && ball.x < g.x + g.w - m && ball.y > g.y + m && ball.y < g.y + g.h - m) { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'fall' }); return ev; }
    }
    (level.switches || []).forEach((w, i) => {
      if (coat !== 'spark' || state.powered.has(i) || Math.hypot(ball.x - w.x, ball.y - w.y) >= R + 2.5) return;
      state.powered.add(i); for (const d of w.open) state.broken.add(d); ev.push({ type: 'power', sw: i });
    });
    const on = state.clock % 4 < 2;   // the electric floor: two seconds on, two off
    for (const z of level.zaps || []) if (inside(z) && coat !== 'spark' && (on || coat === 'water')) return shock();
    (level.torches || []).forEach((t, i) => {
      if (Math.hypot(ball.x - t.x, ball.y - t.y) >= R + 2.5) return;
      if (coat === 'gas') { boom(ball, level, state, t, ev); ev.push({ type: 'boom', torch: i }); coat = null; return; }
      if (coat !== 'fire' || state.lit.has(i)) return;
      state.lit.add(i); state.broken.add(t.door); ev.push({ type: 'light', torch: i });
    });
    for (let k = 0; k < deep.length; k++) {
      const D = deep[k]; if (state.frozen.has(k)) continue;
      const near = Math.hypot(ball.x - Math.max(D.x, Math.min(ball.x, D.x + D.w)), ball.y - Math.max(D.y, Math.min(ball.y, D.y + D.h))) < R;
      if (near && coat === 'ice') { state.frozen.add(k); ev.push({ type: 'freeze', deep: k }); continue; }
      const m = R * 0.4;
      if (ball.x > D.x + m && ball.x < D.x + D.w - m && ball.y > D.y + m && ball.y < D.y + D.h - m) { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'drown', deep: k }); return ev; }
    }
    const lava = level.lava || [];
    for (let k = 0; k < lava.length; k++) {
      const L = lava[k]; if (state.cooled.has(k)) continue;
      const near = Math.hypot(ball.x - Math.max(L.x, Math.min(ball.x, L.x + L.w)), ball.y - Math.max(L.y, Math.min(ball.y, L.y + L.h))) < R;
      if (near && coat === 'water') { state.cooled.add(k); ev.push({ type: 'cool', lava: k }); continue; }
      const m = R * 0.4;
      if (ball.x > L.x + m && ball.x < L.x + L.w - m && ball.y > L.y + m && ball.y < L.y + L.h - m) { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'lava', lava: k }); return ev; }
    }
    for (let f = 0; f < fires.length; f++) {
      if (state.doused.has(f) || Math.hypot(ball.x - fires[f].x, ball.y - fires[f].y) >= fires[f].r + R) continue;
      if (coat === 'water') { state.doused.add(f); ev.push({ type: 'douse', fire: f }); }
      else if (coat === 'gas') { boom(ball, level, state, fires[f], ev); state.doused.add(f); ev.push({ type: 'boom', fire: f }); coat = null; }
      else { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'burn', fire: f }); return ev; }
    }
  }
  if (level.enemies?.length && chase(ball, level, state, dt, coat)) { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'caught' }); return ev; }
  level.coins.forEach((c, i) => {
    if (!state.got.has(i) && Math.hypot(ball.x - c.x, ball.y - c.y) < R + 3) { state.got.add(i); ev.push({ type: 'coin', coin: i }); }
  });
  // the goal and any trap holes: the nearest one that has the ball takes it; each rim pulls the ball in a little
  const wells = (level.traps || []).map((t, i) => ({ ...t, goal: false, i }));
  if (level.hole) wells.push({ ...level.hole, goal: true });
  let take = null, near = Infinity;
  for (const w of wells) {
    const d = Math.hypot(ball.x - w.x, ball.y - w.y);
    if (d < w.r - R * 0.35 && d < near) { take = w; near = d; }
    else if (d < w.r + R * 0.6 && d > 0) { const k = 900 * dt; ball.vx += (w.x - ball.x) / d * k; ball.vy += (w.y - ball.y) / d * k; }
  }
  if (take) { ball.fall = 1e-3; ball.into = take; ev.push(take.goal ? { type: 'hole' } : { type: 'trap', trap: take.i }); }
  return ev;
}

function collide(ball, w, i, ev, state, coat) {
  const cx = Math.max(w.x, Math.min(ball.x, w.x + w.w)), cy = Math.max(w.y, Math.min(ball.y, w.y + w.h));
  let dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
  if (d >= R) return;
  if (d === 0) { dx = 0; dy = -1; d = 1; }
  const nx = dx / d, ny = dy / d, vn = ball.vx * nx + ball.vy * ny;
  if (w.kind === 'fence') { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'shock' }); return; }
  if ((w.kind === 'vine' || w.kind === 'ice') && coat === 'fire') { state.broken.add(i); ev.push({ type: 'burnwall', wall: i }); return; }   // burnt or melted away
  if (vn >= 0) { ball.x += nx * (R - d); ball.y += ny * (R - d); return; }   // already moving away: just step out
  const need = coat === 'stone' ? STONE_BRK : w.kind === 'crack' ? FEEL.brk : Infinity;   // a thick wall gives way only to stone
  if ((w.kind === 'crack' || w.kind === 'thick') && -vn > need) {   // fast enough: the wall gives way
    state.broken.add(i); ev.push({ type: 'break', wall: i });
    ball.vx *= FEEL.keep; ball.vy *= FEEL.keep; return;
  }
  ball.x += nx * (R - d); ball.y += ny * (R - d);
  ball.vx -= (1 + FEEL.bounce) * vn * nx; ball.vy -= (1 + FEEL.bounce) * vn * ny;
  ev.push({ type: 'knock', speed: -vn });
}

// Enemies follow the maze toward the ball, on a 2-unit grid: each frame they step to the neighbouring cell nearest the
// ball by the way round the walls (or, from a ball wearing fire, the one furthest). Returns true when one reaches it.
const FOE_R = 3.5, CELL = 2, GW = BW / CELL, GH = BH / CELL;
function chase(ball, level, state, dt, coat) {
  state.foes ??= level.enemies.map(e => ({ x: e.x, y: e.y, speed: e.speed ?? 28 }));
  const key = state.broken.size;
  if (!state.foeGrid || state.foeGrid.key !== key) {   // where an enemy fits: away from every standing wall
    const solid = level.walls.filter((w, i) => !state.broken.has(i)), open = new Uint8Array(GW * GH);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const x = (gx + 0.5) * CELL, y = (gy + 0.5) * CELL;
      open[gy * GW + gx] = x > RIM + FOE_R && x < BW - RIM - FOE_R && y > RIM + FOE_R && y < BH - RIM - FOE_R && solid.every(w => Math.hypot(x - Math.max(w.x, Math.min(x, w.x + w.w)), y - Math.max(w.y, Math.min(y, w.y + w.h))) >= FOE_R) ? 1 : 0;
    }
    state.foeGrid = { key, open, dist: null, at: -1 };
  }
  const G = state.foeGrid, cell = (x, y) => Math.min(GH - 1, Math.max(0, Math.floor(y / CELL))) * GW + Math.min(GW - 1, Math.max(0, Math.floor(x / CELL)));
  if (!G.dist || state.clock - G.at > 0.2) {   // distance from the ball, through open cells
    const dist = new Int32Array(GW * GH).fill(-1), q = [cell(ball.x, ball.y)]; dist[q[0]] = 0;
    for (let k = 0; k < q.length; k++) {
      const c = q[k], cx = c % GW, cy = (c / GW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, n = ny * GW + nx;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || dist[n] >= 0 || !G.open[n]) continue;
        dist[n] = dist[c] + 1; q.push(n);
      }
    }
    G.dist = dist; G.at = state.clock;
  }
  const away = coat === 'fire';
  let caught = false;
  for (const f of state.foes) {
    const c = cell(f.x, f.y), cx = c % GW, cy = (c / GW) | 0;
    let best = null, bd = away ? -1 : Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy, n = ny * GW + nx;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < GW && ny < GH && G.open[n] && G.dist[n] >= 0 && (away ? G.dist[n] > bd : G.dist[n] < bd)) { bd = G.dist[n]; best = [(nx + 0.5) * CELL, (ny + 0.5) * CELL]; }
    }
    const [tx, ty] = !away && G.dist[c] <= 1 ? [ball.x, ball.y] : best || [f.x, f.y];
    const d = Math.hypot(tx - f.x, ty - f.y), step = Math.min(d, f.speed * dt);
    if (d > 0) { f.x += (tx - f.x) / d * step; f.y += (ty - f.y) / d * step; }
    if (!away && Math.hypot(ball.x - f.x, ball.y - f.y) < R + FOE_R) caught = true;
  }
  return caught;
}

function boom(ball, level, state, at, ev) {
  level.walls.forEach((w, i) => {
    if (!state.broken.has(i) && Math.hypot(at.x - Math.max(w.x, Math.min(at.x, w.x + w.w)), at.y - Math.max(w.y, Math.min(at.y, w.y + w.h))) < BOOM_R) { state.broken.add(i); ev.push({ type: 'break', wall: i }); }
  });
  const dx = ball.x - at.x, dy = ball.y - at.y, d = Math.hypot(dx, dy) || 1;
  ball.vx = dx / d * BOOM_V; ball.vy = dy / d * BOOM_V;
}
