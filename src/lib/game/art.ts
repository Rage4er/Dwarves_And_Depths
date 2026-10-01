// §5 Процедурный пиксель-арт: буфер пикселей → canvas → dataURL (кэш по ключу).
// Спрайты персонажей рисуются в сетке 32×32 и растрируются ×3 (96×96, ТЗ §5),
// иконки предметов — 16×16 ×2 (32×32).

export class Px {
  readonly w: number;
  readonly h: number;
  private cells: (string | null)[];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cells = new Array<string | null>(w * h).fill(null);
  }

  set(x: number, y: number, c: string): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y * this.w + x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }

  hline(x1: number, x2: number, y: number, c: string): void {
    for (let x = x1; x <= x2; x++) this.set(x, y, c);
  }

  vline(x: number, y1: number, y2: number, c: string): void {
    for (let y = y1; y <= y2; y++) this.set(x, y, c);
  }

  disc(cx: number, cy: number, r: number, c: string): void {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r * r + 1) this.set(x, y, c);
      }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      this.set(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), c);
    }
  }

  outline(c: string): void {
    const snap = this.cells.slice();
    const at = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? snap[y * this.w + x] : null;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (at(x, y)) continue;
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.cells[y * this.w + x] = c;
      }
  }
}

const OUTLINE = '#191008';
export const BLANK_SPRITE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const cache = new Map<string, string>();

