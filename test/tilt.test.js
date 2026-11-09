import { describe, it, expect } from 'vitest';
import { mapTilt, deadZone, createTilt } from '../src/tilt.js';

const raw = { beta: 10, gamma: 5 }, zero = { beta: 0, gamma: 0 };
const near = (p, x, y) => { expect(p.x).toBeCloseTo(x, 6); expect(p.y).toBeCloseTo(y, 6); };

describe('tilt', () => {
  it('portrait reads gamma as x and beta as y', () => near(mapTilt(raw, zero, 0), 5, 10));
  it('turned screens rotate the axes', () => {
    near(mapTilt(raw, zero, 90), 10, -5);
    near(mapTilt(raw, zero, 270), -10, 5);
    near(mapTilt(raw, zero, 180), -5, -10);
    near(mapTilt(raw, zero, -90), -10, 5);
  });
  it('the dead zone takes away the first degree', () => {
    expect(deadZone(0.8, 1)).toBe(0); expect(deadZone(3, 1)).toBe(2); expect(deadZone(-3, 1)).toBe(-2);
  });
  it('without a sensor the arrow keys tilt', () => {
    const t = createTilt(); let p;
    for (let i = 0; i < 30; i++) p = t.read(0, { ArrowRight: true });
    expect(p.x).toBeGreaterThanOrEqual(13.9); expect(t.hasSensor).toBe(false);
  });
  it('calibrate takes the present pose as level', () => {
    const t = createTilt(); t.feed({ beta: 20, gamma: -4 }); t.calibrate(); let p;
    for (let i = 0; i < 10; i++) p = t.read(0, {});
    near(p, 0, 0); expect(t.hasSensor).toBe(true);
  });
});
