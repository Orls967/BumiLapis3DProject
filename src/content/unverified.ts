import { builtinColumns } from './columns';
import { formations } from './formations';

/** Human-readable list of content entries flagged verified:false. */
export function unverifiedEntries(): string[] {
  return [
    ...formations.filter((f) => !f.verified).map((f) => `${f.name}: umur dan ketebalan belum dirujuk langsung ke sumber primer.`),
    'Diagram Hjulström: kurva erosi dan pengendapan didigitasi secara pendekatan dari diagram klasik (Hjulström, 1935), belum dicocokkan titik demi titik dengan sumber primer.',
    'Bobot aturan mesin interpretasi (1–5): penilaian ajar yang diturunkan dari tabel ciri diagnostik, bukan hasil pengukuran.',
    ...builtinColumns.filter((c) => !c.verified).map((c) => `${c.title}: tebal lapisan ilustratif.`),
  ];
}
