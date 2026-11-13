import { describe, expect, it } from 'vitest';
import { layers } from '@/content/layers';
import { pickShell, shellTargets, type ShellOptions } from './shells';

const base: ShellOptions = {
  layers,
  grouping: 'compositional',
  scaleMode: 'exaggerated',
  view: 'closed',
  cutDeg: 90,
  hidden: new Set(),
  showAtmosphere: true,
};
const visible = (o: ShellOptions) => shellTargets(o).filter((s) => s.opacity > 0.5);

describe('shellTargets', () => {
  it('shows six nested shells in each grouping mode without gaps', () => {
    for (const [grouping, n] of [
      ['compositional', 6],
      ['mechanical', 6],
    ] as const) {
      const shells = visible({ ...base, grouping }).filter((s) => s.kind === 'interior');
      expect(shells).toHaveLength(n);
      expect(shells[0].rOuter).toBe(1);
      for (let i = 1; i < shells.length; i++) expect(shells[i].rOuter).toBeCloseTo(shells[i - 1].rInner, 9);
      expect(shells[shells.length - 1].rInner).toBe(0);
    }
  });

  it('keeps the inner core whole in wedge mode and offsets shells in explode mode', () => {
    const wedge = visible({ ...base, view: 'wedge' }).filter((s) => s.kind === 'interior');
    expect(wedge[wedge.length - 1].cut).toBe(0);
    expect(wedge[0].cut).toBeCloseTo(Math.PI / 2);
    expect(wedge[2].cut).toBeLessThan(wedge[1].cut);
    const ex = visible({ ...base, view: 'explode' }).filter((s) => s.kind === 'interior');
    expect(ex[3].offsetZ).toBeGreaterThan(ex[2].offsetZ);
  });
});

describe('pickShell', () => {
  it('hits the crust from outside when closed', () => {
    const hit = pickShell([0, 0, 5], [0, 0, -1], visible(base));
    expect(hit?.id).toBe('continental-crust');
    expect(hit?.t).toBeCloseTo(4);
  });

  it('sees the inner core through the wedge', () => {
    const hit = pickShell([0, 0, 5], [0, 0, -1], visible({ ...base, view: 'wedge' }));
    expect(hit?.id).toBe('inner-core');
  });

  it('hits the cut face of the lower mantle and atmosphere bands', () => {
    const shells = visible({ ...base, view: 'half' });
    // half view: flat face in the z = 0 plane, looking straight at it
    expect(pickShell([0.62, 0.1, 5], [0, 0, -1], shells)?.id).toBe('lower-mantle');
    expect(pickShell([-0.3, 0.05, 5], [0, 0, -1], shells)?.id).toBe('outer-core');
    expect(pickShell([0, 1.06, 5], [0, 0, -1], shells)?.id).toBe('stratosphere');
    expect(pickShell([0.99, 0, 5], [0, 0, -1], shells)?.id).toBe('ocean');
    expect(pickShell([3, 3, 5], [0, 0, -1], shells)).toBeNull();
  });

  it('ignores hidden layers', () => {
    const shells = visible({ ...base, hidden: new Set(['continental-crust']) });
    expect(pickShell([0, 0, 5], [0, 0, -1], shells)?.id).toBe('upper-mantle');
  });
});
