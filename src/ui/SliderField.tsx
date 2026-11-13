import { useId } from 'react';
import { fmtAuto } from '@/lib/format';

export type Preset = { label: string; value: number };

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  presets?: Preset[];
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
};

/** Labelled range slider that always shows value + unit, offers presets and works with the keyboard. */
export function SliderField({ label, value, min, max, step = 1, unit, presets, onChange, format, disabled }: Props) {
  const id = useId();
  const text = `${format ? format(value) : fmtAuto(value)}${unit ? ` ${unit}` : ''}`;
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="text-sm tabular-nums text-accent">
          {text}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={text}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn btn-sm"
              aria-pressed={Math.abs(p.value - value) < step / 2}
              disabled={disabled}
              onClick={() => onChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
