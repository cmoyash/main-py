/* =========================================================
   AZURA — the 3D world: sea, sky, cliff and the villa.
   Everything is built from code, so there are no image files.
   Units are metres. Sea level is y = 0, the cliff top is y = 36.
   ========================================================= */
import * as THREE from "../vendor/three.module.min.js";

const CLIFF = 36;

/* ---------- small helpers ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return s; }

// seeded random so the trees land in the same place every visit
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* ---------- the coastline (shared with the sea shader) ---------- */
const coast = (x) => 28 - 0.0022 * x * x + 6 * Math.sin(x * 0.045) + 4 * Math.sin(x * 0.11 + 1.3);
const COAST_GLSL = "float coast(float x){ return 28.0 - 0.0022*x*x + 6.0*sin(x*0.045) + 4.0*sin(x*0.11+1.3); }";

function terrainHeight(x, z) {
  const d = coast(x) - z; // > 0 on land
  const top = CLIFF + (fbm(x * 0.012, z * 0.012) - 0.5) * 12 + smooth(40, 320, d) * fbm(x * 0.004 + 3, z * 0.004) * 70;
  const edge = smooth(-2, 16, d + (fbm(x * 0.07, z * 0.07) - 0.5) * 9);
  const seabed = -5 - clamp(-d, 0, 200) * 0.15;
  let h = lerp(seabed, top, edge);
  h += (fbm(x * 0.16, z * 0.16) - 0.5) * 5 * edge * (1 - edge) * 4; // rough rock on the cliff face
  // flatten the plot the villa sits on
  const bx = Math.max(Math.abs(x) - 26, 0), bz = Math.max(-36 - z, z - 9, 0);
  const plot = 1 - smooth(0, 16, Math.hypot(bx, bz));
  return lerp(h, CLIFF, plot);
}

/* ---------- time of day presets: 0 = afternoon, 1 = golden hour, 2 = blue hour ---------- */
const TOD = [
  { zenith: "#3a78c2", horizon: "#c3dbe9", sun: "#fff4e2", elev: 34, az: 0.55, sunI: 3.2, hemi: 0.75, env: 0.75, lamps: 7, fogFar: 2600 },
  { zenith: "#33497a", horizon: "#f2ab6c", sun: "#ffb46a", elev: 4, az: 0.62, sunI: 2.4, hemi: 0.5, env: 0.55, lamps: 22, fogFar: 2200 },
  { zenith: "#121a30", horizon: "#b9675a", sun: "#ff8a5c", elev: -2, az: 0.62, sunI: 0.15, hemi: 0.28, env: 0.3, lamps: 40, fogFar: 1800 },
];

/* ---------- camera path for the scroll story ---------- */
const KEYS = [
  { t: 0.0, p: [60, 12, 430], l: [0, 34, 0] },
  { t: 0.14, p: [40, 20, 260], l: [0, 36, 0] },
  { t: 0.3, p: [-60, 60, 150], l: [0, 38, 0] },
  { t: 0.42, p: [-40, 50, 55], l: [0, 38, -4] },
  { t: 0.52, p: [22, 41, 34], l: [-2, 37, 4] },
  { t: 0.6, p: [4, 37.5, 19], l: [-3, 37.2, 2] },
  { t: 0.68, p: [-3, 38.1, 3], l: [-8, 37.6, -8] },
  { t: 0.77, p: [-9, 38.1, -1], l: [2, 37.8, -8] },
  { t: 0.87, p: [-3, 38.3, 1], l: [25, 37, 40] },
  { t: 1.0, p: [6, 41, 16], l: [45, 35, 70] },
];

