// Can this stage be played? Every stage must pass before it ships: the hole and every coin can be reached (cracked
// walls count as passable, since they can be broken, trap holes do not), and every cracked wall has room enough in front of it to
// build up the speed that breaks it. Messages are for whoever designs the stage.
import { FEEL } from '../feel.js';

const { BW, BH, RIM, R } = FEEL;
const RUN_NEEDED = 50;   // board units of straight run: about 15° of tilt breaks a wall from here (see test/physics)
const LO = RIM + R, HIX = BW - RIM - R, HIY = BH - RIM - R;

const distToRect = (x, y, w) => Math.hypot(x - Math.max(w.x, Math.min(x, w.x + w.w)), y - Math.max(w.y, Math.min(y, w.y + w.h)));
const inBoard = (x, y) => x >= RIM && x <= BW - RIM && y >= RIM && y <= BH - RIM;
// where the ball's centre can be, with these walls in the way
const fits = (x, y, walls) => x >= LO && x <= HIX && y >= LO && y <= HIY && walls.every(w => distToRect(x, y, w) >= R - 1e-6);

export function validateLevel(level) {
  const err = [], { walls, coins, start, hole } = level, traps = level.traps || [];
  const inTrap = (x, y) => traps.some(t => Math.hypot(x - t.x, y - t.y) < t.r);
  // a fire pillar is a wall unless the stage gives water to put it out
  const fires = (level.kit || []).includes('water') ? [] : level.fires || [];
  const burns = (x, y) => fires.some(f => Math.hypot(x - f.x, y - f.y) < f.r + R);
  walls.forEach((w, i) => { if (!(inBoard(w.x, w.y) && inBoard(w.x + w.w, w.y + w.h))) err.push(`벽 ${i}: 판 밖`); });
  if (!inBoard(start.x, start.y)) err.push('시작점: 판 밖');
  if (!inBoard(hole.x, hole.y)) err.push('구멍: 판 밖');
  coins.forEach((c, i) => { if (!inBoard(c.x, c.y)) err.push(`코인 ${i}: 판 밖`); });
  if (!(level.time >= 20 && level.time <= 120)) err.push(`제한 시간 ${level.time}초 (20–120)`);
  const kit = level.kit || [], fire = kit.includes('fire'), spark = kit.includes('spark');
  // gates: a torch lit with fire opens its door, a switch turned on with electricity its fences (and doors)
  const gates = [...(fire ? (level.torches || []).map(t => ({ x: t.x, y: t.y, open: [t.door] })) : []), ...(spark ? level.switches || [] : [])];
  const lava = kit.includes('water') ? [] : level.lava || [];   // water cools lava to stone
  const inLava = (x, y) => lava.some(L => x > L.x && x < L.x + L.w && y > L.y && y < L.y + L.h);
  const deep = kit.includes('ice') ? [] : level.deep || [];   // ice freezes deep water into a bridge
  const inDeep = (x, y) => deep.some(D => x > D.x && x < D.x + D.w && y > D.y && y < D.y + D.h);
  // what stands in the way: walls, and without fire vines, ice and doors; a door opens once its torch can be reached
  if (!fits(start.x, start.y, walls)) err.push('시작점이 벽에 붙어 있음');
  if (inTrap(start.x, start.y)) err.push('시작점이 함정 안');
  coins.forEach((c, i) => { if (walls.some(w => distToRect(c.x, c.y, w) < R)) err.push(`코인 ${i}: 벽 안`); });

  // flood the board on a one-unit grid from the start, through cracked walls
  const W = BW, H = BH;
  let seen;
  function flood(open) {
    const solid = walls.filter((w, i) => w.kind === 'wall' || (w.kind === 'thick' && !kit.includes('stone')) || ((w.kind === 'vine' || w.kind === 'ice') && !fire) || ((w.kind === 'door' || w.kind === 'fence') && !open.has(i)));
    const free = (x, y) => fits(x + 0.5, y + 0.5, solid) && !inTrap(x + 0.5, y + 0.5) && !burns(x + 0.5, y + 0.5) && !inLava(x + 0.5, y + 0.5) && !inDeep(x + 0.5, y + 0.5);
    seen = new Uint8Array(W * H);
    const sx = Math.floor(start.x), sy = Math.floor(start.y), q = [];
    if (free(sx, sy)) { seen[sy * W + sx] = 1; q.push(sx, sy); }
    for (let k = 0; k < q.length; k += 2) {
      const x = q[k], y = q[k + 1];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || !free(nx, ny)) continue;
        seen[ny * W + nx] = 1; q.push(nx, ny);
      }
    }
  }
  const open = new Set();
  for (;;) {   // open every door whose torch can be reached, and look again
    flood(open);
    const more = gates.filter(g => g.open.some(d => !open.has(d)) && reaches(g.x, g.y, R + 2.5));
    if (!more.length) break;
    for (const g of more) for (const d of g.open) open.add(d);
  }
  function reaches(px, py, r) {
    for (let y = Math.max(0, Math.floor(py - r)); y <= Math.min(H - 1, Math.ceil(py + r)); y++)
      for (let x = Math.max(0, Math.floor(px - r)); x <= Math.min(W - 1, Math.ceil(px + r)); x++)
        if (seen[y * W + x] && Math.hypot(x + 0.5 - px, y + 0.5 - py) < r) return true;
    return false;
  }
  if (!reaches(hole.x, hole.y, hole.r - R * 0.35)) err.push('구멍에 갈 수 없음');
  coins.forEach((c, i) => { if (!reaches(c.x, c.y, R + 3)) err.push(`코인 ${i}에 갈 수 없음`); });

  // a cracked wall needs a straight run toward it, across its long side, somewhere along it
  walls.forEach((w, i) => {
    if (w.kind !== 'crack' || kit.includes('stone')) return;   // stone breaks it from a short roll
    const others = walls.filter(o => o !== w), across = w.w >= w.h;   // a wide wall is hit from above or below
    let best = 0;
    for (let s = 0; s <= (across ? w.w : w.h); s += 2) {
      for (const dir of [-1, 1]) {
        let n = 0;
        for (let d = R; ; d += 1) {
          const x = across ? w.x + s : dir < 0 ? w.x - d : w.x + w.w + d, y = across ? (dir < 0 ? w.y - d : w.y + w.h + d) : w.y + s;
          if (!fits(x, y, others)) break;
          n = d - R;
        }
        best = Math.max(best, n);
      }
    }
    if (best < RUN_NEEDED) err.push(`금 간 벽 ${i}: 달릴 거리 ${Math.round(best)} (${RUN_NEEDED} 필요)`);
  });
  return err;
}

// Would the stage be lost without this element? An element that is only decoration is a design fault.
export function requires(level, el) {
  return validateLevel({ ...level, kit: (level.kit || []).filter(k => k !== el) }).includes('구멍에 갈 수 없음');
}
