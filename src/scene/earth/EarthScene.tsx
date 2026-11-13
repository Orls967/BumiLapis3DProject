import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, PerformanceMonitor, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { MathUtils, Raycaster, Vector2, Vector3, type PerspectiveCamera } from 'three';
import { layers, discontinuities } from '@/content/layers';
import { displayRadius } from '@/lib/profile/scale';
import { pickShell, shellTargets, type ShellTarget, type Vec3 } from '@/lib/profile/shells';
import { useEarth, type EarthState } from '@/store/earth';
import { useQuality } from '@/store/quality';
import { live, overlayEls, prefersReducedMotion } from './live';
import { Shells } from './Shells';
import { Overlays } from './Overlays';

/** Elevation angle (degrees) of each label along the labelled cut face. */
const PHI: Record<string, number> = {
  'continental-crust': 10,
  lithosphere: 10,
  'upper-mantle': -8,
  asthenosphere: -8,
  'transition-zone': -24,
  'lower-mantle': -38,
  'mesosphere-mantle': -38,
  'outer-core': 30,
  'inner-core': 0,
  ocean: -19,
  troposphere: 24,
  stratosphere: 35,
  mesosphere: 46,
  thermosphere: 57,
  exosphere: 68,
  'ozone-layer': 14,
  ionosphere: 78,
  'disc:moho': -32,
  'disc:d410': -44,
  'disc:d660': -56,
  'disc:gutenberg': -12,
  'disc:lehmann': -72,
};

export type Anchor = { pos: Vector3; normal: Vector3 | null; visible: number; priority: number };
export const anchors = new Map<string, Anchor>();
export function setAnchor(id: string, visible: number, priority = 0): Anchor {
  let a = anchors.get(id);
  if (!a) {
    a = { pos: new Vector3(), normal: null, visible, priority };
    anchors.set(id, a);
  }
  a.visible = visible;
  a.priority = priority;
  return a;
}

/** Point on the labelled cut face (the −X side face, whose normal points to +X/+Z). */
export function facePoint(out: Vector3, cut: number, radius: number, phiDeg: number, offsetZ: number, lift = 0.004) {
  const half = cut / 2;
  const phi = MathUtils.degToRad(phiDeg);
  const c = Math.cos(phi) * radius;
  out.set(-Math.sin(half) * c, Math.sin(phi) * radius, Math.cos(half) * c + offsetZ);
  out.x += Math.cos(half) * lift;
  out.z += Math.sin(half) * lift;
  return out;
}
export const faceNormal = (out: Vector3, cut: number) => out.set(Math.cos(cut / 2), 0, Math.sin(cut / 2));

function Animator() {
  const memo = useRef<{ key: unknown[]; targets: ShellTarget[] }>({ key: [], targets: [] });
  const reduced = useMemo(prefersReducedMotion, []);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useEarth.getState();
    const ozone = s.overlays.ozone || s.selectedId === 'ozone-layer';
    const iono = s.selectedId === 'ionosphere';
    const key = [s.grouping, s.scaleMode, s.view, s.cutDeg, s.hidden, s.overlays.atmosphere, ozone, iono];
    if (key.some((k, i) => k !== memo.current.key[i])) {
      memo.current = {
        key,
        targets: shellTargets({
          layers,
          grouping: s.grouping,
          scaleMode: s.scaleMode,
          view: s.view,
          cutDeg: s.cutDeg,
          hidden: new Set(Object.keys(s.hidden).filter((k) => s.hidden[k])),
          showAtmosphere: s.overlays.atmosphere,
          extraBands: [...(ozone ? ['ozone-layer'] : []), ...(iono ? ['ionosphere'] : [])],
        }),
      };
    }
    if (!reduced) live.time += dt;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
    const seen = new Set<string>();
    for (const t of memo.current.targets) {
      seen.add(t.id);
      let l = live.shells.get(t.id);
      if (!l) {
        l = { ...t, opacity: 0, highlight: 0, dim: 0 };
        live.shells.set(t.id, l);
      }
      l.kind = t.kind;
      l.index = t.index;
      l.capsOnly = t.capsOnly;
      l.rOuter += (t.rOuter - l.rOuter) * k;
      l.rInner += (t.rInner - l.rInner) * k;
      l.cut += (t.cut - l.cut) * k;
      l.offsetZ += (t.offsetZ - l.offsetZ) * k;
      l.opacity += (t.opacity - l.opacity) * Math.min(1, k * 1.6);
      if (Math.abs(t.opacity - l.opacity) < 0.01) l.opacity = t.opacity;
      const hi = s.selectedId === t.id ? 1 : s.hoveredId === t.id ? 0.55 : 0;
      const dim = s.selectedId && s.selectedId !== t.id && live.shells.has(s.selectedId) ? 1 : 0;
      l.highlight += (hi - l.highlight) * Math.min(1, k * 2);
      l.dim += (dim - l.dim) * k;
    }
    for (const [id, l] of live.shells) if (!seen.has(id)) l.opacity += (0 - l.opacity) * k;
    live.list = [...live.shells.values()];
  });
  return null;
}

