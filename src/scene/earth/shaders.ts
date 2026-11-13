/** GLSL for the globe. All meshes sit at identity transform; positions are produced in the vertex shader. */

export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0,0.5,1.0,2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0,i1.z,i2.z,1.0)) + i.y + vec4(0.0,i1.y,i2.y,1.0)) + i.x + vec4(0.0,i1.x,i2.x,1.0));
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z); vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy; vec4 y = y_*ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0); m = m*m;
  return 42.0*dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float a = 0.5; float s = 0.0;
  for (int i = 0; i < OCTAVES; i++) { s += a * snoise(p); p = p * 2.03 + vec3(1.7, 9.2, 4.1); a *= 0.5; }
  return s;
}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
`;

/** Shared vertex shader: uShape 0 = sphere of radius uRadius, 1 = half-annulus cut face. */
export const SHELL_VERT = /* glsl */ `
uniform float uShape, uRadius, uInner, uOuter, uAngle, uOffsetZ;
uniform vec3 uCapNormal;
varying vec3 vObj; varying vec3 vNormalW; varying vec3 vWorld; varying vec2 vUv;
void main(){
  vec3 p; vec3 n;
  if (uShape < 0.5) { p = position * uRadius; n = normalize(position); }
  else {
    float r = mix(uInner, uOuter, uv.x);
    float th = mix(-1.5707963, 1.5707963, uv.y);
    vec2 q = vec2(r * cos(th), r * sin(th));
    p = vec3(q.x * cos(uAngle), q.y, -q.x * sin(uAngle));
    n = uCapNormal;
  }
  vObj = p; vNormalW = n; vUv = uv;
  vWorld = p + vec3(0.0, 0.0, uOffsetZ);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
}`;

const DISCARD = /* glsl */ `
  if (uShape < 0.5 && uCut > 0.0001 && abs(atan(vObj.x, vObj.z)) < uCut * 0.5) discard;
  float dth = ign(gl_FragCoord.xy); if (uInv > 0.5) dth = 1.0 - dth;
  if (uOpacity < 0.995 && dth >= uOpacity) discard;
