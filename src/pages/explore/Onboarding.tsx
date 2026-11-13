import { useState } from 'react';
import { ui } from '@/content/ui';
import { useEscape } from '@/ui/hooks';

const O = ui.explore.onboarding;

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  useEscape(onClose);
  const last = i === O.steps.length - 1;
  const s = O.steps[i];
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 p-4">
      <div role="dialog" aria-modal aria-label={O.title} className="glass w-full max-w-sm p-5 text-center">
        <p className="label">{O.title}</p>
        <div aria-hidden className="mx-auto my-3 grid h-16 w-16 place-items-center rounded-full bg-accent text-3xl text-accent-ink">
          {s.icon}
        </div>
        <h2 className="text-lg font-extrabold">{s.title}</h2>
        <p className="mt-1 text-muted">{s.text}</p>
        <div className="my-4 flex justify-center gap-1.5" aria-label={`${O.step} ${i + 1}/${O.steps.length}`}>
          {O.steps.map((_, k) => (
            <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-accent' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn flex-1" onClick={onClose}>
            {O.skip}
          </button>
          <button className="btn btn-primary flex-1" autoFocus onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? O.start : ui.common.next}
          </button>
        </div>
      </div>
    </div>
  );
}
