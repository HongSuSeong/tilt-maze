// The elements a ball can wear. Each world from the second brings one; a stage offers those of its world and before.
export const ELEMENTS = {
  water: { name: '물', color: '#5BB8F5', dur: 5, cool: 3 },   // puts fire pillars out, cools lava to stone
  fire: { name: '불', color: '#FF7A45', dur: 5, cool: 3 },    // burns vines, melts ice, lights torches; a puddle puts it out
};
export const WORLD_ELEMENT = { 2: 'water', 3: 'fire' };

export const ownedFor = world => Object.entries(WORLD_ELEMENT).filter(([w]) => +w <= world).map(([, e]) => e);
export function defaultSlots(level) { const o = ownedFor(level.world); return [o[0] ?? null, o[1] ?? null]; }
