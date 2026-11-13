import { describe, expect, it } from 'vitest';
import { glossary } from '@/content/glossary';
import { linkGlossary } from './glossaryLink';

describe('linkGlossary', () => {
  it('links known terms once, case-insensitively, on word boundaries', () => {
    const tokens = linkGlossary('Litosfer bergeser di atas astenosfer; litosfer itu kaku.', glossary);
    const links = tokens.filter((t) => typeof t !== 'string') as { text: string; id: string }[];
    expect(links.map((l) => l.id)).toEqual(['litosfer', 'astenosfer']);
    expect(links[0].text).toBe('Litosfer');
    expect(tokens.map((t) => (typeof t === 'string' ? t : t.text)).join('')).toBe(
      'Litosfer bergeser di atas astenosfer; litosfer itu kaku.',
    );
  });

  it('prefers the longest match and does not match inside words', () => {
    const ids = (s: string) => linkGlossary(s, glossary).filter((t) => typeof t !== 'string').map((t) => (t as { id: string }).id);
    expect(ids('urutan Bouma pada turbidit')).toEqual(['urutan-bouma', 'turbidit']);
    expect(ids('kerak samudra menunjam')).toEqual(['kerak-samudra', 'subduksi']);
    expect(ids('deltaik')).toEqual([]);
  });
});