function raster(key: string, w: number, h: number, scale: number, draw: (p: Px) => void): string {
  const hit = cache.get(key);
  if (hit) return hit;
  // SSR/пререндер: canvas недоступен — заглушка (как в art/px.ts)
  if (typeof document === 'undefined') return BLANK_SPRITE;
  const p = new Px(w, h);
  draw(p);
  p.outline(OUTLINE);
  const cv = document.createElement('canvas');
  cv.width = w * scale;
  cv.height = h * scale;
  const ctx = cv.getContext('2d');
  if (!ctx) return BLANK_SPRITE;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = p['cells'][y * w + x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  const url = cv.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

// ── Гномы (§6.1): 6 именованных, лицо вправо ──

const SKIN = '#d9a066';
const SKIN_D = '#a9763f';
const EYE = '#1d130a';
const WOOD = '#7a4e26';
const LEATHER = '#6b4423';
const LEATHER_D = '#4a2f16';
const STEEL = '#9aa2ad';
const STEEL_D = '#697077';
const STEEL_L = '#c9d1da';
const GOLD = '#e0a63f';
const GOLD_D = '#a9782a';
const BONE = '#e8dcc7';
const BONE_D = '#b9a98d';
const HAIR = '#6b543f';

interface DwarfLook {
  helm: 'horned' | 'iron' | 'steel' | 'leather' | 'hat' | 'hood';
  beard: [string, string];
  body: 'plate' | 'chain' | 'leather' | 'robe';
  bodyColor?: string;
  weapon: 'axe' | 'staff' | 'bow' | 'shield';
  orb?: string;
  shieldRune?: boolean;
  braid?: boolean;
}

function drawDwarf(p: Px, L: DwarfLook): void {
  // оружие (за спиной/в руке)
  if (L.weapon === 'axe') {
    p.vline(25, 9, 25, WOOD);
    p.set(25, 21, LEATHER);
    p.rect(23, 7, 6, 6, STEEL);
    p.vline(28, 7, 12, STEEL_L);
    p.set(22, 10, STEEL_D);
  } else if (L.weapon === 'staff') {
    p.vline(25, 8, 26, WOOD);
    p.set(25, 9, GOLD);
    p.disc(25, 6, 2, L.orb ?? '#7fb2ff');
    p.set(26, 4, '#e8f4ff');
  } else if (L.weapon === 'bow') {
    p.vline(26, 8, 24, WOOD);
    p.vline(24, 9, 23, '#ded7c3');
    p.hline(24, 26, 8, WOOD);
    p.hline(24, 26, 24, WOOD);
    p.hline(23, 29, 16, '#c9a86a');
    p.set(29, 15, STEEL_L);
    p.set(29, 16, STEEL_L);
    p.set(23, 15, BONE);
    p.set(23, 17, BONE);
  }

  // ноги и сапоги
  p.rect(10, 25, 5, 3, LEATHER_D);
  p.rect(16, 25, 5, 3, LEATHER_D);
  p.rect(9, 28, 7, 2, '#3a2a18');
  p.rect(15, 28, 7, 2, '#3a2a18');

  // торс
  if (L.body === 'plate') {
    p.rect(9, 18, 13, 6, STEEL);
    p.rect(18, 18, 4, 6, STEEL_D);
    p.rect(9, 18, 13, 1, STEEL_L);
    p.vline(15, 19, 23, STEEL_D);
  } else if (L.body === 'chain') {
    p.rect(9, 18, 13, 6, '#7d838c');
    for (let y = 18; y <= 23; y += 2) for (let x = 10; x <= 21; x += 2) p.set(x, y, '#a7adb5');
  } else if (L.body === 'leather') {
    p.rect(9, 18, 13, 6, LEATHER);
    p.rect(18, 18, 4, 6, LEATHER_D);
    p.line(10, 19, 19, 23, LEATHER_D);
  } else {
    p.rect(8, 18, 15, 9, L.bodyColor ?? '#3f6b5a');
    p.rect(17, 18, 6, 9, L.bodyColor ? shade(L.bodyColor) : '#2e4f42');
    p.hline(8, 22, 26, GOLD_D);
  }
  p.rect(9, 24, 13, 1, '#241708');
  p.set(14, 24, GOLD);
  p.set(15, 24, GOLD);

  // рука к оружию
  if (L.weapon === 'axe') {
    p.set(21, 19, SKIN);
    p.set(22, 19, SKIN);
    p.set(23, 19, SKIN);
    p.set(24, 20, SKIN);
  } else if (L.weapon === 'bow') {
    p.line(20, 18, 25, 16, SKIN);
    p.set(26, 16, SKIN_D);
  } else if (L.weapon === 'staff') {
    p.set(21, 19, SKIN);
    p.set(22, 19, SKIN);
    p.set(23, 19, SKIN);
    p.set(24, 20, SKIN);
  }

  // голова
  p.rect(12, 9, 8, 6, SKIN);
  p.rect(13, 14, 6, 1, SKIN);
  p.set(14, 11, EYE);
  p.set(17, 11, EYE);
  p.set(13, 10, L.beard[1]);
  p.set(14, 10, L.beard[1]);
  p.set(16, 10, L.beard[1]);
  p.set(17, 10, L.beard[1]);
  p.set(19, 12, SKIN);
  p.set(20, 12, SKIN_D);
  p.set(11, 11, SKIN_D);

  // борода
  const B = L.beard;
  const rows: [number, number, number][] = [
    [13, 12, 19], [14, 11, 20], [15, 10, 21], [16, 10, 21], [17, 10, 21],
    [18, 11, 20], [19, 12, 19], [20, 13, 18], [21, 14, 17],
  ];
  for (const [y, a, b] of rows) {
    p.hline(a, b, y, y >= 20 ? B[1] : B[0]);
    p.set(b, y, B[1]);
  }
  p.hline(13, 17, 12, B[1]);
  p.set(12, 12, B[0]);
  p.set(18, 12, B[0]);
  if (L.braid) {
    p.set(11, 16, B[0]);
    p.set(11, 17, GOLD);
    p.set(11, 18, B[0]);
    p.set(11, 19, GOLD);
    p.set(20, 16, B[1]);
    p.set(20, 17, GOLD_D);
  }

  // шлем/головной убор
  if (L.helm === 'iron' || L.helm === 'horned' || L.helm === 'steel') {
    p.hline(13, 18, 4, STEEL);
    p.hline(12, 19, 5, STEEL);
    p.hline(11, 20, 6, STEEL);
    p.hline(11, 20, 7, STEEL_D);
    p.hline(10, 21, 8, STEEL);
    p.set(12, 7, GOLD);
    p.set(19, 7, GOLD);
    if (L.helm === 'iron') p.vline(15, 9, 10, STEEL_D);
    if (L.helm === 'horned') {
      p.set(10, 4, BONE);
      p.set(9, 3, BONE);
      p.set(9, 2, BONE_D);
      p.set(8, 1, BONE_D);
      p.set(21, 4, BONE);
      p.set(22, 3, BONE);
      p.set(22, 2, BONE_D);
      p.set(23, 1, BONE_D);
    }
    if (L.helm === 'steel') {
      p.hline(11, 20, 6, GOLD_D);
      p.set(15, 5, '#7dd3fc');
      p.set(16, 5, '#4aa8c8');
    }
  } else if (L.helm === 'leather') {
    p.hline(12, 19, 5, LEATHER);
    p.hline(11, 20, 6, LEATHER);
    p.hline(11, 20, 7, LEATHER_D);
    p.hline(10, 21, 8, '#3a2512');
    p.set(13, 6, '#c49a6c');
    p.set(18, 6, '#c49a6c');
  } else if (L.helm === 'hat') {
    p.hline(15, 17, 2, '#4a3f7a');
    p.hline(14, 18, 3, '#4a3f7a');
    p.hline(13, 19, 4, '#5a4d8f');
    p.hline(12, 20, 5, '#4a3f7a');
    p.hline(10, 22, 6, '#382f5e');
    p.hline(12, 19, 7, HAIR);
    p.hline(13, 19, 5, GOLD_D);
  } else {
    p.hline(14, 17, 4, '#3f6b4a');
    p.hline(12, 19, 5, '#3f6b4a');
    p.hline(11, 20, 6, '#35593e');
    p.hline(11, 20, 7, '#35593e');
    p.hline(10, 21, 8, '#2c4a33');
    p.vline(20, 8, 13, '#35593e');
    p.vline(10, 8, 9, '#35593e');
  }

  // щит (перед корпусом)
  if (L.weapon === 'shield') {
    p.rect(21, 8, 7, 15, STEEL_D);
    p.rect(22, 9, 5, 13, STEEL);
    p.vline(24, 9, 21, STEEL_L);
    p.rect(23, 14, 3, 3, GOLD);
    p.set(24, 15, GOLD_D);
    if (L.shieldRune) {
      p.set(24, 11, '#7dd3fc');
      p.set(23, 12, '#7dd3fc');
      p.set(25, 12, '#7dd3fc');
      p.set(24, 18, '#4aa8c8');
    }
  }
}

function shade(hex: string): string {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) - 28);
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) - 28);
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) - 28);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const DWARF_LOOK: Record<string, DwarfLook> = {
  d_brom: { helm: 'horned', beard: ['#8a5a30', '#5f3c1c'], body: 'plate', weapon: 'shield' },
  d_grim: { helm: 'iron', beard: ['#c96f2f', '#8f4a1a'], body: 'chain', weapon: 'axe' },
  d_thorvin: { helm: 'leather', beard: ['#b8b2a6', '#847e72'], body: 'robe', bodyColor: '#3f6b5a', weapon: 'staff', orb: '#5ae08a' },
  d_dvalin: { helm: 'steel', beard: ['#2e2a28', '#1a1715'], body: 'plate', weapon: 'shield', shieldRune: true },
  d_nori: { helm: 'hood', beard: ['#d9b45a', '#a87f2f'], body: 'leather', weapon: 'bow', braid: true },
  d_bofur: { helm: 'hat', beard: ['#e6e0d2', '#b3ac9c'], body: 'robe', bodyColor: '#4a3f7a', weapon: 'staff', orb: '#7fb2ff' },
};

const DWARF_BY_NAME: Record<string, string> = {
  'Бром': 'd_brom',
  'Грим': 'd_grim',
  'Торвин': 'd_thorvin',
  'Двалин': 'd_dvalin',
  'Нори': 'd_nori',
  'Бофур': 'd_bofur',
  'Бомбур': 'd_bombur',
  'Бифур': 'd_bifur',
  'Бофур II': 'd_bofur_2',
  'Балин': 'd_balin',
  'Бифур II': 'd_bifur_2',
  'Бомбур II': 'd_bombur_2',
  'Двалин II': 'd_dwalin_2',
  'Дори': 'd_dori',
  'Нори II': 'd_nori_2',
  'Оин': 'd_oin',
  'Глоин': 'd_gloin',
  'Балин II': 'd_balin_2',
  'Торин': 'd_thorin',
  'Фили': 'd_fili',
};

