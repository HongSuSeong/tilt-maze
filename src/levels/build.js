// Shorthands for writing stages by hand: a wall, a cracked wall, coins.
export const W = (x, y, w, h) => ({ x, y, w, h, kind: 'wall' });
export const C = (x, y, w, h) => ({ x, y, w, h, kind: 'crack' });
export const coins = (...xy) => xy.map(([x, y]) => ({ x, y }));
