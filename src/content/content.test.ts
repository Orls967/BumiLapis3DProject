import { describe, expect, it } from 'vitest';
import { discontinuities, interiorShells, layerById, layers } from './layers';
import { glossary } from './glossary';
import { quizzes } from './quizzes';
import { tour } from './tour';
import { scaleMarkers } from './markers';
import { earthLayerSchema, glossaryEntrySchema, quizQuestionSchema, sourceSchema } from './schema';

describe('earth layers', () => {
  it('validate against the schema with ≥3 insights and ≥1 source each', () => {
    for (const l of layers) {
      const r = earthLayerSchema.safeParse(l);
      expect(r.success, `${l.id}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true);
      expect(l.insights.length).toBeGreaterThanOrEqual(3);
      expect(l.sources.length).toBeGreaterThanOrEqual(1);
    }
    expect(new Set(layers.map((l) => l.id)).size).toBe(layers.length);
  });

  it('has no depth gaps or overlaps within each grouping mode', () => {
    for (const mode of ['compositional', 'mechanical'] as const) {
      const shells = interiorShells(mode);
      expect(shells[0].topKm).toBe(0);
      for (let i = 1; i < shells.length; i++) expect(shells[i].topKm, `${mode}: ${shells[i].id}`).toBe(shells[i - 1].bottomKm);
      expect(shells[shells.length - 1].bottomKm).toBe(-6371);
    }
  });

  it('stacks the five atmospheric layers without gaps', () => {
    const atm = layers.filter((l) => l.realm === 'atmosphere').sort((a, b) => a.bottomKm - b.bottomKm);
    expect(atm.map((l) => l.id)).toEqual(['troposphere', 'stratosphere', 'mesosphere', 'thermosphere', 'exosphere']);
    expect(atm[0].bottomKm).toBe(0);
    for (let i = 1; i < atm.length; i++) expect(atm[i].bottomKm).toBe(atm[i - 1].topKm);
  });

  it('includes every layer required by the spec and valid variants', () => {
    for (const id of ['ionosphere', 'ozone-layer', 'magnetosphere', 'ocean', 'cryosphere', 'biosphere', 'continental-crust', 'oceanic-crust', 'upper-mantle', 'transition-zone', 'lower-mantle', 'outer-core', 'inner-core', 'lithosphere', 'asthenosphere', 'mesosphere-mantle'])
      expect(layerById.has(id), id).toBe(true);
    for (const l of layers) if (l.variantOf) expect(layerById.has(l.variantOf)).toBe(true);
    expect(discontinuities.map((d) => d.depthKm)).toEqual([35, 410, 660, 2891, 5150]);
  });
});

describe('learning content', () => {
  it('has a glossary of at least 80 valid, unique terms covering the required minimum', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(80);
    expect(new Set(glossary.map((g) => g.id)).size).toBe(glossary.length);
    for (const g of glossary) expect(glossaryEntrySchema.safeParse(g).success, g.id).toBe(true);
    const terms = glossary.map((g) => g.term.toLowerCase());
    for (const t of ['akomodasi', 'agradasi', 'astenosfer', 'bioturbasi', 'diagenesis', 'diskontinuitas', 'eustasi', 'fasies', 'formasi', 'geodinamo', 'hukum walther', 'ketidakselarasan', 'litosfer', 'litologi', 'moho', 'pemilahan', 'progradasi', 'regresi', 'retrogradasi', 'silang-siur', 'subsidence', 'superposisi', 'transgresi', 'turbidit', 'urutan bouma'])
      expect(terms, t).toContain(t);
  });

  it('has five valid questions per quiz', () => {
    for (const [k, quiz] of Object.entries(quizzes)) {
      expect(quiz.questions, k).toHaveLength(5);
      for (const q of quiz.questions) {
        expect(quizQuestionSchema.safeParse(q).success).toBe(true);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });

  it('has a tour of 8–10 steps pointing at existing layers, from exosphere to inner core', () => {
    expect(tour.length).toBeGreaterThanOrEqual(8);
    expect(tour.length).toBeLessThanOrEqual(10);
    for (const s of tour) expect(layerById.has(s.layerId), s.layerId).toBe(true);
    expect(tour[0].layerId).toBe('exosphere');
    expect(tour[tour.length - 1].layerId).toBe('inner-core');
    for (let i = 1; i < tour.length; i++) expect(tour[i].depthKm).toBeLessThan(tour[i - 1].depthKm);
  });

  it('has sourced scale markers', () => {
    for (const m of scaleMarkers) for (const s of m.sources) expect(sourceSchema.safeParse(s).success).toBe(true);
  });
});
