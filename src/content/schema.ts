import { z } from 'zod';

export const sourceSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  year: z.number().int().optional(),
  url: z.string().url().optional(),
});
export type Source = z.infer<typeof sourceSchema>;

/** Udden–Wentworth classes, fine → coarse. */
export const GRAIN_SIZES = [
  'clay',
  'silt',
  'vf-sand',
  'f-sand',
  'm-sand',
  'c-sand',
  'vc-sand',
  'granule',
  'pebble',
  'cobble',
  'boulder',
] as const;
export const grainSizeSchema = z.enum(GRAIN_SIZES);
export type GrainSize = z.infer<typeof grainSizeSchema>;

export const earthLayerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  realm: z.enum(['atmosphere', 'surface', 'interior', 'functional']),
  grouping: z.enum(['compositional', 'mechanical', 'both']).optional(),
  /** Layer that this entry is a lateral variant of (e.g. oceanic vs continental crust). */
  variantOf: z.string().optional(),
  topKm: z.number(),
  bottomKm: z.number(),
  /** Free-text qualifier for the depth range (e.g. "rata-rata; sampai ≈70 km di bawah pegunungan"). */
  rangeNote: z.string().optional(),
  state: z.enum(['gas', 'liquid', 'solid', 'plasma', 'mixed']).optional(),
  stateNote: z.string().optional(),
  tempC: z.tuple([z.number(), z.number()]).optional(),
  tempNote: z.string().optional(),
  pressure: z.object({ min: z.number(), max: z.number(), unit: z.enum(['hPa', 'GPa']) }).optional(),
  densityGcm3: z.tuple([z.number(), z.number()]).optional(),
  share: z.string().optional(),
  composition: z.array(z.object({ label: z.string(), fraction: z.number().min(0).max(1).optional() })).min(1),
  compositionNote: z.string().optional(),
  zones: z.array(z.object({ name: z.string(), range: z.string(), note: z.string() })).optional(),
  summary: z.string().min(40),
  keyFact: z.string().min(10),
  insights: z.array(z.string().min(20)).min(3),
  evidence: z.array(z.string().min(20)).min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sources: z.array(sourceSchema).min(1),
  verified: z.boolean(),
});
export type EarthLayer = z.infer<typeof earthLayerSchema>;

export const lithologySchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string(),
  patternId: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  grainSize: grainSizeSchema,
});
export type Lithology = z.infer<typeof lithologySchema>;

export const baseContactSchema = z.enum(['sharp', 'gradational', 'erosional', 'unconformity']);
export type BaseContact = z.infer<typeof baseContactSchema>;

export const bedSchema = z
  .object({
    id: z.string().min(1),
    topM: z.number(),
    baseM: z.number(),
    lithologyId: z.string(),
    grainSize: grainSizeSchema,
    grainSizeTop: grainSizeSchema.optional(),
    structures: z.array(z.string()),
    fossils: z.array(z.string()),
    color: z.string().optional(),
    baseContact: baseContactSchema,
    formationId: z.string().optional(),
    ageMa: z.tuple([z.number(), z.number()]).optional(),
    description: z.string().optional(),
    environmentId: z.string().optional(),
  })
  .refine((b) => b.baseM > b.topM, { message: 'baseM must be deeper than topM' });
export type Bed = z.infer<typeof bedSchema>;

export const stratColumnSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  kind: z.enum(['example', 'case-study', 'virtual-well', 'simulation', 'user']),
  note: z.string().optional(),
  beds: z.array(bedSchema),
  sources: z.array(sourceSchema),
  verified: z.boolean(),
});
export type StratColumn = z.infer<typeof stratColumnSchema>;

export const formationSchema = z.object({
  id: z.string(),
  name: z.string(),
  basin: z.string(),
  age: z.string(),
  ageMa: z.tuple([z.number(), z.number()]).optional(),
  thicknessM: z.tuple([z.number(), z.number()]).optional(),
  lithologies: z.array(z.string()).min(1),
  environmentIds: z.array(z.string()),
  overlies: z.string().optional(),
  underlies: z.string().optional(),
  contactBelow: z.enum(['conformable', 'unconformable']).optional(),
  economic: z.array(z.string()).optional(),
  typeLocality: z.string().optional(),
  description: z.string().min(20),
  sources: z.array(sourceSchema).min(1),
  verified: z.boolean(),
});
export type Formation = z.infer<typeof formationSchema>;

export const OBSERVATION_FEATURES = [
  'lithology',
  'grainSize',
  'sorting',
  'rounding',
  'structures',
  'fossils',
  'color',
  'trend',
  'geometry',
  'special',
] as const;
export type ObservationFeature = (typeof OBSERVATION_FEATURES)[number];

export const observationSchema = z.object({
  lithology: z.array(z.string()).optional(),
  grainSize: grainSizeSchema.optional(),
  sorting: z.enum(['poor', 'moderate', 'well', 'very-well']).optional(),
  rounding: z.enum(['angular', 'subangular', 'subrounded', 'rounded']).optional(),
  structures: z.array(z.string()).optional(),
  fossils: z.array(z.string()).optional(),
  color: z.string().optional(),
  trend: z.enum(['fining-up', 'coarsening-up', 'uniform', 'cyclic']).optional(),
  geometry: z.string().optional(),
  special: z.array(z.string()).optional(),
});
export type Observation = z.infer<typeof observationSchema>;

export const ruleSchema = z.object({
  feature: z.enum(OBSERVATION_FEATURES),
  value: z.string(),
  weight: z
    .number()
    .int()
    .refine((w) => w !== 0 && Math.abs(w) <= 5, { message: '|weight| must be 1..5' }),
  diagnostic: z.boolean().optional(),
  note: z.string().min(5),
});
export type Rule = z.infer<typeof ruleSchema>;

export const environmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string(),
  setting: z.enum(['continental', 'transitional', 'marine']),
  description: z.string().min(30),
  diagnostics: z.array(z.string()).min(2),
  rules: z.array(ruleSchema).min(4),
  typicalSuccession: z.array(bedSchema).min(2),
  relativeWaterDepth: z.number().min(-1).max(5),
  adjacent: z.array(z.string()).min(1),
  exampleFormations: z.array(z.string()).optional(),
  sources: z.array(sourceSchema).min(1),
});
export type Environment = z.infer<typeof environmentSchema>;

export const glossaryEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  term: z.string(),
  termEn: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  definition: z.string().min(20),
  link: z.string().optional(),
});
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

export const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(3),
  answer: z.number().int().min(0),
  explanation: z.string().min(10),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
