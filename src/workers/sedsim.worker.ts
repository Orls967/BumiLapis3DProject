/// <reference lib="webworker" />
import { createBasin, isDone, stepBasin, type BasinParams, type BasinState } from '@/lib/sedsim/basin';

export type SedsimRequest =
  | { type: 'init'; params: BasinParams; play: boolean; runSeconds: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'step' }
  | { type: 'finish' }
  | { type: 'speed'; runSeconds: number };
export type SedsimResponse = { type: 'snapshot'; state: BasinState; playing: boolean };

const TICK_MS = 33;
let state: BasinState | null = null;
let playing = false;
let runSeconds = 20;
let timer: ReturnType<typeof setInterval> | null = null;

const post = () => state && (self as unknown as DedicatedWorkerGlobalScope).postMessage({ type: 'snapshot', state, playing } satisfies SedsimResponse);

function tick() {
  if (!state || !playing) return;
  const n = Math.max(1, Math.round((state.totalSteps * TICK_MS) / (runSeconds * 1000)));
  stepBasin(state, n);
  if (isDone(state)) setPlaying(false);
  post();
}
function setPlaying(v: boolean) {
  playing = v && !!state && !isDone(state);
  if (playing && timer === null) timer = setInterval(tick, TICK_MS);
  if (!playing && timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

self.onmessage = (e: MessageEvent<SedsimRequest>) => {
  const m = e.data;
  switch (m.type) {
    case 'init':
      state = createBasin(m.params);
      runSeconds = m.runSeconds;
      setPlaying(m.play);
      break;
    case 'play':
      setPlaying(true);
      break;
    case 'pause':
      setPlaying(false);
      break;
    case 'step':
      setPlaying(false);
      if (state) stepBasin(state, state.markEvery - (state.steps % state.markEvery));
      break;
    case 'finish':
      setPlaying(false);
      if (state) stepBasin(state, Infinity);
      break;
    case 'speed':
      runSeconds = m.runSeconds;
      break;
  }
  post();
};
