import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { builtinColumns } from '@/content/columns';
import { StratColumnView } from './StratColumnView';

describe('StratColumnView', () => {
  const column = builtinColumns[0];
  it('renders one clickable shape per bed with patterns and reports clicks', async () => {
    const onSelect = vi.fn();
    const { container } = render(<StratColumnView column={column} pxPerM={4} onSelectBed={onSelect} />);
    const beds = screen.getAllByRole('button');
    expect(beds).toHaveLength(column.beds.length);
    expect(container.querySelectorAll('pattern').length).toBe(new Set(column.beds.map((b) => b.lithologyId)).size);
    await userEvent.click(beds[3]);
    expect(onSelect).toHaveBeenCalledWith(column.beds[3].id);
  });

  it('draws graded beds as trapezoids and wavy erosional contacts', () => {
    const { container } = render(<StratColumnView column={column} pxPerM={4} onSelectBed={() => undefined} />);
    const paths = [...container.querySelectorAll('path[role="button"]')].map((p) => p.getAttribute('d')!);
    const graded = paths[2].match(/L([\d.]+),[\d.]+ L([\d.]+),/)!; // m-sand base, f-sand top
    expect(Number(graded[1])).toBeLessThan(Number(graded[2]));
    expect(paths[3]).toContain('q'); // erosional base → wavy
    expect(paths[0]).not.toContain('q');
  });
});