// v6.8: облик для каждого нового гнома (борода + броня/оружие из существующих наборов)
const EXTRA_LOOK: Record<string, DwarfLook> = {
  d_bombur: { helm: 'steel', beard: ['#c98a3e', '#8f5c22'], body: 'plate', weapon: 'shield' },
  d_bifur: { helm: 'horned', beard: ['#e8d8a0', '#b09050'], body: 'chain', weapon: 'axe', braid: true },
  d_bofur_2: { helm: 'hood', beard: ['#9aa0b8', '#6a7088'], body: 'leather', weapon: 'bow' },
  d_balin: { helm: 'hood', beard: ['#b8702e', '#8a4a1a'], body: 'robe', bodyColor: '#7a5a2e', weapon: 'staff', orb: '#ffd24d' },
  d_bifur_2: { helm: 'horned', beard: ['#d8c890', '#a08850'], body: 'plate', weapon: 'axe', braid: true },
  d_bombur_2: { helm: 'steel', beard: ['#b8803a', '#8a5a22'], body: 'plate', weapon: 'shield' },
  d_dwalin_2: { helm: 'steel', beard: ['#46424a', '#2a272e'], body: 'plate', weapon: 'shield', shieldRune: true },
  d_dori: { helm: 'hat', beard: ['#d88a4a', '#a85a22'], body: 'leather', weapon: 'bow', braid: true },
  d_nori_2: { helm: 'hood', beard: ['#e08a3e', '#a85a1c'], body: 'leather', weapon: 'bow', braid: true },
  d_oin: { helm: 'iron', beard: ['#c8a860', '#94783a'], body: 'chain', weapon: 'axe' },
  d_gloin: { helm: 'leather', beard: ['#b85a2e', '#8a3a18'], body: 'leather', weapon: 'staff', orb: '#ffe08a' },
  d_balin_2: { helm: 'iron', beard: ['#98783e', '#6a5024'], body: 'chain', weapon: 'axe', braid: true },
  d_thorin: { helm: 'steel', beard: ['#3a3640', '#241f2a'], body: 'plate', weapon: 'shield', shieldRune: true },
  d_fili: { helm: 'leather', beard: ['#e8cf8a', '#b89a55'], body: 'leather', weapon: 'bow', braid: true },
};

const ROLE_LOOK: Record<string, DwarfLook> = {
  tank: DWARF_LOOK.d_brom,
  warrior: DWARF_LOOK.d_grim,
  support: DWARF_LOOK.d_thorvin,
  ranged: DWARF_LOOK.d_nori,
  mage: DWARF_LOOK.d_bofur,
  any: DWARF_LOOK.d_grim,
};

export function dwarfSpriteUrl(name: string, roleBias?: string): string {
  const id = DWARF_BY_NAME[name];
  const look = (id && (EXTRA_LOOK[id] ?? DWARF_LOOK[id])) || (roleBias && ROLE_LOOK[roleBias]) || ROLE_LOOK.warrior;
  return raster(`dw:${look.helm}${look.beard[0]}${look.weapon}`, 32, 32, 3, (p) => drawDwarf(p, look));
}

// ── Враги (§6.3): 10 типов, лицо влево ──

function drawRat(p: Px): void {
  const F = '#8a6a44', D = '#5f482c', P = '#c98a96';
  p.rect(10, 16, 14, 7, F);
  p.disc(21, 19, 4, F);
  p.rect(11, 19, 10, 3, '#c49a6c');
  p.rect(5, 15, 6, 5, F);
  p.rect(3, 17, 3, 2, D);
  p.set(2, 18, P);
  p.disc(7, 13, 1, D);
  p.set(7, 12, P);
  p.disc(11, 12, 1, D);
  p.set(11, 11, P);
  p.set(6, 16, '#ff5a4a');
  p.set(8, 18, '#20140b');
  p.line(25, 18, 29, 21, P);
  p.set(29, 22, P);
  p.rect(9, 23, 2, 2, D);
  p.rect(14, 23, 2, 2, D);
  p.rect(19, 23, 2, 2, D);
  p.set(1, 16, '#caa88a');
  p.set(1, 19, '#caa88a');
}

function drawGoblin(p: Px): void {
  const S = '#6fae4e', D = '#4c7d36';
  p.rect(8, 8, 9, 7, S);
  p.set(7, 11, S);
  p.set(6, 12, D);
  p.set(6, 8, S);
  p.set(5, 9, S);
  p.set(4, 10, D);
  p.set(4, 11, D);
  p.set(5, 12, S);
  p.set(9, 10, '#ffd23f');
  p.set(9, 11, '#20140b');
  p.hline(8, 11, 13, '#2f4a20');
  p.set(9, 12, '#e8e2cf');
  p.rect(10, 15, 8, 6, S);
  p.rect(10, 15, 8, 4, '#6b4a2a');
  p.rect(10, 21, 8, 2, '#8a6a3a');
  p.rect(10, 23, 3, 4, D);
  p.rect(15, 23, 3, 4, D);
  p.rect(9, 27, 4, 2, '#3a2a18');
  p.rect(15, 27, 4, 2, '#3a2a18');
  p.set(17, 16, S);
  p.set(17, 17, S);
  p.set(18, 18, S);
  p.hline(19, 24, 17, '#cfd6de');
  p.set(25, 17, '#eef2f6');
  p.set(18, 17, '#3a2512');
}

function drawSpider(p: Px): void {
  const B = '#2e2438', D = '#1c1626';
  p.disc(16, 18, 6, B);
  p.rect(13, 16, 7, 2, '#7a3fa8');
  p.rect(15, 19, 3, 3, '#c93a4a');
  p.disc(9, 17, 3, '#241c2e');
  p.set(8, 16, '#ff4a4a');
  p.set(10, 16, '#ff4a4a');
  p.set(7, 18, '#c93a4a');
  p.set(11, 18, '#c93a4a');
  p.line(12, 14, 8, 10, D);
  p.line(8, 10, 5, 9, D);
  p.line(11, 15, 6, 13, D);
  p.line(11, 19, 5, 19, D);
  p.line(12, 21, 7, 25, D);
  p.line(20, 14, 24, 10, D);
  p.line(24, 10, 27, 9, D);
  p.line(21, 15, 26, 13, D);
  p.line(21, 19, 27, 19, D);
  p.line(20, 21, 25, 25, D);
}

function drawSlime(p: Px): void {
  const rows: [number, number, number][] = [
    [14, 13, 18], [15, 11, 20], [16, 10, 21], [17, 9, 22], [18, 8, 23],
    [19, 8, 23], [20, 8, 23], [21, 8, 23], [22, 8, 23], [23, 8, 23],
    [24, 8, 23], [25, 9, 22], [26, 10, 21], [27, 11, 20],
  ];
  for (const [y, a, b] of rows) p.hline(a, b, y, y >= 24 ? '#2f7a3e' : '#4fae5c');
  p.rect(10, 17, 3, 2, '#a8e8a0');
  p.set(12, 16, '#a8e8a0');
  p.rect(12, 20, 1, 2, '#153a1c');
  p.rect(18, 20, 1, 2, '#153a1c');
  p.hline(14, 17, 23, '#153a1c');
  p.rect(22, 26, 1, 2, '#4fae5c');
  p.set(23, 28, '#4fae5c');
}

