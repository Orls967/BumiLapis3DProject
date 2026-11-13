/**
 * Subset of the International Chronostratigraphic Chart (ICS v2023/09): boundary ages (Ma)
 * and the official CGMW colours, used for the age lane of stratigraphic columns.
 */
export type ChronoUnit = { name: string; nameEn: string; baseMa: number; topMa: number; color: string };

export const series: ChronoUnit[] = [
  { name: 'Holosen', nameEn: 'Holocene', topMa: 0, baseMa: 0.0117, color: '#FEF2E0' },
  { name: 'Pleistosen', nameEn: 'Pleistocene', topMa: 0.0117, baseMa: 2.58, color: '#FFF2AE' },
  { name: 'Pliosen', nameEn: 'Pliocene', topMa: 2.58, baseMa: 5.333, color: '#FFFF99' },
  { name: 'Miosen', nameEn: 'Miocene', topMa: 5.333, baseMa: 23.03, color: '#FFFF00' },
  { name: 'Oligosen', nameEn: 'Oligocene', topMa: 23.03, baseMa: 33.9, color: '#FDC07A' },
  { name: 'Eosen', nameEn: 'Eocene', topMa: 33.9, baseMa: 56.0, color: '#FDB46C' },
  { name: 'Paleosen', nameEn: 'Paleocene', topMa: 56.0, baseMa: 66.0, color: '#FDA75F' },
];

export const systems: ChronoUnit[] = [
  { name: 'Kuarter', nameEn: 'Quaternary', topMa: 0, baseMa: 2.58, color: '#F9F97F' },
  { name: 'Neogen', nameEn: 'Neogene', topMa: 2.58, baseMa: 23.03, color: '#FFE619' },
  { name: 'Paleogen', nameEn: 'Paleogene', topMa: 23.03, baseMa: 66.0, color: '#FD9A52' },
  { name: 'Kapur', nameEn: 'Cretaceous', topMa: 66.0, baseMa: 145.0, color: '#7FC64E' },
  { name: 'Jura', nameEn: 'Jurassic', topMa: 145.0, baseMa: 201.4, color: '#34B2C9' },
  { name: 'Trias', nameEn: 'Triassic', topMa: 201.4, baseMa: 251.902, color: '#812B92' },
  { name: 'Perm', nameEn: 'Permian', topMa: 251.902, baseMa: 298.9, color: '#F04028' },
  { name: 'Karbon', nameEn: 'Carboniferous', topMa: 298.9, baseMa: 358.9, color: '#67A599' },
  { name: 'Devon', nameEn: 'Devonian', topMa: 358.9, baseMa: 419.2, color: '#CB8C37' },
  { name: 'Silur', nameEn: 'Silurian', topMa: 419.2, baseMa: 443.8, color: '#B3E1B6' },
  { name: 'Ordovisium', nameEn: 'Ordovician', topMa: 443.8, baseMa: 485.4, color: '#009270' },
  { name: 'Kambrium', nameEn: 'Cambrian', topMa: 485.4, baseMa: 538.8, color: '#7FA056' },
];

const find = (units: ChronoUnit[], ma: number) => units.find((u) => ma >= u.topMa && ma <= u.baseMa) ?? null;

/** System and series containing the midpoint of an age range (Ma). */
export function chronoAt(ageMa: readonly [number, number]): { system: ChronoUnit | null; series: ChronoUnit | null } {
  const mid = (ageMa[0] + ageMa[1]) / 2;
  return { system: find(systems, mid), series: find(series, mid) };
}

/** Miocene sub-epoch boundaries used to turn "Miosen Awal/Tengah/Akhir" into numbers (ICS v2023/09). */
export const MIOCENE = { earlyBase: 23.03, middleBase: 15.98, lateBase: 11.63, top: 5.333 };
