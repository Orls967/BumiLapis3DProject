import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { builtinColumns } from '@/content/columns';
import { basinStory, formationById } from '@/content/formations';
import type { StratColumn } from '@/content/schema';
import { ui } from '@/content/ui';
import { columnThickness, parseColumn, serializeColumn } from '@/lib/columnIO';
import { findColumn, useColumns } from '@/store/columns';
import { download, svgToPng, svgToString } from '@/ui/exportSvg';
import { QuizButton } from '@/ui/Quiz';
import { RichText } from '@/ui/RichText';
import { SourceList } from '@/ui/SourceList';
import { ColumnLegend, StratColumnView } from '@/ui/StratColumnView';
import { BedDetail, BedEditor } from './BedPanels';
import { Compare } from './Compare';

const C = ui.column;
const VIEW_H = 620;

export default function ColumnPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const stored = useColumns((s) => s.columns);
  const { add, update, remove } = useColumns();
  const id = params.get('kolom') ?? 'teaching';
  const column = findColumn(id, stored) ?? builtinColumns[0];
  const highlight = params.get('formasi');
  const [bedId, setBedId] = useState<string | null>(params.get('lapisan'));
  const [zoom, setZoom] = useState(1);
  const [editing, setEditing] = useState(false);
  const [legend, setLegend] = useState(true);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string[] } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const total = Math.max(columnThickness(column), 1);
  const fitPx = (VIEW_H - 60) / total;
  const pxPerM = fitPx * zoom;
  const bed = column.beds.find((b) => b.id === bedId) ?? null;
  const editable = column.kind === 'user';
  const other = compareId ? findColumn(compareId, stored) : null;
  const all = useMemo(() => [...builtinColumns, ...stored], [stored]);

  const go = (colId: string, extra: Record<string, string> = {}) => {
    setParams({ kolom: colId, ...extra });
    setBedId(null);
    setZoom(1);
    setMessage(null);
  };
  useEffect(() => {
    setEditing(false);
  }, [id]);
  useEffect(() => {
    if (!highlight || !scrollRef.current) return;
    const first = column.beds.find((b) => b.formationId === highlight);
    if (first) scrollRef.current.scrollTop = Math.max(0, (first.topM - column.beds[0].topM) * pxPerM - 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, id]);

  const copyToEdit = (source: StratColumn | null) => {
    const base: StratColumn = source
      ? { ...structuredClone(source), id: `${source.id}-salinan`, title: `${source.title} (salinan)`, kind: 'user', verified: false }
      : { id: 'kolom-baru', title: 'Kolom baru', kind: 'user', beds: [], sources: [], verified: false };
    const newId = add(base);
    go(newId);
    setTimeout(() => setEditing(true), 0);
  };
  const onImport = async (file: File) => {
    const res = parseColumn(await file.text());
    if (!res.ok) return setMessage({ ok: false, text: [C.importError, ...res.errors.slice(0, 6)] });
    const newId = add(res.column);
    go(newId);
    setMessage({ ok: true, text: [C.importOk] });
  };
  const safeName = column.id.replace(/[^a-z0-9-]/gi, '_');

  return (
    <div className="page pb-12">
      <header className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{C.title}</h1>
          <p className="text-sm text-muted">{C.intro}</p>
        </div>
        <QuizButton module="column" />
      </header>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="grid min-w-56 flex-1 gap-1">
          <span className="label">{C.choose}</span>
          <select className="input" value={column.id} onChange={(e) => go(e.target.value)}>
            <optgroup label={C.builtin}>
              {builtinColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </optgroup>
            {stored.length > 0 && (
              <optgroup label={C.mine}>
                {stored.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({C.kinds[c.kind]})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <button className="btn btn-primary" onClick={() => navigate(`/interpretasi?kolom=${column.id}`)} disabled={column.beds.length === 0}>
          <span aria-hidden>🔍</span> {C.interpret}
        </button>
        {editable ? (
          <button className="btn" aria-pressed={editing} onClick={() => setEditing((v) => !v)}>
            ✎ {editing ? C.doneEdit : C.edit}
          </button>
        ) : (
          <button className="btn" onClick={() => copyToEdit(column)}>
            ✎ {C.copyToEdit}
          </button>
        )}
        <button className="btn" onClick={() => copyToEdit(null)}>
          + {C.newColumn}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="toolbar" aria-label={C.title}>
        <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(40, z * 1.5))} aria-label={C.zoomIn}>
          ＋
        </button>
        <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(0.5, z / 1.5))} aria-label={C.zoomOut}>
          －
        </button>
        <button className="btn btn-sm" onClick={() => setZoom(1)}>
          {C.fit}
        </button>
        <button className="btn btn-sm" aria-pressed={legend} onClick={() => setLegend((v) => !v)}>
          {C.legend}
        </button>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        <button className="btn btn-sm" onClick={() => svgRef.current && download(`${safeName}.svg`, svgToString(svgRef.current), 'image/svg+xml')}>
          {C.exportSvg}
        </button>
        <button className="btn btn-sm" onClick={async () => svgRef.current && download(`${safeName}.png`, await svgToPng(svgRef.current))}>
          {C.exportPng}
        </button>
        <button className="btn btn-sm" onClick={() => download(`${safeName}.json`, serializeColumn(column), 'application/json')}>
          {C.exportJson}
        </button>
        <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          {C.importJson}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        <label className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{C.compareWith}</span>
          <select className="input !min-h-9 !w-auto" value={compareId ?? ''} onChange={(e) => setCompareId(e.target.value || null)}>
            <option value="">—</option>
            {all
              .filter((c) => c.id !== column.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </label>
        {editable && (
          <button
            className="btn btn-sm ml-auto"
            onClick={() => {
              remove(column.id);
              go('teaching');
            }}
          >
            {C.remove}
          </button>
        )}
      </div>

      {message && (
        <div role="status" className={`mt-2 rounded-xl border p-3 text-sm ${message.ok ? 'border-ok text-ok' : 'border-bad text-bad'}`}>
          {message.text.map((t) => (
            <div key={t}>{t}</div>
          ))}
        </div>
      )}

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="card min-w-0 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate font-extrabold">{column.title}</h2>
            <span className="chip">{C.kinds[column.kind]}</span>
            {!column.verified && column.kind !== 'user' && <span className="chip chip-warn">⚠ {ui.common.needsVerification}</span>}
            {highlight && formationById.get(highlight) && (
              <button className="chip chip-warn" onClick={() => setParams({ kolom: column.id })}>
                {C.fromFormation}: {formationById.get(highlight)!.name} ✕
              </button>
            )}
          </div>
          {column.note && <p className="mb-2 text-sm text-muted">{column.note}</p>}
          <div ref={scrollRef} className="scroll-thin overflow-auto rounded-lg border border-line" style={{ maxHeight: VIEW_H }} tabIndex={0} aria-label={C.depth}>
            {column.beds.length === 0 ? (
              <p className="p-6 text-muted">{C.emptyColumn}</p>
            ) : other ? (
              <div className="p-2">
                <Compare left={column} right={other} pxPerM={pxPerM} />
              </div>
            ) : (
              <StratColumnView ref={svgRef} column={column} pxPerM={pxPerM} selectedBedId={bedId} onSelectBed={setBedId} highlightFormationId={highlight} />
            )}
          </div>
          {other && (
            <button className="btn btn-sm mt-2" onClick={() => setCompareId(null)}>
              {C.stopCompare}
            </button>
          )}
        </section>

        <aside className="grid content-start gap-4">
          <section className="card p-3">
            <h2 className="mb-1 font-extrabold">{editing ? C.editor.title : C.bed.title}</h2>
            {editing && editable ? (
              <>
                <BedEditor column={column} selectedId={bedId} onSelect={setBedId} onChange={update} />
                <p className="mt-2 text-xs text-ok">✓ {C.editor.valid}: {parseColumn(serializeColumn(column)).ok ? 'ya' : 'tidak'}</p>
              </>
            ) : bed ? (
              <BedDetail bed={bed} />
            ) : (
              <p className="text-sm text-muted">{C.selectBed}</p>
            )}
            {!editable && editing && <p className="text-sm text-muted">{C.editor.readonly}</p>}
          </section>
          {column.id === basinStory.columnId && (
            <section className="card p-3">
              <h2 className="font-extrabold">{basinStory.title}</h2>
              <p className="mt-1 text-sm leading-relaxed">
                <RichText text={basinStory.text} />
              </p>
            </section>
          )}
          {legend && (
            <section className="card p-3">
              <h2 className="mb-2 font-extrabold">{C.legend}</h2>
              <ColumnLegend columns={other ? [column, other] : [column]} />
            </section>
          )}
          {column.sources.length > 0 && (
            <section className="card p-3">
              <h2 className="mb-2 font-extrabold">{ui.common.sources}</h2>
              <SourceList sources={column.sources} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
