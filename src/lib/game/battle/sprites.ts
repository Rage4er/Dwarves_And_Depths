// §5 Phaser-спрайты: процедурный пиксель-арт → Phaser.Textures
// Переиспользует art/dwarves.ts и art/enemies.ts (grid → dataURL).

import { dwarfGrid } from '@/lib/game/art/dwarves';
import { foeGrid, foeKindByName } from '@/lib/game/art/enemies';
import { gridToDataUrl } from '@/lib/game/art/px';

const SCALE = 3; // 32×32 → 96×96

export function registerDwarfTexture(
  scene: any,
  id: string,
  role: string,
  key: string,
): void {
  const g = dwarfGrid(id, role);
  const url = gridToDataUrl(g, SCALE, `phaser:d:${id}:${role}`);
  if (url && !scene.textures.exists(key)) {
    scene.textures.addBase64(key, url);
  }
}

export function registerFoeTexture(
  scene: any,
  name: string,
  key: string,
): void {
  const kind = foeKindByName(name);
  const g = foeGrid(kind);
  const url = gridToDataUrl(g, SCALE, `phaser:f:${kind}`);
  if (url && !scene.textures.exists(key)) {
    scene.textures.addBase64(key, url);
  }
}

export function createDwarfSprite(
  scene: any,
  x: number,
  y: number,
  id: string,
  role: string,
  key?: string,
): any {
  const k = key ?? `dwarf_${id}`;
  registerDwarfTexture(scene, id, role, k);
  return scene.add.sprite(x, y, k).setScale(2).setOrigin(0.5, 1);
}

export function createFoeSprite(
  scene: any,
  x: number,
  y: number,
  name: string,
  key?: string,
): any {
  const k = key ?? `foe_${name}_${Math.random().toString(36).slice(2, 6)}`;
  registerFoeTexture(scene, name, k);
  return scene.add.sprite(x, y, k).setScale(2).setOrigin(0.5, 1);
}
