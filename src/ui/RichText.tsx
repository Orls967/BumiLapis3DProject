import { Link } from 'react-router-dom';
import { glossary, glossaryById } from '@/content/glossary';
import { linkGlossary } from '@/lib/glossaryLink';

/** Content text with glossary terms linked automatically (first occurrence of each term). */
export function RichText({ text, skipId }: { text: string; skipId?: string }) {
  return (
    <>
      {linkGlossary(text, glossary, skipId).map((t, i) =>
        typeof t === 'string' ? (
          t
        ) : (
          <Link key={i} to={`/glosarium?istilah=${t.id}`} className="gloss" title={glossaryById.get(t.id)?.definition}>
            {t.text}
          </Link>
        ),
      )}
    </>
  );
}