/* ---------- fixed camera views used for the listing and gallery images ---------- */
export const VIEWS = {
  sea: { p: [-120, 7, 150], l: [0, 32, 0], tod: 0.85 },
  aerial: { p: [-70, 72, 95], l: [0, 37, -4], tod: 0.25 },
  front: { p: [30, 45, 62], l: [0, 38, -3], tod: 0.35 },
  pool: { p: [16, 38.4, 22], l: [-6, 37, 6], tod: 0.55 },
  living: { p: [-1, 38.2, 2], l: [-9, 37.6, -8], tod: 0.3 },
  bedroom: { p: [13, 42.7, 0], l: [4, 41.6, -8], tod: 0.7 },
  sunset: { p: [-2, 38.6, 6], l: [35, 36, 55], tod: 1 },
  pergola: { p: [27, 39.2, 22], l: [16, 37, 8], tod: 0.9 },
  dusk: { p: [-55, 58, 80], l: [0, 38, -2], tod: 2 },
  garden: { p: [-40, 41, -50], l: [0, 39, -10], tod: 0.45 },
};

/* =========================================================
   Shaders
   ========================================================= */
const skyShader = {
  vertex: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position = p.xyww;
    }`,
  fragment: /* glsl */ `
    uniform vec3 uZenith, uHorizon, uSunColor, uSunDir;
    varying vec3 vDir;
    void main() {
      vec3 d = normalize(vDir);
      float h = max(d.y, 0.0);
      vec3 col = mix(uHorizon, uZenith, pow(h, 0.45));
      if (d.y < 0.0) col = uHorizon * 0.85;
      float s = max(dot(d, uSunDir), 0.0);
      col += uSunColor * (pow(s, 900.0) * 18.0 + pow(s, 14.0) * 0.35 + pow(s, 3.0) * 0.12 * (1.0 - h));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

const seaShader = {
  vertex: /* glsl */ `
    uniform float uTime;
    varying vec3 vWorld;
    float H(vec2 p) {
      float t = uTime;
      return 0.35 * sin(dot(p, vec2(0.8, 0.6)) * 0.06 + t * 0.9)
           + 0.25 * sin(dot(p, vec2(-0.5, 0.85)) * 0.11 + t * 1.3)
           + 0.12 * sin(dot(p, vec2(0.3, -0.95)) * 0.23 + t * 1.9);
    }
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      wp.y += H(wp.xz);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragment: /* glsl */ `
    uniform float uTime, uFogNear, uFogFar;
    uniform vec3 uZenith, uHorizon, uSunColor, uSunDir, uDeep, uShallow;
    varying vec3 vWorld;
    ${COAST_GLSL}
    float H(vec2 p) {
      float t = uTime;
      return 0.35 * sin(dot(p, vec2(0.8, 0.6)) * 0.06 + t * 0.9)
           + 0.25 * sin(dot(p, vec2(-0.5, 0.85)) * 0.11 + t * 1.3)
           + 0.12 * sin(dot(p, vec2(0.3, -0.95)) * 0.23 + t * 1.9)
           + 0.06 * sin(dot(p, vec2(-0.9, -0.2)) * 0.47 + t * 2.6);
    }
    float D(vec2 p) {
      float t = uTime;
      return 0.035 * sin(dot(p, vec2(0.7, 0.7)) * 1.3 + t * 3.1)
           + 0.022 * sin(dot(p, vec2(-0.6, 0.8)) * 2.1 + t * 3.7)
           + 0.015 * sin(dot(p, vec2(0.95, -0.3)) * 3.3 + t * 4.3);
    }
    void main() {
      vec2 p = vWorld.xz;
      float dist = length(cameraPosition - vWorld);
      float detail = 1.0 - smoothstep(25.0, 280.0, dist);
      float e = 0.5;
      float hx = H(p + vec2(e, 0.0)) - H(p - vec2(e, 0.0)) + detail * (D(p + vec2(e, 0.0)) - D(p - vec2(e, 0.0)));
      float hz = H(p + vec2(0.0, e)) - H(p - vec2(0.0, e)) + detail * (D(p + vec2(0.0, e)) - D(p - vec2(0.0, e)));
      vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));
      vec3 v = normalize(cameraPosition - vWorld);
      float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
      vec3 r = reflect(-v, n);
      r.y = abs(r.y);
      vec3 sky = mix(uHorizon, uZenith, pow(r.y, 0.45));
      float sea = vWorld.z - coast(vWorld.x);       // distance out from the shore
      vec3 water = mix(uShallow, uDeep, smoothstep(-4.0, 70.0, sea));
      water *= 0.55 + 0.45 * max(uSunDir.y + 0.3, 0.0);
      vec3 col = mix(water, sky, fres);
      float s = max(dot(r, uSunDir), 0.0);
      col += uSunColor * (pow(s, 700.0) * 7.0 + pow(s, 50.0) * 0.35);
      float foam = (1.0 - smoothstep(-6.0, 9.0, sea)) * (0.55 + 0.45 * sin(sea * 1.7 - uTime * 1.8 + sin(vWorld.x * 0.2) * 2.0));
      col = mix(col, vec3(0.92), clamp(foam, 0.0, 1.0) * 0.6);
      col = mix(col, uHorizon, smoothstep(uFogNear, uFogFar, dist));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

const poolShader = {
  vertex: /* glsl */ `
    varying vec3 vWorld;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragment: /* glsl */ `
    uniform float uTime;
    uniform vec3 uZenith, uHorizon, uSunColor, uSunDir;
    varying vec3 vWorld;
    void main() {
      vec2 p = vWorld.xz * 1.4;
      float t = uTime;
      float c = sin(p.x + sin(p.y * 1.3 + t) * 1.2 + t * 0.7) * sin(p.y * 1.1 + sin(p.x * 0.9 - t * 0.8) * 1.2 + t * 0.5);
      float lines = smoothstep(0.55, 1.0, abs(c));
      vec3 n = normalize(vec3(0.04 * cos(p.x * 2.0 + t * 2.0), 1.0, 0.04 * sin(p.y * 2.3 - t * 1.7)));
      vec3 v = normalize(cameraPosition - vWorld);
      float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
      vec3 r = reflect(-v, n);
      vec3 sky = mix(uHorizon, uZenith, pow(max(r.y, 0.0), 0.45));
      float day = 0.35 + 0.65 * clamp(uSunDir.y * 3.0 + 0.2, 0.0, 1.0);
      vec3 water = mix(vec3(0.02, 0.22, 0.32), vec3(0.18, 0.62, 0.68), 0.45 + 0.4 * lines) * day;
      vec3 col = mix(water, sky, fres * 0.8);
      col += uSunColor * pow(max(dot(r, uSunDir), 0.0), 300.0) * 4.0;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

/* =========================================================
   Scene builders
   ========================================================= */
function srgb(hex) { return new THREE.Color(hex); } // THREE.Color converts hex to linear for us

function buildTerrain() {
  const W = 1400, D = 700, SX = 350, SZ = 175;
  const geo = new THREE.PlaneGeometry(W, D, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -170); // z from -520 (inland) to +180 (out at sea)
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();

  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color(), rockA = new THREE.Color(), rockB = new THREE.Color(), grassA = new THREE.Color(), grassB = new THREE.Color(), wet = new THREE.Color(), plot = new THREE.Color();
  rockA.setStyle("#d2b48c"); rockB.setStyle("#8f6f52"); grassA.setStyle("#5c6b38"); grassB.setStyle("#9a9a62"); wet.setStyle("#4a4038"); plot.setStyle("#b9ae86");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const slope = 1 - nor.getY(i);
    const n = fbm(x * 0.05, z * 0.05);
    const strata = 0.5 + 0.5 * Math.sin(y * 0.9 + n * 4);
    c.copy(rockA).lerp(rockB, strata * 0.7);
    const g = new THREE.Color().copy(grassA).lerp(grassB, fbm(x * 0.02 + 9, z * 0.02));
    c.lerp(g, 1 - smooth(0.18, 0.42, slope));
    if (Math.abs(x) < 34 && z > -46 && z < 16) c.lerp(plot, 0.35);
    c.lerp(wet, 1 - smooth(-1, 3, y));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function buildTrees() {
  const group = new THREE.Group();
  const count = 340;
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), count);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 1, 5), new THREE.MeshStandardMaterial({ color: "#5a4632", roughness: 1 }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0, tries = 0;
  while (placed < count && tries < 6000) {
    tries++;
    const x = (rand() - 0.5) * 900, z = -480 + rand() * 520;
    const d = coast(x) - z;
    if (d < 14) continue;
    if (Math.abs(x) < 38 && z > -60 && z < 22) continue; // keep the villa plot clear
    const y = terrainHeight(x, z);
    const slope = Math.abs(terrainHeight(x + 2, z) - y) + Math.abs(terrainHeight(x, z + 2) - y);
    if (slope > 2.2) continue;
    const size = 1.6 + rand() * 2.6;
    q.setFromEuler(new THREE.Euler(0, rand() * Math.PI, 0));
    s.set(size * 1.2, size * (0.8 + rand() * 0.4), size * 1.2);
    p.set(x, y + size * 1.4 + 1.2, z);
    crowns.setMatrixAt(placed, m.compose(p, q, s));
    crowns.setColorAt(placed, col.setStyle(rand() > 0.5 ? "#3f5a2c" : "#56693a"));
    s.set(1, size * 1.2 + 1.2, 1); p.set(x, y + (size * 1.2 + 1.2) / 2, z);
    trunks.setMatrixAt(placed, m.compose(p, q, s));
    placed++;
  }
  crowns.count = trunks.count = placed;
  crowns.castShadow = trunks.castShadow = true;
  group.add(crowns, trunks);
  return group;
}

function paintingTexture() {
  const cv = document.createElement("canvas");
  cv.width = 512; cv.height = 288;
  const g = cv.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 288);
  grd.addColorStop(0, "#e8d7bf"); grd.addColorStop(1, "#c9a27a");
  g.fillStyle = grd; g.fillRect(0, 0, 512, 288);
  g.fillStyle = "#2f5f7a"; g.beginPath(); g.ellipse(190, 160, 120, 90, -0.3, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#b5532f"; g.beginPath(); g.arc(360, 110, 58, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#1f1f1f"; g.lineWidth = 6; g.beginPath(); g.moveTo(60, 230); g.bezierCurveTo(200, 120, 320, 260, 470, 160); g.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildVilla(poolMat) {
  const villa = new THREE.Group();
  villa.position.set(0, CLIFF, 0);

  const M = {
    white: new THREE.MeshStandardMaterial({ color: "#f1ede6", roughness: 0.85 }),
    inner: new THREE.MeshStandardMaterial({ color: "#e6ddd0", roughness: 0.9, envMapIntensity: 0.35 }),
    limestone: new THREE.MeshStandardMaterial({ color: "#c9b79b", roughness: 0.95, envMapIntensity: 0.4 }),
    panel: new THREE.MeshStandardMaterial({ color: "#7a5537", roughness: 0.7, envMapIntensity: 0.4 }),
    stone: new THREE.MeshStandardMaterial({ color: "#d6c7ae", roughness: 0.92 }),
    floor: new THREE.MeshStandardMaterial({ color: "#b48a5e", roughness: 0.55, envMapIntensity: 0.5 }),
    wood: new THREE.MeshStandardMaterial({ color: "#8e6440", roughness: 0.65 }),
    frame: new THREE.MeshStandardMaterial({ color: "#2b2b2b", roughness: 0.4, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: "#b8d4df", roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 }),
    fabric: new THREE.MeshStandardMaterial({ color: "#e9e1d4", roughness: 1, envMapIntensity: 0.45 }),
    fabricDark: new THREE.MeshStandardMaterial({ color: "#5f554b", roughness: 1, envMapIntensity: 0.45 }),
    rug: new THREE.MeshStandardMaterial({ color: "#a8916f", roughness: 1, envMapIntensity: 0.4 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#5d7342", roughness: 0.9, flatShading: true }),
    cypress: new THREE.MeshStandardMaterial({ color: "#2f4426", roughness: 0.9, flatShading: true }),
    pot: new THREE.MeshStandardMaterial({ color: "#a48f78", roughness: 0.95 }),
    lamp: new THREE.MeshStandardMaterial({ color: "#fff1d6", emissive: "#ffcf8a", emissiveIntensity: 0.6 }),
    canvas: new THREE.MeshStandardMaterial({ map: paintingTexture(), roughness: 0.9 }),
  };

  // box with its base at y (easier to stack)
  const box = (w, h, d, mat, x, y, z, parent = villa) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, y + h / 2, z);
    b.castShadow = mat !== M.glass;
    b.receiveShadow = true;
    parent.add(b);
    return b;
  };
  const glassWall = (x1, x2, z, y, h) => {
    box(x2 - x1, h, 0.04, M.glass, (x1 + x2) / 2, y, z);
    for (let x = x1; x <= x2 + 0.01; x += 3.5) box(0.08, h, 0.14, M.frame, Math.min(x, x2), y, z);
    box(x2 - x1, 0.08, 0.14, M.frame, (x1 + x2) / 2, y + h - 0.08, z);
  };

  /* ---- base: stone terrace + side deck ---- */
  box(48, 1.2, 40, M.stone, 0, -0.9, -12);
  box(12, 1.2, 8, M.stone, 18, -0.9, 11.5);

  /* ---- infinity pool, cantilevered over the cliff ---- */
  box(30, 1.6, 8, M.white, -3, -1.3, 11.5);
  for (let x = -16; x <= 10; x += 6.5) box(0.9, 14, 0.9, M.white, x, -15, 14.8); // columns down the rock
  const water = new THREE.Mesh(new THREE.PlaneGeometry(29.2, 7.6), poolMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-3, 0.31, 11.7);
  villa.add(water);
  box(30, 0.12, 0.3, M.white, -3, 0.3, 7.65);   // inner rim
  box(0.3, 0.12, 8, M.white, -17.85, 0.3, 11.5);
  box(0.3, 0.12, 8, M.white, 11.85, 0.3, 11.5);

  /* ---- ground floor: living pavilion ---- */
  box(28, 0.3, 16, M.floor, -2, 0.3, -4);          // oak floor
  box(32, 0.5, 20, M.white, -2, 4.4, -4);          // roof slab with deep overhang
  box(28, 3.8, 0.4, M.white, -2, 0.6, -12);        // back wall
  box(12, 3.8, 0.12, M.limestone, -9, 0.6, -11.75); // limestone feature wall
  box(28, 0.08, 15.6, M.inner, -2, 4.32, -4);       // warm ceiling
  box(0.4, 3.8, 16, M.white, -16, 0.6, -4);        // left wall
  glassWall(-16, -5, 4, 0.6, 3.8);                  // front glass, with an open slider
  glassWall(-1, 12, 4, 0.6, 3.8);
  box(0.6, 3.8, 0.1, M.glass, -4.7, 0.6, 3.85);     // slid-back door panel
  // right side glass
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.8, 16), M.glass);
  side.position.set(12, 2.5, -4); villa.add(side);

  /* ---- living room ---- */
  box(7, 0.03, 5, M.rug, -7, 0.6, -4.5);
  box(6, 0.45, 1.1, M.fabric, -7, 0.6, -7.2);
  box(6, 0.55, 0.3, M.fabric, -7, 1.05, -7.65);
  box(1.1, 0.45, 3, M.fabric, -10.45, 0.6, -5.2);
  box(0.3, 0.55, 3, M.fabric, -10.9, 1.05, -5.2);
  for (let i = 0; i < 3; i++) box(0.9, 0.5, 0.18, M.fabricDark, -8.8 + i * 1.6, 1.05, -7.4);
  box(2.2, 0.38, 1.2, M.wood, -7, 0.6, -3.8);
  box(1.0, 0.45, 1.0, M.fabricDark, -3.8, 0.6, -4.4);
  box(1.0, 0.45, 1.0, M.fabricDark, -3.8, 0.6, -2.6);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), M.canvas);
  art.position.set(-7, 2.7, -11.68); villa.add(art);
  box(0.45, 3.2, 5, M.wood, -15.55, 0.6, -6);      // bookshelf
  for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) if ((r + k) % 3) box(0.3, 0.45, 0.35 + (k % 2) * 0.2, k % 2 ? M.fabricDark : M.white, -15.45, 0.95 + r * 0.75, -8 + k * 0.8);

  /* ---- dining + kitchen ---- */
  box(3.8, 0.08, 1.3, M.wood, 3, 1.3, -4);
  for (const [x, z] of [[1.3, -4.5], [4.7, -4.5], [1.3, -3.5], [4.7, -3.5]]) box(0.08, 0.7, 0.08, M.frame, x, 0.6, z);
  for (let i = 0; i < 3; i++) for (const z of [-5.1, -2.9]) {
    box(0.55, 0.08, 0.55, M.fabricDark, 1.8 + i * 1.2, 1.05, z);
    box(0.55, 0.6, 0.06, M.fabricDark, 1.8 + i * 1.2, 1.13, z + (z < -4 ? -0.27 : 0.27));
  }
  for (let i = 0; i < 3; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), M.lamp);
    bulb.position.set(1.8 + i * 1.2, 3.25, -4); villa.add(bulb);
    box(0.02, 1.0, 0.02, M.frame, 1.8 + i * 1.2, 3.4, -4);
  }
  box(4.2, 1.0, 1.3, M.white, 7.5, 0.6, -8.2);
  box(9, 2.7, 0.7, M.wood, 7, 0.6, -11.45);
  box(9, 0.06, 0.72, M.white, 7, 1.55, -11.1);

  /* ---- upstairs: bedroom suite cantilevered over the terrace ---- */
  box(20, 0.3, 14, M.floor, 6, 4.9, -5);
  box(20, 3.4, 0.4, M.white, 6, 5.2, -12);
  box(0.4, 3.4, 14, M.white, -4, 5.2, -5);
  box(0.4, 3.4, 14, M.white, 16, 5.2, -5);
  box(22, 0.45, 16, M.white, 6, 8.6, -5);
  glassWall(-4, 16, 2, 5.2, 3.4);
  box(18, 1.1, 0.04, M.glass, 5, 4.9, 5.7);          // balcony glass
  box(18, 0.06, 0.08, M.frame, 5, 6.0, 5.7);
  box(10, 3.4, 0.12, M.panel, 6, 5.2, -11.75);      // timber wall behind the bed
  box(5, 0.03, 4.2, M.rug, 6, 5.2, -7.6);
  box(20, 0.08, 13.6, M.inner, -4 + 10, 8.52, -5);   // warm ceiling
  box(2.4, 0.55, 2.6, M.fabric, 6, 5.23, -8);
  box(2.8, 1.3, 0.15, M.wood, 6, 5.2, -9.4);
  box(2.4, 0.08, 1.2, M.fabricDark, 6, 5.75, -7.2);
  for (const x of [5.4, 6.6]) box(0.8, 0.22, 0.4, M.fabric, x, 5.75, -8.9);
  for (const x of [4.2, 7.8]) {
    box(0.6, 0.55, 0.5, M.wood, x, 5.2, -9);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), M.lamp);
    l.position.set(x, 6.0, -9); villa.add(l);
  }
  box(1.6, 0.45, 0.9, M.fabricDark, 11.5, 5.2, -3); // reading bench by the window

  /* ---- pergola + loungers on the side deck ---- */
  for (const [x, z] of [[13.5, 8], [23.5, 8], [13.5, 15], [23.5, 15]]) box(0.2, 3.2, 0.2, M.wood, x, 0.3, z);
  for (let i = 0; i < 12; i++) box(10.4, 0.12, 0.14, M.wood, 18.5, 3.5, 7.9 + i * 0.65);
  for (const x of [15.5, 18.5, 21.5]) {
    box(0.85, 0.3, 2.1, M.white, x, 0.3, 11.6);
    box(0.85, 0.12, 2.0, M.fabric, x, 0.6, 11.6);
    const back = box(0.85, 0.9, 0.12, M.fabric, x, 0.5, 10.7);
    back.rotation.x = -0.6;
  }

  /* ---- planters, olive trees and cypresses ---- */
  const olive = (x, z) => {
    box(1.4, 0.8, 1.4, M.pot, x, 0.3, z);
    box(0.18, 1.8, 0.18, M.wood, x, 1.1, z);
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 + rand() * 0.35, 0), M.leaf);
      b.position.set(x + (rand() - 0.5) * 1.2, 3 + rand() * 0.6, z + (rand() - 0.5) * 1.2);
      b.castShadow = true; villa.add(b);
    }
  };
  olive(-20, 5); olive(-20, -24); olive(20, -24); olive(14, 2);
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9 + rand() * 3, 7), M.cypress);
    c.position.set(-22 + i * 7.3, 4.8, -31 + (i % 2) * 2);
    c.castShadow = true; villa.add(c);
  }
  // indoor plant
  box(0.7, 0.7, 0.7, M.pot, -14.6, 0.6, 2.5);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), M.leaf);
  plant.position.set(-14.6, 2.1, 2.5); villa.add(plant);

  /* ---- path lights along the pool ---- */
  for (let x = -16; x <= 10; x += 4.3) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.lamp);
    b.position.set(x, 0.45, 6.9); villa.add(b);
  }

  /* ---- warm interior lights (brighter as the sun goes down) ---- */
  const lamps = [];
  for (const [x, y, z] of [[-7, 3.1, -4], [3, 3.0, -4], [6, 7.3, -6], [18.5, 3.0, 11]]) {
    const L = new THREE.PointLight("#ffc78a", 2, 16, 2);
    L.position.set(x, y, z);
    villa.add(L); lamps.push(L);
  }

  return { villa, lamps, lampMat: M.lamp };
}

