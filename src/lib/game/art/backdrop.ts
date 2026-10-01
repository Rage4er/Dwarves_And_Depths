// §5.4 Фон боя: 5 слоёв параллакса (дальние скалы, средние камни, светящиеся
// руны, ближние камни с землёй, дымка) × 3 тира глубины. Тайлятся по X.

import { makeGrid, put, rect, hspan, gridToDataUrl, mulberry } from './px';
import { DEPTH_TIERS } from './palette';
import type { Grid } from './px';

const W = 220;
const H = 120;

// Рисует «с заворотом»: каждый штрих дублируется на x−W и x+W, чтобы шов совпал.
function wrapSpan(g: Grid, x: number, y: number, len: number, c: string): void {
  for (let i = 0; i < len; i++) {
    const xx = ((x + i) % W + W) % W;
    put(g, xx, y, c);
  }
}

function wrapPut(g: Grid, x: number, y: number, c: string): void {
  wrapSpan(g, x, y, 1, c);
}

function sky(t: number): Grid {
  const g = makeGrid(W, H, DEPTH_TIERS[t].sky[0]);
  const colors = DEPTH_TIERS[t].sky;
  const band = Math.floor(H / colors.length);
  colors.forEach((c, i) => {
    for (let y = i * band; y < (i + 1) * band; y++) hspan(g, 0, y, W, c);
  });
  // слабое свечение сверху-по-центру
  const glow = DEPTH_TIERS[t].crystal;
  for (let i = 0; i < 60; i++) {
    const x = 90 + (i % 20);
    const y = 2 + Math.floor(i / 20) * 2;
    put(g, x, y, i % 3 === 0 ? glow : colors[0]);
  }
  return g;
}

function farPeaks(t: number): Grid {
  const g = makeGrid(W, H);
  const p = DEPTH_TIERS[t];
  const rnd = mulberry(t * 101 + 1);
  let x = 0;
  while (x < W) {
    const w = 28 + Math.floor(rnd() * 34);
    const h = 24 + Math.floor(rnd() * 26);
    for (let i = 0; i < w; i++) {
      const peak = Math.round(h * (1 - Math.abs(i / w - 0.5) * 2));
      for (let y = H - peak; y < H; y++) wrapPut(g, x + i, y, y > H - peak + 3 ? p.rockDark : p.rock);
      wrapPut(g, x + i, H - peak, p.rockLit);
    }
    // вершина-кристалл
    if (rnd() < 0.4) wrapPut(g, x + Math.floor(w / 2), H - h - 7, p.crystal);
    x += Math.floor(w * 0.72);
  }
  return g;
}

function midRocks(t: number): Grid {
  const g = makeGrid(W, H);
  const p = DEPTH_TIERS[t];
  const rnd = mulberry(t * 202 + 2);
  let x = 4;
  while (x < W) {
    const w = 18 + Math.floor(rnd() * 26);
    const h = 12 + Math.floor(rnd() * 18);
    const baseY = H - 14;
    for (let iy = 0; iy < h; iy++) {
      const inset = Math.round((1 - iy / h) * (w * 0.22));
      wrapSpan(g, x + inset, baseY - iy, Math.max(2, w - inset * 2), iy % 4 === 0 ? p.rockDark : p.rock);
    }
    wrapSpan(g, x, baseY - h, w, p.rockLit);
    // кристалл на части камней
    if (rnd() < 0.5) {
      const cx = x + 4 + Math.floor(rnd() * (w - 8));
      const ch = 4 + Math.floor(rnd() * 5);
      for (let i = 0; i < ch; i++) {
        wrapPut(g, cx, baseY - h - i - 1, i > ch - 3 ? p.crystalLit : p.crystal);
        if (i < ch - 2) wrapPut(g, cx - 1, baseY - h - i - 1, p.crystal);
        if (i < ch - 2) wrapPut(g, cx + 1, baseY - h - i - 1, p.crystal);
      }
    }
    x += w + 6 + Math.floor(rnd() * 14);
  }
  return g;
}

// Симметричный рунический глиф 5×7.
function runeGlyph(rnd: () => number): boolean[][] {
  const m: boolean[][] = Array.from({ length: 7 }, () => Array(5).fill(false));
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 3; x++) {
      if (rnd() < 0.42) {
        m[y][x] = true;
        m[y][4 - x] = true;
      }
    }
  }
  m[0][2] = true;
  m[6][2] = true;
  return m;
}

function runes(t: number): Grid {
  const g = makeGrid(W, H);
  const p = DEPTH_TIERS[t];
  const rnd = mulberry(t * 303 + 3);
  for (let i = 0; i < 8; i++) {
    const x = 10 + Math.floor(rnd() * (W - 20));
    const y = 12 + Math.floor(rnd() * 60);
    const glyph = runeGlyph(rnd);
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (!glyph[gy][gx]) continue;
        wrapPut(g, x + gx, y + gy, p.rune);
        if (gy === 0 || gy === 6 || gx === 0 || gx === 4) {
          // ореол вокруг
          wrapPut(g, x + gx, y + gy - 1, p.runeDim);
          wrapPut(g, x + gx, y + gy + 1, p.runeDim);
        }
      }
    }
  }
  return g;
}

function nearGround(t: number): Grid {
  const g = makeGrid(W, H);
  const p = DEPTH_TIERS[t];
  const rnd = mulberry(t * 404 + 4);
  // земля с шумом
  for (let y = H - 18; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = rnd();
      wrapPut(g, x, y, r < 0.12 ? p.groundLit : r < 0.2 ? p.rockDark : p.ground);
    }
  }
  hspan(g, 0, H - 18, W, p.groundLit);
  // сталагмиты
  let x = 2;
  while (x < W) {
    if (rnd() < 0.6) {
      const h = 8 + Math.floor(rnd() * 16);
      const w = 6 + Math.floor(rnd() * 8);
      for (let iy = 0; iy < h; iy++) {
        const inset = Math.round((iy / h) * (w * 0.45));
        wrapSpan(g, x + inset, H - 18 - iy, Math.max(1, w - inset * 2), iy > h - 3 ? p.rockLit : p.rockDark);
      }
    }
    x += 24 + Math.floor(rnd() * 40);
  }
  return g;
}

const LAYERS = [sky, farPeaks, midRocks, runes, nearGround];

export function backdropLayerUrl(tier: number, layer: number, scale = 4): string {
  const t = Math.max(0, Math.min(DEPTH_TIERS.length - 1, tier));
  const draw = LAYERS[layer] ?? nearGround;
  return gridToDataUrl(draw(t), scale, `b:${t}:${layer}:${scale}`);
}
