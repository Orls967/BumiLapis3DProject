import { about } from '@/content/about';
import { scaleMarkers } from '@/content/markers';
import { ui } from '@/content/ui';
import { RichText } from '@/ui/RichText';
import { SourceList } from '@/ui/SourceList';
import { unverifiedEntries } from '@/content/unverified';

export default function AboutPage() {
  const unverified = [...scaleMarkers.filter((m) => !m.verified).map((m) => `${m.name}: ${m.note}`), ...unverifiedEntries()];
  return (
    <div className="page grid max-w-3xl gap-6 pb-12">
      <header>
        <h1 className="page-title">{about.title}</h1>
        {about.intro.map((p) => (
          <p key={p} className="mt-2 leading-relaxed">
            <RichText text={p} />
          </p>
        ))}
        <p className="mt-2 text-sm text-muted">{about.privacy}</p>
      </header>
      <section className="card p-4">
        <h2 className="text-lg font-extrabold">{about.limitsTitle}</h2>
        <ul className="mt-2 grid list-disc gap-2 pl-5">
          {about.limits.map((l) => (
            <li key={l}>
              <RichText text={l} />
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-4">
        <h2 className="mb-2 text-lg font-extrabold">{about.sourcesTitle}</h2>
        <SourceList sources={about.sources} />
      </section>
      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 text-lg font-extrabold">{about.creditsTitle}</h2>
        <table className="w-full text-sm">
          <tbody>
            {about.credits.map((c) => (
              <tr key={c.asset} className="border-b border-line align-top last:border-0">
                <th scope="row" className="py-2 pr-3 text-left font-semibold">
                  {c.asset}
                </th>
                <td className="py-2 pr-3">
                  <a href={c.url} target="_blank" rel="noreferrer noopener" className="text-accent underline">
                    {c.source}
                  </a>
                </td>
                <td className="whitespace-nowrap py-2">{c.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card p-4">
        <h2 className="text-lg font-extrabold">{about.unverifiedTitle}</h2>
        <p className="mt-1 text-sm text-muted">{about.unverifiedIntro}</p>
        <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm">
          {unverified.map((u) => (
            <li key={u}>
              {u} <span className="chip chip-warn">{ui.common.needsVerification}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
