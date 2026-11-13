import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StratColumn } from '@/content/schema';
import { builtinColumnById, builtinColumns } from '@/content/columns';

type ColumnsState = {
  /** Columns created in this browser: virtual wells, simulation wells, user-made, imported. */
  columns: StratColumn[];
  add: (c: StratColumn) => string;
  update: (c: StratColumn) => void;
  remove: (id: string) => void;
};

export const useColumns = create<ColumnsState>()(
  persist(
    (set, get) => ({
      columns: [],
      add: (c) => {
        const taken = new Set([...builtinColumns.map((b) => b.id), ...get().columns.map((x) => x.id)]);
        let id = c.id;
        for (let n = 2; taken.has(id); n++) id = `${c.id}-${n}`;
        set({ columns: [...get().columns, { ...c, id }] });
        return id;
      },
      update: (c) => set({ columns: get().columns.map((x) => (x.id === c.id ? c : x)) }),
      remove: (id) => set({ columns: get().columns.filter((x) => x.id !== id) }),
    }),
    { name: 'bl-columns', version: 1 },
  ),
);

export function findColumn(id: string | null | undefined, stored: StratColumn[]): StratColumn | null {
  if (!id) return null;
  return builtinColumnById.get(id) ?? stored.find((c) => c.id === id) ?? null;
}
