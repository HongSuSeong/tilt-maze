// The ball's skin, drawn flat (equirectangular, 2:1) so it wraps a sphere: a pattern in two colours, or the
// player's own 16 × 8 dot drawing. Both the board and the shop preview paint from this.
import { colorHex } from './shop.js';

export const DOT_W = 16, DOT_H = 8;
const RAINBOW = ['#FF6E5E', '#FF8A3D', '#FFD23F', '#6FBF5A', '#5BB8F5', '#8A6BFF'];

export function drawBall(canvas, look) {
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height, base = colorHex(look.base), acc = colorHex(look.accent);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  if (look.mode === 'pixels') {
    const cw = w / DOT_W, ch = h / DOT_H;
    look.pixels.forEach((c, i) => { if (c) { g.fillStyle = colorHex(c); g.fillRect((i % DOT_W) * cw, Math.floor(i / DOT_W) * ch, cw + 0.5, ch + 0.5); } });
    return;
  }
  g.fillStyle = acc;
  const star = (x, y, r) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.fill(); };
  switch (look.pattern) {
    case 'dots': for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 97) % w, 30 + ((i * 53) % (h - 60)), 16 * w / 512, 0, 7); g.fill(); } break;
    case 'stripes': for (let k = 0; k < 4; k++) g.fillRect(0, (k * 2 + 0.5) * h / 8, w, h / 8); break;
    case 'check': for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) g.fillRect(x * w / 8, y * h / 4, w / 8, h / 4); break;
    case 'half': g.fillRect(0, h / 2, w, h / 2); break;
    case 'stars': for (let i = 0; i < 10; i++) star((i * 113) % w + 20, 40 + ((i * 71) % (h - 80)), 20 * w / 512); break;
    case 'rainbow': RAINBOW.forEach((c, k) => { g.fillStyle = c; g.fillRect(k * w / 6, 0, w / 6, h); }); break;
  }
}

// a small round preview of the ball, turned by `spin` (radians): each pixel looks up the skin through the sphere
export function drawPreview(canvas, skin, spin) {
  const g = canvas.getContext('2d'), n = canvas.width, src = skin.getContext('2d').getImageData(0, 0, skin.width, skin.height), out = g.createImageData(n, n), r = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (x - r + 0.5) / r, dy = (y - r + 0.5) / r, d2 = dx * dx + dy * dy, o = (y * n + x) * 4;
    if (d2 > 1) continue;
    const dz = Math.sqrt(1 - d2), lon = Math.atan2(dx, dz) + spin, lat = Math.asin(-dy);
    const u = ((lon / (2 * Math.PI) % 1) + 1) % 1, v = 0.5 - lat / Math.PI, i = (Math.floor(v * (skin.height - 1)) * skin.width + Math.floor(u * (skin.width - 1))) * 4;
    const light = 0.55 + 0.45 * Math.max(0, -0.4 * dx - 0.5 * dy + 0.75 * dz);   // lit from the upper left
    out.data[o] = src.data[i] * light; out.data[o + 1] = src.data[i + 1] * light; out.data[o + 2] = src.data[i + 2] * light; out.data[o + 3] = 255;
  }
  g.putImageData(out, 0, 0);
}
