// Shorthands for writing stages by hand: a wall, a cracked wall, coins.
export const W = (x, y, w, h) => ({ x, y, w, h, kind: 'wall' });
export const C = (x, y, w, h) => ({ x, y, w, h, kind: 'crack' });
export const coins = (...xy) => xy.map(([x, y]) => ({ x, y }));
export const V = (x, y, w, h) => ({ x, y, w, h, kind: 'vine' });   // fire burns it away
export const I = (x, y, w, h) => ({ x, y, w, h, kind: 'ice' });    // fire melts it
export const D = (x, y, w, h) => ({ x, y, w, h, kind: 'door' });   // opens when its torch is lit
export const E = (x, y, w, h) => ({ x, y, w, h, kind: 'fence' });  // shocks; a switch turns it off
