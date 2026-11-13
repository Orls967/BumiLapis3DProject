import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  ShaderMaterial,
  Vector3,
} from 'three';
import { scaleMarkers } from '@/content/markers';
import { displayRadius } from '@/lib/profile/scale';
import { useEarth } from '@/store/earth';
import { live } from './live';
import { facePoint, faceNormal, setAnchor } from './EarthScene';

const outerCut = () => live.list.find((l) => l.kind === 'interior' && l.index === 0 && l.opacity > 0.5)?.cut ?? 0;

/** Glowing marker + arc on the labelled cut face showing the current journey altitude. */
function DepthMarker() {
  const dot = useRef<Mesh>(null);
  const arc = useRef<Group>(null);
  const r = useRef(1);
  const arcGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = -Math.PI / 2 + (i / 96) * Math.PI;
      pts.push(-Math.cos(a), Math.sin(a), 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);
  const arcMat = useMemo(
    () => new LineBasicMaterial({ color: '#fff7c2', transparent: true, opacity: 0.85, depthTest: false, toneMapped: false }),
    [],
  );
  const arcLine = useMemo(() => {
    const l = new Line(arcGeo, arcMat);
    l.renderOrder = 19;
    l.frustumCulled = false;
    return l;
  }, [arcGeo, arcMat]);
  useFrame((_, dt) => {
    const s = useEarth.getState();
    const a = setAnchor('journey', 0, 4);
    const cut = outerCut();
    const on = s.depthKm !== null && cut > 0.2 && s.view !== 'explode';
    if (dot.current) dot.current.visible = on;
    if (arc.current) arc.current.visible = on;
    if (!on || s.depthKm === null) return;
    const target = displayRadius(s.depthKm, s.scaleMode);
    r.current += (target - r.current) * Math.min(1, dt * 8);
    // follow the stepped wedge: use the cut of the shell that contains this radius
    const host = live.list.find((l) => l.kind === 'interior' && l.opacity > 0.5 && r.current <= l.rOuter && r.current >= l.rInner);
    const c = host && host.cut > 0.2 ? host.cut : cut;
    facePoint(a.pos, c, Math.max(r.current, 0.012), 0, 0, 0.012);
    a.normal = faceNormal(a.normal ?? new Vector3(), c);
    a.visible = 1;
    dot.current?.position.copy(a.pos);
    dot.current?.scale.setScalar(0.014 + 0.004 * Math.sin(live.time * 4));
    if (arc.current) {
      arc.current.rotation.y = c / 2;
      arc.current.scale.setScalar(Math.max(r.current, 0.012));
      arc.current.position.set(Math.cos(c / 2) * 0.006, 0, Math.sin(c / 2) * 0.006);
    }
  });
  return (
    <>
      <mesh ref={dot} renderOrder={20}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color={[4, 3.4, 1.6]} toneMapped={false} depthTest={false} transparent />
      </mesh>
      <group ref={arc}>
        <primitive object={arcLine} />
      </group>
    </>
  );
}

/** Scale comparison ticks (Everest, ISS, …) on the second cut face. */
function ScaleMarkers() {
  const refs = useRef<(Mesh | null)[]>([]);
  useFrame(() => {
    const s = useEarth.getState();
    const cut = outerCut();
    const half = cut / 2;
    scaleMarkers.forEach((m, i) => {
      const on = (m.id === 'karman' ? s.overlays.karman || s.overlays.markers : s.overlays.markers) && cut > 0.2 && s.view !== 'explode';
      const a = setAnchor(`mk:${m.id}`, on ? 1 : 0, 2);
      const mesh = refs.current[i];
      if (mesh) mesh.visible = on;
      if (!on) return;
      const r = displayRadius(m.altKm, s.scaleMode);
      const phi = MathUtils.degToRad(m.phiDeg);
      const c = Math.cos(phi) * r;
      // face 1: the +X side face, normal (−cos, 0, sin)
      a.pos.set(Math.sin(half) * c - Math.cos(half) * 0.008, Math.sin(phi) * r, Math.cos(half) * c + Math.sin(half) * 0.008);
      a.normal = (a.normal ?? new Vector3()).set(-Math.cos(half), 0, Math.sin(half));
      mesh?.position.copy(a.pos);
    });
  });
  return (
    <>
      {scaleMarkers.map((m, i) => (
        <mesh key={m.id} ref={(el) => void (refs.current[i] = el)} renderOrder={18}>
          <sphereGeometry args={[0.009, 12, 8]} />
          <meshBasicMaterial color={[2.5, 2.5, 2.5]} toneMapped={false} depthTest={false} transparent />
        </mesh>
      ))}
    </>
  );
}

