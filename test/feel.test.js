import { describe, it, expect } from 'vitest';
import { FEEL } from '../src/feel.js';

describe('feel', () => {
  it('rolls a solid ball at 5/7 g on a 25 cm board', () => expect(FEEL.G).toBeCloseTo(2802.86, 2));
  it('breaks cracked walls at 220', () => expect(FEEL.brk).toBe(220));
  it('has a ball of radius 4.2', () => expect(FEEL.R).toBe(4.2));
});
