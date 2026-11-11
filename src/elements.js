// The elements a ball can wear. Each world from the second brings one; a stage offers those of its world and before.
export const ELEMENTS = {
  water: { name: '물', color: '#5BB8F5', dur: 5, cool: 3 },   // puts fire pillars out, cools lava to stone
  fire: { name: '불', color: '#FF7A45', dur: 5, cool: 3 },    // burns vines, melts ice, lights torches; a puddle puts it out
  ice: { name: '얼음', color: '#8FD8F0', dur: 5, cool: 3 },   // freezes deep water into a bridge
  spark: { name: '전기', color: '#FFD23F', dur: 5, cool: 3 }, // turns switches on; safe on the electric floor
  stone: { name: '돌', color: '#9A8F86', dur: 5, cool: 3 },   // heavy: breaks cracked and thick walls from a short roll; sinks in water
  gas: { name: '가스', color: '#B8E986', dur: 5, cool: 3 },    // light: floats over chasms, rides the wind; blows up at fire
};
// Two elements worn one on the other make a third (see run.js useSlot). `like` is the element it acts as, besides what
// it does of its own (physics.js).
export const FUSIONS = {
  steam: { name: '증기', color: '#E8F4FF', dur: 4, of: ['water', 'fire'], use: '둥실 떠서 틈·깊은 물·용암 위를 지나가요. 적이 공을 놓쳐요' },
  snow: { name: '눈덩이', color: '#F4FAFF', dur: 5, of: ['water', 'ice'], use: '구를수록 커져서, 크면 살살 부딪혀도 벽을 부숴요', like: 'water' },
  blast: { name: '폭발 돌진', color: '#FF5A3C', dur: 1.5, of: ['fire', 'gas'], use: '기울인 쪽으로 튕겨 나가며 닿는 벽을 부숴요', like: 'fire' },
};
export const fusionOf = (a, b) => Object.keys(FUSIONS).find(f => { const [x, y] = FUSIONS[f].of; return (a === x && b === y) || (a === y && b === x); }) ?? null;
export const WORLD_ELEMENT = { 2: 'water', 3: 'fire', 4: 'ice', 5: 'spark', 6: 'stone', 7: 'gas' };

export const ownedFor = world => Object.entries(WORLD_ELEMENT).filter(([w]) => +w <= world).map(([, e]) => e);
// What the slots start with, before the player changes them. On easy and normal, what the stage needs (its kit), so the
// player sees the way and learns it; from hard on nothing, since choosing is part of the puzzle there.
export const RECOMMENDS = ['easy', 'normal'];
export function defaultSlots(level, diff = 'easy') {
  const k = RECOMMENDS.includes(diff) ? level.kit || [] : [];
  return [k[0] ?? null, k[1] ?? null];
}

// Picking before a stage: a tap puts the element in the free slot, a second tap takes it out; with both full the
// older one makes room.
export function toggleElement(slots, el) {
  if (slots.includes(el)) return slots.map(s => (s === el ? null : s));
  const free = slots.indexOf(null);
  if (free >= 0) { const out = [...slots]; out[free] = el; return out; }
  return [slots[1], el];
}