function drawOrc(p: Px): void {
  const S = '#5d8f3e', D = '#43682c';
  p.rect(7, 6, 12, 9, S);
  p.rect(7, 12, 10, 3, S);
  p.set(5, 8, S);
  p.set(4, 9, D);
  p.set(5, 10, S);
  p.set(9, 9, '#ff5a4a');
  p.set(14, 9, '#ff5a4a');
  p.hline(8, 15, 8, '#2c4520');
  p.set(8, 12, '#e8e2cf');
  p.set(8, 11, '#e8e2cf');
  p.set(12, 12, '#e8e2cf');
  p.set(12, 11, '#e8e2cf');
  p.rect(9, 15, 12, 9, '#4a4a52');
  p.rect(9, 15, 12, 1, '#6a6a74');
  p.vline(14, 16, 22, '#3a3a42');
  p.set(13, 23, '#e8e2cf');
  p.line(20, 17, 25, 14, S);
  p.set(25, 14, S);
  p.set(25, 15, D);
  p.vline(26, 9, 24, WOOD);
  p.rect(24, 4, 6, 5, STEEL);
  p.vline(29, 4, 8, STEEL_L);
  p.rect(10, 24, 4, 4, D);
  p.rect(15, 24, 4, 4, D);
  p.rect(9, 28, 6, 2, '#3a2a18');
  p.rect(15, 28, 6, 2, '#3a2a18');
}

// v7.0 §6.3: гоблин-лучник — шапочка с пером, лук перед грудью, колчан за спиной
function drawArcherGoblin(p: Px): void {
  const S = '#6fae4e', D = '#4c7d36';
  p.rect(8, 8, 9, 7, S); // голова
  p.set(7, 11, S);
  p.set(6, 12, D);
  p.set(6, 8, S);
  p.set(5, 9, S);
  p.set(4, 10, D);
  p.rect(8, 7, 9, 2, '#7a5230'); // кожаная шапочка
  p.set(16, 5, '#e05a8a');
  p.set(17, 4, '#e05a8a'); // перо
  p.set(18, 3, '#c93a6a');
  p.set(9, 10, '#ffd23f');
  p.set(9, 11, '#20140b'); // глаз
  p.hline(8, 11, 13, '#2f4a20');
  p.set(9, 12, '#e8e2cf'); // клык
  p.rect(10, 15, 8, 6, S);
  p.rect(10, 15, 8, 4, '#6b4a2a'); // жилет
  p.rect(10, 21, 8, 2, '#8a6a3a');
  p.rect(10, 23, 3, 4, D);
  p.rect(15, 23, 3, 4, D);
  p.rect(9, 27, 4, 2, '#3a2a18');
  p.rect(15, 27, 4, 2, '#3a2a18');
  p.vline(19, 13, 20, '#5a3a1c'); // колчан
  p.set(20, 12, '#8a6a3a');
  p.set(18, 12, '#e8d8a0');
  p.set(19, 12, '#e8d8a0'); // оперение
  p.line(4, 12, 6, 17, '#7a5230'); // лук
  p.line(6, 17, 4, 22, '#7a5230');
  p.vline(3, 12, 22, '#d8c890'); // тетива
  p.set(5, 17, '#e8e2cf'); // стрела на тетиве
}

// v7.0 §6.3: шаман — капюшон, тень лица со светящимися глазами, мантия, посох с черепом
function drawShaman(p: Px): void {
  const R = '#5a4a8a', D = '#3a2f5c', L = '#8a7ab8';
  p.disc(12, 9, 5, R); // капюшон
  p.rect(7, 10, 11, 3, R);
  p.rect(9, 9, 7, 4, '#1c1626'); // тень лица
  p.set(9, 10, '#7fffd0');
  p.set(13, 10, '#7fffd0'); // светящиеся глаза
  const rows: [number, number, number][] = [
    [15, 8, 17], [16, 7, 18], [17, 7, 18], [18, 6, 19], [19, 6, 19],
    [20, 5, 20], [21, 5, 20], [22, 4, 21], [23, 4, 21], [24, 5, 20], [25, 6, 19],
  ];
  for (const [y, a, b] of rows) p.hline(a, b, y, y >= 23 ? D : R);
  p.vline(12, 16, 24, L); // кайма мантии
  p.rect(8, 26, 4, 2, D);
  p.rect(15, 26, 4, 2, D);
  p.vline(4, 9, 26, WOOD); // посох
  p.disc(4, 6, 2, '#e8e2cf'); // череп-навершие
  p.set(3, 6, '#20140b');
  p.set(5, 6, '#20140b'); // глазницы
  p.set(4, 7, '#20140b');
  p.set(4, 4, '#a8ffb8'); // кладбищенское свечение
}

function drawGolem(p: Px): void {
  const S = '#7d7f86', D = '#5a5c63', L = '#a3a6ad', R = '#6fd8e8';
  p.rect(11, 3, 10, 6, S);
  p.rect(12, 3, 8, 1, L);
  p.rect(13, 6, 2, 1, R);
  p.rect(17, 6, 2, 1, R);
  p.rect(8, 9, 16, 12, S);
  p.rect(8, 9, 16, 1, L);
  p.rect(8, 20, 16, 1, D);
  p.set(12, 14, D);
  p.set(17, 12, D);
  p.set(20, 18, D);
  p.set(10, 17, D);
  p.set(13, 13, R);
  p.set(19, 12, R);
  p.set(16, 16, R);
  p.disc(16, 14, 1, '#bff3fb');
  p.rect(5, 9, 4, 4, D);
  p.rect(23, 9, 4, 4, D);
  p.rect(4, 13, 4, 8, S);
  p.rect(24, 13, 4, 8, S);
  p.rect(4, 21, 5, 3, D);
  p.rect(23, 21, 5, 3, D);
  p.rect(10, 21, 5, 7, S);
  p.rect(18, 21, 5, 7, S);
  p.rect(9, 28, 7, 2, D);
  p.rect(18, 28, 7, 2, D);
}

