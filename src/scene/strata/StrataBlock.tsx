import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, LinearFilter, Plane, SRGBColorSpace, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { BLOCK_BOTTOM, BLOCK_SIZE, surfaceAt, unitAt, type Model } from '@/lib/strata/model';
import { drawMap, drawSection, sampleTop, sliceLine, Z_TOP, type Tiles } from '@/lib/strata/raster';
import { loadPatternTiles } from '@/ui/lithologyPatterns';

const S = 0.01; // metres → scene units
const HALF = (BLOCK_SIZE / 2) * S;
const toScene = (x: number, y: number, z: number) => new Vector3((x - BLOCK_SIZE / 2) * S, z * S, (y - BLOCK_SIZE / 2) * S);

export type SliceState = { on: boolean; azimuthDeg: number; offsetM: number };
export type BlockProps = {
  model: Model;
  quality: 'low' | 'high';
  slice: SliceState;
  well: { x: number; y: number } | null;
  selectedUnitId: string | null;
  resetNonce: number;
  onPickUnit: (unitId: string | null) => void;
  onHoverUnit: (unitId: string | null) => void;
  onDrill: (x: number, y: number) => void;
  labels: { top: string; scale: string };
};

function useCanvasTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    return { canvas, texture };
  }, []);
}

type FaceProps = {
  model: Model;
  tiles: Tiles;
  p0: readonly [number, number];
  p1: readonly [number, number];
  pxPerM: number;
  clip: Plane[] | null;
  dim: boolean;
  onPoint: (kind: 'click' | 'move', x: number, y: number, z: number) => void;
};

/** One vertical face (block side or slice section) textured with the rasterised cross-section. */
function Face({ model, tiles, p0, p1, pxPerM, clip, dim, onPoint }: FaceProps) {
  const { canvas, texture } = useCanvasTexture();
  useEffect(() => {
    drawSection(canvas, model, p0, p1, BLOCK_BOTTOM, pxPerM, tiles);
    texture.needsUpdate = true;
  }, [canvas, texture, model, tiles, p0, p1, pxPerM]);
  useEffect(() => () => texture.dispose(), [texture]);
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const d = [(p1[0] - p0[0]) / len, (p1[1] - p0[1]) / len];
  const mid = toScene((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (Z_TOP + BLOCK_BOTTOM) / 2);
  const handle = (kind: 'click' | 'move') => (e: ThreeEvent<MouseEvent>) => {
    if (kind === 'click' && e.delta > 6) return;
    // step 1 m into the rock so that points exactly on the face resolve reliably
    const nx = -d[1];
    const ny = d[0];
    const x = e.point.x / S + BLOCK_SIZE / 2 - nx * 1;
    const y = e.point.z / S + BLOCK_SIZE / 2 - ny * 1;
    const z = e.point.y / S;
    if (z > surfaceAt(model, x, y)) return;
    e.stopPropagation();
    onPoint(kind, x, y, z);
  };
  return (
    <mesh position={mid} rotation={[0, Math.atan2(-d[1], d[0]), 0]} onClick={handle('click')} onPointerMove={handle('move')}>
      <planeGeometry args={[len * S, (Z_TOP - BLOCK_BOTTOM) * S]} />
      <meshStandardMaterial
        map={texture}
        alphaTest={0.5}
        transparent={false}
        roughness={0.95}
        metalness={0}
        side={DoubleSide}
        clippingPlanes={clip}
        color={dim ? '#c9c9c9' : '#ffffff'}
      />
    </mesh>
  );
}

function Top({ model, tiles, n, clip, onDrill }: { model: Model; tiles: Tiles; n: number; clip: Plane[] | null; onDrill: (x: number, y: number) => void }) {
  const { canvas, texture } = useCanvasTexture();
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array((n + 1) * (n + 1) * 3);
    const uv = new Float32Array((n + 1) * (n + 1) * 2);
    const idx: number[] = [];
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const k = j * (n + 1) + i;
        pos[k * 3] = (i / n - 0.5) * BLOCK_SIZE * S;
        pos[k * 3 + 2] = (j / n - 0.5) * BLOCK_SIZE * S;
        uv[k * 2] = i / n;
        uv[k * 2 + 1] = j / n;
        if (i < n && j < n) idx.push(k, k + n + 1, k + 1, k + 1, k + n + 1, k + n + 2);
      }
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }, [n]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const grid = sampleTop(model, n);
    const pos = geometry.getAttribute('position') as BufferAttribute;
    for (let k = 0; k < grid.tops.length; k++) pos.setY(k, grid.tops[k] * S);
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    drawMap(canvas, model, grid, n > 60 ? 768 : 320, tiles);
    texture.flipY = false;
    texture.needsUpdate = true;
  }, [model, n, geometry, canvas, texture, tiles]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh
      geometry={geometry}
      onClick={(e) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        onDrill(e.point.x / S + BLOCK_SIZE / 2, e.point.z / S + BLOCK_SIZE / 2);
      }}
    >
      <meshStandardMaterial map={texture} roughness={1} metalness={0} side={DoubleSide} clippingPlanes={clip} />
    </mesh>
  );
}

