import { Fragment } from 'react';
import { layerList } from '@/content/layers';
import { ui } from '@/content/ui';
import { useEarth } from '@/store/earth';

const L = ui.explore.list;

/** Ordered list of all layers; the keyboard path into the 3D scene. */
export function LayerList() {
  const grouping = useEarth((s) => s.grouping);
  const selectedId = useEarth((s) => s.selectedId);
  const hoveredId = useEarth((s) => s.hoveredId);
  const hidden = useEarth((s) => s.hidden);
  const select = useEarth((s) => s.select);
  const hover = useEarth((s) => s.hover);
  const toggleHidden = useEarth((s) => s.toggleHidden);
  const list = layerList(grouping);
  let lastRealm = '';
  return (
    <nav aria-label={L.title} className="flex min-h-0 flex-col">
      <div className="px-3 pb-1 pt-3">
        <h2 className="text-sm font-extrabold">{L.title}</h2>
        <p className="text-xs text-muted">{L.hint}</p>
      </div>
      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {list.map((l) => {
          const group = l.realm === 'functional' ? (l.topKm > 12 ? 'atmosphere' : 'surface') : l.realm;
          const header = group !== lastRealm;
          lastRealm = group;
          const isHidden = !!hidden[l.id];
          const active = selectedId === l.id;
          return (
            <Fragment key={l.id}>
              {header && <li className="label px-2 pb-0.5 pt-2.5">{L.realms[group]}</li>}
              <li className="flex items-center gap-0.5">
                <button
                  className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-accent font-bold text-accent-ink'
                      : hoveredId === l.id
                        ? 'bg-panel2'
                        : 'hover:bg-panel2'
                  } ${l.variantOf ? 'pl-6' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`${L.select} ${l.name}`}
                  onClick={() => select(l.id)}
                  onMouseEnter={() => hover(l.id)}
                  onMouseLeave={() => hover(null)}
                  onFocus={() => hover(l.id)}
                  onBlur={() => hover(null)}
                >
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/30"
                    style={{ background: l.color, opacity: isHidden ? 0.3 : 1 }}
                  />
                  <span className={`truncate ${isHidden ? 'line-through opacity-60' : ''}`}>{l.name}</span>
                  {l.realm === 'functional' && <span className="chip ml-auto !px-1.5 !text-[10px]">{L.functionalTag}</span>}
                </button>
                {(l.realm === 'interior' || l.realm === 'atmosphere' || l.id === 'ocean') && !l.variantOf && (
                  <button
                    className="btn btn-ghost btn-sm !min-h-11 !min-w-11 shrink-0"
                    aria-pressed={!isHidden}
                    aria-label={`${isHidden ? L.toggleShow : L.toggleHide} ${l.name}`}
                    title={`${isHidden ? L.toggleShow : L.toggleHide} ${l.name}`}
                    onClick={() => toggleHidden(l.id)}
                    style={{ background: 'transparent', color: 'inherit', borderColor: 'transparent' }}
                  >
                    <span aria-hidden className={isHidden ? 'opacity-40' : ''}>
                      {isHidden ? '◌' : '◉'}
                    </span>
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </nav>
  );
}
