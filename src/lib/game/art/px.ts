// §5 Пиксельный холст: логическая сетка + примитивы рисования.
// Рендер в PNG dataURL с кэшем — никаких внешних ассетов, всё генерируется кодом.

export type Grid = {
  w: number;
  h: number;
  data: (string | null)[][];
};

export function makeGrid(w: number, h: number, bg: string | null = null): Grid {
  return {
    w,
    h,
    data: Array.from({ length: h }, () => Array.from({ length: w }, () => bg)),
  };
}

export function put(g: Grid, x: number, y: number, c: string | null): void {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return;
  g.data[y][x] = c;
}

export function rect(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  for (let iy = 0; iy < h; iy++) for (let ix = 0; ix < w; ix++) put(g, x + ix, y + iy, c);
}

export function hspan(g: Grid, x: number, y: number, len: number, c: string): void {
  for (let i = 0; i < len; i++) put(g, x + i, y, c);
}

export function vspan(g: Grid, x: number, y: number, len: number, c: string): void {
  for (let i = 0; i < len; i++) put(g, x, y + i, c);
}

// Примерный диск: заполняет пиксели в радиусе r от центра.
export function disk(g: Grid, cx: number, cy: number, r: number, c: string): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r + r * 0.6) put(g, x, y, c);
    }
  }
}

export function paste(dst: Grid, src: Grid, ox: number, oy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.data[y][x];
      if (c) put(dst, ox + x, oy + y, c);
    }
  }
}

// Детерминированный PRNG для процедурных фонов.
export function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gridToCanvas(g: Grid, scale: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = g.w * scale;
  cv.height = g.h * scale;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const c = g.data[y][x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return cv;
}

const cache = new Map<string, string>();

export function gridToDataUrl(g: Grid, scale: number, cacheKey?: string): string {
  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit) return hit;
  }
  const cv = gridToCanvas(g, scale);
  if (!cv) return '';
  const url = cv.toDataURL('image/png');
  if (cacheKey) cache.set(cacheKey, url);
  return url;
}
