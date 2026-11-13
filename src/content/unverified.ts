import { builtinColumns } from './columns';
import { formations } from './formations';

/** Human-readable list of content entries flagged verified:false. */
export function unverifiedEntries(): string[] {
  return [
    ...formations.filter((f) => !f.verified).map((f) => `${f.name}: umur dan ketebalan belum dirujuk langsung ke sumber primer.`),
    ...builtinColumns.filter((c) => !c.verified).map((c) => `${c.title}: tebal lapisan ilustratif.`),
  ];
}
