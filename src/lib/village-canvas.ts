/**
 * Village Canvas Simulation Engine
 * Ported verbatim from the user-provided BhoomiSetu design HTML.
 * Preserves exact PRNG seeds, bezier wing curves, flying & resting bird behaviors,
 * pointer-fear physics, impasto passes, village life, and survey map generation.
 */

export interface MapInstance {
  id: string;
  host: HTMLElement;
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  mini?: HTMLCanvasElement | null;
  view: { x: number; y: number; w: number; h: number };
}

export interface VillageSimulationEngine {
  registerInstance: (
    id: string,
    host: HTMLElement,
    cv: HTMLCanvasElement,
    mini?: HTMLCanvasElement | null
  ) => () => void;
  setPointer: (x: number, y: number, on: boolean) => void;
  getSurveyMapDataUrl: () => string;
  drawSatThumbs: (canvasA: HTMLCanvasElement, canvasB: HTMLCanvasElement) => void;
  isReady: () => boolean;
  onReady: (cb: () => void) => () => void;
}

let engineInstance: VillageSimulationEngine | null = null;

export function getVillageSimulationEngine(): VillageSimulationEngine {
  if (engineInstance) return engineInstance;

  // PRNG
  function mulberry(seed: number) {
    let a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const VW = 600,
    VH = 560,
    K = 2.5,
    OX = 240,
    OY = 380,
    WW = 1080,
    WH = 980;

  const reduce =
    typeof window !== "undefined" &&
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const R = mulberry(20261018);
  function rnd(a: number, b: number) {
    return a + (b - a) * R();
  }
  function H(c: number[], a?: number) {
    return `hsla(${c[0].toFixed(1)},${c[1].toFixed(1)}%,${c[2].toFixed(1)}%,${a == null ? 1 : a})`;
  }
  function J(c: number[], dh: number, ds: number, dl: number) {
    return [c[0] + rnd(-dh, dh), c[1] + rnd(-ds, ds), c[2] + rnd(-dl, dl)];
  }
  function pip(p: number[], poly: number[][]) {
    const x = p[0],
      y = p[1];
    let ins = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1],
        xj = poly[j][0],
        yj = poly[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  function smooth(pts: number[][], closed: boolean, step?: number): number[][] {
    const out: number[][] = [];
    const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      let p0: number[];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      let p3: number[];
      if (closed) {
        p0 = pts[(i - 1 + n) % n];
        p3 = pts[(i + 2) % n];
      } else {
        p0 = pts[Math.max(i - 1, 0)];
        p3 = pts[Math.min(i + 2, n - 1)];
      }
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const m = Math.max(2, Math.ceil(d / (step || 3)));
      for (let k = 0; k < m; k++) {
        const t = k / m,
          t2 = t * t,
          t3 = t2 * t;
        out.push([
          0.5 *
            (2 * p1[0] +
              (-p0[0] + p2[0]) * t +
              (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
              (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 *
            (2 * p1[1] +
              (-p0[1] + p2[1]) * t +
              (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
              (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function toPath(pts: number[][]) {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    return p;
  }
  function minD(p: number[], pts: number[][]) {
    let m = 1e9;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - p[0], pts[i][1] - p[1]);
      if (d < m) m = d;
    }
    return m;
  }
  function cent(q: number[][]): [number, number] {
    let x = 0,
      y = 0;
    q.forEach(function (p) {
      x += p[0];
      y += p[1];
    });
    return [x / q.length, y / q.length];
  }
  function lerp(a: number[], b: number[], t: number): [number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  // Offscreen painting canvas
  let painting: HTMLCanvasElement;
  let P: CanvasRenderingContext2D;
  if (typeof document !== "undefined") {
    painting = document.createElement("canvas");
    painting.width = WW * K;
    painting.height = WH * K;
    P = painting.getContext("2d")!;
  }

  function TR(x: number, y: number, a: number) {
    if (!P) return;
    const c = Math.cos(a) * K,
      s = Math.sin(a) * K;
    P.setTransform(c, s, -s, c, K * (x + OX), K * (y + OY));
  }
  function I0() {
    if (!P) return;
    P.setTransform(K, 0, 0, K, K * OX, K * OY);
  }
  function dab(
    x: number,
    y: number,
    len: number,
    wid: number,
    ang: number,
    col: number[],
    a: number,
    br?: boolean
  ) {
    if (!P) return;
    TR(x, y, ang);
    P.globalAlpha = a;
    P.fillStyle = H(col);
    const l = len / 2;
    P.beginPath();
    P.moveTo(-l, 0);
    P.quadraticCurveTo(-l * 0.4, -wid * 0.62, l * 0.72, -wid * 0.42);
    P.quadraticCurveTo(l * 1.02, 0, l * 0.72, wid * 0.4);
    P.quadraticCurveTo(-l * 0.4, wid * 0.62, -l, 0);
    P.fill();
    if (br !== false && len > 5) {
      P.globalAlpha = a * 0.45;
      P.strokeStyle = H([col[0], col[1], col[2] + (R() < 0.5 ? -10 : 9)]);
      P.lineWidth = Math.max(0.2, wid * 0.13);
      P.beginPath();
      for (let i = 0; i < 3; i++) {
        const yy = (R() - 0.5) * wid * 0.75;
        P.moveTo(-l * 0.85, yy);
        P.lineTo(l * 0.65, yy * 0.7);
      }
      P.stroke();
    }
  }

  // Geometry
  const HIST = [
    [168, 150],
    [408, 110],
    [476, 300],
    [458, 418],
    [232, 452],
    [150, 300],
  ];
  const lakeP = smooth(
    [
      [-300, 50],
      [-210, 62],
      [-130, 108],
      [-40, 140],
      [30, 148],
      [86, 176],
      [116, 236],
      [106, 300],
      [126, 364],
      [172, 424],
      [238, 462],
      [318, 490],
      [398, 512],
      [468, 546],
      [520, 650],
      [-300, 650],
    ],
    true,
    3
  );
  const pondP = (function () {
    const a: number[][] = [],
      cx = 528,
      cy = 332;
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2,
        r = 1 + rnd(-0.12, 0.12),
        x = Math.cos(t) * 50 * r,
        y = Math.sin(t) * 30 * r,
        ro = -0.3;
      a.push([
        cx + x * Math.cos(ro) - y * Math.sin(ro),
        cy + x * Math.sin(ro) + y * Math.cos(ro),
      ]);
    }
    return smooth(a, true, 3);
  })();
  const islandP = smooth(
    [
      [36, 398],
      [62, 390],
      [80, 406],
      [72, 428],
      [46, 433],
      [30, 418],
    ],
    true,
    2
  );
  const island2P = smooth(
    [
      [-190, 300],
      [-140, 286],
      [-104, 312],
      [-112, 356],
      [-160, 372],
      [-200, 346],
    ],
    true,
    3
  );
  const pond2P = (function () {
    const a: number[][] = [],
      cx = 742,
      cy = 468;
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2,
        r = 1 + rnd(-0.12, 0.12),
        x = Math.cos(t) * 62 * r,
        y = Math.sin(t) * 36 * r,
        ro = 0.25;
      a.push([
        cx + x * Math.cos(ro) - y * Math.sin(ro),
        cy + x * Math.sin(ro) + y * Math.cos(ro),
      ]);
    }
    return smooth(a, true, 3);
  })();
  const topP = smooth(
    [
      [-320, -420],
      [920, -420],
      [920, -70],
      [820, -40],
      [720, -60],
      [640, -20],
      [560, -30],
      [470, -5],
      [380, -25],
      [300, 5],
      [210, -5],
      [130, 25],
      [40, 15],
      [-60, 45],
      [-160, 40],
      [-320, 62],
    ],
    true,
    3
  );
  const topPath = toPath(topP);
  const lakePath = toPath(lakeP),
    pondPath = toPath(pondP),
    pond2Path = toPath(pond2P),
    islandPath = toPath(islandP),
    island2Path = toPath(island2P);
  const waterPath = new Path2D();
  waterPath.addPath(lakePath);
  waterPath.addPath(pondPath);
  waterPath.addPath(pond2Path);
  waterPath.addPath(topPath);

  function isIsland(p: number[]) {
    return pip(p, islandP) || pip(p, island2P);
  }
  function inWaterExact(p: number[]) {
    return (
      (pip(p, lakeP) && !isIsland(p)) ||
      pip(p, pondP) ||
      pip(p, pond2P) ||
      pip(p, topP)
    );
  }

  let wmask: Uint8Array | null = null;
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = WW;
    c.height = WH;
    const x = c.getContext("2d")!;
    x.translate(OX, OY);
    x.fillStyle = "#000";
    x.fill(lakePath);
    x.fill(pondPath);
    x.fill(pond2Path);
    x.fill(topPath);
    x.globalCompositeOperation = "destination-out";
    x.fill(islandPath);
    x.fill(island2Path);
    const d = x.getImageData(0, 0, WW, WH).data;
    wmask = new Uint8Array(WW * WH);
    for (let i = 0; i < wmask.length; i++) wmask[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  }

  function inWater(p: number[]) {
    const x = Math.round(p[0] + OX),
      y = Math.round(p[1] + OY);
    if (!wmask || x < 0 || y < 0 || x >= WW || y >= WH) return inWaterExact(p);
    return wmask[y * WW + x] === 1;
  }
  function shoreD(p: number[]) {
    return Math.min(minD(p, lakeP), minD(p, pondP), minD(p, pond2P), minD(p, topP));
  }
  const road1 = smooth(
    [
      [900, 226],
      [760, 236],
      [640, 248],
      [560, 268],
      [492, 258],
      [478, 200],
      [440, 140],
      [370, 98],
      [262, 86],
      [160, 94],
      [60, 118],
      [-40, 132],
    ],
    false,
    2
  );
  const road2 = smooth(
    [
      [560, 268],
      [598, 330],
      [566, 420],
      [520, 472],
      [476, 522],
      [456, 600],
    ],
    false,
    2
  );
  function nearRoad(p: number[], d: number) {
    return minD(p, road1) < d || minD(p, road2) < d;
  }

  // Fields patchwork
  const g = -0.42,
    cg = Math.cos(g),
    sg = Math.sin(g),
    verts: Record<string, [number, number]> = {},
    fields: number[][][] = [];
  function V(i: number, j: number): [number, number] {
    const k = i + "," + j;
    if (!verts[k]) verts[k] = [i * 62 + rnd(-15, 15), j * 48 + rnd(-13, 13)];
    const u = verts[k];
    return [300 + u[0] * cg - u[1] * sg, 280 + u[0] * sg + u[1] * cg];
  }
  for (let fi = -12; fi <= 12; fi++) {
    for (let fj = -14; fj <= 14; fj++) {
      const q = [V(fi, fj), V(fi + 1, fj), V(fi + 1, fj + 1), V(fi, fj + 1)];
      const c = cent(q);
      if (
        c[0] < -OX - 50 ||
        c[0] > WW - OX + 50 ||
        c[1] < -OY - 50 ||
        c[1] > WH - OY + 50
      )
        continue;
      if (R() < 0.35) {
        const m1 = lerp(q[0], q[1], 0.5 + rnd(-0.15, 0.15));
        const m2 = lerp(q[3], q[2], 0.5 + rnd(-0.15, 0.15));
        fields.push([q[0], m1, m2, q[3]], [m1, q[1], q[2], m2]);
      } else {
        fields.push(q);
      }
    }
  }

  type FieldType = [string, number, number[]];
  const FT: FieldType[] = [
    ["paddy", 0.3, [94, 52, 39]],
    ["young", 0.14, [82, 62, 49]],
    ["mustard", 0.12, [50, 84, 56]],
    ["wheat", 0.13, [42, 62, 60]],
    ["fallow", 0.12, [27, 36, 46]],
    ["cane", 0.08, [106, 44, 28]],
    ["veg", 0.11, [96, 44, 41]],
  ];
  function pickType(): FieldType {
    const r = R();
    let a = 0;
    for (let i = 0; i < FT.length; i++) {
      a += FT[i][1];
      if (r < a) return FT[i];
    }
    return FT[0];
  }

  function lines(
    c: [number, number],
    dir: number,
    rad: number,
    gap: number,
    col: number[],
    a: number,
    w: number
  ) {
    if (!P) return;
    const dx = Math.cos(dir),
      dy = Math.sin(dir),
      px = -dy,
      py = dx;
    I0();
    P.globalAlpha = a;
    P.strokeStyle = H(col);
    P.lineWidth = w;
    P.beginPath();
    for (let o = -rad; o < rad; o += gap) {
      const j = rnd(-0.4, 0.4);
      P.moveTo(c[0] + px * o - dx * rad, c[1] + py * o - dy * rad + j);
      P.lineTo(c[0] + px * o + dx * rad, c[1] + py * o + dy * rad - j);
    }
    P.stroke();
  }

  function paintField(q: number[][]) {
    if (!P) return;
    const t = pickType(),
      base = J(t[2], 4, 5, 5),
      c = cent(q);
    let ins = q.map(function (p) {
      const dx = p[0] - c[0],
        dy = p[1] - c[1],
        d = Math.hypot(dx, dy),
        f = Math.max(0, (d - 2.6) / d);
      return [c[0] + dx * f, c[1] + dy * f];
    });
    ins = (function (pts) {
      const o: number[][] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i],
          b = pts[(i + 1) % pts.length],
          ex = b[0] - a[0],
          ey = b[1] - a[1],
          el = Math.hypot(ex, ey) || 1;
        o.push(a);
        for (let tt = 0.25; tt < 1; tt += 0.25)
          o.push([
            a[0] + ex * tt - (ey / el) * rnd(-1.5, 1.5),
            a[1] + ey * tt + (ex / el) * rnd(-1.5, 1.5),
          ]);
      }
      return o;
    })(ins);

    const path = toPath(ins);
    const xs = ins.map((p) => p[0]),
      ys = ins.map((p) => p[1]);
    const x0 = Math.min.apply(0, xs),
      x1 = Math.max.apply(0, xs),
      y0 = Math.min.apply(0, ys),
      y1 = Math.max.apply(0, ys),
      rad = Math.max(x1 - x0, y1 - y0);
    const fa = g + (R() < 0.5 ? 0 : Math.PI / 2) + rnd(-0.05, 0.05);

    P.save();
    I0();
    P.clip(path);
    P.globalAlpha = 1;
    P.fillStyle = H(base);
    P.fill(path);

    dab(
      x0 + (x1 - x0) * 0.3,
      y0 + (y1 - y0) * 0.3,
      rad * 0.9,
      rad * 0.5,
      fa,
      [base[0] - 3, base[1], base[2] + 7],
      0.35,
      false
    );
    dab(
      x0 + (x1 - x0) * 0.75,
      y0 + (y1 - y0) * 0.75,
      rad * 0.8,
      rad * 0.45,
      fa,
      [base[0] + 3, base[1], base[2] - 7],
      0.3,
      false
    );
    const n = Math.min(170, ((x1 - x0) * (y1 - y0)) / 20);
    for (let k = 0; k < n; k++) {
      dab(
        rnd(x0, x1),
        rnd(y0, y1),
        rnd(6, 13),
        rnd(1.3, 2.4),
        fa + rnd(-0.12, 0.12),
        J(base, 4, 6, 8),
        rnd(0.5, 0.85)
      );
    }
    if (t[0] === "paddy" || t[0] === "young")
      lines(c, fa, rad, 3.2, [base[0], base[1], base[2] - 12], 0.22, 0.5);
    if (t[0] === "fallow") {
      lines(c, fa, rad, 2.6, [26, 30, 36], 0.35, 0.6);
      for (let k = 0; k < 25; k++)
        dab(rnd(x0, x1), rnd(y0, y1), rnd(2, 4), rnd(1, 1.6), fa, [34, 30, 60], 0.5, false);
    }
    if (t[0] === "veg") {
      lines(c, fa, rad, 5.5, [78, 46, 34], 0.55, 2.6);
      lines(c, fa, rad, 5.5, [96, 50, 52], 0.25, 0.6);
    }
    if (t[0] === "mustard") {
      for (let k = 0; k < n * 0.9; k++)
        dab(
          rnd(x0, x1),
          rnd(y0, y1),
          rnd(1.5, 3),
          rnd(1, 1.8),
          rnd(0, 3),
          R() < 0.85 ? J([54, 92, 63], 3, 5, 6) : [90, 45, 40],
          rnd(0.6, 0.95),
          false
        );
    }
    if (t[0] === "wheat") {
      for (let k = 0; k < n * 0.5; k++)
        dab(
          rnd(x0, x1),
          rnd(y0, y1),
          rnd(5, 9),
          rnd(0.8, 1.4),
          fa + rnd(-0.2, 0.2),
          J([46, 70, 76], 3, 5, 5),
          rnd(0.4, 0.7)
        );
    }
    if (t[0] === "cane") {
      for (let k = 0; k < n * 0.6; k++)
        dab(
          rnd(x0, x1),
          rnd(y0, y1),
          rnd(4, 8),
          rnd(1, 1.8),
          rnd(0, 3.14),
          J([118, 40, 22], 5, 5, 5),
          rnd(0.5, 0.8)
        );
    }
    P.restore();

    for (let k = 0; k < 6; k++) {
      const a = q[k % 4],
        b = q[(k + 1) % 4],
        p = lerp(a, b, R());
      dab(
        p[0],
        p[1],
        rnd(3, 6),
        rnd(0.8, 1.4),
        Math.atan2(b[1] - a[1], b[0] - a[0]),
        J([84, 26, 44], 5, 5, 6),
        0.55,
        false
      );
    }
  }

  // Village placement
  interface Hut {
    x: number;
    y: number;
    w: number;
    d: number;
    a: number;
    type: "tile" | "thatch" | "flat";
    court: boolean;
  }
  const huts: Hut[] = [];
  interface Tree {
    x: number;
    y: number;
    r: number;
    c: number[];
  }
  const trees: Tree[] = [];
  const palms: number[][] = [];
  const cows: [number, number, number, boolean][] = [];
  const stacks: [number, number, number][] = [];

  function freeFromHuts(p: number[], r: number) {
    for (let i = 0; i < huts.length; i++)
      if (Math.hypot(huts[i].x - p[0], huts[i].y - p[1]) < huts[i].w * 0.65 + r) return false;
    return true;
  }

  [
    [150, 30, 430, 76, 9],
    [480, 128, 610, 215, 7],
    [455, 360, 610, 560, 14],
    [-10, 40, 100, 135, 5],
    [610, 150, 840, 224, 10],
    [620, 300, 840, 600, 13],
    [-230, -30, -60, 45, 7],
    [-235, -35, 40, 30, 5],
  ].forEach(function (rg) {
    let placed = 0;
    for (let tr = 0; tr < 400 && placed < rg[4]; tr++) {
      const p = [rnd(rg[0], rg[2]), rnd(rg[1], rg[3])];
      if (
        inWater(p) ||
        pip(p, HIST) ||
        minD(p, pondP) < 14 ||
        nearRoad(p, 9) ||
        !freeFromHuts(p, 10)
      )
        continue;
      const r = R();
      huts.push({
        x: p[0],
        y: p[1],
        w: rnd(12, 18),
        d: rnd(9, 12),
        a: -0.42 + rnd(-0.2, 0.2),
        type: r < 0.55 ? "tile" : r < 0.85 ? "thatch" : "flat",
        court: R() < 0.5,
      });
      placed++;
      if (R() < 0.35) stacks.push([p[0] + rnd(-14, 14), p[1] + rnd(10, 16), rnd(3, 4.5)]);
    }
  });

  function okTree(p: number[], r: number) {
    if (inWater(p) || pip(p, HIST) || !freeFromHuts(p, r * 0.5)) return false;
    for (let i = 0; i < trees.length; i++)
      if (Math.hypot(trees[i].x - p[0], trees[i].y - p[1]) < (trees[i].r + r) * 0.72)
        return false;
    return true;
  }

  trees.push({ x: 300, y: 62, r: 25, c: [104, 42, 30] });
  trees.push({ x: 575, y: 250, r: 14, c: [110, 46, 28] });
  trees.push({ x: 690, y: 120, r: 22, c: [104, 46, 30] });
  trees.push({ x: -90, y: 10, r: 20, c: [106, 46, 30] });

  for (let tr = 0, cnt = 0; tr < 6000 && cnt < 140; tr++) {
    const p = [rnd(-OX, WW - OX), rnd(-OY, WH - OY)],
      r = rnd(6, 11);
    if (shoreD(p) < 17 && okTree(p, r)) {
      trees.push({ x: p[0], y: p[1], r: r, c: J([108, 40, 30], 8, 6, 5) });
      cnt++;
    }
  }

  [
    [150, 30, 430, 80],
    [480, 120, 610, 220],
    [455, 360, 610, 560],
    [-10, 30, 110, 140],
    [610, 140, 840, 230],
    [620, 290, 840, 600],
    [-235, -35, 40, 50],
  ].forEach(function (rg) {
    for (let tr = 0, cnt = 0; tr < 300 && cnt < 6; tr++) {
      const p = [rnd(rg[0], rg[2]), rnd(rg[1], rg[3])],
        r = rnd(6, 12);
      if (!nearRoad(p, 4) && okTree(p, r)) {
        trees.push({ x: p[0], y: p[1], r: r, c: J([104, 42, 32], 8, 6, 5) });
        cnt++;
      }
    }
  });

  for (let tr = 0, cnt = 0; tr < 1500 && cnt < 34; tr++) {
    const p2 = [rnd(-OX, WW - OX), rnd(-OY, WH - OY)],
      r2 = rnd(5, 8);
    if (!nearRoad(p2, 5) && okTree(p2, r2)) {
      trees.push({ x: p2[0], y: p2[1], r: r2, c: J([100, 40, 32], 8, 6, 5) });
      cnt++;
    }
  }

  [
    [42, 412, 7],
    [60, 404, 5],
    [55, 424, 6],
    [-160, 318, 9],
    [-135, 340, 8],
    [-175, 345, 7],
    [-128, 305, 6],
  ].forEach(function (t) {
    trees.push({ x: t[0], y: t[1], r: t[2], c: [112, 40, 28] });
  });

  trees.sort((a, b) => a.y - b.y);

  for (let tr = 0, cnt = 0; tr < 3000 && cnt < 34; tr++) {
    const p3 = [rnd(-OX, WW - OX), rnd(-OY, WH - OY)];
    const near = shoreD(p3) < 22 || minD(p3, road1) < 12;
    if (near && !inWater(p3) && !pip(p3, HIST) && !nearRoad(p3, 4) && freeFromHuts(p3, 5)) {
      palms.push(p3);
      cnt++;
    }
  }

  for (let tr = 0, cnt = 0; tr < 700 && cnt < 12; tr++) {
    const p4 = [rnd(440, 840), rnd(220, 600)];
    if (!inWater(p4) && !pip(p4, HIST) && freeFromHuts(p4, 6)) {
      cows.push([p4[0], p4[1], rnd(0, 6.28), R() < 0.6]);
      cnt++;
    }
  }

  function paintRoad(pts: number[][], w: number, from: number, to: number) {
    for (let i = from; i < Math.min(to, pts.length); i++) {
      const p = pts[i],
        q = pts[Math.min(i + 1, pts.length - 1)],
        a = Math.atan2(q[1] - p[1], q[0] - p[0]),
        px = -Math.sin(a),
        py = Math.cos(a);
      dab(
        p[0] + rnd(-0.8, 0.8),
        p[1] + rnd(-0.8, 0.8),
        rnd(6, 10),
        w * rnd(0.85, 1.05),
        a + rnd(-0.1, 0.1),
        J([27, 30, 70], 3, 5, 5),
        rnd(0.6, 0.9),
        false
      );
      if (i % 2 === 0) {
        dab(p[0] + px * w * 0.22, p[1] + py * w * 0.22, rnd(4, 7), 0.8, a, [24, 26, 56], 0.35, false);
        dab(p[0] - px * w * 0.22, p[1] - py * w * 0.22, rnd(4, 7), 0.8, a, [24, 26, 56], 0.35, false);
      }
      if (i % 3 === 0) {
        const sd = R() < 0.5 ? 1 : -1;
        dab(
          p[0] + px * w * 0.55 * sd,
          p[1] + py * w * 0.55 * sd,
          rnd(3, 5),
          1,
          a + rnd(-0.5, 0.5),
          J([90, 38, 42], 6, 5, 6),
          0.6,
          false
        );
      }
    }
  }

  function paintWaterChunk(path: Path2D, poly: number[][], n: number) {
    if (!P) return;
    P.save();
    I0();
    P.clip(path);
    const xs = poly.map((p) => p[0]),
      ys = poly.map((p) => p[1]),
      x0 = Math.max(-OX, Math.min.apply(0, xs)),
      x1 = Math.min(WW - OX, Math.max.apply(0, xs)),
      y0 = Math.max(-OY, Math.min.apply(0, ys)),
      y1 = Math.min(WH - OY, Math.max.apply(0, ys));
    const pal = [
      [176, 46, 27],
      [172, 42, 33],
      [182, 40, 40],
      [168, 36, 30],
      [192, 32, 58],
      [178, 55, 19],
      [170, 38, 47],
    ];
    for (let k = 0; k < n; k++) {
      const col = pal[Math.floor(R() * pal.length)];
      dab(
        rnd(x0, x1),
        rnd(y0, y1),
        rnd(8, 20),
        rnd(1.2, 2.6),
        -0.12 + rnd(-0.08, 0.08),
        J(col, 3, 4, 4),
        col[2] > 50 ? rnd(0.15, 0.35) : rnd(0.35, 0.7)
      );
    }
    P.restore();
  }

  function paintWaterBase(path: Path2D, poly: number[][]) {
    if (!P) return;
    I0();
    P.lineJoin = "round";
    P.globalAlpha = 0.9;
    P.strokeStyle = H([34, 30, 62]);
    P.lineWidth = 10;
    P.stroke(path);
    P.globalAlpha = 0.7;
    P.strokeStyle = H([30, 26, 44]);
    P.lineWidth = 5.5;
    P.stroke(path);
    P.save();
    P.clip(path);
    const c = cent(poly),
      gr = P.createRadialGradient(c[0], c[1], 0, c[0], c[1], 260);
    gr.addColorStop(0, H([178, 50, 24]));
    gr.addColorStop(1, H([170, 40, 36]));
    P.globalAlpha = 1;
    P.fillStyle = gr;
    P.fillRect(-OX, -OY, WW, WH);
    P.restore();
  }

  function paintShore(path: Path2D, poly: number[][]) {
    if (!P) return;
    P.save();
    I0();
    P.clip(path);
    P.globalAlpha = 0.42;
    P.strokeStyle = H([125, 35, 16]);
    P.lineWidth = 14;
    P.stroke(path);
    P.globalAlpha = 0.5;
    P.lineWidth = 4;
    P.strokeStyle = H([120, 30, 12]);
    P.stroke(path);
    for (let k = 0; k < 40; k++) {
      const p = poly[Math.floor(R() * poly.length)];
      dab(
        p[0] + rnd(-12, 12),
        p[1] + rnd(-6, 12),
        rnd(25, 45),
        rnd(4, 8),
        -0.12,
        [196, 40, 74],
        rnd(0.08, 0.18),
        false
      );
    }
    P.restore();
    for (let k = 0; k < 260; k++) {
      const p2 = [rnd(-OX, WW - OX), rnd(-OY, WH - OY)];
      if (!pip(p2, poly) || isIsland(p2)) continue;
      if (minD(p2, poly) < 13) {
        dab(
          p2[0],
          p2[1],
          rnd(2.5, 4),
          rnd(2, 3.2),
          rnd(0, 3),
          J([100, 42, 36], 5, 5, 5),
          0.85,
          false
        );
        if (R() < 0.35)
          dab(p2[0] + rnd(-1, 1), p2[1] + rnd(-1, 1), 1.6, 1.4, rnd(0, 3), [335, 65, 78], 0.95, false);
      }
    }
  }

  function paintHut(h: Hut) {
    if (!P) return;
    const w = h.w,
      d = h.d;
    TR(h.x + 2.4, h.y + 2.6, h.a);
    P.globalAlpha = 0.32;
    P.fillStyle = "#1f2a17";
    P.fillRect(-w / 2, -d / 2, w, d);
    TR(h.x, h.y, h.a);
    if (h.court) {
      P.globalAlpha = 0.92;
      P.fillStyle = H([36, 34, 76]);
      P.fillRect(-w / 2, d / 2, w * 0.8, d * 0.75);
      P.fillStyle = H([110, 40, 34]);
      P.beginPath();
      P.arc(-w * 0.1, d * 0.9, 1.1, 0, 7);
      P.fill();
    }
    let A: number[], B: number[];
    if (h.type === "tile") {
      A = J([14, 54, 48], 3, 4, 3);
      B = [A[0] - 2, A[1], A[2] - 12];
    } else if (h.type === "thatch") {
      A = J([42, 52, 58], 3, 4, 3);
      B = [A[0] - 3, A[1], A[2] - 13];
    } else {
      A = J([205, 28, 82], 4, 4, 3);
      B = [A[0], A[1], A[2] - 8];
    }
    P.globalAlpha = 1;
    P.fillStyle = H(A);
    P.fillRect(-w / 2, -d / 2, w, d / 2);
    P.fillStyle = H(B);
    P.fillRect(-w / 2, 0, w, d / 2);
    P.lineWidth = 0.35;
    P.globalAlpha = 0.4;
    P.strokeStyle = H([A[0], A[1], A[2] - 18]);
    P.beginPath();
    if (h.type === "tile") {
      for (let x = -w / 2 + 1; x < w / 2; x += 1.3) {
        P.moveTo(x, -d / 2);
        P.lineTo(x, d / 2);
      }
      P.moveTo(-w / 2, -d / 4);
      P.lineTo(w / 2, -d / 4);
      P.moveTo(-w / 2, d / 4);
      P.lineTo(w / 2, d / 4);
    } else if (h.type === "thatch") {
      for (let k = 0; k < w * 3; k++) {
        const xx = rnd(-w / 2, w / 2),
          yy = rnd(-d / 2, d / 2);
        P.moveTo(xx, yy);
        P.lineTo(xx + rnd(-0.3, 0.3), yy + (yy < 0 ? 1.6 : -1.6));
      }
    } else {
      P.rect(-w / 2 + 0.8, -d / 2 + 0.8, w - 1.6, d - 1.6);
    }
    P.stroke();
    if (h.type !== "flat") {
      P.globalAlpha = 0.8;
      P.strokeStyle = H([A[0], A[1], A[2] + 14]);
      P.lineWidth = 0.8;
      P.beginPath();
      P.moveTo(-w / 2, 0);
      P.lineTo(w / 2, 0);
      P.stroke();
    }
    P.globalAlpha = 0.5;
    P.strokeStyle = "#2a1d14";
    P.lineWidth = 0.4;
    P.strokeRect(-w / 2, -d / 2, w, d);
  }

  function paintTree(t: Tree) {
    if (!P) return;
    const x = t.x,
      y = t.y,
      r = t.r,
      b = t.c;
    for (let k = 0; k < 6; k++)
      dab(
        x + r * 0.55 + rnd(-r * 0.3, r * 0.3),
        y + r * 0.5 + rnd(-r * 0.3, r * 0.3),
        r * 1.1,
        r * 0.75,
        rnd(0, 3),
        [100, 30, 12],
        0.17,
        false
      );
    const n = Math.round(10 + r * r * 0.45);
    for (let k = 0; k < n * 0.55; k++) {
      const a = rnd(0, 6.283),
        dd = Math.sqrt(R()) * r;
      dab(
        x + Math.cos(a) * dd,
        y + Math.sin(a) * dd * 0.92,
        r * rnd(0.4, 0.6),
        r * rnd(0.25, 0.38),
        rnd(0, 3.14),
        J([b[0], b[1], b[2] - 8], 5, 5, 4),
        rnd(0.75, 0.95),
        r > 8
      );
    }
    for (let k = 0; k < n * 0.4; k++) {
      const a = rnd(0, 6.283),
        dd = Math.sqrt(R()) * r * 0.85,
        px = x + Math.cos(a) * dd - r * 0.12,
        py = y + Math.sin(a) * dd * 0.92 - r * 0.12;
      if (px - x + (py - y) > r * 0.4) continue;
      dab(
        px,
        py,
        r * rnd(0.3, 0.45),
        r * rnd(0.2, 0.3),
        rnd(0, 3.14),
        J(b, 5, 5, 4),
        rnd(0.75, 0.95),
        r > 8
      );
    }
    for (let k = 0; k < n * 0.22; k++) {
      const a = rnd(0, 6.283),
        dd = Math.sqrt(R()) * r * 0.7,
        px = x + Math.cos(a) * dd - r * 0.28,
        py = y + Math.sin(a) * dd * 0.9 - r * 0.28;
      if (px - x + (py - y) > 0) continue;
      dab(
        px,
        py,
        r * rnd(0.2, 0.32),
        r * rnd(0.13, 0.2),
        rnd(0, 3.14),
        J([b[0] - 10, b[1] + 8, b[2] + 13], 4, 5, 5),
        rnd(0.7, 0.95),
        false
      );
    }
  }

  function paintPalmShadow(p: number[]) {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * 6.283 + rnd(-0.2, 0.2),
        len = rnd(9, 12);
      dab(
        p[0] + 3 + Math.cos(a) * len * 0.5,
        p[1] + 3 + Math.sin(a) * len * 0.5,
        len,
        2.2,
        a,
        [100, 30, 12],
        0.18,
        false
      );
    }
  }

  function paintPalm(p: number[]) {
    const f = 9;
    for (let k = 0; k < f; k++) {
      const a = (k / f) * 6.283 + rnd(-0.2, 0.2),
        len = rnd(9, 12),
        col = J([96, 48, 31], 6, 6, 6),
        dx = Math.cos(a),
        dy = Math.sin(a);
      for (let s = 0.12; s <= 1; s += 0.13) {
        const px = p[0] + dx * len * s - dy * Math.sin(s * 3.14) * 1.4,
          py = p[1] + dy * len * s + dx * Math.sin(s * 3.14) * 1.4,
          ll = 3.2 * (1 - s * 0.5);
        dab(px, py, ll, 0.7, a + 1.1, [col[0], col[1], col[2] + (1 - s) * 10], 0.9, false);
        dab(px, py, ll, 0.7, a - 1.1, [col[0], col[1], col[2] + (1 - s) * 4], 0.9, false);
      }
    }
    dab(p[0], p[1], 2.2, 2, 0, [30, 40, 30], 0.9, false);
  }

  // Paint operations
  const ops: (() => void)[] = [];
  ops.push(function () {
    I0();
    P.globalAlpha = 1;
    P.fillStyle = H([38, 30, 57]);
    P.fillRect(-OX, -OY, WW, WH);
  });
  for (let oc = 0; oc < 20; oc++) {
    ops.push(function () {
      for (let k = 0; k < 300; k++)
        dab(
          rnd(-OX, WW - OX),
          rnd(-OY, WH - OY),
          rnd(4, 9),
          rnd(1, 2),
          rnd(0, 3.14),
          J([40, 28, 56], 8, 8, 8),
          rnd(0.4, 0.8)
        );
    });
  }

  fields
    .map(function (q) {
      const c = cent(q);
      return { q: q, k: c[0] + c[1] + rnd(-160, 160) };
    })
    .sort((a, b) => a.k - b.k)
    .forEach(function (f) {
      ops.push(function () {
        paintField(f.q);
      });
    });

  ops.push(function () {
    for (let k = 0; k < 180; k++) {
      const warm = R() < 0.5;
      dab(
        rnd(-OX, WW - OX),
        rnd(-OY, WH - OY),
        rnd(120, 240),
        rnd(60, 130),
        rnd(-0.8, 0.2),
        warm ? [44, 45, 72] : [150, 20, 22],
        rnd(0.05, 0.1),
        false
      );
    }
  });

  [road1, road2].forEach(function (rd) {
    for (let s = 0; s < rd.length; s += 50) {
      (function (start) {
        ops.push(function () {
          paintRoad(rd, 7, start, start + 50);
        });
      })(s);
    }
  });

  ops.push(function () {
    paintWaterBase(lakePath, lakeP);
  });
  for (let oc = 0; oc < 26; oc++)
    ops.push(function () {
      paintWaterChunk(lakePath, lakeP, 140);
    });
  ops.push(function () {
    paintShore(lakePath, lakeP);
  });

  [
    [islandPath, islandP],
    [island2Path, island2P],
  ].forEach(function (il) {
    ops.push(function () {
      const poly = il[1] as number[][],
        xs = poly.map((p) => p[0]),
        ys = poly.map((p) => p[1]),
        x0 = Math.min.apply(0, xs),
        x1 = Math.max.apply(0, xs),
        y0 = Math.min.apply(0, ys),
        y1 = Math.max.apply(0, ys);
      I0();
      P.globalAlpha = 0.9;
      P.strokeStyle = H([34, 30, 62]);
      P.lineWidth = 5;
      P.stroke(il[0] as Path2D);
      P.save();
      P.clip(il[0] as Path2D);
      P.fillStyle = H([86, 46, 40]);
      P.globalAlpha = 1;
      P.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let k = 0; k < ((x1 - x0) * (y1 - y0)) / 25; k++)
        dab(rnd(x0, x1), rnd(y0, y1), rnd(4, 8), rnd(1, 2), rnd(0, 3), J([88, 46, 40], 6, 6, 6), 0.7);
      P.restore();
    });
  });

  ops.push(function () {
    paintWaterBase(pondPath, pondP);
  });
  for (let oc = 0; oc < 4; oc++)
    ops.push(function () {
      paintWaterChunk(pondPath, pondP, 90);
    });
  ops.push(function () {
    paintShore(pondPath, pondP);
  });

  ops.push(function () {
    paintWaterBase(topPath, topP);
  });
  for (let oc = 0; oc < 26; oc++)
    ops.push(function () {
      paintWaterChunk(topPath, topP, 150);
    });
  ops.push(function () {
    paintShore(topPath, topP);
  });

  ops.push(function () {
    paintWaterBase(pond2Path, pond2P);
  });
  for (let oc = 0; oc < 5; oc++)
    ops.push(function () {
      paintWaterChunk(pond2Path, pond2P, 100);
    });
  ops.push(function () {
    paintShore(pond2Path, pond2P);
  });

  // Ghat steps and shrine
  ops.push(function () {
    for (let i = 0; i < 4; i++) {
      TR(512 - i * 0 + 1.2 * i, 363 + i * 3.2, -0.3);
      P.globalAlpha = 0.95;
      P.fillStyle = H([36, 14, i % 2 ? 74 : 82]);
      P.fillRect(-15, -1.6, 30, 3.2);
    }
    TR(524, 387, -0.3);
    P.globalAlpha = 0.3;
    P.fillStyle = "#1f2a17";
    P.fillRect(-4, -4, 13, 13);
    TR(522, 385, -0.3);
    P.globalAlpha = 1;
    P.fillStyle = H([40, 30, 92]);
    P.fillRect(-6, -6, 12, 12);
    P.fillStyle = H([26, 88, 55]);
    P.beginPath();
    P.arc(0, 0, 3.6, 0, 7);
    P.fill();
    P.strokeStyle = "#5a3a1a";
    P.lineWidth = 0.5;
    P.beginPath();
    P.moveTo(5, -5);
    P.lineTo(5, -14);
    P.stroke();
    P.fillStyle = H([28, 92, 56]);
    P.beginPath();
    P.moveTo(5, -14);
    P.lineTo(10, -12);
    P.lineTo(5, -10);
    P.fill();
  });

  for (let hi = 0; hi < huts.length; hi += 3) {
    (function (start) {
      ops.push(function () {
        for (let k = start; k < Math.min(start + 3, huts.length); k++) paintHut(huts[k]);
      });
    })(hi);
  }

  ops.push(function () {
    stacks.forEach(function (s) {
      dab(s[0] + 2, s[1] + 2, s[2] * 2.2, s[2] * 2, 0, [90, 30, 14], 0.3, false);
      dab(s[0], s[1], s[2] * 2, s[2] * 2, 0, [44, 58, 60], 1, false);
      I0();
      P.globalAlpha = 0.4;
      P.strokeStyle = H([38, 50, 40]);
      P.lineWidth = 0.4;
      P.beginPath();
      P.arc(s[0], s[1], s[2] * 0.6, 0, 5);
      P.stroke();
    });
    cows.forEach(function (c) {
      dab(c[0] + 1.2, c[1] + 1.2, 5, 2.8, c[2], [90, 30, 14], 0.3, false);
      dab(c[0], c[1], 5, 2.6, c[2], c[3] ? [40, 15, 92] : [24, 40, 40], 1, false);
      dab(
        c[0] + Math.cos(c[2]) * 3,
        c[1] + Math.sin(c[2]) * 3,
        1.8,
        1.5,
        c[2],
        c[3] ? [40, 10, 85] : [22, 40, 32],
        1,
        false
      );
    });
  });

  for (let ti = 0; ti < trees.length; ti += 3) {
    (function (start) {
      ops.push(function () {
        for (let k = start; k < Math.min(start + 3, trees.length); k++) paintTree(trees[k]);
      });
    })(ti);
  }

  interface PalmSprite {
    x: number;
    y: number;
    c: HTMLCanvasElement;
    ph: number;
  }
  const palmSprites: PalmSprite[] = [];

  for (let pi = 0; pi < palms.length; pi += 4) {
    (function (start) {
      ops.push(function () {
        for (let k = start; k < Math.min(start + 4, palms.length); k++) {
          const pp = palms[k];
          paintPalmShadow(pp);
          const sc = document.createElement("canvas");
          sc.width = sc.height = Math.ceil(36 * K);
          const sP = P,
            sx = OX,
            sy = OY;
          P = sc.getContext("2d")!;
          const tempOX = 18 - pp[0];
          const tempOY = 18 - pp[1];
          // temporarily offset
          TR(pp[0] + tempOX - 18, pp[1] + tempOY - 18, 0);
          paintPalm(pp);
          P = sP;
          palmSprites.push({ x: pp[0], y: pp[1], c: sc, ph: rnd(0, 6.28) });
        }
      });
    })(pi);
  }

  // Impasto passes
  let snap: Uint8ClampedArray | null = null;
  function impasto(
    chunks: number,
    per: number,
    lmin: number,
    lmax: number,
    wmin: number,
    wmax: number,
    amin: number,
    amax: number
  ) {
    ops.push(function () {
      snap = P.getImageData(0, 0, painting.width, painting.height).data;
    });
    for (let ic = 0; ic < chunks; ic++) {
      ops.push(function () {
        if (!snap) return;
        const W = painting.width,
          Hh = painting.height;
        for (let k = 0; k < per; k++) {
          const x = rnd(-OX, WW - OX),
            y = rnd(-OY, WH - OY),
            px = Math.min(W - 1, Math.max(0, Math.round((x + OX) * K))),
            py = Math.min(Hh - 1, Math.max(0, Math.round((y + OY) * K))),
            o = (py * W + px) * 4,
            v = rnd(-16, 16);
          const wet = inWater([x, y]),
            ang = wet
              ? -0.12 + rnd(-0.05, 0.05)
              : g + Math.sin(x * 0.031) * 0.45 + Math.cos(y * 0.027) * 0.45 + rnd(-0.3, 0.3);
          TR(x, y, ang);
          P.globalAlpha = rnd(amin, amax);
          P.fillStyle = `rgb(${Math.round(snap[o] + v)},${Math.round(snap[o + 1] + v)},${Math.round(
            snap[o + 2] + v * 0.8
          )})`;
          const l = (rnd(lmin, lmax) * (wet ? 1.8 : 1)) / 2,
            w = rnd(wmin, wmax) * (wet ? 0.8 : 1);
          P.beginPath();
          P.moveTo(-l, 0);
          P.quadraticCurveTo(-l * 0.4, -w * 0.62, l * 0.72, -w * 0.42);
          P.quadraticCurveTo(l * 1.02, 0, l * 0.72, w * 0.4);
          P.quadraticCurveTo(-l * 0.4, w * 0.62, -l, 0);
          P.fill();
          if (l > 3) {
            P.globalAlpha *= 0.5;
            P.strokeStyle = "rgba(255,250,235,.35)";
            P.lineWidth = 0.22;
            P.beginPath();
            const yy = rnd(-w * 0.3, w * 0.3);
            P.moveTo(-l * 0.8, yy);
            P.lineTo(l * 0.6, yy * 0.6);
            P.stroke();
          }
        }
      });
    }
    ops.push(function () {
      snap = null;
    });
  }

  impasto(34, 1000, 5, 14, 1.8, 3.6, 0.45, 0.75);
  impasto(34, 1250, 2.5, 6.5, 0.9, 1.8, 0.55, 0.85);

  ops.push(function () {
    I0();
    const gr = P.createLinearGradient(-OX, -OY, WW - OX, WH - OY);
    gr.addColorStop(0, "rgba(255,214,140,.16)");
    gr.addColorStop(0.55, "rgba(255,214,140,0)");
    gr.addColorStop(1, "rgba(30,40,90,.12)");
    P.globalAlpha = 1;
    P.fillStyle = gr;
    P.fillRect(-OX, -OY, WW, WH);

    const nz = document.createElement("canvas");
    nz.width = nz.height = 180;
    const nc = nz.getContext("2d")!,
      id = nc.createImageData(180, 180);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = R() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    nc.putImageData(id, 0, 0);
    P.setTransform(1, 0, 0, 1, 0, 0);
    P.globalAlpha = 0.08;
    P.globalCompositeOperation = "overlay";
    P.fillStyle = P.createPattern(nz, "repeat")!;
    P.fillRect(0, 0, painting.width, painting.height);
    P.globalCompositeOperation = "source-over";
    P.globalAlpha = 1;
  });

  // Living simulation data
  const shimmer: { x: number; y: number; l: number; w: number; ph: number; sp: number }[] = [];
  for (let si = 0; si < 1100; si++) {
    const sp = [rnd(-OX, WW - OX), rnd(-OY, WH - OY)];
    if (inWater(sp))
      shimmer.push({
        x: sp[0],
        y: sp[1],
        l: rnd(2, 6),
        w: rnd(0.4, 0.9),
        ph: rnd(0, 6.28),
        sp: rnd(0.6, 1.6),
      });
  }
  let ripples: { x: number; y: number; t0: number }[] = [];
  let nextRipple = 1;
  const smokeSrc = huts
    .filter((h) => h.type !== "flat")
    .slice(1, 4)
    .filter((_, i) => i !== 1)
    .map((h) => [h.x + h.w * 0.3, h.y - 1]);
  const clouds = [
    { x: 0, y: 180, r: 200, v: 5, a: 0.12 },
    { x: 520, y: 420, r: 170, v: 4, a: 0.1 },
    { x: 900, y: 60, r: 220, v: 4.5, a: 0.1 },
  ];

  // Flocks and birds
  const ptr = { x: -999, y: -999, on: false };
  let lastT: number | null = null;
  interface Flock {
    n: number;
    from: [number, number];
    to: [number, number];
    dur: number;
    period: number;
    off: number;
    sc: number;
  }
  const flocks: Flock[] = [
    { n: 7, from: [-300, 560], to: [900, 10], dur: 34, period: 40, off: 0, sc: 1.25 },
    { n: 4, from: [900, 560], to: [-300, 150], dur: 38, period: 46, off: 14, sc: 1.1 },
    { n: 3, from: [-300, 230], to: [900, 340], dur: 40, period: 52, off: 26, sc: 1 },
  ];

  interface Bird {
    st: "flock" | "rest" | "flee" | "return";
    f?: Flock;
    home?: number[];
    bk?: number;
    lat?: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    fear: number;
    ph: number;
    glide: number;
    alt: number;
    sc: number;
    cyc?: number | null;
    vis?: boolean;
    ang?: number;
    peck?: number;
    timer?: number;
  }
  const birds: Bird[] = [];

  flocks.forEach(function (f) {
    for (let i = 0; i < f.n; i++) {
      const side = i % 2 ? 1 : -1,
        rank = Math.ceil(i / 2);
      birds.push({
        st: "flock",
        f: f,
        bk: -rank * rnd(14, 22) + rnd(-4, 4),
        lat: side * rank * rnd(9, 15) + rnd(-4, 4),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fear: 0,
        ph: rnd(0, 6.28),
        glide: rnd(0, 4),
        alt: 1,
        sc: f.sc * rnd(0.9, 1.08),
        cyc: null,
      });
    }
  });

  (function () {
    let n = 0;
    for (let tr = 0; tr < 5000 && n < 11; tr++) {
      const p = [rnd(-220, 820), rnd(20, 560)],
        d = shoreD(p);
      if (d < 9 && !inWater(p) && freeFromHuts(p, 6)) {
        let ok = true;
        birds.forEach(function (b) {
          if (b.home && Math.hypot(b.home[0] - p[0], b.home[1] - p[1]) < 40) ok = false;
        });
        if (!ok) continue;
        birds.push({
          st: "rest",
          home: p,
          x: p[0],
          y: p[1],
          vx: 0,
          vy: 0,
          fear: 0,
          ph: rnd(0, 6.28),
          glide: 0,
          alt: 0,
          sc: rnd(0.95, 1.1),
          ang: rnd(0, 6.28),
          peck: rnd(0, 20),
          timer: 0,
        });
        n++;
      }
    }
  })();

  function updateBirds(t: number, dt: number) {
    birds.forEach(function (b) {
      const dxp = b.x - ptr.x,
        dyp = b.y - ptr.y,
        dp = Math.hypot(dxp, dyp) || 1;
      if (b.st === "flock") {
        const f = b.f!;
        const cyc = Math.floor((t - f.off) / f.period);
        const p = ((((t - f.off) % f.period) + f.period) % f.period) / f.dur;
        const dx = f.to[0] - f.from[0];
        const dy = f.to[1] - f.from[1];
        const ang = Math.atan2(dy, dx);
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const bvx = dx / f.dur;
        const bvy = dy / f.dur;
        const tx =
          f.from[0] + dx * p + b.bk! * ca - b.lat! * sa + Math.sin(t * 0.4 + b.lat!) * 3;
        const ty =
          f.from[1] + dy * p + b.bk! * sa + b.lat! * ca + Math.cos(t * 0.5 + b.bk!) * 3;
        if (cyc !== b.cyc) {
          b.cyc = cyc;
          b.x = tx;
          b.y = ty;
          b.vx = bvx;
          b.vy = bvy;
          b.fear = 0;
        }
        b.vis = p < 1.12 || b.fear > 0.05;
        if (dt <= 0) return;
        const pull = 1 - b.fear * 0.9,
          ax = ((tx - b.x) * 1.1 + (bvx - b.vx) * 1.4) * pull,
          ay = ((ty - b.y) * 1.1 + (bvy - b.vy) * 1.4) * pull;
        if (ptr.on && dp < 80) {
          const k = 1 - dp / 80;
          b.vx += (dxp / dp) * 1400 * k * dt;
          b.vy += (dyp / dp) * 1400 * k * dt;
          b.fear = 1;
        }
        b.fear = Math.max(0, b.fear - dt * 0.3);
        b.vx += ax * dt;
        b.vy += ay * dt;
        const sp = Math.hypot(b.vx, b.vy),
          mx = Math.hypot(bvx, bvy) * 3.2;
        if (sp > mx) {
          b.vx *= mx / sp;
          b.vy *= mx / sp;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      } else {
        b.vis = true;
        if (dt <= 0) return;
        if (ptr.on && dp < 62 && b.st !== "flee") {
          b.st = "flee";
          b.fear = 1;
          b.timer = rnd(3.5, 5.5);
          const a = Math.atan2(dyp, dxp) + rnd(-0.5, 0.5);
          b.vx = Math.cos(a) * 70;
          b.vy = Math.sin(a) * 70;
        }
        if (b.st === "flee") {
          b.alt = Math.min(1, b.alt + dt * 0.9);
          b.timer! -= dt;
          b.vx *= 1 + dt * 0.15;
          b.vy *= 1 + dt * 0.15;
          const s2 = Math.hypot(b.vx, b.vy);
          if (s2 > 120) {
            b.vx *= 120 / s2;
            b.vy *= 120 / s2;
          }
          const turn = dt * 0.35;
          const nvx = b.vx * Math.cos(turn) - b.vy * Math.sin(turn);
          b.vy = b.vx * Math.sin(turn) + b.vy * Math.cos(turn);
          b.vx = nvx;
          if (b.timer! <= 0) b.st = "return";
        } else if (b.st === "return") {
          const hx = b.home![0] - b.x,
            hy = b.home![1] - b.y,
            hd = Math.hypot(hx, hy);
          if (ptr.on && dp < 62) {
            b.st = "flee";
            b.timer = rnd(2.5, 4);
          }
          b.vx += ((hx / hd) * 55 - b.vx) * dt * 1.6;
          b.vy += ((hy / hd) * 55 - b.vy) * dt * 1.6;
          if (hd < 40) {
            b.vx *= 1 - dt * 2.2;
            b.vy *= 1 - dt * 2.2;
          }
          b.alt = Math.min(1, hd / 70);
          if (hd < 1.5) {
            b.st = "rest";
            b.x = b.home![0];
            b.y = b.home![1];
            b.vx = b.vy = 0;
            b.alt = 0;
            b.ang = Math.atan2(hy, hx);
          }
        }
        b.fear = Math.max(0, b.fear - dt * 0.25);
        if (b.st !== "rest") {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }
      }
      if (dt > 0) {
        b.glide -= dt;
        const rate = b.fear > 0.2 ? 13 : 7.5;
        if (b.glide < 0 && b.glide > -1.4 && b.fear < 0.2) {
          b.ph = Math.round(b.ph / 6.283) * 6.283;
        } else {
          b.ph += dt * rate;
        }
        if (b.glide < -1.4) b.glide = rnd(1.5, 3.5);
      }
    });
  }

  function wing(
    c: CanvasRenderingContext2D,
    s: number,
    span: number,
    sweep: number,
    col: string,
    edge?: string | null
  ) {
    const W = 12.5 * span,
      tx = -2.5 - sweep * 6,
      ty = s * W;
    c.beginPath();
    c.moveTo(1.6, s * 1.1);
    c.bezierCurveTo(2.6, s * W * 0.35, 1.2 - sweep * 3, s * W * 0.8, tx, ty);
    const rx = -3.6,
      ry = s * 1.5;
    for (let i = 1; i <= 4; i++) {
      const f = i / 4,
        px = tx + (rx - tx) * f,
        py = ty + (ry - ty) * f;
      c.quadraticCurveTo(px - 1.4 - (1 - f) * 1.2, py - (ty - ry) * 0.06, px, py);
    }
    c.closePath();
    c.fillStyle = col;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = 0.3;
      c.stroke();
    }
  }

  function drawFlyer(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    ang: number,
    b: Bird,
    shadow?: boolean
  ) {
    const sc = b.sc * (1 + b.alt * 0.18);
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.scale(sc, sc);
    const cp = Math.cos(b.ph),
      span = 0.7 + 0.3 * cp,
      sweep = 0.45 - 0.45 * cp,
      up = Math.sin(b.ph) > 0;
    const fill = shadow ? "rgba(14,22,10," + (0.2 - b.alt * 0.06).toFixed(3) + ")" : null;
    if (!shadow) {
      c.globalAlpha = 0.35;
      wing(c, -1, span * 1.05, sweep, "#fff");
      wing(c, 1, span * 1.05, sweep, "#fff");
      c.globalAlpha = 1;
    }
    const wc = shadow ? fill! : up ? "#ECEAE2" : "#FBFAF5",
      ed = shadow ? null : "rgba(110,110,100,.45)";
    wing(c, -1, span, sweep, wc, ed);
    wing(c, 1, span, sweep, wc, ed);
    if (!shadow) {
      c.fillStyle = "rgba(170,170,160,.35)";
      c.beginPath();
      c.ellipse(-1, 0, 3.2, 1.2, 0, 0, 6.283);
      c.fill();
    }
    c.fillStyle = shadow ? fill! : "#FCFBF7";
    c.beginPath();
    c.moveTo(6.6, 0);
    c.bezierCurveTo(5.5, -1.9, -2, -2.1, -6.4, -0.5);
    c.lineTo(-6.4, 0.5);
    c.bezierCurveTo(-2, 2.1, 5.5, 1.9, 6.6, 0);
    c.fill();
    c.beginPath();
    c.arc(6.4, 0, 1.35, 0, 6.283);
    c.fill();
    if (!shadow) {
      c.strokeStyle = "rgba(120,118,108,.5)";
      c.lineWidth = 0.3;
      c.beginPath();
      c.moveTo(6.6, 0);
      c.bezierCurveTo(5.5, 1.9, -2, 2.1, -6.4, 0.5);
      c.stroke();
      c.fillStyle = "#E3A93A";
      c.beginPath();
      c.moveTo(7.4, -0.4);
      c.lineTo(10.6, 0);
      c.lineTo(7.4, 0.4);
      c.fill();
    }
    c.strokeStyle = shadow ? fill! : "rgba(30,28,24,.75)";
    c.lineWidth = 0.45;
    c.beginPath();
    c.moveTo(-5.8, -0.35);
    c.lineTo(-11.5, -0.7);
    c.moveTo(-5.8, 0.35);
    c.lineTo(-11.5, 0.7);
    c.stroke();
    c.restore();
  }

  function drawResting(c: CanvasRenderingContext2D, b: Bird, t: number) {
    const x = b.x,
      y = b.y,
      a = (b.ang || 0) + Math.sin(t * 0.3 + (b.peck || 0)) * 0.25,
      pk = Math.max(0, Math.sin(t * 0.9 + (b.peck || 0))),
      nk = 2.5 + pk * 3,
      sc = b.sc;
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    c.save();
    c.transform(1, 0, 0.9, 0.55, 0, 0);
    c.translate(5, 6);
    c.rotate(a);
    c.fillStyle = "rgba(14,22,10,.28)";
    c.beginPath();
    c.ellipse(0, 0, 4.6, 2, 0, 0, 6.283);
    c.fill();
    c.strokeStyle = "rgba(14,22,10,.28)";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(3, 0);
    c.quadraticCurveTo(5, -2, 4 + nk, -1);
    c.stroke();
    c.restore();
    c.strokeStyle = "rgba(14,22,10,.3)";
    c.lineWidth = 0.4;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(6, 6);
    c.moveTo(0.6, 0);
    c.lineTo(6.8, 5.6);
    c.stroke();
    c.rotate(a);
    c.fillStyle = "#C9C8C0";
    c.beginPath();
    c.ellipse(0.3, 0.5, 4.6, 2.3, 0, 0, 6.283);
    c.fill();
    c.fillStyle = "#FBFAF4";
    c.beginPath();
    c.ellipse(0, 0, 4.4, 2.1, 0, 0, 6.283);
    c.fill();
    c.strokeStyle = "#F8F7F0";
    c.lineWidth = 1.25;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(3, 0);
    c.quadraticCurveTo(4.5, -1.6, 3 + nk, -0.6);
    c.stroke();
    c.fillStyle = "#FBFAF4";
    c.beginPath();
    c.arc(3 + nk, -0.6, 1.05, 0, 6.283);
    c.fill();
    c.fillStyle = "#E3A93A";
    c.beginPath();
    c.moveTo(3.8 + nk, -1);
    c.lineTo(6.6 + nk, -0.3);
    c.lineTo(3.8 + nk, -0.2);
    c.fill();
    c.restore();
  }

  function drawBirds(c: CanvasRenderingContext2D, t: number) {
    birds.forEach(function (b) {
      if (!b.vis || b.st === "rest") return;
      const ang = Math.atan2(b.vy, b.vx),
        off = 4 + b.alt * 24;
      drawFlyer(c, b.x + off, b.y + off * 0.8, ang, b, true);
    });
    birds.forEach(function (b) {
      if (b.vis && b.st === "rest") drawResting(c, b, t);
    });
    birds.forEach(function (b) {
      if (!b.vis || b.st === "rest") return;
      drawFlyer(c, b.x, b.y, Math.atan2(b.vy, b.vx), b, false);
    });
  }

  const WIND = 0.32;
  let windSprite: HTMLCanvasElement;
  if (typeof document !== "undefined") {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g2 = cv.getContext("2d")!,
      gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,250,215,1)");
    gr.addColorStop(1, "rgba(255,250,215,0)");
    g2.fillStyle = gr;
    g2.fillRect(0, 0, 128, 128);
    windSprite = cv;
  }

  interface Leaf {
    x: number;
    y: number;
    r: number;
    s: number;
    v: number;
    ph: number;
    c: string;
  }
  const leaves: Leaf[] = [];
  for (let li = 0; li < 46; li++)
    leaves.push({
      x: rnd(-OX, WW - OX),
      y: rnd(-OY, WH - OY),
      r: rnd(0, 6.28),
      s: rnd(0.7, 1.3),
      v: rnd(0.7, 1.3),
      ph: rnd(0, 6.28),
      c: ["#E8A33A", "#C9D35A", "#D97B3A", "#F2D06B"][Math.floor(R() * 4)],
    });

  function wind(c: CanvasRenderingContext2D, t: number, dt: number) {
    const ca = Math.cos(WIND),
      sa = Math.sin(WIND);
    c.save();
    c.translate(300, 280);
    c.rotate(WIND);
    if (windSprite) {
      for (let k = 0; k < 6; k++) {
        const d = ((t * 9 + k * 260) % 1560) - 780;
        for (let yy = -760; yy <= 760; yy += 85) {
          const x = d + Math.sin(yy * 0.006 + k * 1.7 + t * 0.15) * 60;
          c.globalAlpha = 0.085;
          c.drawImage(windSprite, x - 80, yy - 55, 160, 110);
          c.globalAlpha = 0.035;
          c.drawImage(windSprite, x - 150, yy - 40, 90, 80);
        }
      }
    }
    c.restore();
    c.globalAlpha = 1;
    leaves.forEach(function (l) {
      if (dt > 0) {
        l.x += ca * 12 * l.v * dt + Math.sin(t * 0.8 + l.ph) * 4 * dt;
        l.y += sa * 12 * l.v * dt + Math.cos(t * 0.6 + l.ph) * 5 * dt;
        l.r += dt * (0.8 + l.v);
        if (l.x > WW - OX + 20) {
          l.x = -OX - 20;
          l.y = rnd(-OY, WH - OY);
        }
        if (l.y > WH - OY + 20) {
          l.y = -OY - 20;
          l.x = rnd(-OX, WW - OX);
        }
      }
      c.save();
      c.translate(l.x, l.y);
      c.rotate(l.r);
      c.scale(l.s, l.s * Math.abs(Math.cos(t * 1.3 + l.ph)) * 0.8 + 0.2);
      c.fillStyle = "rgba(14,22,10,.15)";
      c.beginPath();
      c.ellipse(3, 3, 1.8, 0.9, 0, 0, 6.283);
      c.fill();
      c.fillStyle = l.c;
      c.beginPath();
      c.ellipse(0, 0, 1.8, 0.9, 0, 0, 6.283);
      c.fill();
      c.restore();
    });
  }

  function palmsLive(c: CanvasRenderingContext2D, t: number) {
    palmSprites.forEach(function (p) {
      const a =
        Math.sin(t * 0.55 + p.ph + p.x * 0.01) * 0.07 + Math.sin(t * 1.3 + p.ph) * 0.02;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(a);
      c.translate(Math.cos(WIND) * a * 8, Math.sin(WIND) * a * 8);
      c.drawImage(p.c, -18, -18, 36, 36);
      c.restore();
    });
  }

  interface Boat {
    x0: number;
    dx: number;
    y0: number;
    dy: number;
    f: number;
    ph: number;
    sari: string;
  }
  const boats: Boat[] = [
    { x0: 600, dx: 90, y0: -200, dy: 6, f: 0.022, ph: 1, sari: "#2F6DA8" },
    { x0: 70, dx: 60, y0: 476, dy: 3, f: 0.035, ph: 0, sari: "#C8432B" },
    { x0: -150, dx: 80, y0: 186, dy: 5, f: 0.028, ph: 2, sari: "#E9C46A" },
  ];

  function boatState(t: number, cfg: Boat) {
    const p = (Math.sin(t * cfg.f + cfg.ph) + 1) / 2,
      x = cfg.x0 + p * cfg.dx,
      y = cfg.y0 + Math.sin(t * cfg.f * 0.7 + cfg.ph) * cfg.dy,
      dir = Math.cos(t * cfg.f + cfg.ph) >= 0 ? 1 : -1;
    return {
      x: x,
      y: y,
      dir: dir,
      bob: Math.sin(t * 1.3 + cfg.ph) * 0.12,
      heave: Math.sin(t * 1.9 + cfg.ph) * 0.35,
    };
  }

  function boatWake(c: CanvasRenderingContext2D, t: number, b: Boat) {
    const s = boatState(t, b);
    c.strokeStyle = "rgba(230,244,236,.32)";
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(s.x - s.dir * 7, s.y - 1.6);
    c.lineTo(s.x - s.dir * 20, s.y - 4.5);
    c.moveTo(s.x - s.dir * 7, s.y + 1.6);
    c.lineTo(s.x - s.dir * 20, s.y + 4.5);
    c.stroke();
    const rg = (t * 0.6 + b.ph) % 1;
    c.strokeStyle = "rgba(230,244,236," + ((1 - rg) * 0.35).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(s.x, s.y, 9 + rg * 6, 3 + rg * 2.5, 0, 0, 6.283);
    c.stroke();
  }

  function boatHull(c: CanvasRenderingContext2D, t: number, b: Boat) {
    const s = boatState(t, b);
    c.save();
    c.translate(s.x, s.y + s.heave);
    c.rotate(0.04 * s.dir + s.bob * 0.25);
    c.scale(s.dir, 1);
    c.fillStyle = "rgba(14,24,10,.25)";
    c.beginPath();
    c.ellipse(1.5, 1.8, 9, 2.6, 0, 0, 6.283);
    c.fill();
    c.fillStyle = "#6B4426";
    c.beginPath();
    c.moveTo(-9, 0);
    c.quadraticCurveTo(0, -3.4, 9, 0);
    c.quadraticCurveTo(0, 3.4, -9, 0);
    c.fill();
    c.fillStyle = "#9A6A3E";
    c.beginPath();
    c.moveTo(-7, 0);
    c.quadraticCurveTo(0, -2.2, 7, 0);
    c.quadraticCurveTo(0, 2.2, -7, 0);
    c.fill();
    c.fillStyle = "#4a3420";
    for (let k = -4; k <= 4; k += 4) c.fillRect(k - 0.3, -1.6, 0.6, 3.2);
    c.fillStyle = b.sari;
    c.beginPath();
    c.ellipse(-1.5, 0, 1.7, 1.4, 0, 0, 6.283);
    c.fill();
    c.fillStyle = "#2a211a";
    c.beginPath();
    c.arc(-1.2, 0, 0.85, 0, 6.283);
    c.fill();
    c.strokeStyle = "#4a3420";
    c.lineWidth = 0.55;
    const oa = Math.sin(t * 0.9 + b.ph) * 0.45;
    c.beginPath();
    c.moveTo(-1.5, 0);
    c.lineTo(-1.5 + Math.cos(1.9 + oa) * 9, Math.sin(1.9 + oa) * 9);
    c.stroke();
    c.restore();
  }

  function cum(rd: number[][]) {
    const a = [0];
    for (let i = 1; i < rd.length; i++)
      a.push(a[i - 1] + Math.hypot(rd[i][0] - rd[i - 1][0], rd[i][1] - rd[i - 1][1]));
    return a;
  }

  interface RoadL {
    p: number[][];
    c: number[];
  }
  const roadsL: RoadL[] = [
    { p: road1, c: cum(road1) },
    { p: road2, c: cum(road2) },
  ];

  function roadAt(r: RoadL, d: number) {
    const c = r.c,
      n = c.length,
      L = c[n - 1];
    d = Math.max(0, Math.min(L, d));
    let lo = 0,
      hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (c[mid] < d) lo = mid;
      else hi = mid;
    }
    const a = r.p[lo],
      b = r.p[hi],
      f = (d - c[lo]) / (c[hi] - c[lo] || 1);
    return {
      x: a[0] + (b[0] - a[0]) * f,
      y: a[1] + (b[1] - a[1]) * f,
      a: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  }

  const CLOTH = [
    "#C8432B",
    "#E07A2E",
    "#E9C46A",
    "#F4F0E6",
    "#2F6DA8",
    "#8E3B6E",
    "#3E8E5A",
    "#F2EEE4",
  ];

  interface Walker {
    r: RoadL;
    d: number;
    v: number;
    side: number;
    col: string;
    pot: boolean;
    bundle: boolean;
    ph: number;
    pause: number;
    kid: boolean;
  }
  const walkers: Walker[] = [];
  for (let wi = 0; wi < 14; wi++) {
    const rr = roadsL[wi < 9 ? 0 : 1],
      L = rr.c[rr.c.length - 1];
    walkers.push({
      r: rr,
      d: rnd(0, L),
      v: rnd(2.2, 3.4) * (R() < 0.5 ? 1 : -1),
      side: rnd(-2.2, 2.2),
      col: CLOTH[Math.floor(R() * CLOTH.length)],
      pot: R() < 0.3,
      bundle: R() < 0.2,
      ph: rnd(0, 6.28),
      pause: 0,
      kid: R() < 0.15,
    });
  }
  for (let wi = 0; wi < 4; wi++) {
    const w0 = walkers[wi * 3];
    walkers.push({
      r: w0.r,
      d: w0.d + 3,
      v: w0.v,
      side: -w0.side,
      col: CLOTH[Math.floor(R() * CLOTH.length)],
      pot: R() < 0.4,
      bundle: false,
      ph: w0.ph + 1.5,
      pause: 0,
      kid: R() < 0.3,
    });
  }

  interface Dog {
    r: RoadL;
    d: number;
    v: number;
    col: string;
    ph: number;
    pause: number;
    run: number;
  }
  const dogs: Dog[] = [];
  for (let wi = 0; wi < 4; wi++) {
    const rd2 = roadsL[wi % 2],
      L2 = rd2.c[rd2.c.length - 1];
    dogs.push({
      r: rd2,
      d: rnd(0, L2),
      v: rnd(5, 8) * (R() < 0.5 ? 1 : -1),
      col: ["#B07A43", "#8A5A32", "#3a2e26", "#D9B98A"][wi],
      ph: rnd(0, 6.28),
      pause: rnd(0, 3),
      run: rnd(2, 6),
    });
  }

  interface Farmer {
    c: [number, number];
    dir: number;
    len: number;
    sp: number;
    ph: number;
    col: string;
    hat: boolean;
  }
  const farmers: Farmer[] = [];

  interface Plough {
    c: [number, number];
    dir: number;
    len: number;
    sp: number;
    ph: number;
  }
  const ploughs: Plough[] = [];

  (function () {
    const cand = fields.filter(function (f) {
      const c = cent(f);
      return (
        c[0] > 180 &&
        c[0] < 820 &&
        c[1] > -10 &&
        c[1] < 430 &&
        !inWater(c) &&
        freeFromHuts(c, 18) &&
        !nearRoad(c, 18)
      );
    });
    for (let i = cand.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1)),
        t2 = cand[i];
      cand[i] = cand[j];
      cand[j] = t2;
    }
    cand.slice(0, 6).forEach(function (f, i) {
      const c = cent(f),
        n = i < 4 ? 2 : 1;
      for (let k = 0; k < n; k++)
        farmers.push({
          c: [c[0] + (k ? 7 : 0), c[1] + (k ? 6 : 0)],
          dir: g + (i % 2 ? Math.PI / 2 : 0),
          len: rnd(8, 13),
          sp: rnd(0.5, 0.9),
          ph: rnd(0, 6.28),
          col: CLOTH[Math.floor(R() * CLOTH.length)],
          hat: R() < 0.5,
        });
    });
    cand.slice(6, 8).forEach(function (f) {
      const c = cent(f);
      ploughs.push({ c: c, dir: g, len: 14, sp: 0.04, ph: rnd(0, 6.28) });
    });
  })();

  interface HerdAnimal {
    home: number[];
    x: number;
    y: number;
    a: number;
    tx: number;
    ty: number;
    wait: number;
    col: string[];
    ph: number;
    buff: boolean;
  }
  const herd: HerdAnimal[] = [];
  (function () {
    for (let tr = 0, n = 0; tr < 3000 && n < 9; tr++) {
      const p = [rnd(420, 830), rnd(140, 580)];
      if (inWater(p) || !freeFromHuts(p, 8) || nearRoad(p, 6) || shoreD(p) > 45) continue;
      herd.push({
        home: p,
        x: p[0],
        y: p[1],
        a: rnd(0, 6.28),
        tx: p[0],
        ty: p[1],
        wait: rnd(0, 6),
        col:
          R() < 0.5
            ? ["#F2EEE4", "#E8E2D4"]
            : R() < 0.5
            ? ["#8A5A32", "#6E4526"]
            : ["#3a3430", "#2a2522"],
        ph: rnd(0, 6.28),
        buff: R() < 0.25,
      });
      n++;
    }
  })();

  function shadowE(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    a?: number
  ) {
    c.fillStyle = "rgba(14,22,10," + (a || 0.24) + ")";
    c.beginPath();
    c.ellipse(x + 1.4, y + 1.2, rx, ry, 0, 0, 6.283);
    c.fill();
  }

  interface PersonOptions {
    kid?: boolean;
    walk?: boolean;
    bend?: boolean;
    hat?: boolean;
    pot?: boolean;
    bundle?: boolean;
  }
  function drawPerson(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    ang: number,
    ph: number,
    col: string,
    o: PersonOptions
  ) {
    const sc = (o.kid ? 0.75 : 1) * 1.7,
      walk = o.walk !== false;
    shadowE(c, x, y, 1.8 * sc, 1.2 * sc, 0.22);
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.scale(sc, sc);
    const st = walk ? Math.sin(ph) * 1.1 : 0;
    c.strokeStyle = "#3b2a1e";
    c.lineWidth = 0.55;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(0, -0.55);
    c.lineTo(st, -0.6);
    c.moveTo(0, 0.55);
    c.lineTo(-st, 0.6);
    c.stroke();
    if (o.bend) c.translate(0.6, 0);
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(0, 0, o.bend ? 1.5 : 1.05, 1.85, 0, 0, 6.283);
    c.fill();
    c.strokeStyle = col;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(0, -1.5);
    c.lineTo(o.bend ? 1.6 : -st * 0.7, -1.7);
    c.moveTo(0, 1.5);
    c.lineTo(o.bend ? 1.6 : st * 0.7, 1.7);
    c.stroke();
    c.fillStyle = "#2a1d14";
    c.beginPath();
    c.arc(o.bend ? 1.3 : 0.3, 0, 0.95, 0, 6.283);
    c.fill();
    if (o.hat) {
      c.fillStyle = "#D9B56A";
      c.beginPath();
      c.arc(o.bend ? 1.3 : 0.3, 0, 1.5, 0, 6.283);
      c.fill();
      c.strokeStyle = "#A8843E";
      c.lineWidth = 0.25;
      c.stroke();
    }
    if (o.pot) {
      c.fillStyle = "#C9962B";
      c.beginPath();
      c.arc(0.3, 0, 1.25, 0, 6.283);
      c.fill();
      c.fillStyle = "rgba(255,240,190,.7)";
      c.beginPath();
      c.arc(0, -0.4, 0.4, 0, 6.283);
      c.fill();
    }
    if (o.bundle) {
      c.fillStyle = "#7FA94A";
      c.beginPath();
      c.ellipse(0.3, 0, 1.9, 1.5, 0, 0, 6.283);
      c.fill();
    }
    c.restore();
  }

  function drawCow(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    a: number,
    ph: number,
    col: string[],
    graze: boolean,
    buff: boolean
  ) {
    shadowE(c, x, y, 6.2, 3.2, 0.24);
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(1.35, 1.35);
    const tail = Math.sin(ph * 1.7) * 0.6;
    c.strokeStyle = col[1];
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-4, 0);
    c.quadraticCurveTo(-5.5, tail, -6.6, tail * 1.8);
    c.stroke();
    c.fillStyle = buff ? "#2b2724" : col[0];
    c.beginPath();
    c.ellipse(0, 0, 4.2, 2.15, 0, 0, 6.283);
    c.fill();
    if (!buff) {
      c.fillStyle = col[1];
      c.beginPath();
      c.ellipse(-1.2, 0.6, 1.4, 0.9, 0.4, 0, 6.283);
      c.fill();
    } else {
      c.fillStyle = "rgba(255,255,255,.12)";
      c.beginPath();
      c.ellipse(0.4, -0.6, 2.6, 0.9, 0, 0, 6.283);
      c.fill();
    }
    const hx = 4.3 + (graze ? 0.9 + Math.sin(ph) * 0.3 : 0);
    c.fillStyle = buff ? "#2b2724" : col[0];
    c.beginPath();
    c.ellipse(hx, 0, 1.6, 1.15, 0, 0, 6.283);
    c.fill();
    c.strokeStyle = buff ? "#5a5048" : "#D8CDB0";
    c.lineWidth = 0.45;
    c.beginPath();
    if (buff) {
      c.moveTo(hx - 0.4, -1);
      c.quadraticCurveTo(hx - 2, -2.4, hx - 2.6, -1);
      c.moveTo(hx - 0.4, 1);
      c.quadraticCurveTo(hx - 2, 2.4, hx - 2.6, 1);
    } else {
      c.moveTo(hx - 0.5, -0.9);
      c.lineTo(hx - 0.2, -2);
      c.moveTo(hx - 0.5, 0.9);
      c.lineTo(hx - 0.2, 2);
    }
    c.stroke();
    c.restore();
  }

  function drawDog(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    a: number,
    ph: number,
    col: string,
    moving: boolean
  ) {
    shadowE(c, x, y, 3, 1.5, 0.2);
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(1.5, 1.5);
    const b = moving ? Math.sin(ph * 2) * 0.2 : 0;
    c.strokeStyle = col;
    c.lineWidth = 0.6;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-2.2, 0);
    c.quadraticCurveTo(-3.2, -1, -2.6, -1.6 + Math.sin(ph * 3) * 0.3);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(0, b, 2.4, 0.95, 0, 0, 6.283);
    c.fill();
    c.beginPath();
    c.ellipse(2.5, b * 0.5, 1.05, 0.8, 0, 0, 6.283);
    c.fill();
    c.beginPath();
    c.moveTo(2.2, -0.8);
    c.lineTo(2.6, -1.5);
    c.lineTo(3, -0.7);
    c.fill();
    c.beginPath();
    c.moveTo(2.2, 0.8);
    c.lineTo(2.6, 1.5);
    c.lineTo(3, 0.7);
    c.fill();
    c.restore();
  }

  function drawPlough(c: CanvasRenderingContext2D, t: number, p: Plough) {
    const u = Math.sin(t * p.sp * 6.283 + p.ph),
      du = Math.cos(t * p.sp * 6.283 + p.ph),
      dir = p.dir + (du < 0 ? Math.PI : 0),
      dx = Math.cos(p.dir),
      dy = Math.sin(p.dir),
      x = p.c[0] + dx * u * p.len,
      y = p.c[1] + dy * u * p.len,
      fx = Math.cos(dir),
      fy = Math.sin(dir),
      px = -fy,
      py = fx;
    c.strokeStyle = "rgba(70,45,25,.35)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(p.c[0] - dx * p.len, p.c[1] - dy * p.len);
    c.lineTo(x, y);
    c.stroke();
    const ph = t * 3;
    drawCow(c, x + fx * 9 + px * 3, y + fy * 9 + py * 3, dir, ph, ["#ECE6D8", "#D8D0BE"], false, false);
    drawCow(c, x + fx * 9 - px * 3, y + fy * 9 - py * 3, dir, ph + 1, ["#E2DACA", "#CFC5B0"], false, false);
    c.strokeStyle = "#5a3a1a";
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x + fx * 12.5 + px * 5, y + fy * 12.5 + py * 5);
    c.lineTo(x + fx * 12.5 - px * 5, y + fy * 12.5 - py * 5);
    c.moveTo(x + fx * 12.5, y + fy * 12.5);
    c.lineTo(x + fx * 0.5, y + fy * 0.5);
    c.stroke();
    drawPerson(c, x - fx * 2.5, y - fy * 2.5, dir, t * 4, "#F2EEE4", { hat: true });
  }

  function villageLife(c: CanvasRenderingContext2D, t: number, dt: number) {
    farmers.forEach(function (f) {
      const s = Math.sin(t * f.sp * 0.35 + f.ph),
        x = f.c[0] + Math.cos(f.dir) * s * f.len,
        y = f.c[1] + Math.sin(f.dir) * s * f.len,
        bend = Math.sin(t * 1.1 + f.ph) > -0.4;
      drawPerson(c, x, y, f.dir + Math.PI / 2 + Math.sin(t * 0.3 + f.ph) * 0.3, t * 2, f.col, {
        bend: bend,
        hat: f.hat,
        walk: false,
      });
    });
    ploughs.forEach(function (p) {
      drawPlough(c, t, p);
    });
    herd.forEach(function (h) {
      if (dt > 0) {
        h.wait -= dt;
        const dx = h.tx - h.x,
          dy = h.ty - h.y,
          d = Math.hypot(dx, dy);
        if (h.wait <= 0 && d < 0.5) {
          h.tx = h.home[0] + rnd(-16, 16);
          h.ty = h.home[1] + rnd(-12, 12);
          if (inWater([h.tx, h.ty])) {
            h.tx = h.home[0];
            h.ty = h.home[1];
          }
          h.wait = rnd(5, 12);
        }
        if (d > 0.5 && h.wait <= 0) {
          const ta = Math.atan2(dy, dx),
            da = Math.atan2(Math.sin(ta - h.a), Math.cos(ta - h.a));
          h.a += Math.max(-dt * 0.6, Math.min(dt * 0.6, da));
          if (Math.abs(da) < 0.6) {
            h.x += Math.cos(h.a) * 0.9 * dt;
            h.y += Math.sin(h.a) * 0.9 * dt;
          }
        }
      }
      h.ph += dt * 1.6;
      drawCow(c, h.x, h.y, h.a, h.ph, h.col, h.wait > 0, h.buff);
    });
    walkers.forEach(function (w) {
      const L = w.r.c[w.r.c.length - 1];
      if (dt > 0) {
        if (w.pause > 0) w.pause -= dt;
        else {
          w.d += w.v * dt;
          w.ph += dt * Math.abs(w.v) * 1.6;
          if (w.d < 0 || w.d > L) {
            w.v = -w.v;
            w.d = Math.max(0, Math.min(L, w.d));
          }
          if (R() < dt * 0.02) w.pause = rnd(2, 5);
        }
      }
      const p = roadAt(w.r, w.d),
        ang = p.a + (w.v < 0 ? Math.PI : 0),
        nx = -Math.sin(p.a),
        ny = Math.cos(p.a);
      drawPerson(c, p.x + nx * w.side, p.y + ny * w.side, ang, w.ph, w.col, {
        pot: w.pot,
        bundle: w.bundle,
        kid: w.kid,
        walk: w.pause <= 0,
      });
    });
    dogs.forEach(function (d) {
      const L = d.r.c[d.r.c.length - 1],
        moving = d.pause <= 0;
      if (dt > 0) {
        if (d.pause > 0) {
          d.pause -= dt;
          if (d.pause <= 0) d.run = rnd(2, 6);
        } else {
          d.d += d.v * dt;
          d.run -= dt;
          if (d.d < 0 || d.d > L) {
            d.v = -d.v;
            d.d = Math.max(0, Math.min(L, d.d));
          }
          if (d.run <= 0) {
            d.pause = rnd(2, 6);
            if (R() < 0.4) d.v = -d.v;
          }
        }
        d.ph += dt * (moving ? 6 : 1);
      }
      const p = roadAt(d.r, d.d),
        nx = -Math.sin(p.a),
        ny = Math.cos(p.a),
        off = Math.sin(d.d * 0.08) * 2.5;
      drawDog(c, p.x + nx * off, p.y + ny * off, p.a + (d.v < 0 ? Math.PI : 0), d.ph, d.col, moving);
    });
  }

  function living(c: CanvasRenderingContext2D, t: number) {
    clouds.forEach(function (cl) {
      const x = ((cl.x + t * cl.v) % (WW + 440)) - OX - 220,
        gr = c.createRadialGradient(x, cl.y, 0, x, cl.y, cl.r);
      gr.addColorStop(0, "rgba(16,28,20," + cl.a + ")");
      gr.addColorStop(1, "rgba(16,28,20,0)");
      c.fillStyle = gr;
      c.fillRect(x - cl.r, cl.y - cl.r, cl.r * 2, cl.r * 2);
    });
    c.save();
    c.clip(waterPath);
    c.lineCap = "round";
    for (let i = 0; i < shimmer.length; i++) {
      const s = shimmer[i],
        a = Math.pow(Math.max(0, Math.sin(t * s.sp + s.ph)), 4) * 0.6;
      if (a < 0.02) continue;
      c.strokeStyle = "rgba(236,246,236," + a.toFixed(3) + ")";
      c.lineWidth = s.w;
      c.beginPath();
      c.moveTo(s.x - s.l, s.y + s.l * 0.12);
      c.lineTo(s.x + s.l, s.y - s.l * 0.12);
      c.stroke();
    }
    if (t > nextRipple && shimmer.length) {
      const rp = shimmer[Math.floor(Math.random() * shimmer.length)];
      ripples.push({ x: rp.x, y: rp.y, t0: t });
      nextRipple = t + 0.8 + Math.random() * 1.6;
    }
    ripples = ripples.filter((r) => t - r.t0 < 2.6);
    ripples.forEach(function (r) {
      const age = (t - r.t0) / 2.6;
      for (let k = 0; k < 2; k++) {
        const rr = 1 + age * 9 - k * 2.5;
        if (rr <= 0) continue;
        c.strokeStyle = "rgba(230,244,236," + ((1 - age) * 0.45).toFixed(3) + ")";
        c.lineWidth = 0.5;
        c.beginPath();
        c.ellipse(r.x, r.y, rr, rr * 0.62, 0, 0, 6.283);
        c.stroke();
      }
    });
    boats.forEach((bt) => boatWake(c, t, bt));
    c.restore();
    boats.forEach((bt) => boatHull(c, t, bt));
    smokeSrc.forEach(function (sp, j) {
      for (let k = 0; k < 7; k++) {
        const age = (t * 0.22 + k / 7 + j * 0.3) % 1;
        c.fillStyle = "rgba(240,238,230," + ((1 - age) * 0.2).toFixed(3) + ")";
        c.beginPath();
        c.arc(sp[0] + age * 24 + Math.sin(t + k) * 1.5, sp[1] - age * 9, 1.6 + age * 6, 0, 6.283);
        c.fill();
      }
    });
    let dt = lastT == null ? 0 : Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    if (reduce) dt = 0;
    villageLife(c, t, dt);
    palmsLive(c, t);
    wind(c, t, dt);
    updateBirds(t, dt);
    drawBirds(c, t);
  }

  // Multi-instance canvas rendering
  const instances: MapInstance[] = [];
  let painted = false;
  let opi = 0;
  let readyCallbacks: (() => void)[] = [];

  function mapOf(I: MapInstance) {
    const v = I.view,
      s = Math.max(I.w / v.w, I.h / v.h);
    return {
      s: s,
      tx: (I.w - v.w * s) / 2 - v.x * s,
      ty: (I.h - v.h * s) / 2 - v.y * s,
    };
  }

  function draw(I: MapInstance, t: number) {
    if (!I.host.offsetWidth || !I.w || !painting) return;
    const c = I.ctx,
      m = mapOf(I);
    c.setTransform(I.dpr, 0, 0, I.dpr, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = "#6f8a45";
    c.fillRect(0, 0, I.w, I.h);
    c.drawImage(painting, m.tx - OX * m.s, m.ty - OY * m.s, WW * m.s, WH * m.s);
    if (painted) {
      c.setTransform(I.dpr * m.s, 0, 0, I.dpr * m.s, I.dpr * m.tx, I.dpr * m.ty);
      living(c, t);
    }
  }

  function finish() {
    painted = true;
    readyCallbacks.forEach((cb) => cb());
    instances.forEach(function (I) {
      if (!I.mini) return;
      const m = I.mini.getContext("2d");
      if (!m) return;
      m.drawImage(
        painting,
        (140 + OX) * K,
        (90 + OY) * K,
        360 * K,
        370 * K,
        0,
        0,
        I.mini.width,
        I.mini.height
      );
    });
  }

  // Start painting pipeline
  if (typeof window !== "undefined") {
    if (reduce) {
      ops.forEach((o) => o());
      opi = ops.length;
      finish();
    } else {
      const per = Math.ceil(ops.length / 110);
      let t0: number | null = null;
      const frame = (now: number) => {
        if (t0 == null) t0 = now;
        if (opi < ops.length) {
          const st = performance.now();
          const goal = Math.ceil(ops.length * Math.min(1, (now - t0) / 2600));
          while (
            opi < ops.length &&
            (opi < goal || opi === 0) &&
            (performance.now() - st < 40 || opi < goal - per * 4)
          ) {
            ops[opi++]();
          }
          if (opi >= ops.length) finish();
        }
        const t = (now - t0) / 1000 + 4;
        instances.forEach((I) => draw(I, t));
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

  // Folded paper survey map cached Data URL
  let cachedSurveyDataUrl: string | null = null;
  function drawSurveyMap(): string {
    if (cachedSurveyDataUrl) return cachedSurveyDataUrl;
    if (typeof document === "undefined") return "";

    const MR = mulberry(77);
    function mr(a: number, b: number) {
      return a + (b - a) * MR();
    }
    const MW = 1200,
      MH = 800,
      MS = 2,
      mc = document.createElement("canvas");
    mc.width = MW * MS;
    mc.height = MH * MS;
    const m = mc.getContext("2d")!;
    m.scale(MS, MS);

    function W(p: number[]): [number, number] {
      return [p[0] * 1.3 + 250, p[1] * 1.3 - 20];
    }
    function poly(pts: number[][], open?: boolean) {
      m.beginPath();
      pts.forEach(function (p, i) {
        const q = W(p);
        i ? m.lineTo(q[0], q[1]) : m.moveTo(q[0], q[1]);
      });
      if (!open) m.closePath();
    }

    const ink = "rgba(78,58,38,.85)",
      serif = 'Georgia,"Times New Roman",serif';
    m.fillStyle = "#EFE5CB";
    m.fillRect(0, 0, MW, MH);
    for (let i = 0; i < 16; i++) {
      const x = mr(0, MW),
        y = mr(0, MH),
        r = mr(60, 220),
        g2 = m.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, "rgba(160,120,60," + mr(0.03, 0.08).toFixed(3) + ")");
      g2.addColorStop(1, "rgba(160,120,60,0)");
      m.fillStyle = g2;
      m.fillRect(x - r, y - r, r * 2, r * 2);
    }
    m.save();
    m.beginPath();
    m.rect(46, 46, MW - 92, MH - 92);
    m.clip();
    const tints = [
      "rgba(140,175,95,.30)",
      "rgba(205,190,100,.30)",
      "rgba(160,185,110,.22)",
      "rgba(190,150,100,.24)",
      "rgba(120,160,90,.26)",
    ];
    const vis: { f: number[][]; q: [number, number] }[] = [];
    fields.forEach(function (f) {
      const c = cent(f);
      if (inWater(c)) return;
      poly(f);
      m.fillStyle = tints[Math.floor(MR() * tints.length)];
      m.fill();
      const q = W(c);
      if (q[0] > 60 && q[0] < MW - 60 && q[1] > 60 && q[1] < MH - 60) vis.push({ f: f, q: q });
    });
    m.strokeStyle = ink;
    m.lineWidth = 0.9;
    fields.forEach(function (f) {
      if (inWater(cent(f))) return;
      poly(f);
      m.stroke();
    });

    // Roads as double lines
    [road1, road2].forEach(function (rd) {
      poly(rd, true);
      m.lineJoin = "round";
      m.lineCap = "round";
      m.strokeStyle = ink;
      m.lineWidth = 8;
      m.stroke();
      m.strokeStyle = "#EFE5CB";
      m.lineWidth = 5.6;
      m.stroke();
    });

    // Water with hand-ruled hatching
    [
      [lakeP, true],
      [pondP, false],
      [pond2P, false],
    ].forEach(function (w) {
      poly(w[0] as number[][]);
      m.fillStyle = "#DCE4DA";
      m.fill();
      m.save();
      m.clip();
      m.strokeStyle = "rgba(60,100,135,.5)";
      m.lineWidth = 0.8;
      for (let y = 0; y < MH; y += 7) {
        m.beginPath();
        for (let x = mr(-20, 0); x < MW; x += mr(18, 34)) {
          const l = mr(6, 14);
          m.moveTo(x, y + mr(-0.8, 0.8));
          m.quadraticCurveTo(x + l / 2, y - 1.6, x + l, y);
        }
        m.stroke();
      }
      m.restore();
      poly(w[0] as number[][]);
      m.strokeStyle = "rgba(50,85,120,.85)";
      m.lineWidth = 1.4;
      m.stroke();
    });

    [islandP, island2P].forEach(function (il) {
      poly(il);
      m.fillStyle = "#E6DDBF";
      m.fill();
      m.strokeStyle = "rgba(50,85,120,.85)";
      m.lineWidth = 1.2;
      m.stroke();
    });

    // Settlement and trees as map symbols
    huts.forEach(function (h) {
      const q = W([h.x, h.y]);
      m.save();
      m.translate(q[0], q[1]);
      m.rotate(h.a);
      m.fillStyle = "rgba(70,50,32,.85)";
      m.fillRect(-h.w * 0.55, -h.d * 0.55, h.w * 1.1, h.d * 1.1);
      m.restore();
    });
    m.strokeStyle = "rgba(60,90,50,.8)";
    m.lineWidth = 0.8;
    trees.forEach(function (t, i) {
      if (i % 2) return;
      const q = W([t.x, t.y]),
        r = Math.min(9, t.r * 0.7);
      m.beginPath();
      m.arc(q[0], q[1], r, 0, 6.283);
      m.stroke();
      m.beginPath();
      m.arc(q[0], q[1], 1, 0, 6.283);
      m.stroke();
    });
    palms.forEach(function (p) {
      const q = W(p);
      m.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * 6.283;
        m.moveTo(q[0], q[1]);
        m.lineTo(q[0] + Math.cos(a) * 5, q[1] + Math.sin(a) * 5);
      }
      m.stroke();
    });

    // Khesra numbers
    vis.sort((a, b) => (a.q[1] - b.q[1]) * 3 + (a.q[0] - b.q[0]));
    m.fillStyle = "rgba(70,52,34,.75)";
    m.font = "italic 10px " + serif;
    m.textAlign = "center";
    vis.forEach(function (v, i) {
      if (i % 2) return;
      m.fillText(String(401 + i), v.q[0], v.q[1] + 3);
    });

    // Shrine and anchal office
    const sq = W([522, 385]);
    m.strokeStyle = ink;
    m.lineWidth = 1.2;
    m.beginPath();
    m.arc(sq[0], sq[1], 6, 0, 6.283);
    m.stroke();
    m.beginPath();
    m.moveTo(sq[0] - 4, sq[1]);
    m.lineTo(sq[0] + 4, sq[1]);
    m.moveTo(sq[0], sq[1] - 4);
    m.lineTo(sq[0], sq[1] + 4);
    m.stroke();
    m.font = "italic 11px " + serif;
    m.fillStyle = ink;
    m.textAlign = "left";
    m.fillText("Ghat and shrine", sq[0] + 10, sq[1] + 4);

    const oq = W([560, 190]);
    m.fillStyle = "#EFE5CB";
    m.fillRect(oq[0] - 11, oq[1] - 8, 22, 16);
    m.strokeStyle = ink;
    m.lineWidth = 1.4;
    m.strokeRect(oq[0] - 11, oq[1] - 8, 22, 16);
    m.beginPath();
    m.moveTo(oq[0] - 11, oq[1] - 8);
    m.lineTo(oq[0] + 11, oq[1] + 8);
    m.moveTo(oq[0] + 11, oq[1] - 8);
    m.lineTo(oq[0] - 11, oq[1] + 8);
    m.stroke();
    m.fillStyle = ink;
    m.font = "italic 12px " + serif;
    m.fillText("Anchal office", oq[0] + 16, oq[1] + 4);

    // Satellite frame
    const a1 = W([60, 300]),
      a2 = W([250, 470]);
    m.setLineDash([6, 5]);
    m.strokeStyle = "rgba(60,60,60,.7)";
    m.lineWidth = 1.2;
    m.strokeRect(a1[0], a1[1], a2[0] - a1[0], a2[1] - a1[1]);
    m.setLineDash([]);
    m.font = "italic 11px " + serif;
    m.fillStyle = "rgba(60,60,60,.85)";
    m.fillText("Satellite frame", a1[0] + 6, a2[1] - 6);

    // Parcel boundaries
    const SV = [
        [196, 180],
        [390, 148],
        [446, 300],
        [430, 396],
        [246, 422],
        [180, 300],
      ],
      MP = [
        [194, 178],
        [392, 147],
        [448, 301],
        [431, 398],
        [244, 424],
        [178, 300],
      ];
    poly(SV);
    m.save();
    m.clip();
    m.strokeStyle = "rgba(46,107,58,.35)";
    m.lineWidth = 0.8;
    for (let d = -800; d < 1600; d += 6) {
      m.beginPath();
      m.moveTo(d, 0);
      m.lineTo(d + 800, 800);
      m.stroke();
    }
    m.restore();
    poly(HIST);
    m.setLineDash([9, 6]);
    m.strokeStyle = "#B23A2A";
    m.lineWidth = 2.4;
    m.stroke();
    m.setLineDash([]);
    poly(SV);
    m.strokeStyle = "#2E6B3A";
    m.lineWidth = 2.6;
    m.stroke();
    poly(MP);
    m.setLineDash([1.5, 4]);
    m.lineCap = "round";
    m.strokeStyle = "#2F4E8C";
    m.lineWidth = 2;
    m.stroke();
    m.setLineDash([]);
    const pc = W([312, 250]);
    m.fillStyle = "#EFE5CB";
    m.fillRect(pc[0] - 38, pc[1] - 12, 76, 22);
    m.strokeStyle = ink;
    m.lineWidth = 1;
    m.strokeRect(pc[0] - 38, pc[1] - 12, 76, 22);
    m.fillStyle = "#2d2318";
    m.font = "bold 12px " + serif;
    m.textAlign = "center";
    m.fillText("DEMO-456", pc[0], pc[1] + 4);
    m.restore();

    // Frame, ticks, cartouche, legend, scale, compass
    m.strokeStyle = "#4e3a26";
    m.lineWidth = 3;
    m.strokeRect(30, 30, MW - 60, MH - 60);
    m.lineWidth = 1;
    m.strokeRect(46, 46, MW - 92, MH - 92);
    m.font = "9px " + serif;
    m.fillStyle = "#4e3a26";
    m.textAlign = "center";
    for (let gx = 0; gx < 11; gx++) {
      const x2 = 46 + ((MW - 92) * gx) / 10;
      m.beginPath();
      m.moveTo(x2, 30);
      m.lineTo(x2, 46);
      m.moveTo(x2, MH - 46);
      m.lineTo(x2, MH - 30);
      m.stroke();
      m.fillText(String.fromCharCode(65 + gx), x2 + (MW - 92) / 20, 41);
    }
    for (let gy = 0; gy < 7; gy++) {
      const y2 = 46 + ((MH - 92) * gy) / 6;
      m.beginPath();
      m.moveTo(30, y2);
      m.lineTo(46, y2);
      m.moveTo(MW - 46, y2);
      m.lineTo(MW - 30, y2);
      m.stroke();
      if (gy < 6) m.fillText(String(gy + 1), 38, y2 + (MH - 92) / 12 + 3);
    }

    function box(bx: number, by: number, bw: number, bh: number) {
      m.fillStyle = "rgba(239,229,203,.95)";
      m.fillRect(bx, by, bw, bh);
      m.strokeStyle = "#4e3a26";
      m.lineWidth = 1.2;
      m.strokeRect(bx, by, bw, bh);
      m.lineWidth = 0.6;
      m.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
    }
    box(70, 66, 270, 96);
    m.textAlign = "left";
    m.fillStyle = "#2d2318";
    m.font = "italic 12px " + serif;
    m.fillText("Survey sheet (synthetic)", 88, 92);
    m.font = "26px " + serif;
    m.fillText("Example Mauza A", 88, 122);
    m.font = "12px " + serif;
    m.fillText("Khata DEMO-128   Khesra DEMO-456", 88, 146);

    box(70, MH - 196, 250, 128);
    m.font = "italic 12px " + serif;
    m.fillStyle = "#2d2318";
    m.fillText("Boundaries of DEMO-456", 86, MH - 172);

    [
      ["#B23A2A", [9, 6], "Historical record, 1.20 ac"],
      ["#2E6B3A", [], "Survey, 1.02 ac"],
      ["#2F4E8C", [1.5, 4], "Mapped geometry, 1.0243 ac"],
    ].forEach(function (l, i) {
      const y3 = MH - 150 + i * 22;
      m.setLineDash(l[1] as number[]);
      m.strokeStyle = l[0] as string;
      m.lineWidth = 2.4;
      m.beginPath();
      m.moveTo(86, y3);
      m.lineTo(118, y3);
      m.stroke();
      m.setLineDash([]);
      m.font = "12px " + serif;
      m.fillText(l[2] as string, 128, y3 + 4);
    });

    const sx = MW - 330,
      sy = MH - 74;
    m.fillStyle = "#2d2318";
    for (let k = 0; k < 4; k++) {
      m.fillStyle = k % 2 ? "#EFE5CB" : "#2d2318";
      m.fillRect(sx + k * 45, sy, 45, 7);
    }
    m.strokeStyle = "#2d2318";
    m.lineWidth = 1;
    m.strokeRect(sx, sy, 180, 7);
    m.fillStyle = "#2d2318";
    m.font = "10px " + serif;
    m.textAlign = "center";
    [0, 50, 100, 150, 200].forEach(function (v, i) {
      m.fillText(String(v), sx + i * 45, sy - 5);
    });
    m.fillText("metres", sx + 90, sy + 20);

    const cx = MW - 96,
      cy = MH - 120;
    m.strokeStyle = "#4e3a26";
    m.lineWidth = 1;
    m.beginPath();
    m.arc(cx, cy, 30, 0, 6.283);
    m.stroke();
    m.beginPath();
    m.arc(cx, cy, 24, 0, 6.283);
    m.stroke();
    m.fillStyle = "#4e3a26";
    m.beginPath();
    m.moveTo(cx, cy - 40);
    m.lineTo(cx + 7, cy);
    m.lineTo(cx, cy + 40);
    m.lineTo(cx - 7, cy);
    m.closePath();
    m.fill();
    m.fillStyle = "#B5532E";
    m.beginPath();
    m.moveTo(cx, cy - 40);
    m.lineTo(cx + 7, cy);
    m.lineTo(cx - 7, cy);
    m.fill();
    m.fillStyle = "#4e3a26";
    m.beginPath();
    m.moveTo(cx - 40, cy);
    m.lineTo(cx, cy - 5);
    m.lineTo(cx + 40, cy);
    m.lineTo(cx, cy + 5);
    m.closePath();
    m.globalAlpha = 0.6;
    m.fill();
    m.globalAlpha = 1;
    m.font = "bold 13px " + serif;
    m.fillText("N", cx, cy - 46);

    // Paper grain and worn edges
    const nz = document.createElement("canvas");
    nz.width = nz.height = 160;
    const nc = nz.getContext("2d")!,
      nid = nc.createImageData(160, 160);
    for (let i = 0; i < nid.data.length; i += 4) {
      const v = MR() * 255;
      nid.data[i] = nid.data[i + 1] = nid.data[i + 2] = v;
      nid.data[i + 3] = 255;
    }
    nc.putImageData(nid, 0, 0);
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalAlpha = 0.07;
    m.globalCompositeOperation = "multiply";
    m.fillStyle = m.createPattern(nz, "repeat")!;
    m.fillRect(0, 0, mc.width, mc.height);
    m.globalCompositeOperation = "source-over";
    m.globalAlpha = 1;

    const vg = m.createRadialGradient(
      mc.width / 2,
      mc.height / 2,
      mc.height * 0.45,
      mc.width / 2,
      mc.height / 2,
      mc.width * 0.62
    );
    vg.addColorStop(0, "rgba(120,80,30,0)");
    vg.addColorStop(1, "rgba(120,80,30,.22)");
    m.fillStyle = vg;
    m.fillRect(0, 0, mc.width, mc.height);

    cachedSurveyDataUrl = mc.toDataURL("image/jpeg", 0.88);
    return cachedSurveyDataUrl;
  }

  function drawSatThumbs(canvasA: HTMLCanvasElement, canvasB: HTMLCanvasElement) {
    if (!painting) return;
    const sx = (60 + OX) * K,
      sy = (300 + OY) * K,
      sw = 190 * K,
      sh = 170 * K * 0.75;
    const ca = canvasA.getContext("2d");
    if (ca) {
      ca.filter = "saturate(.55) sepia(.3) brightness(1.04) contrast(.92)";
      ca.drawImage(painting, sx, sy, sw, sh, 0, 0, 240, 160);
      ca.filter = "none";
    }
    const cb = canvasB.getContext("2d");
    if (cb) {
      cb.drawImage(painting, sx, sy, sw, sh, 0, 0, 240, 160);
    }
  }

  engineInstance = {
    registerInstance: function (id, host, cv, mini) {
      const stage = (host.querySelector(".stage") as HTMLElement) || host;
      const ctx = cv.getContext("2d")!;
      const I: MapInstance = {
        id: id,
        host: host,
        cv: cv,
        ctx: ctx,
        w: 0,
        h: 0,
        dpr: 1,
        mini: mini,
        view: id === "mapHome" ? { x: -OX, y: -380, w: WW, h: 740 } : { x: 0, y: 0, w: VW, h: VH },
      };

      function size() {
        I.w = stage.offsetWidth || host.offsetWidth;
        I.h = stage.offsetHeight || host.offsetHeight;
        I.dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.max(1, Math.round(I.w * I.dpr));
        cv.height = Math.max(1, Math.round(I.h * I.dpr));
        if (reduce && painted) draw(I, 9);
      }

      let ro: ResizeObserver | null = null;
      if (typeof window !== "undefined" && window.ResizeObserver) {
        ro = new ResizeObserver(size);
        ro.observe(stage);
      } else {
        window.addEventListener("resize", size);
      }
      size();

      instances.push(I);

      // Event listener for pointer tracking in this canvas
      const toVB = (e: PointerEvent) => {
        const r = cv.getBoundingClientRect();
        if (!r.width) return;
        const fx = ((e.clientX - r.left) / r.width) * I.w;
        const fy = ((e.clientY - r.top) / r.height) * I.h;
        const m = mapOf(I);
        ptr.x = (fx - m.tx) / m.s;
        ptr.y = (fy - m.ty) / m.s;
        ptr.on = true;
      };

      if (id === "mapHome") {
        const bgMove = (e: PointerEvent) => {
          if (
            e.target &&
            (e.target as HTMLElement).closest &&
            (e.target as HTMLElement).closest("#mapCase")
          )
            return;
          toVB(e);
        };
        window.addEventListener("pointermove", bgMove as EventListener);
        window.addEventListener("pointerdown", bgMove as EventListener);
        const leaveHandler = () => {
          ptr.on = false;
        };
        document.documentElement.addEventListener("mouseleave", leaveHandler);
      } else {
        host.addEventListener("pointermove", toVB as EventListener);
        host.addEventListener("pointerdown", toVB as EventListener);
        const hostLeave = () => {
          ptr.on = false;
        };
        host.addEventListener("pointerleave", hostLeave);
      }

      return () => {
        const idx = instances.indexOf(I);
        if (idx !== -1) instances.splice(idx, 1);
        if (ro) ro.disconnect();
        else window.removeEventListener("resize", size);
      };
    },
    setPointer: function (x, y, on) {
      ptr.x = x;
      ptr.y = y;
      ptr.on = on;
    },
    getSurveyMapDataUrl: drawSurveyMap,
    drawSatThumbs: drawSatThumbs,
    isReady: () => painted,
    onReady: (cb) => {
      if (painted) cb();
      readyCallbacks.push(cb);
      return () => {
        readyCallbacks = readyCallbacks.filter((c) => c !== cb);
      };
    },
  };

  return engineInstance;
}
