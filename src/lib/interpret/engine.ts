import { grainGroup } from '@/content/environments';
import type { Environment, Observation, ObservationFeature, Rule } from '@/content/schema';

/**
 * Transparent rule-based interpretation of depositional environments (BUMILAPIS.md 4.6).
 * score = Σ weights of matched rules ÷ the largest positive sum the environment could reach
 * with the features the user actually filled in. Empty features never count against a candidate.
 */
export type Candidate = {
  env: Environment;
  /** 0–1. */
  score: number;
  raw: number;
  maxPositive: number;
  supporting: Rule[];
  opposing: Rule[];
  diagnosticHits: number;
};
export type Suggestion = { feature: ObservationFeature; value: string; favours: string; against: string; difference: number; note: string };
export type Interpretation = { candidates: Candidate[]; top: Candidate[]; suggestions: Suggestion[]; filled: ObservationFeature[] };

/** Values the user gave for a feature, in rule vocabulary; empty when the feature is not filled in. */
export function observedValues(obs: Observation, feature: ObservationFeature): string[] {
  const v = obs[feature];
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v;
  if (feature === 'grainSize') return [grainGroup(obs.grainSize!)];
  return [v as string];
}

export const filledFeatures = (obs: Observation, features: readonly ObservationFeature[]) => features.filter((f) => observedValues(obs, f).length > 0);

const FEATURES: ObservationFeature[] = ['lithology', 'grainSize', 'sorting', 'rounding', 'structures', 'fossils', 'color', 'trend', 'geometry', 'special'];

export function scoreEnvironment(env: Environment, obs: Observation): Candidate {
  const supporting: Rule[] = [];
  const opposing: Rule[] = [];
  let raw = 0;
  let maxPositive = 0;
  for (const f of FEATURES) {
    const values = observedValues(obs, f);
    if (values.length === 0) continue;
    const rules = env.rules.filter((r) => r.feature === f);
    // best the environment could do with this many observed values of the feature
    const positives = rules
      .filter((r) => r.weight > 0)
      .map((r) => r.weight)
      .sort((a, b) => b - a);
    maxPositive += positives.slice(0, values.length).reduce((s, w) => s + w, 0);
    for (const rule of rules) {
      if (!values.includes(rule.value)) continue;
      raw += rule.weight;
      (rule.weight > 0 ? supporting : opposing).push(rule);
    }
  }
  const score = maxPositive > 0 ? Math.min(1, Math.max(0, raw / maxPositive)) : 0;
  supporting.sort((a, b) => b.weight - a.weight);
  opposing.sort((a, b) => a.weight - b.weight);
  return { env, score, raw, maxPositive, supporting, opposing, diagnosticHits: supporting.filter((r) => r.diagnostic).length };
}

const weightOf = (env: Environment, feature: ObservationFeature, value: string) => env.rules.find((r) => r.feature === feature && r.value === value)?.weight ?? 0;

/** Unfilled observations that would best tell the two leading candidates apart. */
export function suggest(a: Candidate, b: Candidate, obs: Observation, limit = 4): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const env of [a.env, b.env]) {
    for (const rule of env.rules) {
      const key = `${rule.feature}:${rule.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const current = observedValues(obs, rule.feature);
      const multi = Array.isArray(obs[rule.feature]) || ['lithology', 'structures', 'fossils', 'special'].includes(rule.feature);
      if (current.includes(rule.value) || (!multi && current.length > 0)) continue;
      const wa = weightOf(a.env, rule.feature, rule.value);
      const wb = weightOf(b.env, rule.feature, rule.value);
      const difference = Math.abs(wa - wb);
      if (difference < 3) continue;
      const fav = wa > wb ? a.env : b.env;
      const other = wa > wb ? b.env : a.env;
      out.push({ feature: rule.feature, value: rule.value, favours: fav.id, against: other.id, difference, note: fav.rules.find((r) => r.feature === rule.feature && r.value === rule.value)?.note ?? rule.note });
    }
  }
  return out.sort((x, y) => y.difference - x.difference).slice(0, limit);
}

export function interpret(obs: Observation, envs: Environment[]): Interpretation {
  const candidates = envs
    .map((e) => scoreEnvironment(e, obs))
    .sort((x, y) => y.score - x.score || y.diagnosticHits - x.diagnosticHits || y.raw - x.raw);
  const top = candidates.slice(0, 3);
  const filled = filledFeatures(obs, FEATURES);
  return { candidates, top, suggestions: filled.length && top.length >= 2 ? suggest(top[0], top[1], obs) : [], filled };
}
