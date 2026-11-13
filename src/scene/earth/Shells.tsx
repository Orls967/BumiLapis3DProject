import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  CustomBlending,
  OneFactor,
  ZeroFactor,
  BackSide,
  Color,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  PlaneGeometry,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Side,
  type Texture,
} from 'three';
import { layers } from '@/content/layers';
import { useQuality } from '@/store/quality';
import { useEarth } from '@/store/earth';
import { BAND_FRAG, HALO_FRAG, HALO_VERT, LAYER_FRAG, SHELL_VERT, SURFACE_FRAG } from './shaders';
import { live, type LiveShell } from './live';

const STYLE: Record<string, { style: number; glow: number }> = {
  'continental-crust': { style: 0, glow: 0 },
  lithosphere: { style: 0, glow: 0 },
  'upper-mantle': { style: 1, glow: 0.02 },
  asthenosphere: { style: 1, glow: 0.1 },
  'transition-zone': { style: 1, glow: 0.2 },
  'lower-mantle': { style: 1, glow: 0.42 },
  'mesosphere-mantle': { style: 1, glow: 0.42 },
  'outer-core': { style: 2, glow: 1 },
  'inner-core': { style: 3, glow: 1 },
};

type Kind = 'layer' | 'surface' | 'band';

function makeMaterial(kind: Kind, color: string, octaves: number, side: Side, extra: Record<string, unknown> = {}) {
  const frag = kind === 'surface' ? SURFACE_FRAG : kind === 'band' ? BAND_FRAG : LAYER_FRAG;
  return new ShaderMaterial({
    vertexShader: SHELL_VERT,
    fragmentShader: frag,
    defines: { OCTAVES: octaves },
    side,
    transparent: kind === 'band',
    depthWrite: kind !== 'band',
    polygonOffset: kind === 'band',
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: {
      uShape: { value: 0 },
      uRadius: { value: 1 },
      uInner: { value: 0 },
      uOuter: { value: 1 },
      uAngle: { value: 0 },
      uOffsetZ: { value: 0 },
      uCapNormal: { value: new Vector3(0, 0, 1) },
      uCut: { value: 0 },
      uOpacity: { value: 1 },
      uInv: { value: 0 },
      uTime: { value: 0 },
      uHighlight: { value: 0 },
      uDim: { value: 0 },
      uStyle: { value: 0 },
      uGlow: { value: 0 },
      uBack: { value: 0 },
      uAlpha: { value: 0.3 },
      uColor: { value: new Color(color) },
      uSun: { value: live.sun },
      ...extra,
    },
  });
}

type Part = { mat: ShaderMaterial; role: 'outer' | 'inner' | 'cap1' | 'cap2' };

function applyLive(parts: Part[], s: LiveShell) {
  const half = s.cut / 2;
  for (const { mat, role } of parts) {
    const u = mat.uniforms;
    u.uOffsetZ.value = s.offsetZ;
    u.uOpacity.value = s.opacity;
    u.uTime.value = live.time;
    u.uHighlight.value = s.highlight;
    u.uDim.value = s.dim;
    u.uInner.value = s.rInner;
    u.uOuter.value = s.rOuter;
    u.uCut.value = s.cut;
    if (role === 'outer') u.uRadius.value = s.rOuter;
    else if (role === 'inner') u.uRadius.value = s.rInner;
    else {
      const sign = role === 'cap1' ? 1 : -1;
      u.uAngle.value = sign * half - Math.PI / 2;
      (u.uCapNormal.value as Vector3).set(-sign * Math.cos(half), 0, Math.sin(half));
    }
  }
}

const noRaycast = () => null;

