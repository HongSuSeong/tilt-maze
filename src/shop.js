// What coins buy, and what clearing stages opens. Pure: every purchase returns a new save.
export const COLORS = [
  { id: 'coral', name: '산호', hex: '#FF6E5E', price: 0 }, { id: 'mint', name: '민트', hex: '#48C99A', price: 0 }, { id: 'cream', name: '크림', hex: '#FFF1DC', price: 0 },
  { id: 'sky', name: '하늘', hex: '#5BB8F5', price: 15 }, { id: 'lemon', name: '레몬', hex: '#FFD23F', price: 15 }, { id: 'sand', name: '모래', hex: '#E6D6AE', price: 15 },
  { id: 'snow', name: '흰색', hex: '#FFFFFF', price: 20 }, { id: 'orange', name: '주황', hex: '#FF8A3D', price: 20 }, { id: 'leaf', name: '잎새', hex: '#6FBF5A', price: 20 },
  { id: 'grape', name: '포도', hex: '#8A6BFF', price: 25 }, { id: 'pink', name: '분홍', hex: '#FF8FC2', price: 25 }, { id: 'brown', name: '밤색', hex: '#8A5A36', price: 25 },
  { id: 'ink', name: '먹색', hex: '#2B2F45', price: 30 }, { id: 'navy', name: '남색', hex: '#3E5CB8', price: 30 }, { id: 'teal', name: '청록', hex: '#1FA2A0', price: 30 },
  { id: 'berry', name: '산딸기', hex: '#C2185B', price: 35 },
];
export const PATTERNS = [
  { id: 'dots', name: '물방울', price: 0 }, { id: 'stripes', name: '줄무늬', price: 0 }, { id: 'check', name: '체크', price: 20 },
  { id: 'half', name: '반반', price: 30 }, { id: 'stars', name: '별', price: 40 }, { id: 'rainbow', name: '무지개', price: 60 },
];
export const BOOST_PRICES = [50, 100, 200];   // each step: elements are worn a second longer
export const colorHex = id => (COLORS.find(c => c.id === id) || COLORS[0]).hex;

const CATALOG = { colors: COLORS, patterns: PATTERNS };
export function buy(save, kind, id) {
  const item = CATALOG[kind]?.find(x => x.id === id);
  if (!item || save.owned[kind].includes(id) || save.coins < item.price) return { ok: false, save };
  return { ok: true, save: { ...save, coins: save.coins - item.price, owned: { ...save.owned, [kind]: [...save.owned[kind], id] } } };
}
export function buyBoost(save) {
  const price = BOOST_PRICES[save.boost];
  if (price == null || save.coins < price) return { ok: false, save };
  return { ok: true, save: { ...save, coins: save.coins - price, boost: save.boost + 1 } };
}

// Paint for the dot drawing: four to start, one more for every eight stages cleared (on any difficulty).
const PAINT_ORDER = ['snow', 'ink', 'coral', 'mint', 'sky', 'lemon', 'grape', 'pink', 'orange', 'leaf', 'navy', 'sand', 'berry', 'teal', 'brown', 'cream'];
export const clears = s => Object.values(s.prog).reduce((n, p) => n + Object.keys(p.best).length, 0);
export const paintPalette = s => PAINT_ORDER.slice(0, Math.min(16, 4 + Math.floor(clears(s) / 8))).map(id => COLORS.find(c => c.id === id));
export const nextPaintAt = s => (paintPalette(s).length >= 16 ? null : (Math.floor(clears(s) / 8) + 1) * 8);
