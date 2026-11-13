import { Link } from 'react-router-dom';
import { formationById } from '@/content/formations';
import { grainSizeInfo, lithologies, lithologyById } from '@/content/lithologies';
import { GRAIN_SIZES, type Bed, type GrainSize, type StratColumn } from '@/content/schema';
import { chronoAt } from '@/content/timescale';
import { ui } from '@/content/ui';
import { colors, contacts, environmentNames, fossils, structures, vocabName } from '@/content/vocab';
import { fmtAuto } from '@/lib/format';
import { restack } from '@/lib/columnIO';
import { RichText } from '@/ui/RichText';

const B = ui.column.bed;
const E = ui.column.editor;

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-2 last:border-0">
      <dt className="label">{k}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export function BedDetail({ bed }: { bed: Bed }) {
  const lith = lithologyById.get(bed.lithologyId);
  const f = bed.formationId ? formationById.get(bed.formationId) : null;
  const chrono = bed.ageMa ? chronoAt(bed.ageMa) : null;
  const g0 = grainSizeInfo[bed.grainSize];
  const g1 = bed.grainSizeTop ? grainSizeInfo[bed.grainSizeTop] : null;
  return (
    <dl className="text-sm">
      <Field k={B.lithology}>
        <b className="text-base">{lith?.name ?? bed.lithologyId}</b>
      </Field>
      {bed.description && (
        <Field k={B.description}>
          <RichText text={bed.description} />
        </Field>
      )}
      <Field k={B.interval}>
        {fmtAuto(bed.topM)} – {fmtAuto(bed.baseM)} m · {B.thickness.toLowerCase()} {fmtAuto(bed.baseM - bed.topM)} m
      </Field>
      <Field k={B.grain}>
        {g1 && g1 !== g0 ? `${g0.name} (dasar) → ${g1.name} (puncak)` : g0.name} <span className="text-muted">({g0.mm} mm)</span>
      </Field>
      {bed.ageMa && (
        <Field k={B.age}>
          {chrono?.series?.name ?? chrono?.system?.name ?? ''} · {fmtAuto(bed.ageMa[0])} – {fmtAuto(bed.ageMa[1])} juta tahun
        </Field>
      )}
      <Field k={B.structures}>{bed.structures.length ? bed.structures.map((s) => vocabName('structures', s)).join(', ') : B.none}</Field>
      <Field k={B.fossils}>{bed.fossils.length ? bed.fossils.map((s) => vocabName('fossils', s)).join(', ') : B.none}</Field>
      {bed.color && <Field k={B.color}>{vocabName('colors', bed.color)}</Field>}
      <Field k={B.contact}>{contacts.find((c) => c.id === bed.baseContact)?.name}</Field>
      {f && (
        <Field k={B.formation}>
          <Link className="font-semibold text-accent underline" to={`/formasi/${f.id}`}>
            {f.name}
          </Link>
        </Field>
      )}
      {bed.environmentId && (
        <Field k={B.environment}>
          <Link className="font-semibold text-accent underline" to={`/interpretasi?lingkungan=${bed.environmentId}`}>
            {environmentNames[bed.environmentId] ?? bed.environmentId}
          </Link>{' '}
          <span className="text-muted">({B.authorInterp})</span>
        </Field>
      )}
    </dl>
  );
}

