export type SearchKind = 'layer' | 'formation' | 'term' | 'environment' | 'page';
export type SearchItem = { kind: SearchKind; title: string; subtitle: string; to: string; body?: string };
export type SearchResult = SearchItem & { score: number };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Simple ranked substring search: every query word must occur; title matches rank higher. */
export function search(items: readonly SearchItem[], query: string, limit = 12): SearchResult[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const out: SearchResult[] = [];
  for (const it of items) {
    const title = norm(it.title);
    const rest = norm(`${it.subtitle} ${it.body ?? ''}`);
    let score = 0;
    let ok = true;
    for (const w of words) {
      if (title.startsWith(w)) score += 10;
      else if (title.split(/\s+/).some((t) => t.startsWith(w))) score += 7;
      else if (title.includes(w)) score += 5;
      else if (rest.includes(w)) score += 1;
      else {
        ok = false;
        break;
      }
    }
    if (ok) out.push({ ...it, score: score - title.length * 0.01 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