function ShellMeshes({
  id,
  sphere,
  cap,
  textures,
}: {
  id: string;
  sphere: SphereGeometry;
  cap: PlaneGeometry;
  textures: Texture[] | null;
}) {
  const layer = layers.find((l) => l.id === id)!;
  const octaves = useQuality((q) => (q.level === 'high' ? 5 : 3));
  const isBand = layer.realm !== 'interior';
  const isSurface = id === 'continental-crust' || id === 'lithosphere';
  const visibleRef = useRef<{ group: { visible: boolean } | null }>({ group: null });

  const parts = useMemo<Part[]>(() => {
    const st = STYLE[id] ?? { style: 0, glow: 0 };
    const tune = (m: ShaderMaterial, shape: number, back = 0) => {
      m.uniforms.uShape.value = shape;
      m.uniforms.uStyle.value = st.style;
      m.uniforms.uGlow.value = st.glow;
      m.uniforms.uBack.value = back;
      m.uniforms.uInv.value = layer.grouping === 'mechanical' ? 1 : 0;
      return m;
    };
    if (isBand) {
      const alpha = id === 'ocean' ? 0.95 : id === 'exosphere' ? 0.1 : id === 'thermosphere' ? 0.2 : 0.3;
      return (['cap1', 'cap2'] as const).map((role) => {
        const m = tune(makeMaterial('band', layer.color, octaves, DoubleSide), 1);
        m.uniforms.uAlpha.value = alpha;
        return { mat: m, role };
      });
    }
    const list: Part[] = [];
    if (isSurface) {
      const m = makeMaterial('surface', layer.color, octaves, 0, {
        uDay: { value: textures?.[0] ?? null },
        uNight: { value: textures?.[1] ?? null },
        uTopo: { value: textures?.[2] ?? null },
        uHasTex: { value: textures ? 1 : 0 },
        uLon: { value: live.lonOffset },
      });
      list.push({ mat: tune(m, 0), role: 'outer' });
    } else list.push({ mat: tune(makeMaterial('layer', layer.color, octaves, 0), 0), role: 'outer' });
    if (layer.bottomKm > -6371)
      list.push({ mat: tune(makeMaterial('layer', layer.color, octaves, BackSide), 0, 1), role: 'inner' });
    list.push({ mat: tune(makeMaterial('layer', layer.color, octaves, DoubleSide), 1), role: 'cap1' });
    list.push({ mat: tune(makeMaterial('layer', layer.color, octaves, DoubleSide), 1), role: 'cap2' });
    return list;
  }, [id, layer, octaves, isBand, isSurface, textures]);

  useEffect(() => () => parts.forEach((p) => p.mat.dispose()), [parts]);

  useFrame(() => {
    const s = live.shells.get(id);
    const g = visibleRef.current.group;
    if (!s) {
      if (g) g.visible = false;
      return;
    }
    if (g) g.visible = s.opacity > 0.003;
    applyLive(parts, s);
  });

  return (
    <group ref={(g) => void (visibleRef.current.group = g)}>
      {parts.map((p) => (
        <mesh
          key={p.role}
          geometry={p.role === 'cap1' || p.role === 'cap2' ? cap : sphere}
          material={p.mat}
          frustumCulled={false}
          raycast={noRaycast}
          renderOrder={isBand ? 5 : 0}
        />
      ))}
    </group>
  );
}

function useEarthTextures(): Texture[] | null {
  const high = useQuality((q) => q.level === 'high');
  const res = high ? '4k' : '2k';
  const tex = useLoader(TextureLoader, [
    `./textures/earth-day-${res}.webp`,
    `./textures/earth-night-${res}.webp`,
    './textures/earth-topo-2k.webp',
  ]);
  useMemo(() => {
    tex.forEach((t, i) => {
      t.colorSpace = i < 2 ? SRGBColorSpace : '';
      t.wrapS = RepeatWrapping;
      t.minFilter = LinearMipmapLinearFilter;
      t.magFilter = LinearFilter;
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
  }, [tex]);
  return tex;
}

function Halo({ sphere }: { sphere: SphereGeometry }) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: CustomBlending,
        blendSrc: OneFactor,
        blendDst: OneFactor,
        blendSrcAlpha: ZeroFactor,
        blendDstAlpha: OneFactor,
        uniforms: { uRadius: { value: 1.6 }, uSun: { value: live.sun }, uScale: { value: 0.04 }, uStrength: { value: 1 } },
      }),
    [],
  );
  useFrame((_, dt) => {
    const s = useEarth.getState();
    const target = s.scaleMode === 'exaggerated' ? 0.045 : 0.016;
    mat.uniforms.uScale.value += (target - mat.uniforms.uScale.value) * Math.min(1, dt * 4);
    const strength = s.view === 'explode' ? 0 : 1;
    mat.uniforms.uStrength.value += (strength - mat.uniforms.uStrength.value) * Math.min(1, dt * 4);
  });
  return <mesh geometry={sphere} material={mat} frustumCulled={false} raycast={noRaycast} renderOrder={8} />;
}

const SHELL_IDS = layers
  .filter((l) => (l.realm === 'interior' && !l.variantOf) || l.realm === 'atmosphere' || l.id === 'ocean')
  .map((l) => l.id);

function ShellsInner({ textures }: { textures: Texture[] | null }) {
  const high = useQuality((q) => q.level === 'high');
  const sphere = useMemo(() => new SphereGeometry(1, high ? 128 : 64, high ? 64 : 32), [high]);
  const cap = useMemo(() => new PlaneGeometry(1, 1, 1, high ? 128 : 64), [high]);
  useEffect(() => () => (sphere.dispose(), cap.dispose()), [sphere, cap]);
  return (
    <>
      {SHELL_IDS.map((id) => (
        <ShellMeshes key={id} id={id} sphere={sphere} cap={cap} textures={textures} />
      ))}
      <Halo sphere={sphere} />
    </>
  );
}

function TexturedShells() {
  const textures = useEarthTextures();
  return <ShellsInner textures={textures} />;
}

/** All concentric shells. Renders with procedural materials until (or unless) the textures load. */
export function Shells({ procedural = false }: { procedural?: boolean }) {
  return procedural ? <ShellsInner textures={null} /> : <TexturedShells />;
}