function Multi({ label, options, value, onChange }: { label: string; options: { id: string; name: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="label mb-1">{label}</legend>
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button key={o.id} type="button" className="chip !min-h-8 cursor-pointer" aria-pressed={on} style={on ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : undefined} onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}>
              {o.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const newBed = (id: string, topM: number): Bed => ({ id, topM, baseM: topM + 5, lithologyId: 'sandstone', grainSize: 'm-sand', structures: [], fossils: [], baseContact: 'sharp' });

type EditorProps = { column: StratColumn; selectedId: string | null; onSelect: (id: string | null) => void; onChange: (c: StratColumn) => void };

/** Form-based editor: add, delete, reorder beds and edit their properties. */
export function BedEditor({ column, selectedId, onSelect, onChange }: EditorProps) {
  const beds = column.beds;
  const idx = beds.findIndex((b) => b.id === selectedId);
  const bed = idx >= 0 ? beds[idx] : null;
  const commit = (next: Bed[]) => onChange({ ...column, beds: restack(next, beds[0]?.topM ?? 0) });
  const patch = (p: Partial<Bed>) => bed && commit(beds.map((b) => (b.id === bed.id ? { ...b, ...p } : b)));
  const freshId = () => {
    let n = beds.length + 1;
    while (beds.some((b) => b.id === `b${n}`)) n++;
    return `b${n}`;
  };
  const insert = (at: number) => {
    const b = newBed(freshId(), 0);
    const next = [...beds];
    next.splice(at, 0, b);
    commit(next);
    onSelect(b.id);
  };
  const move = (dir: -1 | 1) => {
    if (idx < 0 || idx + dir < 0 || idx + dir >= beds.length) return;
    const next = [...beds];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    commit(next);
  };
  const grainSelect = (label: string, value: GrainSize, set: (g: GrainSize) => void) => (
    <label className="grid gap-1">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => set(e.target.value as GrainSize)}>
        {GRAIN_SIZES.map((g) => (
          <option key={g} value={g}>
            {grainSizeInfo[g].name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="grid gap-3 text-sm">
      <label className="grid gap-1">
        <span className="label">{E.columnTitle}</span>
        <input className="input" value={column.title} onChange={(e) => onChange({ ...column, title: e.target.value })} />
      </label>
      <div className="flex flex-wrap gap-1">
        {beds.length === 0 ? (
          <button className="btn btn-sm btn-primary" onClick={() => insert(0)}>
            {E.addFirst}
          </button>
        ) : (
          <>
            <button className="btn btn-sm" onClick={() => insert(Math.max(0, idx))}>
              {E.addAbove}
            </button>
            <button className="btn btn-sm" onClick={() => insert(idx < 0 ? beds.length : idx + 1)}>
              {E.addBelow}
            </button>
            <button className="btn btn-sm" disabled={idx <= 0} onClick={() => move(-1)}>
              ↑ {E.up}
            </button>
            <button className="btn btn-sm" disabled={idx < 0 || idx >= beds.length - 1} onClick={() => move(1)}>
              ↓ {E.down}
            </button>
            <button
              className="btn btn-sm"
              disabled={!bed}
              onClick={() => {
                commit(beds.filter((b) => b.id !== selectedId));
                onSelect(null);
              }}
            >
              ✕ {E.delete}
            </button>
          </>
        )}
      </div>
      {bed ? (
        <div className="grid gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="label">{E.thicknessM}</span>
              <input
                className="input"
                type="number"
                min={0.1}
                step={0.5}
                value={Math.round((bed.baseM - bed.topM) * 100) / 100}
                onChange={(e) => patch({ baseM: bed.topM + Math.max(0.1, Number(e.target.value) || 0.1) })}
              />
            </label>
            <label className="grid gap-1">
              <span className="label">{B.lithology}</span>
              <select
                className="input"
                value={bed.lithologyId}
                onChange={(e) => {
                  const l = lithologyById.get(e.target.value);
                  patch({ lithologyId: e.target.value, grainSize: l?.grainSize ?? bed.grainSize, grainSizeTop: undefined });
                }}
              >
                {lithologies.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            {grainSelect(B.grainBase, bed.grainSize, (g) => patch({ grainSize: g }))}
            {grainSelect(B.grainTop, bed.grainSizeTop ?? bed.grainSize, (g) => patch({ grainSizeTop: g === bed.grainSize ? undefined : g }))}
            <label className="grid gap-1">
              <span className="label">{B.contact}</span>
              <select className="input" value={bed.baseContact} onChange={(e) => patch({ baseContact: e.target.value as Bed['baseContact'] })}>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="label">{B.color}</span>
              <select className="input" value={bed.color ?? ''} onChange={(e) => patch({ color: e.target.value || undefined })}>
                <option value="">{B.none}</option>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Multi label={B.structures} options={structures} value={bed.structures} onChange={(v) => patch({ structures: v })} />
          <Multi label={B.fossils} options={fossils} value={bed.fossils} onChange={(v) => patch({ fossils: v })} />
          <label className="grid gap-1">
            <span className="label">{B.environment}</span>
            <select className="input" value={bed.environmentId ?? ''} onChange={(e) => patch({ environmentId: e.target.value || undefined })}>
              <option value="">{B.none}</option>
              {Object.entries(environmentNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="label">{B.description}</span>
            <textarea className="input !h-auto py-2" rows={2} value={bed.description ?? ''} onChange={(e) => patch({ description: e.target.value || undefined })} />
          </label>
        </div>
      ) : (
        beds.length > 0 && <p className="text-muted">{ui.column.selectBed}</p>
      )}
    </div>
  );
}
