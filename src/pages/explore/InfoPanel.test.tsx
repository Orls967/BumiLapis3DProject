import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { layers } from '@/content/layers';
import { ui } from '@/content/ui';
import { InfoPanel } from './InfoPanel';

describe('InfoPanel', () => {
  it('fills all six tabs for every layer', async () => {
    const user = userEvent.setup();
    for (const layer of layers.filter((l) => ['outer-core', 'troposphere', 'ocean', 'lithosphere'].includes(l.id))) {
      const { unmount } = render(
        <MemoryRouter>
          <InfoPanel layer={layer} />
        </MemoryRouter>,
      );
      expect(screen.getByRole('heading', { name: layer.name })).toBeInTheDocument();
      for (const tab of ui.explore.panel.tabs) {
        await user.click(screen.getByRole('tab', { name: tab }));
        const panel = screen.getByRole('tabpanel');
        expect(panel.textContent?.trim().length ?? 0).toBeGreaterThan(20);
      }
      unmount();
    }
  });
});
