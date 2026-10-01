// §5 Враги 96×96: 7 типов, вид сбоку, лицом влево (к отряду).

import { makeGrid, put, rect, hspan, vspan, gridToDataUrl } from './px';
import type { Grid } from './px';

export type FoeKind = 'e_rat' | 'e_goblin' | 'e_spider' | 'e_slime' | 'e_orc' | 'e_golem' | 'e_heart';

const FOE_BY_NAME: Record<string, FoeKind> = {
  Крыса: 'e_rat',
  Гоблин: 'e_goblin',
  Паук: 'e_spider',
  Слизень: 'e_slime',
  Орк: 'e_orc',
  Голем: 'e_golem',
  'Сердце Глубин': 'e_heart',
};

export function foeKindByName(name: string): FoeKind {
  return FOE_BY_NAME[name] ?? 'e_goblin';
}

function rat(g: Grid): void {
  const fur = '#8c7a6a';
  const furL = '#a89a88';
  const furD = '#6a5c50';
  rect(g, 9, 17, 15, 9, fur);
  rect(g, 10, 23, 13, 3, furL);
  rect(g, 3, 15, 7, 8, fur); // морда влево
  rect(g, 10, 17, 4, 3, furD);
  rect(g, 4, 12, 2, 3, furD); // ухо
  put(g, 4, 13, '#e8a0a0');
  put(g, 5, 17, '#e04040'); // глаз
  put(g, 2, 19, '#e8a0a0'); // нос
  put(g, 2, 21, '#f0ead8'); // зуб
  hspan(g, 3, 22, 3, furD);
  // хвост
  put(g, 25, 20, '#b58a8a');
  put(g, 26, 18, '#b58a8a');
  put(g, 27, 16, '#b58a8a');
  put(g, 28, 14, '#b58a8a');
  put(g, 29, 12, '#b58a8a');
  rect(g, 11, 26, 3, 4, furD);
  rect(g, 19, 26, 3, 4, furD);
}

function goblin(g: Grid): void {
  const skin = '#6da03c';
  const skinD = '#4c7a28';
  rect(g, 8, 8, 10, 8, skin); // голова
  rect(g, 4, 9, 4, 2, skin); // ухо
  put(g, 3, 10, skin);
  put(g, 2, 11, skinD);
  put(g, 10, 11, '#d04030'); // глаз
  put(g, 15, 11, '#d04030');
  hspan(g, 9, 14, 6, '#2e4018');
  put(g, 9, 13, '#f0ead8'); // клык
  rect(g, 8, 16, 10, 8, skin); // тело
  rect(g, 8, 16, 10, 4, '#7a5230'); // жилет
  rect(g, 9, 24, 8, 3, '#8a6a3a'); // набедренная
  rect(g, 9, 27, 3, 4, skinD);
  rect(g, 14, 27, 3, 4, skinD);
  rect(g, 5, 18, 3, 3, skin); // рука с кинжалом
  vspan(g, 4, 14, 6, '#b8c0c8');
  put(g, 4, 20, '#7a5230');
  put(g, 4, 13, '#d8e0e8');
}

function spider(g: Grid): void {
  const body = '#3a2f38';
  const bodyL = '#4a3d46';
  rect(g, 10, 12, 13, 11, body); // брюшко
  rect(g, 12, 10, 10, 4, bodyL);
  put(g, 14, 11, '#8a4a5a');
  put(g, 17, 12, '#8a4a5a');
  put(g, 19, 11, '#8a4a5a');
  rect(g, 6, 14, 6, 7, body); // голова
  put(g, 7, 16, '#ff4040');
  put(g, 9, 15, '#ff4040');
  put(g, 7, 18, '#ff8040');
  put(g, 6, 21, '#f0ead8'); // хелицеры
  put(g, 8, 21, '#f0ead8');
  // лапы: 4 пары
  const leg = '#241d24';
  for (const [sx, sy] of [[5, 13], [4, 15], [4, 17], [5, 19]] as const) {
    put(g, sx, sy, leg);
    put(g, sx - 1, sy - 2, leg);
    put(g, sx - 2, sy - 4, leg);
  }
  for (const [sx, sy] of [[23, 13], [24, 15], [24, 17], [23, 19]] as const) {
    put(g, sx, sy, leg);
    put(g, sx + 1, sy - 2, leg);
    put(g, sx + 2, sy - 4, leg);
  }
}

function slime(g: Grid): void {
  const base = '#4fae3e';
  const top = '#7fd45e';
  const hi = '#c8ffb0';
  for (let y = 14; y <= 30; y++) {
    const t = (y - 13) / 17;
    const half = Math.round(9 * Math.sin(Math.min(1, t + 0.12) * Math.PI * 0.75) + 3);
    const cx = 16;
    if (y <= 18) hspan(g, cx - half, y, half * 2 + 1, top);
    else hspan(g, cx - half, y, half * 2 + 1, base);
  }
  rect(g, 11, 16, 3, 2, hi); // блик
  rect(g, 14, 21, 5, 5, '#2e6a24'); // ядро
  put(g, 15, 22, '#8ce07a');
  put(g, 12, 20, '#1e3a14'); // глаза
  put(g, 20, 20, '#1e3a14');
  hspan(g, 14, 24, 4, '#1e3a14');
}

