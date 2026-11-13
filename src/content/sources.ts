import type { Source } from './schema';

/** Shared reference list (BUMILAPIS.md Bagian 3.H plus additional cited works). */
export const refs = {
  prem: {
    title: 'Preliminary Reference Earth Model. Physics of the Earth and Planetary Interiors, 25, 297–356',
    author: 'Dziewonski, A. M. & Anderson, D. L.',
    year: 1981,
    url: 'https://doi.org/10.1016/0031-9201(81)90046-7',
  },
  ussa: { title: 'U.S. Standard Atmosphere, 1976', author: 'NOAA, NASA, USAF', year: 1976 },
  fergusonChurch: {
    title: 'A simple universal equation for grain settling velocity. Journal of Sedimentary Research, 74(6), 933–937',
    author: 'Ferguson, R. I. & Church, M.',
    year: 2004,
    url: 'https://doi.org/10.1306/051204740933',
  },
  boggs: { title: 'Principles of Sedimentology and Stratigraphy (edisi ke-5)', author: 'Boggs, S.', year: 2011 },
  nichols: { title: 'Sedimentology and Stratigraphy (edisi ke-2)', author: 'Nichols, G.', year: 2009 },
  bishop: {
    title: 'South Sumatra Basin Province, Indonesia: The Lahat/Talang Akar–Cenozoic Total Petroleum System. USGS Open-File Report 99-50-S',
    author: 'Bishop, M. G.',
    year: 2001,
    url: 'https://pubs.usgs.gov/of/1999/ofr-99-0050/OF99-50S/',
  },
  deCoster: {
    title: 'The geology of the Central and South Sumatra Basins. Proceedings Indonesian Petroleum Association, 3rd Annual Convention, 77–110',
    author: 'De Coster, G. L.',
    year: 1974,
  },
  ics: {
    title: 'International Chronostratigraphic Chart v2023/09',
    author: 'International Commission on Stratigraphy',
    year: 2023,
    url: 'https://stratigraphy.org/chart',
  },
  fgdc: {
    title: 'FGDC Digital Cartographic Standard for Geologic Map Symbolization (FGDC-STD-013-2006)',
    author: 'Federal Geographic Data Committee',
    year: 2006,
    url: 'https://ngmdb.usgs.gov/fgdc_gds/geolsymstd.php',
  },
  blueMarble: {
    title: 'Blue Marble Next Generation / Visible Earth',
    author: 'NASA Earth Observatory',
    url: 'https://visibleearth.nasa.gov/collection/1484/blue-marble',
  },
  usgsInterior: {
    title: 'The Interior of the Earth (USGS General Interest Publication)',
    author: 'Robertson, E. C.',
    year: 2011,
    url: 'https://pubs.usgs.gov/gip/interior/',
  },
  fowler: { title: 'The Solid Earth: An Introduction to Global Geophysics (edisi ke-2)', author: 'Fowler, C. M. R.', year: 2005 },
  wallaceHobbs: {
    title: 'Atmospheric Science: An Introductory Survey (edisi ke-2)',
    author: 'Wallace, J. M. & Hobbs, P. V.',
    year: 2006,
  },
  lehmann: { title: "P′. Publications du Bureau Central Séismologique International, A14, 87–115", author: 'Lehmann, I.', year: 1936 },
  noaaOcean: {
    title: 'How deep is the ocean? (NOAA National Ocean Service)',
    author: 'NOAA',
    url: 'https://oceanservice.noaa.gov/facts/oceandepth.html',
  },
  usgsWater: {
    title: "Where is Earth's Water? (USGS Water Science School)",
    author: 'USGS',
    url: 'https://www.usgs.gov/special-topics/water-science-school/science/where-earths-water',
  },
  bird: {
    title: 'An updated digital model of plate boundaries. Geochemistry, Geophysics, Geosystems, 4(3), 1027',
    author: 'Bird, P.',
    year: 2003,
    url: 'https://doi.org/10.1029/2001GC000252',
  },
  hjulstrom: {
    title: 'Studies of the morphological activity of rivers as illustrated by the River Fyris. Bulletin of the Geological Institution of the University of Upsala, 25, 221–527',
    author: 'Hjulström, F.',
    year: 1935,
  },
  bouma: { title: 'Sedimentology of Some Flysch Deposits: A Graphic Approach to Facies Interpretation', author: 'Bouma, A. H.', year: 1962 },
  wentworth: {
    title: 'A scale of grade and class terms for clastic sediments. The Journal of Geology, 30(5), 377–392',
    author: 'Wentworth, C. K.',
    year: 1922,
  },
  spec: { title: 'Ringkasan konten ilmiah proyek (BUMILAPIS.md Bagian 3)', year: 2026 },
} satisfies Record<string, Source>;
