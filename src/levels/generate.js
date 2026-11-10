// Hard stages, made rather than drawn: a maze with one way through, dug from a fixed seed so everyone gets the same
// map, with the world's devices set on that one way so each element in the kit is needed. Dead ends hold trap holes.
// Every stage this makes is checked in test/generate.test.js.
import { W, V, I, D, E, T } from './build.js';

const B = 3, WALL = 3;   // the rim, and the walls between cells
const NAMES = { 1: '들판', 2: '물가', 3: '불의 협곡', 4: '얼음 들판', 5: '번개 공장', 6: '돌 채석장', 7: '바람 절벽', 8: '갈림길', 9: '어둠', 10: '원소의 끝' };
const PAIRS = [['water', 'fire'], ['ice', 'spark'], ['stone', 'gas'], ['fire', 'ice'], ['water', 'spark'], ['gas', 'fire'], ['stone', 'water'], ['spark', 'gas'], ['ice', 'stone'], ['fire', 'spark']];

function rng(seed) {   // mulberry32
  return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// which elements a stage needs: its world's own, every other stage one more; the mixed worlds take a pair
function kitFor(world, index) {
  const own = { 2: 'water', 3: 'fire', 4: 'ice', 5: 'spark', 6: 'stone', 7: 'gas' }[world], second = { 3: 'water', 4: 'fire', 5: 'water', 6: 'ice', 7: 'spark' }[world];
  if (world === 1) return [];
  if (world >= 8) return PAIRS[(index - 1 + world) % PAIRS.length];
  return index % 2 === 0 && second ? [own, second] : [own];
}

// hard, hell and god differ in the grid, the seed, the id, and what they add (moving traps; a hole locked behind the coins)
// easy is for the mixed worlds (8–10) of the stages drawn by hand: wide cells, a size that grows through the world
const EASY_SIZE = (w, i) => (w === 10 ? [4 + (i > 6), 5 + Math.floor(i / 4)] : [3 + (i > 5), (w === 8 ? 4 : 5) + Math.floor(i / 4)]);
const KINDS = { easy: { id: 'w', salt: 3 }, hard: { C: 5, rows: w => (w <= 5 ? 8 : 9), id: 'h', salt: 0 }, hell: { C: 6, rows: () => 9, id: 'x', salt: 1 }, god: { C: 6, rows: () => 10, id: 'g', salt: 2 } };

export function generate(world, index, diff = 'hard') {
  const K = KINDS[diff], rand = rng(world * 7919 + index * 104729 + 17 + K.salt * 7777777), pick = a => a[Math.floor(rand() * a.length)];
  const [C, Rn] = diff === 'easy' ? EASY_SIZE(world, index) : [K.C, K.rows(world)];
  const cw = (100 - 2 * B) / C, ch = (160 - 2 * B) / Rn, N = C * Rn;
  const col = c => c % C, row = c => Math.floor(c / C);
  const center = c => ({ x: B + (col(c) + 0.5) * cw, y: B + (row(c) + 0.5) * ch });
  const neighbours = c => [c - C, c + C, col(c) > 0 ? c - 1 : -1, col(c) < C - 1 ? c + 1 : -1].filter(n => n >= 0 && n < N);
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  // dig: depth first from the top-left cell, the next cell chosen at random
  const open = new Set(), seen = new Uint8Array(N), stack = [0]; seen[0] = 1;
  while (stack.length) {
    const c = stack[stack.length - 1], next = neighbours(c).filter(n => !seen[n]);
    if (!next.length) { stack.pop(); continue; }
    const n = pick(next); open.add(key(c, n)); seen[n] = 1; stack.push(n);
  }
  const links = c => neighbours(c).filter(n => open.has(key(c, n)));
  // the one way: from the start to the cell furthest from it
  const dist = new Int32Array(N).fill(-1), from = new Int32Array(N).fill(-1), q = [0]; dist[0] = 0;
  for (let k = 0; k < q.length; k++) for (const n of links(q[k])) if (dist[n] < 0) { dist[n] = dist[q[k]] + 1; from[n] = q[k]; q.push(n); }
  let end = 0; for (let c = 0; c < N; c++) if (dist[c] > dist[end]) end = c;
  const path = []; for (let c = end; c >= 0; c = from[c]) path.unshift(c);
  const onPath = new Set(path);

  // the walls between cells that were not dug through
  const walls = [];
  for (let c = 0; c < N; c++) {
    if (col(c) < C - 1 && !open.has(key(c, c + 1))) walls.push(W(B + (col(c) + 1) * cw - WALL / 2, Math.max(B, B + row(c) * ch - WALL / 2), WALL, Math.min(ch + WALL, 160 - B - Math.max(B, B + row(c) * ch - WALL / 2))));
    if (row(c) < Rn - 1 && !open.has(key(c, c + C))) walls.push(W(Math.max(B, B + col(c) * cw - WALL / 2), B + (row(c) + 1) * ch - WALL / 2, Math.min(cw + WALL, 100 - B - Math.max(B, B + col(c) * cw - WALL / 2)), WALL));
  }
  // the opening between two cells on the way, as a plug that fills it; and a cell's floor, as a rect that fills it
  const plug = (a, b, kind) => {
    const lo = Math.min(a, b);
    return Math.abs(a - b) === 1
      ? kind(B + (col(lo) + 1) * cw - WALL / 2, B + row(lo) * ch + WALL / 2, WALL, ch - WALL)
      : kind(B + col(lo) * cw + WALL / 2, B + (row(lo) + 1) * ch - WALL / 2, cw - WALL, WALL);
  };
  const floor = c => ({ x: B + col(c) * cw + WALL / 2, y: B + row(c) * ch + WALL / 2, w: cw - WALL, h: ch - WALL });

  const kit = kitFor(world, index), o = { fires: [], lava: [], deep: [], gaps: [], torches: [], switches: [], zaps: [], winds: [], slick: [], enemies: [] };
  // devices along the way, spread out: two for a single element, one or two for each of a pair
  const each = kit.length === 1 ? 2 : world >= 10 ? 2 : 1, total = each * kit.length, L = path.length, used = new Set();
  const slots = Array.from({ length: total }, (_, k) => Math.max(1, Math.min(L - 3, Math.round((L - 2) * (k + 1) / (total + 1)))));
  slots.forEach((at, k) => {
    while (used.has(at) || used.has(at + 1) || used.has(at - 1)) at = at + 1 < L - 2 ? at + 1 : 1;   // apart, and off the start and the hole
    used.add(at);
    const el = kit[Math.floor(k / each)], c = path[at], next = path[at + 1], prev = path[at - 1];
    if (el === 'water') { if (kit.includes('gas') || rand() < 0.4) o.lava.push(floor(c)); else o.fires.push({ ...center(c), r: Math.max(6, Math.min(cw, ch) / 2 - 3) }); }   // a pillar as wide as its cell, so there is no way round it
    if (el === 'fire') {
      const how = kit.includes('gas') ? rand() * 0.6 : rand();   // with gas about, no torch: a blast beside it would open the door without fire
      if (how < 0.4) walls.push(plug(c, next, V));
      else if (how < 0.6) walls.push(plug(c, next, I));
      else { o.torches.push({ ...center(c), door: walls.length }); walls.push(plug(c, next, D)); }
    }
    if (el === 'ice') o.deep.push(floor(c));
    if (el === 'spark') { o.switches.push({ ...center(prev), open: [walls.length] }); walls.push(plug(c, next, E)); }
    if (el === 'stone') walls.push(plug(c, next, T));
    if (el === 'gas') o.gaps.push(floor(c));
  });
  // what each world adds along the rest of the way
  const free = path.filter((c, k) => k > 0 && k < L - 1 && !used.has(k) && !used.has(k - 1));
  const some = n => free.filter(() => rand() < 0.5).slice(0, n);
  if (world === 4) o.slick.push(...some(4).map(floor));
  if (world === 5 || world === 10) o.zaps.push(...some(2).map(floor));
  if (world === 7) for (const c of some(2)) { const n = path[path.indexOf(c) + 1], a = center(c), b = center(n); o.winds.push({ ...floor(c), dx: Math.sign(b.x - a.x) * 160, dy: Math.sign(b.y - a.y) * 160 }); }

  // dead ends get the trap holes (and, from the fifth world, enemies wait in the furthest); other cells off the way coins
  const deadEnds = [];
  for (let c = 1; c < N; c++) if (!onPath.has(c) && links(c).length === 1) deadEnds.push(c);
  deadEnds.sort((a, b) => dist[b] - dist[a]);
  const nTraps = Math.min(deadEnds.length, 2 + Math.floor(world / 2)), trapCells = deadEnds.slice(0, nTraps);
  const traps = trapCells.map(c => ({ ...center(c), r: 4.5 }));
  if (!traps.length) { const c = [...Array(N).keys()].find(c => !onPath.has(c)) ?? path[1]; traps.push({ ...center(c), r: 4.5 }); trapCells.push(c); }
  if (diff !== 'easy' && (world === 5 || world === 10)) {
    const lair = deadEnds.filter(c => !trapCells.includes(c)).concat([path[Math.floor(L * 0.75)]]);
    o.enemies.push(...lair.slice(0, world === 10 ? 2 : 1).map(c => ({ ...center(c), speed: 22 })));
  }
  const coins = [...Array(N).keys()].filter(c => !onPath.has(c) && !trapCells.includes(c)).filter(() => rand() < 0.35).slice(0, 4).map(center);
  coins.push(center(path[Math.floor(L / 2)]));
  if (diff === 'god') for (let k = 1; coins.length < 3; k++) coins.push(center(path[Math.floor(L * k / 4)]));   // something to gather before the hole opens

  // hell and god: traps that go back and forth along straight stretches of the way (two to four), timed to be passed
  if (diff !== 'hard') {
    const dir = k => path[k + 1] - path[k], runs = [];
    for (let k = 1; k < L - 2; ) {
      let m = k; while (m + 1 < L - 1 && dir(m) === dir(k)) m++;
      if (m - k >= 1 && ![...Array(m - k + 1).keys()].some(j => used.has(k + j))) runs.push([k, m]);
      k = m + 1;
    }
    runs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
    const want = 2 + Math.floor(world / 4);
    for (const [a, b] of runs.slice(0, want)) traps.push({ ...center(path[a]), r: 4.5, to: center(path[b]), period: 3 + rand() * 1.6 });
    for (let c = 0; traps.filter(t => t.to).length < 2 && c < N; c++) {   // few straight stretches: set one going off the way
      const n = links(c).find(n => !onPath.has(c) && !onPath.has(n) && !trapCells.includes(c) && !trapCells.includes(n));
      if (n != null) traps.push({ ...center(c), r: 4.5, to: center(n), period: 3.5 });
    }
  }

  if (diff === 'easy') {   // each stage of a mixed world gets its own extra: wind, the electric floor, ice or puddles, in turn; enemies late on
    const extra = index % 4, cells = some(3);
    if (extra === 0) for (const c of cells.slice(0, 2)) { const n = path[path.indexOf(c) + 1], a = center(c), b = center(n); o.winds.push({ ...floor(c), dx: Math.sign(b.x - a.x) * 140, dy: Math.sign(b.y - a.y) * 140 }); }
    if (extra === 1) o.zaps.push(...cells.slice(0, 2).map(floor));
    if (extra === 2) o.slick.push(...cells.map(floor));
    if (extra === 3 && !kit.includes('stone')) o.pools = cells.slice(0, 2).map(floor);
    const foes = world === 10 ? (index >= 8 ? 2 : index >= 3 ? 1 : 0) : world === 9 && index >= 6 ? 1 : 0;
    const lair = deadEnds.filter(c => !trapCells.includes(c)).concat(deadEnds);
    o.enemies.push(...lair.slice(0, foes).map(c => ({ ...center(c), speed: 20 })));
    const hint = { 8: '이제 원소가 여섯 가지예요. 판을 보고 맞는 두 가지를 장착하세요', 9: '어둠 속에서는 공 둘레만 보여요. 빛나는 것을 길잡이 삼아 가세요' }[world];
    return {
      id: `w${world}-${index}`, world, index, name: `${NAMES[world]} ${index}`, kit, path: L, start: center(0), hole: { ...center(end), r: 7.4 }, walls, coins, traps: [],
      time: Math.max(30, Math.min(110, Math.round(L * 3.2 + total * 3 + 12))), normal: { traps }, ...o, ...(world === 9 && { dim: true }), ...(index === 1 && hint && { hint }),
    };
  }
  return {
    id: `${K.id}${world}-${index}`, world, index, name: `${NAMES[world]} ${index}`, kit, path: L,
    time: Math.max(20, Math.min(120, Math.round((L * 2.4 + total * 2 + 8) * (diff === 'hard' ? 1 : 0.85) + (diff === 'god' ? coins.length * 4 : 0)))),
    ...(diff === 'god' && { lock: true }),
    start: center(0), hole: { ...center(end), r: 7.4 }, walls, coins, traps, ...o, ...(world === 9 && { dim: true }),
  };
}

const MADE = {};
export const madeLevels = diff => (MADE[diff] ??= Array.from({ length: 10 }, (_, w) => Array.from({ length: 10 }, (_, i) => generate(w + 1, i + 1, diff))).flat());

// the mixed worlds of the stages drawn by hand (easy, and normal from them): made here, each stage a maze of its own
export const mixedWorld = world => Array.from({ length: 10 }, (_, i) => generate(world, i + 1, 'easy'));
