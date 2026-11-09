// The elements a ball can wear. Each world from the second brings one; a stage offers those of its world and before.
export const ELEMENTS = {
  water: { name: '물', color: '#5BB8F5', dur: 5, cool: 3 },   // puts fire pillars out, cools lava to stone
  fire: { name: '불', color: '#FF7A45', dur: 5, cool: 3 },    // burns vines, melts ice, lights torches; a puddle puts it out
  ice: { name: '얼음', color: '#8FD8F0', dur: 5, cool: 3 },   // freezes deep water into a bridge
  spark: { name: '전기', color: '#FFD23F', dur: 5, cool: 3 }, // turns switches on; safe on the electric floor
  stone: { name: '돌', color: '#9A8F86', dur: 5, cool: 3 },   // heavy: breaks cracked and thick walls from a short roll; sinks in water
};
export const WORLD_ELEMENT = { 2: 'water', 3: 'fire', 4: 'ice', 5: 'spark', 6: 'stone' };

export const ownedFor = world => Object.entries(WORLD_ELEMENT).filter(([w]) => +w <= world).map(([, e]) => e);
// the last two gained, so the newest is always worn in its own world
export function defaultSlots(level) { const o = ownedFor(level.world).slice(-2); return [o[0] ?? null, o[1] ?? null]; }
