import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { routes } from '@/routes';
import { ui } from '@/content/ui';
import { useTheme } from '@/store/theme';
import { SearchDialog } from './SearchDialog';

export function Layout({ children }: { children: ReactNode }) {
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors ${
      isActive ? 'bg-accent text-accent-ink' : 'text-muted hover:bg-panel2 hover:text-ink'
    }`;

  return (
    <div className="flex h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-panel focus:p-2">
        {ui.common.skipToContent}
      </a>
      <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-panel px-3">
        <NavLink to="/" className="mr-1 flex items-center gap-2 text-base font-extrabold tracking-tight">
          <img src="./favicon.svg" alt="" className="h-7 w-7" />
          <span>{ui.appName}</span>
        </NavLink>
        <nav aria-label={ui.nav.aria} className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto xl:flex">
          {routes.map((r) => (
            <NavLink key={r.path} to={r.path} end={r.path === '/'} className={link}>
              {r.short}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 xl:hidden" />
        <button className="btn btn-sm" onClick={() => setSearchOpen(true)} aria-label={ui.search.open}>
          <span aria-hidden>⌕</span>
          <span className="hidden sm:inline">{ui.search.button}</span>
          <kbd className="hidden rounded border border-line px-1 text-[10px] text-muted sm:inline">⌘K</kbd>
        </button>
        <button className="btn btn-sm" onClick={toggle} aria-label={dark ? ui.theme.toLight : ui.theme.toDark}>
          <span aria-hidden>{dark ? '☀' : '☾'}</span>
        </button>
        <button
          className="btn btn-sm xl:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span aria-hidden>☰</span> {ui.nav.menu}
        </button>
        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label={ui.nav.aria}
            className="glass absolute right-2 top-[60px] z-50 grid w-64 gap-1 p-2 xl:hidden"
          >
            {routes.map((r) => (
              <NavLink key={r.path} to={r.path} end={r.path === '/'} className={link}>
                {r.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="relative min-h-0 flex-1 overflow-auto">
        {children}
      </main>
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