/* =========================================================
   createWorld — public API used by main.js
   ========================================================= */
export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const mobile = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.3, 7000);

  const shared = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunColor: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3() },
    uTime: { value: 0 },
  };

  // sky (also used, on its own, to light the scene through an environment map)
  const skyMat = new THREE.ShaderMaterial({ uniforms: shared, vertexShader: skyShader.vertex, fragmentShader: skyShader.fragment, side: THREE.BackSide, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 32, 16), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat);
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null, envTod = -1;

  const seaMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uDeep: { value: srgb("#0a3a58") }, uShallow: { value: srgb("#1d8f9c") }, uFogNear: { value: 300 }, uFogFar: { value: 2600 } },
    vertexShader: seaShader.vertex, fragmentShader: seaShader.fragment,
  });
  const seaGeo = new THREE.PlaneGeometry(9000, 9000, 220, 220);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, seaMat);
  scene.add(sea);

  const poolMat = new THREE.ShaderMaterial({ uniforms: shared, vertexShader: poolShader.vertex, fragmentShader: poolShader.fragment });

  scene.add(buildTerrain());
  scene.add(buildTrees());
  const { villa, lamps, lampMat } = buildVilla(poolMat);
  scene.add(villa);

  scene.fog = new THREE.Fog("#c3dbe9", 300, 2600);

  const hemi = new THREE.HemisphereLight("#cfe3f2", "#8a7458", 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffffff", 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 600;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  sun.target.position.set(0, CLIFF, -4);
  scene.add(sun, sun.target);

  /* ---- time of day ---- */
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  function mixPreset(key, tod) {
    const i = Math.min(Math.floor(tod), TOD.length - 2), f = tod - i;
    const a = TOD[i][key], b = TOD[i + 1][key];
    if (typeof a === "number") return lerp(a, b, f);
    return tmpA.set(a).lerp(tmpB.set(b), f).clone();
  }
  function setTimeOfDay(tod) {
    tod = clamp(tod, 0, 2);
    shared.uZenith.value.copy(mixPreset("zenith", tod));
    const horizon = mixPreset("horizon", tod);
    shared.uHorizon.value.copy(horizon);
    shared.uSunColor.value.copy(mixPreset("sun", tod));
    const el = THREE.MathUtils.degToRad(mixPreset("elev", tod)), az = mixPreset("az", tod);
    shared.uSunDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    sun.position.copy(shared.uSunDir.value).multiplyScalar(300).add(sun.target.position);
    sun.color.copy(shared.uSunColor.value);
    sun.intensity = mixPreset("sunI", tod);
    hemi.intensity = mixPreset("hemi", tod);
    scene.environmentIntensity = mixPreset("env", tod);
    scene.fog.color.copy(horizon);
    scene.fog.far = mixPreset("fogFar", tod);
    seaMat.uniforms.uFogFar.value = scene.fog.far;
    const lampI = mixPreset("lamps", tod);
    for (const L of lamps) L.intensity = lampI;
    lampMat.emissiveIntensity = 0.4 + lampI * 0.06;
    if (Math.abs(tod - envTod) > 0.06) {
      if (envRT) envRT.dispose();
      envRT = pmrem.fromScene(envScene, 0.02);
      scene.environment = envRT.texture;
      envTod = tod;
    }
  }

  /* ---- camera path ---- */
  const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.p)), false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.l)), false, "centripetal");
  function curveParam(p) {
    p = clamp(p, 0, 1);
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].t) i++;
    const local = (p - KEYS[i].t) / (KEYS[i + 1].t - KEYS[i].t);
    return (i + clamp(local, 0, 1)) / (KEYS.length - 1);
  }

  const state = { target: 0, current: 0, px: 0, py: 0, sx: 0, sy: 0, running: false, last: 0 };
  const look = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

  function placeCamera(p) {
    const u = curveParam(p);
    posCurve.getPoint(u, camera.position);
    lookCurve.getPoint(u, look);
    // a gentle drift that follows the pointer
    right.subVectors(look, camera.position).cross(up).normalize();
    const inside = p > 0.62 && p < 0.9 ? 0.25 : 1;
    camera.position.addScaledVector(right, state.sx * 1.2 * inside).addScaledVector(up, state.sy * 0.6 * inside);
    camera.lookAt(look);
    // golden hour arrives as you move through the house
    setTimeOfDay(smooth(0.7, 0.92, p));
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 62 : 45;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    if (!state.running) return;
    const dt = Math.min((now - state.last) / 1000 || 0.016, 0.1);
    state.last = now;
    shared.uTime.value += dt;
    const k = 1 - Math.exp(-dt * 3.2);
    state.current += (state.target - state.current) * k;
    state.sx += (state.px - state.sx) * k;
    state.sy += (state.py - state.sy) * k;
    placeCamera(state.current);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  /* ---- still images from fixed views (for listing cards and the gallery) ---- */
  function snapshot(viewName, w = 960, h = 640) {
    const v = VIEWS[viewName];
    if (!v) return null;
    const prevPos = camera.position.clone(), prevFov = camera.fov, prevAspect = camera.aspect;
    const size = renderer.getSize(new THREE.Vector2());
    const prevRatio = renderer.getPixelRatio();
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = 50; camera.updateProjectionMatrix();
    camera.position.set(...v.p);
    camera.lookAt(new THREE.Vector3(...v.l));
    setTimeOfDay(v.tod);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    const url = canvas.toDataURL("image/jpeg", 0.86);
    // put everything back exactly as it was
    renderer.setPixelRatio(prevRatio);
    renderer.setSize(size.x, size.y, false);
    camera.aspect = prevAspect; camera.fov = prevFov; camera.updateProjectionMatrix();
    camera.position.copy(prevPos);
    placeCamera(state.current);
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    return url;
  }

  resize();
  placeCamera(0);
  renderer.render(scene, camera);

  return {
    setProgress(p) { state.target = clamp(p, 0, 1); },
    jumpTo(p) { state.target = state.current = clamp(p, 0, 1); },
    setPointer(x, y) { state.px = x; state.py = y; },
    start() { if (state.running) return; state.running = true; state.last = performance.now(); requestAnimationFrame(frame); },
    stop() { state.running = false; },
    resize,
    snapshot,
  };
}
