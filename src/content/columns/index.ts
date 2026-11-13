import type { StratColumn } from '../schema';
import teaching from './teaching.json';
import southSumatra from './south-sumatra.json';

/** Built-in columns. Add a JSON file and list it here to include another basin. */
export const builtinColumns = [teaching, southSumatra] as unknown as StratColumn[];
export const builtinColumnById = new Map(builtinColumns.map((c) => [c.id, c]));
