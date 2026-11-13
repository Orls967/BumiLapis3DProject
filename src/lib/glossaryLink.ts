import type { GlossaryEntry } from '@/content/schema';

export type TextToken = string | { text: string; id: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type Matcher = { regex: RegExp; lookup: Map<string, string> };
const cache = new WeakMap<readonly GlossaryEntry[], Matcher>();

function matcher(entries: readonly GlossaryEntry[]): Matcher {
  let m = cache.get(entries);
  if (m) return m;
  const lookup = new Map<string, string>();
  for (const e of entries) {
    for (const name of [e.term, ...(e.aliases ?? [])]) {
      // terms such as "Pantai / muka pantai" are linked through their aliases only
      if (name.includes('/') || name.includes('(')) continue;
      lookup.set(name.toLowerCase(), e.id);
    }
  }
  const names = [...lookup.keys()].sort((a, b) => b.length - a.length).map(escape);
  const regex = new RegExp(`(?<![\\p{L}\\p{N}])(${names.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  m = { regex, lookup };
  cache.set(entries, m);
  return m;
}

/** Split text into plain strings and glossary term matches (each term linked once per text). */
export function linkGlossary(text: string, entries: readonly GlossaryEntry[], skipId?: string): TextToken[] {
  const { regex, lookup } = matcher(entries);
  const out: TextToken[] = [];
  const used = new Set<string>();
  let last = 0;
  regex.lastIndex = 0;
  for (let m = regex.exec(text); m; m = regex.exec(text)) {
    const id = lookup.get(m[0].toLowerCase());
    if (!id || used.has(id) || id === skipId) continue;
    used.add(id);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ text: m[0], id });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
