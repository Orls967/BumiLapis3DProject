import { describe, expect, it } from 'vitest';
import { searchIndex } from '@/content/searchIndex';
import { search } from './search';

describe('search', () => {
  const items = searchIndex();
  it('finds layers and glossary terms', () => {
    expect(search(items, 'inti luar')[0]).toMatchObject({ kind: 'layer', title: 'Inti luar' });
    expect(search(items, 'walther').some((r) => r.kind === 'term' && r.title === 'Hukum Walther')).toBe(true);
    expect(search(items, 'outer core').some((r) => r.title === 'Inti luar')).toBe(true);
    expect(search(items, 'karman').some((r) => r.title === 'Garis Kármán')).toBe(true);
  });
  it('returns nothing for empty or unmatched queries', () => {
    expect(search(items, '   ')).toEqual([]);
    expect(search(items, 'zzzzqqq')).toEqual([]);
  });
});
