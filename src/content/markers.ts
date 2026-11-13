import type { Source } from './schema';
import { refs } from './sources';

export type ScaleMarker = {
  id: string;
  name: string;
  altKm: number;
  note: string;
  /** Elevation angle of the tick on the cut face (layout only). */
  phiDeg: number;
  sources: Source[];
  verified: boolean;
};

/** Scale comparison markers shown as ticks at their true altitude/depth on the cut face. */
export const scaleMarkers: ScaleMarker[] = [
  { id: 'iss', name: 'ISS', altKm: 400, note: 'Stasiun Antariksa Internasional mengorbit di ≈400 km, di dalam termosfer.', phiDeg: 52, sources: [refs.spec], verified: true },
  { id: 'karman', name: 'Garis Kármán', altKm: 100, note: 'Batas antariksa menurut konvensi: 100 km.', phiDeg: 34, sources: [refs.spec], verified: true },
  {
    id: 'aircraft',
    name: 'Jelajah pesawat',
    altKm: 11,
    note: 'Pesawat jet komersial umumnya menjelajah di dekat puncak troposfer; angka ≈11 km adalah nilai tipikal yang belum dirujuk ke sumber.',
    phiDeg: 18,
    sources: [{ title: 'Nilai tipikal ketinggian jelajah pesawat jet komersial (belum dirujuk ke sumber primer)' }],
    verified: false,
  },
  { id: 'everest', name: 'Everest', altKm: 8.849, note: 'Titik tertinggi di daratan: ≈8.849 m.', phiDeg: 2, sources: [refs.spec], verified: true },
  { id: 'mariana', name: 'Palung Mariana', altKm: -10.9, note: 'Challenger Deep, titik terdalam lautan: ≈10.900 m.', phiDeg: -16, sources: [refs.noaaOcean, refs.spec], verified: true },
  { id: 'kola', name: 'Lubang bor Kola', altKm: -12.3, note: 'Lubang terdalam buatan manusia: ≈12,3 km, sekitar 0,2% jari-jari Bumi.', phiDeg: -34, sources: [refs.spec], verified: true },
];
