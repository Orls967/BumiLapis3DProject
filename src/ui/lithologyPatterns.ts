import { lithologies } from '@/content/lithologies';

/** Hand-drawn lithology pattern tiles (style inspired by FGDC-STD-013; drawn for this project). */
export type PatternDef = { size: [number, number]; body: string; ink?: string };

const S = 'fill="none" stroke="INK" stroke-width="1" stroke-linecap="round"';
export const patternDefs: Record<string, PatternDef> = {
  sandstone: { size: [12, 12], body: `<circle cx="3" cy="3" r="1" fill="INK"/><circle cx="9" cy="9" r="1" fill="INK"/>` },
  siltstone: { size: [16, 10], body: `<circle cx="3" cy="3" r="0.8" fill="INK"/><circle cx="11" cy="8" r="0.8" fill="INK"/><path ${S} d="M7,3H12 M0.5,8H5"/>` },
  shale: { size: [18, 8], body: `<path ${S} d="M1,2.5H11 M8,6.5H17"/>` },
  conglomerate: { size: [24, 20], body: `<ellipse cx="6.5" cy="6" rx="4.4" ry="3.2" ${S}/><ellipse cx="17" cy="14.5" rx="4.8" ry="3.4" ${S}/><circle cx="17.5" cy="4.5" r="1.8" ${S}/><circle cx="5" cy="15.5" r="1.5" ${S}/>` },
  breccia: { size: [24, 20], body: `<path ${S} stroke-linejoin="miter" d="M2.5,9L6.5,2L10.5,8Z M14,17L16.5,10.5L22,16Z M15,6.5L19.5,3L20,7.5Z M3,17.5L6,13.5L8.5,18Z"/>` },
  limestone: { size: [24, 12], body: `<path ${S} d="M0,0.5H24 M0,6.5H24 M12,0.5V6.5 M0.5,6.5V12 M23.5,6.5V12"/>` },
  dolomite: { size: [24, 12], body: `<path ${S} d="M0,0.5H24 M0,6.5H24 M14,0.5L10,6.5 M3,6.5L-1,12.5 M27,6.5L23,12.5"/>` },
  marl: { size: [24, 12], body: `<path ${S} d="M0,0.5H24 M12,0.5V6 M2,9.5H9 M14,9.5H21"/>` },
  coal: { size: [16, 8], body: `<path ${S} d="M0,2H7 M9,6H16"/>`, ink: '#8b8b93' },
  chert: { size: [18, 14], body: `<path ${S} d="M2.5,6.5L5,2.5L7.5,6.5Z M11.5,12.5L14,8.5L16.5,12.5Z"/>` },
  evaporite: { size: [12, 12], body: `<path ${S} stroke-width="0.8" d="M0,12L12,0 M0,0L12,12"/>` },
  tuff: { size: [20, 14], body: `<path ${S} d="M3,2.5l2,3.5l2,-3.5 M12.5,9l2,3.5l2,-3.5"/><circle cx="14" cy="3" r="0.7" fill="INK"/><circle cx="4.5" cy="10.5" r="0.7" fill="INK"/>` },
  igneous: { size: [18, 18], body: `<path ${S} d="M4.5,2V7 M2,4.5H7 M13.5,11V16 M11,13.5H16"/>` },
  metamorphic: { size: [20, 10], body: `<path ${S} d="M0,3Q5,0 10,3T20,3 M0,8Q5,5 10,8T20,8"/>` },
};

const INK = '#2b2b33';

export function patternMarkup(lithologyId: string): { size: [number, number]; svg: string } {
  const lith = lithologies.find((l) => l.id === lithologyId);
  const def = patternDefs[lith?.patternId ?? ''] ?? { size: [8, 8], body: '' };
  const [w, h] = def.size;
  return {
    size: def.size,
    svg: `<rect width="${w}" height="${h}" fill="${lith?.color ?? '#cccccc'}"/>${def.body.replaceAll('INK', def.ink ?? INK)}`,
  };
}

/** Rasterise every lithology pattern to a canvas tile (used by the 3D block and mini previews). */
export async function loadPatternTiles(scale = 2): Promise<Map<string, HTMLCanvasElement>> {
  const out = new Map<string, HTMLCanvasElement>();
  await Promise.all(
    lithologies.map(async (l) => {
      const { size, svg } = patternMarkup(l.id);
      const [w, h] = size;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      const src = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}">${svg}</svg>`;
      try {
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('pattern'));
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;
        });
        ctx.drawImage(img, 0, 0);
      } catch {
        ctx.fillStyle = l.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      out.set(l.id, canvas);
    }),
  );
  return out;
}