function drawHeart(p: Px): void {
  const M = '#c33aa0', D = '#7c1f6a', L = '#ff7ad9';
  const rows: [number, number, number][] = [
    [6, 12, 14], [6, 17, 19], [7, 11, 20], [8, 10, 21], [9, 10, 21],
    [10, 11, 20], [11, 12, 19], [12, 13, 18], [13, 14, 17], [14, 15, 16],
  ];
  for (const [y, a, b] of rows) p.hline(a, b, y, M);
  p.rect(12, 7, 2, 3, L);
  p.set(13, 6, L);
  p.set(15, 9, D);
  p.set(16, 11, D);
  p.set(14, 12, D);
  p.set(18, 9, D);
  p.line(13, 15, 13, 19, D);
  p.set(14, 17, D);
  p.set(12, 19, D);
  p.line(17, 15, 17, 21, D);
  p.set(16, 18, D);
  p.set(18, 20, D);
  p.line(19, 15, 19, 17, D);
  p.set(8, 8, '#8be9ff');
  p.set(24, 10, '#8be9ff');
  p.set(7, 16, '#8be9ff');
  p.set(25, 15, '#8be9ff');
}

// Демон Кузни (v6.8): рогатый огненный демон с горящей пастью-горном
function drawForgeDemon(p: Px): void {
  const S = '#8a3226', D = '#5e1f18', L = '#b8503a';
  const FIRE = '#ff8a2a', FIRE_L = '#ffd23f', FIRE_W = '#fff2b0';
  // рога
  p.set(8, 2, BONE); p.set(7, 3, BONE); p.set(6, 4, BONE); p.set(6, 5, D);
  p.set(24, 2, BONE); p.set(25, 3, BONE); p.set(26, 4, BONE); p.set(26, 5, D);
  // голова
  p.rect(10, 5, 12, 8, S);
  p.hline(11, 21, 4, L);
  p.rect(10, 12, 12, 1, D);
  // глаза и пасть-горн
  p.set(13, 9, FIRE_L); p.set(14, 9, FIRE_W);
  p.set(18, 9, FIRE_L); p.set(19, 9, FIRE_W);
  p.rect(12, 12, 8, 2, '#24100a');
  p.rect(13, 12, 2, 1, FIRE); p.rect(17, 12, 2, 1, FIRE);
  p.set(15, 13, FIRE_L); p.set(16, 13, FIRE_L);
  // торс с горнилом
  p.rect(8, 14, 16, 12, S);
  p.hline(9, 22, 14, L);
  p.rect(8, 25, 16, 1, D);
  p.rect(12, 16, 8, 6, '#24100a');
  p.rect(13, 19, 6, 3, FIRE);
  p.rect(14, 20, 4, 2, FIRE_L);
  p.set(15, 20, FIRE_W); p.set(16, 20, FIRE_W);
  p.set(14, 17, FIRE); p.set(17, 17, FIRE);
  // руки с когтями
  p.rect(4, 15, 4, 8, D);
  p.rect(24, 15, 4, 8, D);
  p.set(4, 23, BONE); p.set(5, 24, BONE);
  p.set(27, 23, BONE); p.set(26, 24, BONE);
  // ноги и копыта
  p.rect(9, 26, 5, 4, D);
  p.rect(18, 26, 5, 4, D);
  p.rect(8, 30, 6, 2, '#24100a');
  p.rect(18, 30, 6, 2, '#24100a');
  // искры над головой
  p.set(12, 2, FIRE_L); p.set(20, 1, FIRE); p.set(16, 0, FIRE_W);
}

// Древний (v6.9 §5.2): тёмный силуэт с горящими глазами, палитра фиолетовых
// (OKLCH H 250–270); в боях не спавнится — появляется только в финале босс-боя
function drawAncient(p: Px): void {
  const S = '#151024';   // силуэт
  const D = '#1c1631';   // тёмный фиолет
  const L = '#28204a';   // кромка
  const X = '#0d0a1a';   // пустота капюшона
  const G = '#5a4ad0';   // руны
  const GL = '#9d8cf2';  // свечение
  const EY = '#7a63e8';  // глаза
  const CORE = '#ece6ff';
  // рогатая корона (шпили вверх)
  p.line(9, 6, 5, 1, L); p.set(5, 1, D);
  p.line(23, 6, 27, 1, L); p.set(27, 1, D);
  p.line(13, 4, 12, 0, D);
  p.line(19, 4, 20, 0, D);
  // капюшон и пустота лица
  p.disc(16, 9, 7, S);
  p.rect(9, 10, 15, 4, S);
  p.disc(16, 9, 4, X);
  // глаза
  p.rect(12, 8, 2, 2, EY); p.set(12, 8, CORE);
  p.rect(19, 8, 2, 2, EY); p.set(20, 8, CORE);
  // плечи с шипами и мантия
  p.rect(4, 15, 24, 4, S);
  p.hline(4, 27, 15, L);
  p.set(3, 14, D); p.set(2, 13, D);
  p.set(29, 14, D); p.set(28, 13, D);
  p.rect(6, 19, 20, 7, S);
  p.hline(6, 25, 25, D);
  p.rect(9, 26, 14, 3, D);
  // растворяющийся низ — рваные пряди
  p.set(8, 29, D); p.set(7, 31, X); p.set(12, 30, D);
  p.set(16, 29, X); p.set(20, 30, D); p.set(24, 29, D); p.set(25, 31, X);
  // руки-коси
  p.rect(3, 17, 3, 9, S);
  p.rect(26, 17, 3, 9, S);
  p.set(3, 26, D); p.set(28, 26, D);
  // светящиеся руны на теле
  p.set(14, 18, G); p.set(15, 19, GL);
  p.set(18, 21, G); p.set(13, 22, G);
  p.set(20, 17, GL); p.set(16, 23, G);
  // парящие искры
  p.set(2, 9, GL); p.set(30, 11, G); p.set(1, 20, G);
  p.set(31, 22, GL); p.set(6, 3, GL); p.set(26, 5, G);
}

const FOE_DRAW: Record<string, (p: Px) => void> = {
  'Крыса': drawRat,
  'Гоблин': drawGoblin,
  'Гоблин-лучник': drawArcherGoblin,
  'Шаман': drawShaman,
  'Паук': drawSpider,
  'Слизень': drawSlime,
  'Орк': drawOrc,
  'Голем': drawGolem,
  'Сердце Глубин': drawHeart,
  'Демон Кузни': drawForgeDemon,
  'Древний': drawAncient,
};

export function foeSpriteUrl(name: string): string {
  const draw = FOE_DRAW[name] ?? drawOrc;
  return raster(`foe:${name}`, 32, 32, 3, draw);
}

