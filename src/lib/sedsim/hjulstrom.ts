/**
 * Hjulström diagram (BUMILAPIS.md 4.5.3): empirical, qualitative relation between flow velocity,
 * grain size and erosion / transport / deposition. The curves below are hand-digitised approximations
 * of the classic diagram (Hjulström, 1935) on log–log axes; they are for teaching, not for design.
 */
export type CurvePoint = readonly [dMm: number, vCmS: number];

/** Velocity needed to erode (entrain) loose grains of a given size from the bed. */
export const erosionCurve: CurvePoint[] = [
  [0.001, 300],
  [0.003, 160],
  [0.01, 75],
  [0.03, 38],
  [0.1, 22],
  [0.3, 18],
  [0.5, 19],
  [1, 25],
  [3, 50],
  [10, 105],
  [30, 190],
  [100, 350],
];

/** Below this velocity grains of a given size settle out (fall-velocity curve). */
export const depositionCurve: CurvePoint[] = [
  [0.01, 0.1],
  [0.03, 0.28],
  [0.1, 0.8],
  [0.3, 2.4],
  [1, 8],
  [3, 22],
  [10, 65],
  [30, 130],
  [100, 250],
];

export const HJULSTROM_RANGE = { dMm: [0.001, 100], vCmS: [0.1, 1000] } as const;
export const hjulstromSource = { title: 'Studies of the morphological activity of rivers as illustrated by the River Fyris', author: 'Hjulström, F.', year: 1935 };

/** Log–log interpolation on a digitised curve; outside the range the end segments are extrapolated. */
export function interpLogLog(curve: CurvePoint[], dMm: number): number {
  const lx = Math.log10(dMm);
  let k = 0;
  while (k < curve.length - 2 && dMm > curve[k + 1][0]) k++;
  const [x0, y0] = curve[k];
  const [x1, y1] = curve[k + 1];
  const f = (lx - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0));
  return 10 ** (Math.log10(y0) + f * (Math.log10(y1) - Math.log10(y0)));
}

export const erosionVelocity = (dMm: number) => interpLogLog(erosionCurve, dMm);
/** Grains finer than the left end of the deposition curve stay in suspension at any plotted velocity. */
export const depositionVelocity = (dMm: number) => (dMm < depositionCurve[0][0] ? 0 : interpLogLog(depositionCurve, dMm));

export type FlowClass = 'erosi' | 'transportasi' | 'pengendapan';

export function classify(dMm: number, vCmS: number): FlowClass {
  if (vCmS >= erosionVelocity(dMm)) return 'erosi';
  if (vCmS < depositionVelocity(dMm)) return 'pengendapan';
  return 'transportasi';
}
