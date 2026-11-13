import { ui } from '@/content/ui';

/** Placeholder; replaced by the real global search in M3. */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 p-4 pt-24" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={ui.search.button} className="glass mx-auto w-full max-w-xl p-4">
        {ui.search.placeholder}
      </div>
    </div>
  );
}