// ── Иконки предметов (§6.2): 16×16 ×2 = 32×32 ──

interface IconColors {
  metal?: string;
  metalD?: string;
  metalL?: string;
  accent?: string;
  wood?: string;
}

const ICON_STEEL: IconColors = { metal: STEEL, metalD: STEEL_D, metalL: STEEL_L, wood: WOOD, accent: GOLD };

function iconAxe(p: Px, c: IconColors = ICON_STEEL): void {
  p.line(4, 13, 11, 6, c.wood ?? WOOD);
  p.line(5, 13, 12, 6, c.wood ? shade(c.wood) : LEATHER_D);
  p.rect(9, 2, 5, 4, c.metal ?? STEEL);
  p.rect(8, 3, 6, 3, c.metal ?? STEEL);
  p.vline(13, 2, 6, c.metalL ?? STEEL_L);
  p.set(9, 5, c.metalD ?? STEEL_D);
}

function iconAxe2(p: Px, c: IconColors = ICON_STEEL): void {
  p.vline(7, 3, 13, c.wood ?? WOOD);
  p.vline(8, 3, 13, c.wood ? shade(c.wood) : LEATHER_D);
  p.rect(2, 3, 5, 4, c.metal ?? STEEL);
  p.rect(9, 3, 5, 4, c.metal ?? STEEL);
  p.set(2, 5, c.metalL ?? STEEL_L);
  p.set(13, 5, c.metalL ?? STEEL_L);
  p.rect(6, 7, 3, 1, c.accent ?? GOLD);
}

function iconHammer(p: Px, c: IconColors = ICON_STEEL): void {
  p.vline(7, 7, 13, c.wood ?? WOOD);
  p.vline(8, 7, 13, c.wood ? shade(c.wood) : LEATHER_D);
  p.rect(3, 3, 10, 4, c.metal ?? STEEL);
  p.hline(3, 12, 3, c.metalL ?? STEEL_L);
  p.rect(7, 3, 2, 4, c.accent ?? GOLD);
  p.set(4, 6, c.metalD ?? STEEL_D);
  p.set(11, 6, c.metalD ?? STEEL_D);
}

function iconDagger(p: Px, c: IconColors = { accent: '#7fe05a' }): void {
  p.line(5, 11, 12, 4, '#cfd6de');
  p.line(6, 11, 12, 5, '#eef2f6');
  p.set(13, 3, '#eef2f6');
  p.hline(4, 6, 12, c.metal ?? GOLD_D);
  p.set(3, 13, '#3a2512');
  p.set(4, 13, '#3a2512');
  p.set(12, 6, c.accent ?? '#7fe05a');
}

function iconBlade(p: Px): void {
  p.line(5, 13, 10, 4, '#d84a5f');
  p.line(6, 13, 11, 4, '#ff8a9a');
  p.set(11, 3, '#ffd2d9');
  p.hline(4, 7, 12, GOLD);
  p.set(3, 14, '#3a2512');
  p.set(4, 14, '#3a2512');
}

function iconBow(p: Px, recurve = false): void {
  p.vline(11, 3, 12, WOOD);
  p.set(10, 3, WOOD);
  p.set(10, 12, WOOD);
  if (recurve) {
    p.set(9, 2, WOOD);
    p.set(9, 13, WOOD);
    p.set(12, 4, LEATHER_D);
    p.set(12, 11, LEATHER_D);
  }
  p.vline(9, 3, 12, '#ded7c3');
  p.hline(6, 13, 8, '#c9a86a');
  p.set(13, 8, STEEL_L);
  p.set(6, 8, BONE);
}

function iconStaff(p: Px, orb: string, flame = false): void {
  p.line(5, 13, 10, 5, WOOD);
  p.line(6, 13, 10, 6, LEATHER_D);
  if (flame) {
    p.set(11, 3, '#ffd23f');
    p.set(10, 4, '#ff5a2a');
    p.set(11, 4, '#ffb03a');
    p.set(12, 4, '#ff5a2a');
    p.set(11, 5, '#ffd23f');
  } else {
    p.disc(11, 4, 2, orb);
    p.set(12, 3, '#e8f4ff');
  }
  p.set(10, 5, GOLD);
}

function iconShield(p: Px, body: string, dark: string, glyph: 'none' | 'boss' | 'magnet'): void {
  p.rect(4, 2, 8, 11, dark);
  p.rect(5, 3, 6, 9, body);
  p.vline(7, 3, 11, shade(body));
  if (glyph === 'boss') {
    p.set(7, 6, GOLD);
    p.set(8, 6, GOLD);
    p.set(7, 7, GOLD_D);
    p.set(8, 7, GOLD_D);
  } else if (glyph === 'magnet') {
    p.vline(6, 5, 7, '#6fd8e8');
    p.vline(9, 5, 7, '#6fd8e8');
    p.hline(6, 9, 8, '#6fd8e8');
    p.set(6, 4, '#bff3fb');
    p.set(9, 4, '#bff3fb');
  }
}

function iconCap(p: Px): void {
  p.hline(5, 10, 4, LEATHER);
  p.hline(4, 11, 5, LEATHER);
  p.hline(4, 11, 6, LEATHER);
  p.hline(4, 11, 7, LEATHER_D);
  p.hline(3, 12, 8, '#3a2512');
  p.set(6, 5, '#c49a6c');
  p.set(9, 5, '#c49a6c');
}

function iconHelm(p: Px): void {
  p.hline(5, 10, 4, STEEL);
  p.hline(4, 11, 5, STEEL);
  p.hline(4, 11, 6, STEEL);
  p.hline(4, 11, 7, STEEL_D);
  p.hline(3, 12, 8, STEEL);
  p.vline(7, 8, 10, STEEL_D);
  p.vline(8, 8, 10, STEEL_D);
  p.set(5, 5, STEEL_L);
  p.set(10, 5, GOLD);
}

function iconPlate(p: Px): void {
  p.rect(4, 4, 3, 3, STEEL_D);
  p.rect(9, 4, 3, 3, STEEL_D);
  p.rect(4, 6, 8, 7, STEEL);
  p.rect(4, 6, 8, 1, STEEL_L);
  p.vline(7, 6, 12, STEEL_D);
  p.hline(4, 11, 12, STEEL_D);
  p.set(6, 8, GOLD);
  p.set(9, 8, GOLD);
  p.set(7, 10, GOLD_D);
  p.set(8, 10, GOLD_D);
}

