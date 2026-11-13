const nf = (digits: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const cache = new Map<number, Intl.NumberFormat>();

/** Format a number with Indonesian locale conventions. */
export function fmt(value: number, digits = 0): string {
  let f = cache.get(digits);
  if (!f) {
    f = nf(digits);
    cache.set(digits, f);
  }
  return f.format(value);
}

/** Pick a sensible number of decimals for the magnitude. */
export function fmtAuto(value: number): string {
  const a = Math.abs(value);
  if (a === 0) return '0';
  if (a >= 100) return fmt(value, 0);
  if (a >= 10) return fmt(value, 1);
  if (a >= 1) return fmt(value, 2);
  if (a >= 0.01) return fmt(value, 3);
  return fmt(value, 4);
}

export function fmtRange(range: readonly [number, number], digits = 0, unit = ''): string {
  const u = unit ? ` ${unit}` : '';
  if (range[0] === range[1]) return `${fmt(range[0], digits)}${u}`;
  return `${fmt(range[0], digits)} – ${fmt(range[1], digits)}${u}`;
}

/** "120 km di atas muka laut" / "2.891 km di bawah permukaan". */
export function fmtAltitude(km: number): string {
  if (km >= 0) return `${fmtAuto(km)} km di atas muka laut`;
  return `${fmtAuto(-km)} km di bawah permukaan`;
}
