// The ball on the board, in board units. Pure: no drawing, no sensors. The caller keeps `state` (walls broken, coins
// taken) so the level data is never changed and a stage can start over by making a new state.
import { FEEL } from './feel.js';

const { BW, BH, RIM, R } = FEEL;
const RIM_WALLS = [
  { x: 0, y: 0, w: BW, h: RIM }, { x: 0, y: BH - RIM, w: BW, h: RIM },
  { x: 0, y: 0, w: RIM, h: BH }, { x: BW - RIM, y: 0, w: RIM, h: BH },
];
const FALL_DONE = 1.1;   // seconds from dropping into the hole to the stage being over

export function createBall(x, y) { return { x, y, vx: 0, vy: 0, fall: 0 }; }

// One frame. Returns what happened in it: knock {speed}, break {wall}, coin {coin}, hole, sunk, for a trap hole
// trap {trap} then lost, at a fire pillar douse {fire} (the ball wears water) or burn {fire} (it does not), burnwall
// {wall} (fire takes a vine or ice wall), light {torch} (fire lights a torch and its door opens), cool {lava} (water
// turns lava to stone) or lava {lava} (the ball sinks in), and quench (fire worn into a puddle goes out).
// `coat` is the element the ball wears this frame, or null.
export function stepBall(ball, tilt, dt, level, state, sens, coat = null) {
  const ev = [];
  if (ball.burnt) return ev;
  state.doused ??= new Set(); state.lit ??= new Set(); state.cooled ??= new Set();
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
  const fric = FEEL.fric * (wet ? 5 : 1);   // a puddle holds the ball back
  if (wet && coat === 'fire') { coat = null; ev.push({ type: 'quench' }); }   // ...and puts fire out
  for (let i = 0; i < FEEL.sub; i++) {
    ball.vx += ax * h; ball.vy += ay * h;
    const damp = Math.exp(-fric * h); ball.vx *= damp; ball.vy *= damp;
    const sp = Math.hypot(ball.vx, ball.vy); if (sp > FEEL.vmax) { ball.vx *= FEEL.vmax / sp; ball.vy *= FEEL.vmax / sp; }
    ball.x += ball.vx * h; ball.y += ball.vy * h;
    for (const w of RIM_WALLS) collide(ball, w, -1, ev);
    level.walls.forEach((w, i) => { if (!state.broken.has(i)) collide(ball, w, i, ev, state, coat); });
    (level.torches || []).forEach((t, i) => {
      if (coat !== 'fire' || state.lit.has(i) || Math.hypot(ball.x - t.x, ball.y - t.y) >= R + 2.5) return;
      state.lit.add(i); state.broken.add(t.door); ev.push({ type: 'light', torch: i });
    });
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
      else { ball.burnt = true; ball.vx = ball.vy = 0; ev.push({ type: 'burn', fire: f }); return ev; }
    }
  }
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
  if ((w.kind === 'vine' || w.kind === 'ice') && coat === 'fire') { state.broken.add(i); ev.push({ type: 'burnwall', wall: i }); return; }   // burnt or melted away
  if (vn >= 0) { ball.x += nx * (R - d); ball.y += ny * (R - d); return; }   // already moving away: just step out
  if (w.kind === 'crack' && -vn > FEEL.brk) {   // fast enough: the cracked wall gives way
    state.broken.add(i); ev.push({ type: 'break', wall: i });
    ball.vx *= FEEL.keep; ball.vy *= FEEL.keep; return;
  }
  ball.x += nx * (R - d); ball.y += ny * (R - d);
  ball.vx -= (1 + FEEL.bounce) * vn * nx; ball.vy -= (1 + FEEL.bounce) * vn * ny;
  ev.push({ type: 'knock', speed: -vn });
}