const dirFrom = (azDeg: number, elDeg: number) => {
  const az = MathUtils.degToRad(azDeg);
  const el = MathUtils.degToRad(elDeg);
  return new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
};

function computePose(s: EarthState, aspect: number) {
  const fit = Math.max(1, 1.18 / Math.max(aspect, 0.42));
  const target = new Vector3();
  let dir = dirFrom(32, 16);
  let dist = 3.6;
  if (s.view === 'wedge' || s.view === 'half') {
    dir = s.view === 'wedge' ? dirFrom(22, 13) : dirFrom(16, 12);
    dist = s.overlays.atmosphere ? (s.scaleMode === 'exaggerated' ? 4.5 : 3.9) : 3.7;
    target.set(0, -0.12, 0);
  }
  if (s.view === 'explode') {
    dir = dirFrom(62, 16);
    target.set(0, 0, 1.2);
    dist = 6.4;
  }
  const sel = s.selectedId ? layers.find((l) => l.id === s.selectedId) : null;
  if (sel && s.view !== 'explode') {
    const rTop = displayRadius(sel.topKm, s.scaleMode);
    const rBot = displayRadius(sel.bottomKm, s.scaleMode);
    if (sel.id === 'magnetosphere') dist = 9;
    else if (sel.realm === 'atmosphere' || sel.realm === 'functional') dist = Math.max(3.5, Math.min(rTop, 3) * 2.7);
    else if (sel.realm === 'interior' && s.view !== 'closed') {
      const t = live.shells.get(sel.id);
      const cut = t?.cut ?? MathUtils.degToRad(s.cutDeg);
      facePoint(target, cut, (rTop + rBot) / 2, PHI[sel.id] ?? 0, 0).multiplyScalar(0.35);
      dist = Math.min(dist, 3.0 + rTop * 0.9);
    }
  }
  if (s.overlays.magnetosphere && dist < 7 && s.view !== 'explode' && !sel) dist = 7;
  if (s.depthKm !== null && s.depthKm > 700) dist = Math.max(dist, displayRadius(s.depthKm, s.scaleMode) * 2.9);
  return { pos: target.clone().addScaledVector(dir, dist * fit), target };
}