function iconScale(p: Px): void {
  const A = '#3fae9c', D = '#2a7a6c', L = '#7fd8c8';
  p.rect(3, 3, 4, 3, A);
  p.rect(9, 3, 4, 3, A);
  p.rect(6, 6, 4, 3, A);
  p.rect(3, 9, 4, 3, A);
  p.rect(9, 9, 4, 3, A);
  p.rect(6, 12, 4, 3, D);
  p.set(3, 3, L);
  p.set(9, 3, L);
  p.set(6, 6, L);
  p.set(3, 9, L);
  p.set(9, 9, L);
}

function iconRing(p: Px, gem: string): void {
  const pts: [number, number][] = [
    [6, 6], [7, 5], [8, 5], [9, 6], [10, 7], [10, 8], [10, 9], [10, 10],
    [9, 11], [8, 11], [7, 11], [6, 10], [5, 9], [5, 8], [5, 7],
  ];
  for (const [x, y] of pts) p.set(x, y, GOLD);
  p.set(7, 9, GOLD_D);
  p.set(8, 9, GOLD_D);
  p.set(7, 4, gem);
  p.set(8, 4, gem);
  p.set(7, 3, '#e8f4ff');
}

function iconCharm(p: Px): void {
  p.line(4, 12, 11, 5, BONE);
  p.line(5, 12, 11, 6, BONE_D);
  p.disc(4, 12, 1, BONE);
  p.disc(11, 5, 1, BONE);
  p.set(12, 4, BONE);
  p.set(3, 11, BONE);
  p.set(8, 8, '#c93a4a');
}

function iconAmulet(p: Px): void {
  p.line(5, 2, 7, 4, GOLD);
  p.line(11, 2, 9, 4, GOLD);
  p.disc(8, 5, 1, GOLD_D);
  p.disc(8, 9, 2, '#5ae08a');
  p.set(7, 8, '#a8f0c0');
  p.set(8, 12, '#2a7a4a');
}

function iconBoots(p: Px): void {
  p.rect(5, 4, 5, 6, LEATHER);
  p.rect(5, 9, 8, 3, LEATHER);
  p.hline(5, 12, 11, '#3a2512');
  p.hline(5, 9, 4, '#8a5a30');
  p.set(10, 6, '#eef2f6');
  p.set(11, 5, '#eef2f6');
  p.set(12, 4, '#eef2f6');
}

function iconDrum(p: Px): void {
  p.rect(3, 5, 10, 7, '#8a5a30');
  p.rect(3, 4, 10, 2, '#c49a6c');
  p.vline(4, 5, 11, '#5f3c1c');
  p.vline(8, 5, 11, '#5f3c1c');
  p.vline(12, 5, 11, '#5f3c1c');
  p.line(11, 1, 13, 3, WOOD);
  p.line(13, 1, 11, 3, WOOD);
  p.set(6, 8, GOLD_D);
}

function iconTome(p: Px): void {
  p.rect(3, 3, 9, 10, '#5a3f8f');
  p.rect(3, 3, 9, 1, '#7a5cbf');
  p.vline(12, 3, 12, '#e8e2cf');
  p.rect(11, 3, 1, 10, '#c9c2b0');
  p.set(6, 6, '#8be9ff');
  p.set(8, 6, '#8be9ff');
  p.set(7, 7, '#8be9ff');
  p.set(6, 8, '#8be9ff');
  p.set(8, 8, '#8be9ff');
  p.rect(11, 7, 2, 2, GOLD);
}

function iconBeard(p: Px): void {
  const rows: [number, number, number][] = [
    [4, 5, 10], [5, 4, 11], [6, 4, 11], [7, 5, 10], [8, 6, 9], [9, 7, 8],
  ];
  for (const [y, a, b] of rows) p.hline(a, b, y, '#ffd23f');
  p.set(5, 5, '#fff2b0');
  p.set(10, 5, '#fff2b0');
  p.set(5, 6, '#c9932a');
  p.set(10, 6, '#c9932a');
  p.set(6, 7, '#c9932a');
  p.set(9, 7, '#c9932a');
  p.set(7, 8, '#c9932a');
  p.set(8, 8, '#c9932a');
}

const ICONS: Record<string, (p: Px) => void> = {
  axe: (p) => iconAxe(p),
  axe_rust: (p) => iconAxe(p, { metal: '#a3623a', metalD: '#7a4426', metalL: '#c98a5a', wood: WOOD }),
  axe_slayer: (p) => iconAxe(p, { metal: '#b8b2c8', metalD: '#8a849a', metalL: '#e8e4f2', accent: '#c93a4a', wood: '#3a2512' }),
  axe2: (p) => iconAxe2(p),
  hammer: (p) => iconHammer(p),
  hammer_rune: (p) => iconHammer(p, { metal: '#9aa2ad', metalL: '#c9d1da', accent: '#7dd3fc' }),
  dagger: (p) => iconDagger(p),
  blade: (p) => iconBlade(p),
  bow: (p) => iconBow(p, false),
  bow2: (p) => iconBow(p, true),
  staff: (p) => iconStaff(p, '#7fb2ff'),
  staff_fire: (p) => iconStaff(p, '#ff5a2a', true),
  shield_wood: (p) => iconShield(p, '#8a5a30', '#5f3c1c', 'boss'),
  shield_tower: (p) => iconShield(p, STEEL, STEEL_D, 'boss'),
  shield_magnet: (p) => iconShield(p, '#8a92a0', '#5a6270', 'magnet'),
  cap: (p) => iconCap(p),
  helm: (p) => iconHelm(p),
  plate: (p) => iconPlate(p),
  scale: (p) => iconScale(p),
  ring: (p) => iconRing(p, '#7dd3fc'),
  ring_lucky: (p) => iconRing(p, '#5ae08a'),
  charm: (p) => iconCharm(p),
  amulet: (p) => iconAmulet(p),
  boots: (p) => iconBoots(p),
  drum: (p) => iconDrum(p),
  tome: (p) => iconTome(p),
  beard: (p) => iconBeard(p),
};

