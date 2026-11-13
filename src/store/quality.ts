import { create } from 'zustand';

type Quality = { level: 'high' | 'low'; setLevel: (l: 'high' | 'low') => void };

const initial = (): 'high' | 'low' => {
  if (typeof navigator === 'undefined') return 'high';
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 8;
  return mobile || cores <= 4 ? 'low' : 'high';
};

/** Rendering quality; lowered automatically when the frame rate drops. */
export const useQuality = create<Quality>((set) => ({ level: initial(), setLevel: (level) => set({ level }) }));