function CameraRig() {
  const controls = useRef<CameraControls>(null);
  const size = useThree((t) => t.size);
  const view = useEarth((s) => s.view);
  const selectedId = useEarth((s) => s.selectedId);
  const scaleMode = useEarth((s) => s.scaleMode);
  const nonce = useEarth((s) => s.cameraNonce);
  const magnet = useEarth((s) => s.overlays.magnetosphere);
  const far = useEarth((s) => (s.depthKm ?? 0) > 700);
  const journeyOn = useEarth((s) => s.depthKm !== null);
  const first = useRef(true);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const { pos, target } = computePose(useEarth.getState(), size.width / size.height);
    const animate = !first.current && !prefersReducedMotion();
    first.current = false;
    void c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, animate);
    const wide = size.width / size.height > 1.25;
    void c.setFocalOffset(journeyOn && wide ? -pos.distanceTo(target) * 0.16 : 0, 0, 0, animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedId, scaleMode, nonce, magnet, far, journeyOn, size.width < size.height]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => useEarth.getState().stopAutoRotate();
    c.addEventListener('controlstart', stop);
    return () => c.removeEventListener('controlstart', stop);
  }, []);

  useFrame((_, dt) => {
    const s = useEarth.getState();
    if (s.autoRotate && s.view === 'closed' && controls.current && !prefersReducedMotion())
      controls.current.azimuthAngle += Math.min(dt, 0.05) * 0.06;
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={1.25}
      maxDistance={40}
      smoothTime={0.45}
      draggingSmoothTime={0.12}
      dollySpeed={0.6}
      truckSpeed={1.2}
    />
  );
}

const toVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];

function Picker() {
  const gl = useThree((t) => t.gl);
  const camera = useThree((t) => t.camera);
  useEffect(() => {
    const el = gl.domElement;
    const ray = new Raycaster();
    const ndc = new Vector2();
    let down: { x: number; y: number; t: number } | null = null;
    const pick = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return pickShell(toVec3(ray.ray.origin), toVec3(ray.ray.direction), live.list);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.buttons !== 0) return;
      const hit = pick(e);
      useEarth.getState().hover(hit?.id ?? null);
      el.style.cursor = hit ? 'pointer' : 'grab';
      const tip = overlayEls.tooltip;
      if (tip) {
        const r = el.getBoundingClientRect();
        tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
      }
    };
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY, t: performance.now() });
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 600;
      down = null;
      if (moved > 6 || !quick) return;
      const hit = pick(e);
      useEarth.getState().select(hit?.id ?? null);
    };
    const onLeave = () => useEarth.getState().hover(null);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [gl, camera]);
  return null;
}

const tmp = new Vector3();
const tmpN = new Vector3();
const tmpDir = new Vector3();

function shellAnchors() {
  const s = useEarth.getState();
  for (const l of live.list) {
    const a = setAnchor(l.id, l.opacity, s.selectedId === l.id ? 3 : s.hoveredId === l.id ? 2 : 1);
    const mid = (l.rOuter + l.rInner) / 2;
    if (s.view === 'explode' && l.kind === 'interior' && l.offsetZ > 0.05 && l.rInner > 0.001) {
      // exploded bowls: label the top of each rim so the next bowl does not hide it
      a.pos.set(0, l.rOuter + 0.06, l.offsetZ - 0.08);
      a.normal = null;
    } else if (l.cut > 0.2) {
      facePoint(a.pos, l.cut, l.rInner < 0.001 ? l.rOuter * 0.45 : mid, PHI[l.id] ?? 0, l.offsetZ);
      a.normal = faceNormal(a.normal ?? new Vector3(), l.cut);
      a.visible = l.opacity * MathUtils.smoothstep(l.cut, 0.2, 0.5);
    } else if (!l.capsOnly && l.rInner < 0.001 && s.view !== 'closed') {
      // whole inner-core ball: label its front
      a.pos.set(0, 0, l.rOuter + 0.004 + l.offsetZ);
      a.normal = (a.normal ?? new Vector3()).set(0, 0, 1);
    } else a.visible = 0;
  }
  const outer = live.list.find((l) => l.kind === 'interior' && l.index === 0 && l.opacity > 0.5);
  for (const d of discontinuities) {
    const id = `disc:${d.id}`;
    const r = displayRadius(-d.depthKm, s.scaleMode);
    const host = live.list.find((l) => l.kind === 'interior' && l.opacity > 0.5 && Math.abs(l.rInner - r) < 0.02);
    const a = setAnchor(id, 0, 0);
    if (!s.overlays.discontinuities || !host || !outer || host.cut < 0.2 || s.view === 'explode') continue;
    facePoint(a.pos, host.cut, r, PHI[id] ?? -40, host.offsetZ);
    a.normal = faceNormal(a.normal ?? new Vector3(), host.cut);
    a.visible = MathUtils.smoothstep(host.cut, 0.2, 0.5);
  }
}

