// §5.2 Юнит на арене:rig = контейнер + тело + HP-бар.
// Контейнер — единственная точка позиционирования: логику (x, y из BattleState)
// пишем только в container. Тело (body) остаётся свободным для tween'ов
// удара/подскока (ЭТАП 4), поэтому анимации не конфликтуют с координатами боя.

import { dwarfGrid } from '@/lib/game/art/dwarves';
import { foeGrid, foeKindByName } from '@/lib/game/art/enemies';
import { gridToDataUrl } from '@/lib/game/art/px';

// Пиксельная сетка 32×32 → текстура 96×96 (BAKE_SCALE 3).
// На арене 1920×1080 спрайт показывается с UNIT_SCALE 2 → 192 px.
const BAKE_SCALE = 3;
export const UNIT_SCALE = 2;

const BAR_W = 120;
const BAR_H = 10;
const BAR_GAP = 18;

export function dwarfTextureKey(id: string): string {
  return `dwarf_${id}`;
}

export function foeTextureKey(name: string): string {
  return `foe_${foeKindByName(name)}`;
}

// Текстуры регистрируются через load.image(): загрузчик ждёт их все до create(),
// поэтому в create() спрайт гарантированно получает готовую текстуру.
// (scene.textures.addBase64 асинхронный — спрайт создавался с пустой текстурой,
// что и давало невидимых гномов.)
// Роль входит в ключ: шлем и оружие рисуются по роли (art/dwarves.ts).
export function queueDwarfTextures(
  scene: any,
  units: Array<{ id: string; role: string }>,
): void {
  for (const { id, role } of units) {
    const key = dwarfTextureKey(id);
    if (scene.textures.exists(key)) continue;
    const url = gridToDataUrl(dwarfGrid(id, role), BAKE_SCALE, `d:${id}:${role}`);
    if (url) scene.load.image(key, url);
  }
}

export function queueFoeTextures(scene: any, names: string[]): void {
  const kinds = new Set(names.map((n) => foeKindByName(n)));
  for (const kind of kinds) {
    const key = `foe_${kind}`;
    if (scene.textures.exists(key)) continue;
    const url = gridToDataUrl(foeGrid(kind), BAKE_SCALE, `f:${kind}`);
    if (url) scene.load.image(key, url);
  }
}

export interface UnitRig {
  /** ключ текстуры тела — `dwarf_<id>` / `foe_<kind>` */
  key: string;
  container: any;
  body: any;
  moveTo(x: number, y: number): void;
  setHp(hp: number): void;
}

// origin (0.5, 1) → точка опоры в ногах: координата y из логики = линия земли,
// поворот тела вокруг ног выглядит как падение, а не вокруг центра.
function addBody(scene: any, key: string): any {
  return scene.add.image(0, 0, key).setOrigin(0.5, 1).setScale(UNIT_SCALE);
}

function drawBar(g: any, bodyH: number, maxHp: number, hp: number): void {
  g.clear();
  const y = -bodyH - BAR_GAP;
  g.fillStyle(0x1a1a1a, 0.85);
  g.fillRect(-BAR_W / 2, y, BAR_W, BAR_H);
  const pct = Math.max(0, Math.min(1, hp / maxHp));
  g.fillStyle(pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xcccc44 : 0xcc4444, 1);
  g.fillRect(-BAR_W / 2, y, BAR_W * pct, BAR_H);
  g.lineStyle(1, 0x000000, 0.6);
  g.strokeRect(-BAR_W / 2, y, BAR_W, BAR_H);
}

// keyMissing: текстура не успела загрузиться → спрайт всё равно создаём
// (Phaser покажет пустоту), но координаты и HP-бар работают.
export function createUnitRig(
  scene: any,
  key: string,
  x: number,
  y: number,
  maxHp: number,
  hp: number,
): UnitRig {
  const body = addBody(scene, key);
  const bar = scene.add.graphics();
  const bodyH = body.height || 96;
  drawBar(bar, bodyH, maxHp, hp);
  const container = scene.add.container(x, y, [body, bar]);
  container.setDepth(20);
  return {
    key,
    container,
    body,
    moveTo: (nx: number, ny: number) => container.setPosition(nx, ny),
    setHp: (next: number) => drawBar(bar, bodyH, maxHp, next),
  };
}
