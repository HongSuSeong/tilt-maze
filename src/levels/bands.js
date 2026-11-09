// Stages made of bands across the board, each one needing an element to cross: the mixed worlds (8–10) are built
// from these. A band is [type, side]; side says where a gap is ('l' or 'r') for the bands that have one.
//   water: 'pillar' (a fire pillar in the gap), 'lava'   fire: 'vine' (a vine in the gap), 'door' (a torch above opens it)
//   ice: 'deep'   spark: 'fence' (a switch above turns it off)   stone: 'thick'   gas: 'gap' (a chasm)
import { W, V, D, E, T } from './build.js';

const HEIGHT = { pillar: 6, lava: 12, vine: 6, door: 6, deep: 14, fence: 4, thick: 6, gap: 14 };
const ROWS = { 1: [80], 2: [55, 100], 3: [40, 75, 110], 4: [34, 62, 90, 118] };

export function banded(bands) {
  const o = { walls: [], fires: [], lava: [], deep: [], gaps: [], torches: [], switches: [], coins: [], traps: [] }, ys = ROWS[bands.length];
  let top = 3;
  bands.forEach(([type, side = 'r'], k) => {
    const y = ys[k], h = HEIGHT[type], mid = (top + y) / 2, gx = side === 'r' ? 90 : 10;
    o.coins.push({ x: k % 2 ? 30 : 70, y: mid });
    if (y - top >= 22) o.traps.push({ x: 50, y: mid, r: 4 });
    const across = (kind, plug) => side === 'r' ? [kind(3, y, 80, h), plug(83, y, 14, h)] : [plug(3, y, 14, h), kind(17, y, 80, h)];
    if (type === 'pillar') { o.walls.push(side === 'r' ? W(3, y, 80, h) : W(17, y, 80, h)); o.fires.push({ x: gx, y: y + 3, r: 5 }); }
    if (type === 'lava') o.lava.push({ x: 3, y, w: 94, h });
    if (type === 'vine') o.walls.push(...across(W, V));
    if (type === 'door') {
      const d = o.walls.length + 1;
      o.walls.push(W(3, y, 40, h), D(43, y, 20, h), W(63, y, 34, h)); o.torches.push({ x: gx, y: mid, door: d });
    }
    if (type === 'deep') o.deep.push({ x: 3, y, w: 94, h });
    if (type === 'fence') { o.walls.push(E(3, y, 94, h)); o.switches.push({ x: side === 'r' ? 80 : 20, y: mid, open: [o.walls.length - 1] }); }
    if (type === 'thick') o.walls.push(T(3, y, 94, h));
    if (type === 'gap') o.gaps.push({ x: 3, y, w: 94, h });
    top = y + h;
  });
  o.coins.push({ x: 30, y: (top + 157) / 2 });
  return o;
}

// a stage of a mixed world: `bands` make the board; anything else given (winds, zaps, enemies, a hint) is added
export function mixed(world, name, index, time, kit, bands, extra = {}) {
  const b = banded(bands);
  return {
    id: `w${world}-${index}`, world, index, name: `${name} ${index}`, time, kit, start: { x: 15, y: 15 }, hole: { x: 50, y: 145, r: 7.4 },
    walls: b.walls, fires: b.fires, lava: b.lava, deep: b.deep, gaps: b.gaps, torches: b.torches, switches: b.switches, coins: b.coins,
    normal: { traps: b.traps }, ...extra,
  };
}