type Box = { x: number; y: number; w: number; h: number };

function LabelProjector() {
  const camera = useThree((t) => t.camera) as PerspectiveCamera;
  const size = useThree((t) => t.size);
  const boxes = useRef<Box[]>([]);
  const sizes = useRef(new Map<string, { w: number; h: number }>());
  useFrame(() => {
    shellAnchors();
    const entries = [...anchors.entries()]
      .filter(([id]) => overlayEls.labels.has(id))
      .sort((a, b) => b[1].priority - a[1].priority);
    const kept = boxes.current;
    kept.length = 0;
    const origin = toVec3(camera.position);
    for (const [id, a] of entries) {
      const el = overlayEls.labels.get(id)!;
      let alpha = a.visible;
      if (alpha > 0.02) {
        tmpDir.copy(a.pos).sub(camera.position);
        const dist = tmpDir.length();
        tmpDir.divideScalar(dist);
        if (a.normal) alpha *= MathUtils.smoothstep(-tmpN.copy(a.normal).dot(tmpDir), 0.04, 0.22);
        if (alpha > 0.02) {
          const hit = pickShell(origin, toVec3(tmpDir), live.list);
          if (hit && hit.t < dist - 0.03) alpha = 0;
        }
      }
      let x = 0;
      let y = 0;
      if (alpha > 0.02) {
        tmp.copy(a.pos).project(camera);
        if (tmp.z > 1) alpha = 0;
        x = (tmp.x * 0.5 + 0.5) * size.width;
        y = (-tmp.y * 0.5 + 0.5) * size.height;
        let dim = sizes.current.get(id);
        if (!dim || dim.w === 0) {
          dim = { w: el.offsetWidth, h: el.offsetHeight };
          sizes.current.set(id, dim);
        }
        const box = { x: x - dim.w / 2 - 3, y: y - dim.h / 2 - 2, w: dim.w + 6, h: dim.h + 4 };
        const clash = kept.some((k) => box.x < k.x + k.w && box.x + box.w > k.x && box.y < k.y + k.h && box.y + box.h > k.y);
        if (clash && a.priority < 3) alpha = 0;
        else kept.push(box);
      }
      const shown = alpha > 0.02;
      el.style.opacity = shown ? String(Math.min(1, alpha)) : '0';
      el.style.pointerEvents = shown && alpha > 0.5 ? 'auto' : 'none';
      if (shown) el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  });
  return null;
}

function Effects() {
  const high = useQuality((q) => q.level === 'high');
  return (
    <EffectComposer multisampling={high ? 4 : 0}>
      {high ? <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.25} intensity={0.75} radius={0.72} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {high ? <SMAA /> : <></>}
    </EffectComposer>
  );
}

export default function EarthScene() {
  const level = useQuality((q) => q.level);
  const setLevel = useQuality((q) => q.setLevel);
  return (
    <Canvas
      flat
      dpr={level === 'high' ? [1, 2] : [1, 1.25]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 40, near: 0.05, far: 400, position: [1.8, 1, 2.9] }}
      style={{ background: '#03050c', touchAction: 'none' }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setLevel('low')} flipflops={2} />
      <color attach="background" args={['#03050c']} />
      <Stars radius={120} depth={60} count={level === 'high' ? 6000 : 2500} factor={4.5} saturation={0.4} fade speed={0.4} />
      <Animator />
      <Suspense fallback={<Shells procedural />}>
        <Shells />
      </Suspense>
      <Overlays />
      <CameraRig />
      <Picker />
      <LabelProjector />
      <Effects />
    </Canvas>
  );
}