const ITEM_ICON: Record<string, string> = {
  e_rusty_axe: 'axe_rust',
  e_wood_shield: 'shield_wood',
  e_short_bow: 'bow',
  e_apprentice_staff: 'staff',
  e_leather_cap: 'cap',
  e_lucky_ring: 'ring_lucky',
  e_bone_charm: 'charm',
  e_rune_hammer: 'hammer_rune',
  e_tower_shield: 'shield_tower',
  e_2h_axe: 'axe2',
  e_magnet_shield: 'shield_magnet',
  e_poison_dagger: 'dagger',
  e_fire_staff: 'staff_fire',
  e_iron_helm: 'helm',
  e_swift_boots: 'boots',
  e_healing_charm: 'amulet',
  e_war_drum: 'drum',
  e_slayer_axe: 'axe_slayer',
  e_guardian_plate: 'plate',
  e_hunter_bow: 'bow2',
  e_vamp_blade: 'blade',
  e_mithril_beard: 'beard',
  e_dragon_scale: 'scale',
  e_arcane_tome: 'tome',
};

// id экипировки имеет вид `${def.key}#${stage}#${seq}` — вычленяем ключ каталога
export function itemIconUrl(itemId: string): string {
  const itemKey = itemId.split('#')[0];
  const key = ITEM_ICON[itemKey] ?? 'charm';
  return raster(`ic:${key}`, 16, 16, 2, ICONS[key]);
}

// ── Пиксельные иконки узлов карты (16×16 ×2) и монета ──

function drawSwords(p: Px): void {
  p.line(3, 3, 11, 11, '#cfd6de');
  p.line(4, 3, 12, 11, '#eef2f6');
  p.line(12, 3, 4, 11, '#a8aeb8');
  p.line(12, 4, 5, 11, '#cfd6de');
  p.hline(2, 5, 12, GOLD_D);
  p.hline(10, 13, 12, GOLD_D);
  p.set(3, 13, WOOD);
  p.set(4, 14, WOOD);
  p.set(12, 13, WOOD);
  p.set(11, 14, WOOD);
  p.set(2, 2, '#eef2f6');
}

function drawSkull(p: Px): void {
  p.rect(4, 3, 8, 7, BONE);
  p.rect(3, 5, 10, 4, BONE);
  p.rect(5, 5, 2, 2, '#241a10');
  p.rect(9, 5, 2, 2, '#241a10');
  p.rect(7, 8, 2, 1, BONE_D);
  p.rect(5, 10, 1, 3, BONE);
  p.rect(7, 10, 1, 3, BONE);
  p.rect(9, 10, 1, 3, BONE);
  p.set(4, 3, '#fff8ea');
  p.set(11, 3, '#fff8ea');
  p.set(6, 12, BONE_D);
  p.set(9, 12, BONE_D);
}

function drawCrown(p: Px): void {
  p.rect(3, 9, 10, 4, GOLD);
  p.rect(3, 8, 10, 1, GOLD_D);
  p.rect(3, 4, 2, 5, GOLD);
  p.rect(7, 3, 2, 6, GOLD);
  p.rect(11, 4, 2, 5, GOLD);
  p.set(4, 3, '#ffe08a');
  p.set(8, 2, '#ffe08a');
  p.set(12, 3, '#ffe08a');
  p.rect(4, 10, 1, 1, '#c93a4a');
  p.rect(8, 10, 1, 1, '#5a7fd8');
  p.rect(11, 10, 1, 1, '#5ae08a');
  p.hline(3, 12, 13, '#a9782a');
}

function drawPouch(p: Px): void {
  p.rect(5, 6, 7, 8, LEATHER);
  p.rect(4, 8, 9, 5, LEATHER);
  p.hline(5, 10, 6, GOLD_D);
  p.set(5, 5, GOLD);
  p.set(7, 4, GOLD);
  p.set(9, 5, GOLD);
  p.set(6, 3, '#ffe08a');
  p.rect(7, 9, 2, 2, GOLD);
  p.set(6, 13, LEATHER_D);
  p.set(10, 13, LEATHER_D);
}

function drawScroll(p: Px): void {
  p.rect(4, 2, 8, 12, '#e8dcc7');
  p.rect(5, 2, 6, 1, '#c9bda3');
  p.rect(3, 1, 2, 14, '#8a5a30');
  p.rect(11, 1, 2, 14, '#8a5a30');
  p.hline(6, 9, 5, '#7a6a4a');
  p.hline(6, 10, 7, '#7a6a4a');
  p.hline(6, 8, 9, '#7a6a4a');
  p.set(8, 11, '#5a7fd8');
  p.set(7, 12, '#5a7fd8');
  p.set(9, 12, '#5a7fd8');
}

function drawCampfire(p: Px): void {
  p.hline(3, 12, 12, '#6b4423');
  p.hline(4, 11, 13, '#4a2f16');
  p.set(3, 11, WOOD);
  p.set(12, 11, WOOD);
  p.rect(6, 9, 4, 2, '#ff5a2a');
  p.rect(7, 7, 2, 2, '#ff8a3a');
  p.rect(7, 5, 2, 2, '#ffd23f');
  p.set(8, 4, '#fff2b0');
  p.set(6, 10, '#c93a1a');
  p.set(9, 10, '#c93a1a');
}

function drawAnvil(p: Px): void {
  p.rect(2, 6, 12, 3, '#4a4a52');
  p.rect(3, 5, 8, 1, '#6a6a74');
  p.rect(6, 9, 4, 3, '#3a3a42');
  p.rect(4, 12, 8, 2, '#4a4a52');
  p.rect(9, 4, 4, 2, '#6a6a74');
  p.set(11, 3, '#ffb03a');
  p.set(12, 2, '#ffd23f');
  p.set(13, 3, '#ff5a2a');
  p.set(10, 4, '#ffd23f');
  p.hline(2, 13, 14, '#241708');
}

function drawCoin(p: Px): void {
  p.disc(8, 8, 5, GOLD);
  p.disc(8, 8, 4, '#ffd873');
  p.disc(7, 7, 2, '#fff2b0');
  p.set(8, 5, GOLD_D);
  p.set(8, 11, GOLD_D);
  p.set(5, 8, GOLD_D);
  p.set(11, 8, GOLD_D);
}

const NODE_ICONS: Record<string, (p: Px) => void> = {
  battle: drawSwords,
  elite: drawSkull,
  boss: drawCrown,
  shop: drawPouch,
  event: drawScroll,
  rest: drawCampfire,
  forge: drawAnvil,
};

export function nodeIconUrl(type: string): string {
  const draw = NODE_ICONS[type] ?? drawSwords;
  return raster(`node:${type}`, 16, 16, 2, draw);
}

export function coinUrl(): string {
  return raster('ic:coin', 16, 16, 2, drawCoin);
}

export function dwarfPortraitUrl(name: string, roleBias?: string): string {
  return dwarfSpriteUrl(name, roleBias);
}