`;

/** Interior layers. uStyle: 0 rock, 1 mantle, 2 liquid outer core, 3 inner core. */
export const LAYER_FRAG = /* glsl */ `
uniform float uShape, uCut, uOpacity, uInv, uTime, uHighlight, uDim, uStyle, uGlow, uInner, uOuter, uBack;
uniform vec3 uColor, uSun;
varying vec3 vObj; varying vec3 vNormalW; varying vec3 vWorld; varying vec2 vUv;
${NOISE}
void main(){
  ${DISCARD}
  vec3 p = vObj;
  float r = length(p);
  vec3 N = normalize(vNormalW) * (uBack > 0.5 ? -1.0 : 1.0);
  float ndl = dot(N, uSun);
  float light = uShape > 0.5 ? 0.92 + 0.08 * ndl : 0.5 + 0.5 * smoothstep(-0.4, 0.9, ndl);
  vec3 col;
  if (uStyle < 0.5) {
    float n = fbm(p * 14.0);
    float grain = snoise(p * 90.0);
    col = uColor * (0.82 + 0.3 * n + 0.07 * grain);
    col *= 0.94 + 0.06 * sin(r * 520.0 + n * 6.0);
    col *= light;
  } else if (uStyle < 1.5) {
    vec3 q = p * 2.6;
    vec3 w = vec3(snoise(q + vec3(0.0, uTime * 0.035, 0.0)), snoise(q + vec3(7.3, 1.1, -uTime * 0.03)), snoise(q + vec3(-3.7, 13.1, 2.2)));
    q += 0.55 * w;
    float n = fbm(q * 1.6);
    float veins = pow(1.0 - abs(snoise(q * 1.9 + vec3(0.0, 0.0, uTime * 0.02))), 7.0);
    col = mix(uColor * 0.5, uColor * 1.2, smoothstep(-0.6, 0.7, n));
    col += vec3(1.0, 0.5, 0.12) * veins * (0.25 + uGlow);
    col *= mix(light, 1.0, 0.45) * (0.9 + 0.7 * uGlow);
  } else if (uStyle < 2.5) {
    vec3 q = p * 4.2;
    q += 0.8 * vec3(snoise(q * 0.7 + uTime * 0.11), snoise(q * 0.7 + 5.2 - uTime * 0.09), snoise(q * 0.7 + 9.4 + uTime * 0.07));
    float n = fbm(q + vec3(0.0, uTime * 0.12, 0.0));
    float bands = 0.5 + 0.5 * sin(p.y * 22.0 + n * 5.0 + uTime * 0.25);
    col = mix(vec3(0.85, 0.16, 0.01), vec3(1.0, 0.55, 0.06), smoothstep(-0.55, 0.55, n));
    col = mix(col, vec3(1.0, 0.8, 0.3), 0.3 * bands * smoothstep(0.15, 0.7, n));
    col *= 1.25;
  } else {
    float n = fbm(p * 7.0);
    float cells = abs(snoise(p * 16.0));
    col = mix(vec3(1.0, 0.82, 0.42), vec3(1.0, 0.97, 0.82), smoothstep(-0.4, 0.6, n));
    col *= 2.3 * (0.86 + 0.14 * smoothstep(0.0, 0.25, cells));
  }
  if (uShape > 0.5) {
    float edge = min(vUv.x, 1.0 - vUv.x) * (uOuter - uInner);
    float w = fwidth(r) * 1.5 + 0.0012;
    col *= mix(0.3, 1.0, smoothstep(0.0, w, edge));
  }
  col = mix(col, col * 0.42, uDim);
  col += (col * 0.28 + vec3(0.07, 0.06, 0.03)) * uHighlight;
  gl_FragColor = vec4(col, 1.0);
}`;

/** Earth surface: day/night textures, relief, ocean glint, procedural clouds, atmospheric rim. */
export const SURFACE_FRAG = /* glsl */ `
uniform sampler2D uDay, uNight, uTopo;
uniform float uShape, uCut, uOpacity, uInv, uTime, uLon, uHighlight, uDim, uHasTex;
uniform vec3 uSun;
varying vec3 vObj; varying vec3 vNormalW; varying vec3 vWorld; varying vec2 vUv;
${NOISE}
void main(){
  ${DISCARD}
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorld);
  vec2 uv = vec2(fract(vUv.x + uLon), vUv.y);
  vec3 day; vec3 night; float ocean; vec3 Nb = N;
  if (uHasTex > 0.5) {
    day = texture2D(uDay, uv).rgb;
    night = texture2D(uNight, uv).rgb;
    float h0 = texture2D(uTopo, uv).r;
    vec2 e = vec2(1.0 / 2048.0, 1.0 / 1024.0);
    float hx = texture2D(uTopo, uv + vec2(e.x, 0.0)).r - texture2D(uTopo, uv - vec2(e.x, 0.0)).r;
    float hy = texture2D(uTopo, uv + vec2(0.0, e.y)).r - texture2D(uTopo, uv - vec2(0.0, e.y)).r;
    vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), N) + vec3(1e-5, 0.0, 0.0));
    vec3 B = cross(N, T);
    Nb = normalize(N - 2.2 * (hx * T + hy * B));
    ocean = (1.0 - smoothstep(0.0, 0.02, h0)) * smoothstep(0.0, 0.08, day.b - max(day.r, day.g) * 0.9);
  } else {
    float land = smoothstep(0.02, 0.1, fbm(N * 2.1 + 3.0));
    day = mix(vec3(0.02, 0.09, 0.25), mix(vec3(0.1, 0.25, 0.08), vec3(0.4, 0.33, 0.2), fbm(N * 6.0) * 0.5 + 0.5), land);
    night = vec3(0.0); ocean = 1.0 - land;
  }
  float ndl = dot(Nb, uSun);
  float ndlGeo = dot(N, uSun);
  float dayAmt = smoothstep(-0.1, 0.22, ndlGeo);
  vec3 col = day * (0.035 + 1.25 * max(ndl, 0.0)) * dayAmt + day * 0.03;
  vec3 H = normalize(uSun + V);
  col += vec3(1.0, 0.93, 0.8) * pow(max(dot(N, H), 0.0), 70.0) * ocean * 0.9 * dayAmt;
  col += vec3(0.3, 0.5, 0.9) * pow(max(dot(N, H), 0.0), 8.0) * ocean * 0.07 * dayAmt;
  vec3 lights = pow(night, vec3(1.4)) * vec3(1.0, 0.78, 0.5) * 2.6;
  // procedural clouds drifting slowly
  float ca = uTime * 0.006;
  vec3 cp = vec3(N.x * cos(ca) - N.z * sin(ca), N.y, N.x * sin(ca) + N.z * cos(ca));
  vec3 warp = vec3(snoise(cp * 1.7 + 4.0), snoise(cp * 1.7 + 11.0), snoise(cp * 1.7 - 6.0));
  float c = fbm(cp * 3.4 + warp * 0.7) + 0.2 * snoise(cp * vec3(1.2, 6.0, 1.2) + 2.0) + 0.12 * snoise(cp * 24.0 + warp);
  float cloud = smoothstep(0.22, 0.8, c) * 0.82;
  col = mix(col, vec3(1.0) * (0.03 + 1.15 * max(ndlGeo, 0.0)) * dayAmt + vec3(0.012), cloud);
  col += lights * (1.0 - dayAmt) * (1.0 - cloud * 0.8);
  // atmospheric scattering rim + warm terminator
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  col += vec3(0.22, 0.48, 1.0) * fres * (0.12 + 1.1 * dayAmt);
  col += vec3(1.0, 0.36, 0.12) * smoothstep(0.25, 0.0, abs(ndlGeo)) * fres * 0.5;
  col = mix(col, col * 0.5, uDim);
  col += (col * 0.4 + vec3(0.05, 0.07, 0.1)) * uHighlight;
  gl_FragColor = vec4(col, 1.0);
}`;

/** Translucent bands (atmosphere layers, ocean) drawn on the cut faces. */
export const BAND_FRAG = /* glsl */ `
uniform float uShape, uCut, uOpacity, uHighlight, uDim, uAlpha, uInner, uOuter;
uniform vec3 uColor;
varying vec3 vObj; varying vec2 vUv;
void main(){
  float r = length(vObj);
  float edge = min(vUv.x, 1.0 - vUv.x) * (uOuter - uInner);
  float w = fwidth(r) * 1.2 + 0.0008;
  float line = 1.0 - smoothstep(0.0, w, edge);
  float a = uAlpha * (0.75 + 0.25 * (1.0 - vUv.x)) * (1.0 - 0.55 * uDim) + 0.35 * uHighlight + line * 0.35;
  vec3 col = uColor * (1.0 + 0.9 * uHighlight) + vec3(line * 0.25);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOpacity);
}`;

/** Outer halo: analytic limb glow computed from the ray's closest approach to the planet. */
export const HALO_VERT = /* glsl */ `
uniform float uRadius;
varying vec3 vWorld;
void main(){ vWorld = position * uRadius; gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0); }`;

export const HALO_FRAG = /* glsl */ `
uniform vec3 uSun; uniform float uScale, uStrength;
varying vec3 vWorld;
void main(){
  vec3 d = normalize(vWorld - cameraPosition);
  float t = -dot(cameraPosition, d);
  vec3 c = cameraPosition + d * t;
  float b = length(c);
  if (b < 1.0) discard;
  float glow = exp(-(b - 1.0) / uScale);
  float dayAmt = smoothstep(-0.55, 0.5, dot(normalize(c), uSun));
  vec3 col = mix(vec3(0.25, 0.5, 1.0), vec3(0.6, 0.8, 1.0), glow * glow);
  gl_FragColor = vec4(col * glow * (0.12 + dayAmt) * uStrength, 0.0);
}`;