function Well({ model, x, y }: { model: Model; x: number; y: number }) {
  const top = surfaceAt(model, x, y);
  const h = (top - BLOCK_BOTTOM) * S;
  const mid = toScene(x, y, (top + BLOCK_BOTTOM) / 2);
  const head = toScene(x, y, top);
  return (
    <group>
      <mesh position={mid} renderOrder={5}>
        <cylinderGeometry args={[0.05, 0.05, h, 12]} />
        <meshBasicMaterial color="#ef4444" depthTest={false} transparent opacity={0.55} />
      </mesh>
      <mesh position={[head.x, head.y + 0.45, head.z]}>
        <coneGeometry args={[0.2, 0.9, 4]} />
        <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" roughness={0.4} />
      </mesh>
      <mesh position={[head.x, head.y + 0.02, head.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.3, 24]} />
        <meshBasicMaterial color="#ffffff" side={DoubleSide} />
      </mesh>
    </group>
  );
}

function Rig({ resetNonce }: { resetNonce: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((t) => t.camera);
  const size = useThree((t) => t.size);
  useEffect(() => {
    const k = size.width < size.height ? 1.55 : 1;
    camera.position.set(11.5 * k, 8.2 * k, 13.5 * k);
    controls.current?.target.set(0, -1.6, 0);
    controls.current?.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetNonce, camera, size.width < size.height]);
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.12} minDistance={7} maxDistance={48} maxPolarAngle={Math.PI * 0.62} />;
}

function Scene(props: BlockProps & { tiles: Tiles }) {
  const { model, tiles, quality, slice, well, onPickUnit, onHoverUnit, onDrill, labels } = props;
  const gl = useThree((t) => t.gl);
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  const pxPerM = quality === 'high' ? 0.62 : 0.2;
  const n = quality === 'high' ? 96 : 36;
  const line = slice.on ? sliceLine(slice.azimuthDeg, slice.offsetM) : null;
  const clip = useMemo(() => {
    if (!slice.on) return null;
    const a = (slice.azimuthDeg * Math.PI) / 180;
    return [new Plane(new Vector3(-Math.cos(a), 0, -Math.sin(a)), slice.offsetM * S + 0.0005)];
  }, [slice.on, slice.azimuthDeg, slice.offsetM]);
  const sides = useMemo(
    () =>
      [
        [[0, BLOCK_SIZE], [BLOCK_SIZE, BLOCK_SIZE]],
        [[BLOCK_SIZE, BLOCK_SIZE], [BLOCK_SIZE, 0]],
        [[BLOCK_SIZE, 0], [0, 0]],
        [[0, 0], [0, BLOCK_SIZE]],
      ] as [[number, number], [number, number]][],
    [],
  );
  const slicePts = useMemo(() => (line ? ([line.p0, line.p1] as const) : null), [line?.p0[0], line?.p0[1], line?.p1[0], line?.p1[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const onPoint = (kind: 'click' | 'move', x: number, y: number, z: number) => {
    const iv = unitAt(model, Math.min(BLOCK_SIZE, Math.max(0, x)), Math.min(BLOCK_SIZE, Math.max(0, y)), z);
    if (kind === 'click') onPickUnit(iv?.unitId ?? null);
    else onHoverUnit(iv?.unitId ?? null);
  };
  return (
    <>
      <hemisphereLight args={['#ffffff', '#8d99ae', 0.95]} />
      <directionalLight position={[7, 12, 9]} intensity={2.1} />
      <directionalLight position={[-9, 5, -6]} intensity={0.5} />
      <group onPointerLeave={() => onHoverUnit(null)}>
        {sides.map(([p0, p1], i) => (
          <Face key={i} model={model} tiles={tiles} p0={p0} p1={p1} pxPerM={pxPerM} clip={clip} dim={false} onPoint={onPoint} />
        ))}
        {slicePts && <Face model={model} tiles={tiles} p0={slicePts[0]} p1={slicePts[1]} pxPerM={pxPerM} clip={null} dim={false} onPoint={onPoint} />}
        <Top model={model} tiles={tiles} n={n} clip={clip} onDrill={onDrill} />
      </group>
      <mesh position={[0, BLOCK_BOTTOM * S - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color="#3f3f46" side={DoubleSide} clippingPlanes={clip} />
      </mesh>
      {well && <Well model={model} x={well.x} y={well.y} />}
      <ContactShadows position={[0, BLOCK_BOTTOM * S - 0.25, 0]} opacity={0.5} scale={26} blur={2.6} far={12} resolution={512} />
      <Html position={[0, BLOCK_BOTTOM * S - 0.05, HALF + 0.55]} center style={{ pointerEvents: 'none' }}>
        <div className="label3d !static !translate-x-0 !translate-y-0">{labels.scale}</div>
      </Html>
      <Rig resetNonce={props.resetNonce} />
    </>
  );
}

/** Interactive 3D block diagram of layered rock. */
export default function StrataBlock(props: BlockProps) {
  const [tiles, setTiles] = useState<Tiles | null>(null);
  useEffect(() => {
    let alive = true;
    void loadPatternTiles(2).then((t) => alive && setTiles(t));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 32, near: 0.5, far: 200, position: [11.5, 8.2, 13.5] }} gl={{ antialias: true }} style={{ touchAction: 'none' }} aria-hidden>
      {tiles && <Scene {...props} tiles={tiles} />}
    </Canvas>
  );
}
