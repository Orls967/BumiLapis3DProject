import type { GrainSize, Lithology } from './schema';

/** Lithologies with their fill colour and default grain-size position. Patterns are drawn in ui/lithologyPatterns.ts. */
export const lithologies: Lithology[] = [
  { id: 'sandstone', name: 'Batupasir', nameEn: 'sandstone', patternId: 'sandstone', color: '#f0d273', grainSize: 'm-sand' },
  { id: 'siltstone', name: 'Batulanau', nameEn: 'siltstone', patternId: 'siltstone', color: '#d8c69a', grainSize: 'silt' },
  { id: 'shale', name: 'Serpih / batulempung', nameEn: 'shale / claystone', patternId: 'shale', color: '#a3acb3', grainSize: 'clay' },
  { id: 'conglomerate', name: 'Konglomerat', nameEn: 'conglomerate', patternId: 'conglomerate', color: '#e6ab5e', grainSize: 'pebble' },
  { id: 'breccia', name: 'Breksi', nameEn: 'breccia', patternId: 'breccia', color: '#cf9366', grainSize: 'pebble' },
  { id: 'limestone', name: 'Batugamping', nameEn: 'limestone', patternId: 'limestone', color: '#86bdea', grainSize: 'f-sand' },
  { id: 'dolomite', name: 'Dolomit', nameEn: 'dolomite', patternId: 'dolomite', color: '#a79ddb', grainSize: 'f-sand' },
  { id: 'marl', name: 'Napal', nameEn: 'marl', patternId: 'marl', color: '#a8d3c2', grainSize: 'clay' },
  { id: 'coal', name: 'Batubara', nameEn: 'coal', patternId: 'coal', color: '#2a2a2e', grainSize: 'clay' },
  { id: 'chert', name: 'Rijang', nameEn: 'chert', patternId: 'chert', color: '#dc9191', grainSize: 'clay' },
  { id: 'evaporite', name: 'Evaporit', nameEn: 'evaporite', patternId: 'evaporite', color: '#f3c8e2', grainSize: 'silt' },
  { id: 'tuff', name: 'Tuf / vulkaniklastik', nameEn: 'tuff / volcaniclastic', patternId: 'tuff', color: '#cbb9dc', grainSize: 'f-sand' },
  { id: 'igneous', name: 'Batuan beku', nameEn: 'igneous rock', patternId: 'igneous', color: '#e57373', grainSize: 'c-sand' },
  { id: 'metamorphic', name: 'Batuan metamorf', nameEn: 'metamorphic rock', patternId: 'metamorphic', color: '#93ab90', grainSize: 'c-sand' },
];

export const lithologyById = new Map(lithologies.map((l) => [l.id, l]));

/** Udden–Wentworth classes (BUMILAPIS.md Bagian 3.D2). */
export const grainSizeInfo: Record<GrainSize, { name: string; short: string; mm: string; midMm: number }> = {
  clay: { name: 'Lempung', short: 'lp', mm: '< 0,0039', midMm: 0.002 },
  silt: { name: 'Lanau', short: 'ln', mm: '0,0039 – 0,0625', midMm: 0.016 },
  'vf-sand': { name: 'Pasir sangat halus', short: 'psh', mm: '0,0625 – 0,125', midMm: 0.09 },
  'f-sand': { name: 'Pasir halus', short: 'ph', mm: '0,125 – 0,25', midMm: 0.18 },
  'm-sand': { name: 'Pasir sedang', short: 'ps', mm: '0,25 – 0,5', midMm: 0.35 },
  'c-sand': { name: 'Pasir kasar', short: 'pk', mm: '0,5 – 1', midMm: 0.7 },
  'vc-sand': { name: 'Pasir sangat kasar', short: 'psk', mm: '1 – 2', midMm: 1.4 },
  granule: { name: 'Granul', short: 'gr', mm: '2 – 4', midMm: 3 },
  pebble: { name: 'Kerikil', short: 'kr', mm: '4 – 64', midMm: 16 },
  cobble: { name: 'Kerakal', short: 'kk', mm: '64 – 256', midMm: 128 },
  boulder: { name: 'Bongkah', short: 'bk', mm: '> 256', midMm: 400 },
};
