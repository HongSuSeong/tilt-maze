// The elements a ball can wear. Each world from the second brings one; a stage offers those of its world and before.
export const ELEMENTS = {
  water: { name: '물', color: '#5BB8F5', dur: 5, cool: 3 },   // puts fire pillars out, cools lava to stone
  fire: { name: '불', color: '#FF7A45', dur: 5, cool: 3 },    // burns vines, melts ice, lights torches; a puddle puts it out
  ice: { name: '얼음', color: '#8FD8F0', dur: 5, cool: 3 },   // freezes deep water into a bridge
  spark: { name: '전기', color: '#FFD23F', dur: 5, cool: 3 }, // turns switches on; safe on the electric floor
  stone: { name: '돌', color: '#9A8F86', dur: 5, cool: 3 },   // heavy: breaks cracked and thick walls from a short roll; sinks in water
  gas: { name: '가스', color: '#B8E986', dur: 5, cool: 3 },    // light: floats over chasms, rides the wind; blows up at fire
};
export const WORLD_ELEMENT = { 2: 'water', 3: 'fire', 4: 'ice', 5: 'spark', 6: 'stone', 7: 'gas' };

export const ownedFor = world => Object.entries(WORLD_ELEMENT).filter(([w]) => +w <= world).map(([, e]) => e);
// the last two gained, so the newest is always worn in its own world
export function defaultSlots(level) { const o = ownedFor(level.world).slice(-2); return [o[0] ?? null, o[1] ?? null]; }

// Picking before a stage: a tap puts the element in the free slot, a second tap takes it out; with both full the
// older one makes room.
export function toggleElement(slots, el) {
  if (slots.includes(el)) return slots.map(s => (s === el ? null : s));
  const free = slots.indexOf(null);
  if (free >= 0) { const out = [...slots]; out[free] = el; return out; }
  return [slots[1], el];
}
