import { describe, expect, it } from 'vitest';
import { altitudeFromRadius, displayRadius, EXAGGERATED_SCALE } from './scale';

describe('displayRadius', () => {
  it('is proportional in true mode', () => {
    expect(displayRadius(0, 'true')).toBeCloseTo(1);
    expect(displayRadius(-6371, 'true')).toBeCloseTo(0);
    expect(displayRadius(-2891, 'true')).toBeCloseTo(3480 / 6371);
    expect(displayRadius(6371, 'true')).toBeCloseTo(2);
  });

  it('is strictly monotonic in both modes', () => {
    for (const mode of ['true', 'exaggerated'] as const) {
      let prev = -Infinity;
      for (let alt = -6371; alt <= 70000; alt += 7.3) {
        const r = displayRadius(alt, mode);
        expect(r).toBeGreaterThan(prev);
        prev = r;
      }
    }
  });

  it('has a strictly increasing table and keeps the surface at 1', () => {
    for (let i = 1; i < EXAGGERATED_SCALE.length; i++) {
      expect(EXAGGERATED_SCALE[i][0]).toBeGreaterThan(EXAGGERATED_SCALE[i - 1][0]);
      expect(EXAGGERATED_SCALE[i][1]).toBeGreaterThan(EXAGGERATED_SCALE[i - 1][1]);
    }
    expect(displayRadius(0, 'exaggerated')).toBe(1);
  });

  it('exaggerates thin layers', () => {
    const crustTrue = 1 - displayRadius(-35, 'true');
    const crustEx = 1 - displayRadius(-35, 'exaggerated');
    expect(crustEx).toBeGreaterThan(crustTrue * 5);
    expect(displayRadius(12, 'exaggerated') - 1).toBeGreaterThan((displayRadius(12, 'true') - 1) * 10);
  });

  it('round-trips through the inverse', () => {
    for (const mode of ['true', 'exaggerated'] as const) {
      for (const alt of [-6000, -3000, -500, -20, 0, 8, 70, 400, 5000]) {
        expect(altitudeFromRadius(displayRadius(alt, mode), mode)).toBeCloseTo(alt, 6);
      }
    }
  });
});
