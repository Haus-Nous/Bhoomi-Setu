"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation, useLocale } from "@/components/locale-context";

// Seeded PRNG for deterministic rendering
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

let sharedPainting: HTMLCanvasElement | null = null;
let sharedPalmSprites: { x: number; y: number; c: HTMLCanvasElement; ph: number }[] = [];
let sharedIsPaintingReady = false;
const paintReadyListeners: (() => void)[] = [];

function notifyPaintReady() {
  sharedIsPaintingReady = true;
  paintReadyListeners.forEach((l) => l());
}

export function getSharedPainting() {
  return { painting: sharedPainting, ready: sharedIsPaintingReady };
}

// Generate offscreen painting once
function initPainting() {
  if (sharedPainting || typeof window === "undefined") return;

  const VW = 600,
    VH = 560,
    K = 2.5,
    WW = 1080,
    WH = 980;
  let OX = 240,
    OY = 380;
  const R = mulberry(20261018);
  function rnd(a: number, b: number) {
    return a + (b - a) * R();
  }
  function H(c: number[], a?: number) {
    return (
      "hsla(" +
      c[0].toFixed(1) +
      "," +
      c[1].toFixed(1) +
      "%," +
      c[2].toFixed(1) +
      "%," +
      (a == null ? 1 : a) +
      ")"
    );
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
  function smooth(pts: number[][], closed: boolean, step?: number) {
    const out: number[][] = [],
      n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      let p0: number[],
        p1 = pts[i],
        p2 = pts[(i + 1) % n],
        p3: number[];
      if (closed) {
        p0 = pts[(i - 1 + n) % n];
        p3 = pts[(i + 2) % n];
      } else {
        p0 = pts[Math.max(i - 1, 0)];
        p3 = pts[Math.min(i + 2, n - 1)];
      }
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]),
        m = Math.max(2, Math.ceil(d / (step || 3)));
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
  function lerp(a: number[], b: number[], t: number) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  const painting = document.createElement("canvas");
  painting.width = WW * K;
  painting.height = WH * K;
  let P: CanvasRenderingContext2D | null = painting.getContext("2d");
  if (!P) return;

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
    const a = [],
      cx = 528,
      cy = 332;
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2,
        r = 1 + rnd(-0.12, 0.12),
        x = Math.cos(t) * 50 * r,
        y = Math.sin(t) * 30 * r,
        ro = -0.3;
      a.push([cx + x * Math.cos(ro) - y * Math.sin(ro), cy + x * Math.sin(ro) + y * Math.cos(ro)]);
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
    const a = [],
      cx = 742,
      cy = 468;
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2,
        r = 1 + rnd(-0.12, 0.12),
        x = Math.cos(t) * 62 * r,
        y = Math.sin(t) * 36 * r,
        ro = 0.25;
      a.push([cx + x * Math.cos(ro) - y * Math.sin(ro), cy + x * Math.sin(ro) + y * Math.cos(ro)]);
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

  const lakePath = toPath(lakeP),
    pondPath = toPath(pondP),
    pond2Path = toPath(pond2P),
    islandPath = toPath(islandP),
    island2Path = toPath(island2P),
    topPath = toPath(topP);

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

  const wmask = (function () {
    const c = document.createElement("canvas");
    c.width = WW;
    c.height = WH;
    const x = c.getContext("2d");
    if (!x) return new Uint8Array(WW * WH);
    x.translate(OX, OY);
    x.fillStyle = "#000";
    x.fill(lakePath);
    x.fill(pondPath);
    x.fill(pond2Path);
    x.fill(topPath);
    x.globalCompositeOperation = "destination-out";
    x.fill(islandPath);
    x.fill(island2Path);
    const d = x.getImageData(0, 0, WW, WH).data,
      m = new Uint8Array(WW * WH);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
    return m;
  })();

  function inWater(p: number[]) {
    const x = Math.round(p[0] + OX),
      y = Math.round(p[1] + OY);
    if (x < 0 || y < 0 || x >= WW || y >= WH) return inWaterExact(p);
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

  for (let fi = -12; fi <= 12; fi++)
    for (let fj = -14; fj <= 14; fj++) {
      const q = [V(fi, fj), V(fi + 1, fj), V(fi + 1, fj + 1), V(fi, fj + 1)],
        c = cent(q);
      if (
        c[0] < -OX - 50 ||
        c[0] > WW - OX + 50 ||
        c[1] < -OY - 50 ||
        c[1] > WH - OY + 50
      )
        continue;
      if (R() < 0.35) {
        const m1 = lerp(q[0], q[1], 0.5 + rnd(-0.15, 0.15)),
          m2 = lerp(q[3], q[2], 0.5 + rnd(-0.15, 0.15));
        fields.push([q[0], m1, m2, q[3]], [m1, q[1], q[2], m2]);
      } else fields.push(q);
    }

  const FT: [string, number, number[]][] = [
    ["paddy", 0.3, [94, 52, 39]],
    ["young", 0.14, [82, 62, 49]],
    ["mustard", 0.12, [50, 84, 56]],
    ["wheat", 0.13, [42, 62, 60]],
    ["fallow", 0.12, [27, 36, 46]],
    ["cane", 0.08, [106, 44, 28]],
    ["veg", 0.11, [96, 44, 41]],
  ];
  function pickType() {
    const r = R();
    let a = 0;
    for (let i = 0; i < FT.length; i++) {
      a += FT[i][1];
      if (r < a) return FT[i];
    }
    return FT[0];
  }

  function lines(
    c: number[],
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

    const path = toPath(ins),
      xs = ins.map((p) => p[0]),
      ys = ins.map((p) => p[1]),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys),
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
    for (let k = 0; k < n; k++)
      dab(
        rnd(x0, x1),
        rnd(y0, y1),
        rnd(6, 13),
        rnd(1.3, 2.4),
        fa + rnd(-0.12, 0.12),
        J(base, 4, 6, 8),
        rnd(0.5, 0.85)
      );
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
    if (t[0] === "mustard")
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
    if (t[0] === "wheat")
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
    if (t[0] === "cane")
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

  type Hut = { x: number; y: number; w: number; d: number; a: number; type: string; court: boolean };
  const huts: Hut[] = [],
    trees: { x: number; y: number; r: number; c: number[] }[] = [],
    palms: number[][] = [],
    cows: [number, number, number, boolean][] = [],
    stacks: [number, number, number][] = [];

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
      if (Math.hypot(trees[i].x - p[0], trees[i].y - p[1]) < (trees[i].r + r) * 0.72) return false;
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
      x0 = Math.max(-OX, Math.min(...xs)),
      x1 = Math.min(WW - OX, Math.max(...xs)),
      y0 = Math.max(-OY, Math.min(...ys)),
      y1 = Math.min(WH - OY, Math.max(...ys));
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
        dab(p2[0], p2[1], rnd(2.5, 4), rnd(2, 3.2), rnd(0, 3), J([100, 42, 36], 5, 5, 5), 0.85, false);
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
  }

  function paintTree(t: { x: number; y: number; r: number; c: number[] }) {
    const x = t.x,
      y = t.y,
      r = t.r,
      b = t.c;
    for (let k = 0; k < 6; k++)
      dab(x + r * 0.55 + rnd(-r * 0.3, r * 0.3), y + r * 0.5 + rnd(-r * 0.3, r * 0.3), r * 1.1, r * 0.75, rnd(0, 3), [100, 30, 12], 0.17, false);
    const n = Math.round(10 + r * r * 0.45);
    for (let k = 0; k < n * 0.55; k++) {
      const a = rnd(0, 6.283),
        dd = Math.sqrt(R()) * r;
      dab(x + Math.cos(a) * dd, y + Math.sin(a) * dd * 0.92, r * rnd(0.4, 0.6), r * rnd(0.25, 0.38), rnd(0, 3.14), J([b[0], b[1], b[2] - 8], 5, 5, 4), rnd(0.75, 0.95), r > 8);
    }
  }

  function paintPalmShadow(p: number[]) {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * 6.283 + rnd(-0.2, 0.2),
        len = rnd(9, 12);
      dab(p[0] + 3 + Math.cos(a) * len * 0.5, p[1] + 3 + Math.sin(a) * len * 0.5, len, 2.2, a, [100, 30, 12], 0.18, false);
    }
  }

  function paintPalm(p: number[]) {
    const f = 9;
    for (let k = 0; k < f; k++) {
      const a = (k / f) * 6.283 + rnd(-0.2, 0.2),
        len = rnd(9, 12);
      const col = J([96, 48, 31], 6, 6, 6),
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

  // Draw ops
  I0();
  P.globalAlpha = 1;
  P.fillStyle = H([38, 30, 57]);
  P.fillRect(-OX, -OY, WW, WH);

  for (let oc = 0; oc < 15; oc++) {
    for (let k = 0; k < 200; k++)
      dab(rnd(-OX, WW - OX), rnd(-OY, WH - OY), rnd(4, 9), rnd(1, 2), rnd(0, 3.14), J([40, 28, 56], 8, 8, 8), rnd(0.4, 0.8));
  }

  fields
    .map((q) => {
      const c = cent(q);
      return { q, k: c[0] + c[1] + rnd(-160, 160) };
    })
    .sort((a, b) => a.k - b.k)
    .forEach((f) => paintField(f.q));

  [road1, road2].forEach((rd) => {
    for (let s = 0; s < rd.length; s += 50) paintRoad(rd, 7, s, s + 50);
  });

  paintWaterBase(lakePath, lakeP);
  paintWaterChunk(lakePath, lakeP, 120);
  paintShore(lakePath, lakeP);

  paintWaterBase(pondPath, pondP);
  paintWaterChunk(pondPath, pondP, 80);
  paintShore(pondPath, pondP);

  paintWaterBase(topPath, topP);
  paintWaterChunk(topPath, topP, 120);

  huts.forEach((h) => paintHut(h));
  trees.forEach((t) => paintTree(t));

  sharedPalmSprites = [];
  palms.forEach((pp) => {
    paintPalmShadow(pp);
    const sc = document.createElement("canvas");
    sc.width = sc.height = Math.ceil(36 * K);
    const sP = P,
      sx = OX,
      sy = OY;
    const ctx = sc.getContext("2d");
    if (ctx) {
      // @ts-ignore
      P = ctx;
      // @ts-ignore
      OX = 18 - pp[0];
      // @ts-ignore
      OY = 18 - pp[1];
      paintPalm(pp);
      P = sP;
      // @ts-ignore
      OX = sx;
      // @ts-ignore
      OY = sy;
      sharedPalmSprites.push({ x: pp[0], y: pp[1], c: sc, ph: rnd(0, 6.28) });
    }
  });

  // Finish grain
  I0();
  const gr = P.createLinearGradient(-OX, -OY, WW - OX, WH - OY);
  gr.addColorStop(0, "rgba(255,214,140,.16)");
  gr.addColorStop(0.55, "rgba(255,214,140,0)");
  gr.addColorStop(1, "rgba(30,40,90,.12)");
  P.globalAlpha = 1;
  P.fillStyle = gr;
  P.fillRect(-OX, -OY, WW, WH);

  sharedPainting = painting;
  notifyPaintReady();
}

export function PaintedScene({
  mode = "background",
  caseId = "demo-family-001",
}: {
  mode?: "background" | "case";
  caseId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState({ hist: true, surv: true, mapd: true });
  const [zoom, setZoom] = useState(1);
  const [showFloat, setShowFloat] = useState(true);
  const { locale } = useLocale();

  const isCase = mode === "case";
  const VW = 600,
    VH = 560,
    WW = 1080,
    WH = 980,
    OX = 240,
    OY = 380;

  useEffect(() => {
    initPainting();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastT: number | null = null;
    let ptr = { x: -999, y: -999, on: false };

    // Shimmer points in water
    const shimmer: { x: number; y: number; l: number; w: number; ph: number; sp: number }[] = [];
    for (let i = 0; i < 300; i++) {
      shimmer.push({
        x: -100 + Math.random() * 800,
        y: 200 + Math.random() * 400,
        l: 2 + Math.random() * 4,
        w: 0.5 + Math.random() * 0.4,
        ph: Math.random() * 6.28,
        sp: 0.8 + Math.random() * 0.8,
      });
    }

    // Birds
    const birds = [
      { x: -100, y: 150, vx: 26, vy: -5, ph: 0, fear: 0, sc: 1.1 },
      { x: -120, y: 170, vx: 26, vy: -5, ph: 1.2, fear: 0, sc: 1.0 },
      { x: -140, y: 160, vx: 26, vy: -5, ph: 2.1, fear: 0, sc: 1.05 },
      { x: 340, y: 440, vx: 0, vy: 0, ph: 0, fear: 0, sc: 1.0, rest: true, home: [340, 440] },
      { x: 490, y: 350, vx: 0, vy: 0, ph: 0.8, fear: 0, sc: 1.05, rest: true, home: [490, 350] },
    ];

    function handlePointer(e: PointerEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const view = isCase ? { x: 0, y: 0, w: VW, h: VH } : { x: -OX, y: -380, w: WW, h: 740 };
      const s = Math.max(canvas.width / (view.w * (window.devicePixelRatio || 1)), canvas.height / (view.h * (window.devicePixelRatio || 1)));
      const tx = (canvas.width / (window.devicePixelRatio || 1) - view.w * s) / 2 - view.x * s;
      const ty = (canvas.height / (window.devicePixelRatio || 1) - view.h * s) / 2 - view.y * s;
      ptr.x = (e.clientX - r.left - tx) / s;
      ptr.y = (e.clientY - r.top - ty) / s;
      ptr.on = true;
    }

    function handlePointerLeave() {
      ptr.on = false;
    }

    window.addEventListener("pointermove", handlePointer);
    window.addEventListener("pointerleave", handlePointerLeave);

    function resize() {
      if (!canvas || !containerRef.current) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = containerRef.current.offsetWidth || (isCase ? 500 : window.innerWidth);
      const h = containerRef.current.offsetHeight || (isCase ? 520 : window.innerHeight);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    }
    resize();
    window.addEventListener("resize", resize);

    function frame(now: number) {
      if (!canvas || !ctx) return;
      const t = now / 1000;
      const dt = lastT == null ? 0.016 : Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const view = isCase ? { x: 0, y: 0, w: VW, h: VH } : { x: -OX, y: -380, w: WW, h: 740 };
      const s = Math.max(w / view.w, h / view.h);
      const tx = (w - view.w * s) / 2 - view.x * s;
      const ty = (h - view.h * s) / 2 - view.y * s;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#6f8a45";
      ctx.fillRect(0, 0, w, h);

      if (sharedPainting) {
        ctx.drawImage(sharedPainting, tx - OX * s, ty - OY * s, WW * s, WH * s);
      }

      // Live layer in map coordinates
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * tx, dpr * ty);

      // Shimmer
      ctx.lineWidth = 0.6;
      ctx.lineCap = "round";
      for (let i = 0; i < shimmer.length; i++) {
        const sm = shimmer[i];
        const a = Math.pow(Math.max(0, Math.sin(t * sm.sp + sm.ph)), 4) * 0.55;
        if (a < 0.03) continue;
        ctx.strokeStyle = `rgba(236,246,236,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(sm.x - sm.l, sm.y);
        ctx.lineTo(sm.x + sm.l, sm.y);
        ctx.stroke();
      }

      // Birds update and render
      birds.forEach((b) => {
        const dxp = b.x - ptr.x;
        const dyp = b.y - ptr.y;
        const dp = Math.hypot(dxp, dyp) || 1;
        if (ptr.on && dp < 75) {
          b.fear = 1;
          b.vx += (dxp / dp) * 120 * dt;
          b.vy += (dyp / dp) * 120 * dt;
        } else {
          b.fear = Math.max(0, b.fear - dt * 0.4);
        }

        b.x += (b.vx || 24) * dt;
        b.y += (b.vy || -4) * dt;
        b.ph += dt * (b.fear > 0.2 ? 14 : 7);

        if (b.x > WW - OX + 50) {
          b.x = -OX - 50;
          b.y = 100 + Math.random() * 200;
        }

        // Draw bird
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.sc, b.sc);
        const span = 0.7 + 0.3 * Math.cos(b.ph);
        ctx.strokeStyle = "rgba(10,20,10,0.2)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6 * span, -Math.sin(b.ph) * 3);
        ctx.lineTo(0, 0);
        ctx.lineTo(6 * span, -Math.sin(b.ph) * 3);
        ctx.stroke();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      });

      // Update minimap once painting is ready
      if (isCase && miniCanvasRef.current && sharedPainting) {
        const miniCtx = miniCanvasRef.current.getContext("2d");
        if (miniCtx) {
          miniCtx.drawImage(
            sharedPainting,
            (140 + OX) * 2.5,
            (90 + OY) * 2.5,
            360 * 2.5,
            370 * 2.5,
            0,
            0,
            miniCanvasRef.current.width,
            miniCanvasRef.current.height
          );
        }
      }

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, [isCase]);

  if (!isCase) {
    return (
      <div id="mapHome" className="hero-map scene-bg" aria-hidden="true" ref={containerRef}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    );
  }

  return (
    <div className="tile c7 maptile" id="mapCase" ref={containerRef}>
      <div className="stage" style={{ transform: `scale(${zoom})` }}>
        <canvas ref={canvasRef} className="paint" aria-hidden="true" />
        <svg
          className="map"
          viewBox="0 0 600 560"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Painted view of a village around the parcel"
        >
          {layers.hist && (
            <>
              <path
                data-layer="hist"
                d="M168 150 L408 110 L476 300 L458 418 L232 452 L150 300 Z M196 180 L390 148 L446 300 L430 396 L246 422 L180 300 Z"
                fill="#E5483B"
                fillOpacity=".26"
                fillRule="evenodd"
              />
              <path
                data-layer="hist"
                d="M168 150 L408 110 L476 300 L458 418 L232 452 L150 300 Z"
                fill="none"
                stroke="#fff"
                strokeWidth="1.6"
                strokeDasharray="6 5"
                strokeOpacity=".9"
              />
            </>
          )}
          {layers.surv && (
            <path
              data-layer="surv"
              d="M196 180 L390 148 L446 300 L430 396 L246 422 L180 300 Z"
              fill="#C9F31D"
              fillOpacity=".12"
              stroke="#fff"
              strokeWidth="2.2"
            />
          )}
          {layers.mapd && (
            <path
              data-layer="mapd"
              d="M194 178 L392 147 L448 301 L431 398 L244 424 L178 300 Z"
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              strokeDasharray="1.5 4"
              strokeLinecap="round"
            />
          )}
          <text
            x="312"
            y="295"
            textAnchor="middle"
            fill="#fff"
            stroke="rgba(20,30,15,.45)"
            strokeWidth="3"
            style={{ paintOrder: "stroke" }}
            fontFamily="Outfit,system-ui,sans-serif"
            fontSize="14"
            fontWeight="500"
          >
            DEMO-456
          </text>
        </svg>
      </div>

      <div className="layers" role="group" aria-label="Show or hide a boundary" style={{ display: "none" }}>
        <button
          aria-pressed={layers.hist}
          onClick={() => setLayers((l) => ({ ...l, hist: !l.hist }))}
        >
          <i style={{ color: "var(--hist)" }} />
          <span>{locale === "hi" ? "पुराना रिकॉर्ड" : "Historical"}</span>
        </button>
        <button
          aria-pressed={layers.surv}
          onClick={() => setLayers((l) => ({ ...l, surv: !l.surv }))}
        >
          <i style={{ color: "#7DC242" }} />
          <span>{locale === "hi" ? "सर्वे" : "Survey"}</span>
        </button>
        <button
          aria-pressed={layers.mapd}
          onClick={() => setLayers((l) => ({ ...l, mapd: !l.mapd }))}
        >
          <i style={{ color: "var(--ink)", borderTopStyle: "dotted" }} />
          <span>{locale === "hi" ? "नक्शा" : "Mapped"}</span>
        </button>
      </div>

      <button
        className="fs"
        aria-label="Fit parcel"
        onClick={() => setZoom(1)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {showFloat && (
        <div className="float">
          <div className="t-h">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 18 L8 6 L16 8 L21 18 Z" fill="currentColor" />
            </svg>
            <span>{locale === "hi" ? "रकबे का अंतर" : "Area difference"}</span>
          </div>
          <div className="val">
            <span>
              <span className="t-sub">{locale === "hi" ? "5% सीमा से ऊपर" : "Above 5% limit"}</span>
              <div className="spark" aria-hidden="true">
                <span style={{ height: "100%", background: "var(--hist)" }} />
                <span style={{ height: "85%", background: "#7DC242" }} />
                <span style={{ height: "85.4%", background: "#fff" }} />
              </div>
            </span>
            <b>0.18 ac</b>
          </div>
          <div className="acts">
            <a href="#differences">{locale === "hi" ? "देखें" : "Review"}</a>
            <button onClick={() => setShowFloat(false)}>{locale === "hi" ? "छिपाएँ" : "Hide"}</button>
          </div>
        </div>
      )}

      <div className="map-ctl">
        <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}>
          <svg viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.2))}>
          <svg viewBox="0 0 24 24">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <div className="mini" aria-hidden="true">
        <canvas ref={miniCanvasRef} width={148} height={148} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    </div>
  );
}
