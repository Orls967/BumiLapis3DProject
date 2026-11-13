import type { Observation } from './schema';

/** Ready-made observation sets for the interpretation form (the test cases of BUMILAPIS.md 4.6). */
export const exampleObservations: { id: string; label: string; observation: Observation }[] = [
  {
    id: 'turbidite',
    label: 'Batupasir–serpih berurutan Bouma',
    observation: { lithology: ['sandstone', 'shale'], structures: ['graded-bedding', 'bouma', 'sole-marks'], special: ['rhythmic'] },
  },
  {
    id: 'delta',
    label: 'Mengasar ke atas dengan batubara',
    observation: { lithology: ['shale', 'sandstone', 'coal'], trend: 'coarsening-up', fossils: ['plants'], special: ['coal'] },
  },
  {
    id: 'meander',
    label: 'Menghalus ke atas, dasar erosional',
    observation: { lithology: ['sandstone', 'siltstone', 'shale'], trend: 'fining-up', structures: ['erosional-base', 'cross-bedding', 'roots', 'mud-cracks'] },
  },
  {
    id: 'desert',
    label: 'Batupasir bundar, silang-siur raksasa',
    observation: { lithology: ['sandstone'], sorting: 'very-well', rounding: 'rounded', structures: ['large-cross-bedding'], fossils: ['none'] },
  },
  { id: 'reef', label: 'Batugamping dengan koral dan alga', observation: { lithology: ['limestone'], fossils: ['coral', 'algae'] } },
  { id: 'tidal', label: 'Flaser, lentikular, tulang ikan', observation: { structures: ['flaser', 'lenticular', 'herringbone'] } },
  {
    id: 'glacial',
    label: 'Diamiktit, kerakal bergores, dropstone',
    observation: { lithology: ['conglomerate'], sorting: 'poor', structures: ['striated-clasts', 'dropstones'] },
  },
  {
    id: 'pelagic',
    label: 'Rijang radiolaria dan lempung merah',
    observation: { lithology: ['chert', 'shale'], grainSize: 'clay', color: 'red', structures: ['fine-lamination'], fossils: ['radiolaria'] },
  },
];
