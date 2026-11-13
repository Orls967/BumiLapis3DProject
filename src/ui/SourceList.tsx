import type { Source } from '@/content/schema';
import { ui } from '@/content/ui';

export function SourceList({ sources, verified }: { sources: Source[]; verified?: boolean }) {
  return (
    <div className="grid gap-2">
      {verified !== undefined && (
        <span className={`chip w-fit ${verified ? '' : 'chip-warn'}`}>
          {verified ? `✓ ${ui.explore.panel.verified}` : `⚠ ${ui.common.needsVerification}`}
        </span>
      )}
      <ol className="grid list-decimal gap-2 pl-5 text-sm">
        {sources.map((s, i) => (
          <li key={i}>
            {s.author && <span>{s.author} </span>}
            {s.year && <span>({s.year}). </span>}
            <em>{s.title}</em>
            {s.url && (
              <>
                {' '}
                <a href={s.url} target="_blank" rel="noreferrer noopener" className="break-all text-accent underline">
                  {s.url.replace(/^https?:\/\//, '')}
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