function orc(g: Grid): void {
  const skin = '#4a6b3c';
  const skinD = '#33502a';
  rect(g, 7, 6, 12, 10, skin); // голова
  rect(g, 7, 14, 12, 3, skinD);
  put(g, 5, 8, skin); // уши
  put(g, 4, 9, skinD);
  put(g, 20, 8, skin);
  rect(g, 9, 8, 8, 1, '#243a18'); // бровь
  put(g, 10, 10, '#e04040');
  put(g, 15, 10, '#e04040');
  put(g, 8, 13, '#f0ead8'); // клыки
  put(g, 17, 13, '#f0ead8');
  rect(g, 6, 17, 14, 10, skin); // тело
  rect(g, 6, 17, 14, 5, '#5c5044'); // бронь
  vspan(g, 12, 17, 5, '#3e352a');
  rect(g, 4, 16, 4, 4, '#6a5c4c'); // наплечник
  rect(g, 8, 27, 4, 4, skinD);
  rect(g, 14, 27, 4, 4, skinD);
  rect(g, 3, 20, 3, 4, skin); // рука
  vspan(g, 2, 12, 10, '#7a5230'); // топор
  rect(g, 0, 10, 5, 6, '#8c949c');
  vspan(g, 0, 10, 6, '#c8d0d8');
}

function golem(g: Grid): void {
  const stone = '#7d7d84';
  const stoneD = '#5a5a62';
  const stoneL = '#9a9aa4';
  const glow = '#6de0ff';
  rect(g, 9, 4, 10, 6, stone); // голова
  rect(g, 11, 6, 2, 2, glow);
  rect(g, 15, 6, 2, 2, glow);
  rect(g, 6, 10, 18, 14, stone); // корпус
  hspan(g, 6, 17, 18, stoneD);
  vspan(g, 12, 10, 7, stoneD);
  vspan(g, 18, 17, 7, stoneD);
  hspan(g, 7, 10, 4, stoneL);
  rect(g, 2, 12, 4, 9, stone); // руки
  rect(g, 24, 12, 4, 9, stone);
  rect(g, 2, 21, 5, 4, stoneD);
  rect(g, 23, 21, 5, 4, stoneD);
  rect(g, 8, 24, 5, 4, stone);
  rect(g, 17, 24, 5, 4, stone);
  put(g, 9, 13, glow); // трещины
  put(g, 10, 14, glow);
  put(g, 15, 20, glow);
  put(g, 16, 21, glow);
  put(g, 20, 12, glow);
  put(g, 7, 10, '#4a7a3a'); // мох
  put(g, 23, 9, '#4a7a3a');
}

function heart(g: Grid): void {
  const base = '#c22a5a';
  const light = '#ff5a8a';
  const dark = '#7a1038';
  const hi = '#ff9ac0';
  const rows: Array<[number, number, number]> = [
    // [y, x0, x1]
    [4, 13, 14], [4, 17, 18],
    [5, 12, 19], [6, 10, 21], [7, 9, 22], [8, 9, 22],
    [9, 8, 23], [10, 8, 23], [11, 8, 23], [12, 8, 23],
    [13, 9, 22], [14, 9, 22], [15, 9, 22],
    [16, 10, 21], [17, 10, 21], [18, 11, 20],
    [19, 12, 19], [20, 13, 18], [21, 14, 17], [22, 15, 16],
  ];
  for (const [y, x0, x1] of rows) hspan(g, x0, y, x1 - x0 + 1, base);
  rect(g, 10, 7, 3, 4, hi); // блик
  vspan(g, 9, 9, 6, light);
  vspan(g, 22, 10, 5, dark);
  hspan(g, 14, 4, 4, dark); // выемка
  // трещины
  put(g, 16, 10, '#4a0820');
  put(g, 17, 11, '#4a0820');
  put(g, 16, 12, '#4a0820');
  put(g, 15, 13, '#4a0820');
  rect(g, 14, 12, 4, 4, '#ffd0e0'); // пульсирующее ядро
  rect(g, 15, 13, 2, 2, '#ffffff');
  // парящие осколки
  put(g, 6, 25, light);
  put(g, 26, 22, dark);
  put(g, 12, 27, dark);
  put(g, 22, 27, light);
}

const DRAWERS: Record<FoeKind, (g: Grid) => void> = {
  e_rat: rat,
  e_goblin: goblin,
  e_spider: spider,
  e_slime: slime,
  e_orc: orc,
  e_golem: golem,
  e_heart: heart,
};

export function foeGrid(kind: FoeKind): Grid {
  const g = makeGrid(32, 32);
  DRAWERS[kind](g);
  return g;
}

export function foeSpriteUrl(kind: FoeKind, scale = 3): string {
  return gridToDataUrl(foeGrid(kind), scale, `f:${kind}:${scale}`);
}
