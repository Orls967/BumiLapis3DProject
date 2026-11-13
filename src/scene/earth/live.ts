import { Vector3 } from 'three';
import type { ShellTarget } from '@/lib/profile/shells';

/** Mutable per-frame scene state shared by the animator, meshes, picker and label projector. */
export type LiveShell = ShellTarget & { highlight: number; dim: number };

export const live = {
  shells: new Map<string, LiveShell>(),
  list: [] as LiveShell[],
  time: 0,
  /** Direction towards the Sun (world space, fixed). */
  sun: new Vector3(0.82, 0.36, 0.45).normalize(),
  /** Longitude offset (turns) applied to the surface texture so that Indonesia faces the default camera. */
  lonOffset: 0.49,
};

/** DOM elements registered by the page for projection (labels) and the hover tooltip. */
export const overlayEls = {
  labels: new Map<string, HTMLElement>(),
  tooltip: null as HTMLElement | null,
};

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
