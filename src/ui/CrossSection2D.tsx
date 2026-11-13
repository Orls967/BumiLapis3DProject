import { atmosphereShells, interiorShells } from '@/content/layers';
import { ui } from '@/content/ui';
import { displayRadius } from '@/lib/profile/scale';
import { useEarth } from '@/store/earth';

/** SVG fallback / text-friendly equivalent of the globe: concentric rings using the same data and scale. */
export function CrossSection2D({ className = '' }: { className?: string }) {
  const grouping = useEarth((s) => s.grouping);
  const scaleMode = useEarth((s) => s.scaleMode);
  const selectedId = useEarth((s) => s.selectedId);
  const select = useEarth((s) => s.select);
  const rings = [...atmosphereShells.filter((l) => l.id !== 'exosphere' || scaleMode === 'exaggerated'), ...interiorShells(grouping)];
  const rMax = Math.max(...rings.map((l) => displayRadius(l.topKm, scaleMode)));
  const S = 300;
  const k = (S - 6) / rMax;
  return (
    <svg viewBox={`${-S} ${-S} ${S * 2 + 260} ${S * 2}`} className={className} role="img" aria-label={ui.explore.crossSection}>
      <rect x={-S} y={-S} width={S * 2 + 260} height={S * 2} fill="#03050c" />
      {rings.map((l, i) => {
        const r = displayRadius(l.topKm, scaleMode) * k;
        const rIn = displayRadius(l.bottomKm, scaleMode) * k;
        const active = selectedId === l.id;
        const ly = -S + 26 + i * ((S * 2 - 40) / rings.length);
        const a = -Math.PI / 2 + (i + 0.5) * (Math.PI / rings.length) * 0.9 + 0.1;
        const px = Math.cos(a) * (r + rIn) * 0.5;
        const py = Math.sin(a) * (r + rIn) * 0.5;
        return (
          <g
            key={l.id}
            role="button"
            tabIndex={0}
            aria-label={l.name}
            onClick={() => select(l.id)}
            onKeyDown={(e) => e.key === 'Enter' && select(l.id)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              r={r}
              fill={l.color}
              fillOpacity={l.realm === 'atmosphere' ? 0.45 : 1}
              stroke={active ? '#fff' : '#03050c'}
              strokeWidth={active ? 3 : 1}
            />
            <polyline points={`${px},${py} ${S + 6},${ly} ${S + 16},${ly}`} fill="none" stroke="#94a3b8" strokeWidth={1} />
            <circle cx={px} cy={py} r={3} fill="#fff" />
            <text x={S + 22} y={ly + 5} fill={active ? '#fbbf24' : '#e2e8f0'} fontSize={17} fontWeight={active ? 800 : 600}>
              {l.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
