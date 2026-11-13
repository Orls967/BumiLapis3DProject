import { describe, expect, it } from 'vitest';
import { bedSchema, earthLayerSchema } from './schema';

describe('schema', () => {
  it('accepts a valid bed and rejects an inverted one', () => {
    const bed = {
      id: 'b1',
      topM: 0,
      baseM: 5,
      lithologyId: 'sandstone',
      grainSize: 'm-sand',
      structures: [],
      fossils: [],
      baseContact: 'sharp',
    };
    expect(bedSchema.safeParse(bed).success).toBe(true);
    expect(bedSchema.safeParse({ ...bed, baseM: -1 }).success).toBe(false);
  });

  it('requires at least three insights for an earth layer', () => {
    const result = earthLayerSchema.safeParse({
      id: 'x',
      name: 'X',
      nameEn: 'X',
      realm: 'interior',
      topKm: 0,
      bottomKm: -1,
      composition: [{ label: 'a' }],
      summary: 'x'.repeat(50),
      keyFact: 'x'.repeat(12),
      insights: ['only one insight that is long enough'],
      evidence: ['seismology evidence text here'],
      color: '#ffffff',
      sources: [{ title: 't' }],
      verified: true,
    });
    expect(result.success).toBe(false);
  });
});