const LINE_VERT = /* glsl */ `
varying vec3 vObj;
void main(){ vObj = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const LINE_FRAG = /* glsl */ `
uniform float uCut, uOpacity; uniform vec3 uColor;
varying vec3 vObj;
void main(){
  if (uCut > 0.0001 && abs(atan(vObj.x, vObj.z)) < uCut * 0.5) discard;
  gl_FragColor = vec4(uColor, uOpacity);
}`;

/** Simplified plate boundaries (PB2002) draped on the surface. */
function Plates() {
  const on = useEarth((s) => s.overlays.plates);
  const [lines, setLines] = useState<number[][][] | null>(null);
  useEffect(() => {
    if (!on || lines) return;
    let alive = true;
    fetch('./data/plates.json')
      .then((r) => r.json())
      .then((d: number[][][]) => alive && setLines(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [on, lines]);
  const geo = useMemo(() => {
    if (!lines) return null;
    const pos: number[] = [];
    const R = 1.0025;
    const at = (lon: number, lat: number) => {
      const u = (lon + 180) / 360 - live.lonOffset;
      const th = MathUtils.degToRad(90 - lat);
      const ph = u * Math.PI * 2;
      return [-Math.cos(ph) * Math.sin(th) * R, Math.cos(th) * R, Math.sin(ph) * Math.sin(th) * R];
    };
    for (const line of lines)
      for (let i = 1; i < line.length; i++) {
        if (Math.abs(line[i][0] - line[i - 1][0]) > 180) continue;
        pos.push(...at(line[i - 1][0], line[i - 1][1]), ...at(line[i][0], line[i][1]));
      }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    return g;
  }, [lines]);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: { uCut: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new Vector3(3.2, 1.3, 0.25) } },
      }),
    [],
  );
  useFrame((_, dt) => {
    const s = useEarth.getState();
    mat.uniforms.uCut.value = outerCut();
    const target = s.overlays.plates && s.view !== 'explode' ? 0.95 : 0;
    mat.uniforms.uOpacity.value += (target - mat.uniforms.uOpacity.value) * Math.min(1, dt * 5);
  });
  if (!geo) return null;
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} renderOrder={6} />;
}

/** Schematic dipole field lines, compressed on the day side and stretched into a tail. Not to scale. */
function Magnetosphere() {
  const geo = useMemo(() => {
    const pos: number[] = [];
    const sun = live.sun;
    const tmp = new Vector3();
    const push = (v: Vector3) => {
      const d = v.dot(sun);
      tmp.copy(v).addScaledVector(sun, d > 0 ? -d * 0.32 : d * 0.9 * Math.min(1, v.length() / 3));
      pos.push(tmp.x, tmp.y, tmp.z);
    };
    const a = new Vector3();
    const b = new Vector3();
    for (const L of [2.0, 3.0, 4.2])
      for (let k = 0; k < 6; k++) {
        const az = (k / 6) * Math.PI * 2 + 0.4;
        const n = 48;
        for (let i = 0; i < n; i++) {
          const pt = (lat: number, out: Vector3) => {
            const r = L * Math.cos(lat) ** 2;
            return out.set(Math.cos(az) * r * Math.cos(lat), r * Math.sin(lat), Math.sin(az) * r * Math.cos(lat));
          };
          const lim = Math.acos(Math.sqrt(1.02 / L));
          pt(-lim + (i / n) * 2 * lim, a);
          pt(-lim + ((i + 1) / n) * 2 * lim, b);
          push(a);
          push(b);
        }
      }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new LineBasicMaterial({ color: '#38e8ff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }),
    [],
  );
  useFrame((_, dt) => {
    const s = useEarth.getState();
    const target = s.overlays.magnetosphere && s.view !== 'explode' ? 0.3 : 0;
    mat.opacity += (target - mat.opacity) * Math.min(1, dt * 4);
    const a = setAnchor('ov:magnetosphere', mat.opacity > 0.2 ? 1 : 0, 2);
    a.pos.set(-1.6, 1.75, 0.4);
    a.normal = null;
  });
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} renderOrder={7} />;
}

export function Overlays() {
  return (
    <>
      <Plates />
      <Magnetosphere />
      <ScaleMarkers />
      <DepthMarker />
    </>
  );
}
