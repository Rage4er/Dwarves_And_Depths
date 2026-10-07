// §5.2.1 Phaser-параллакс: 5 слоёв × 3 тира глубины
// Переиспользует art/backdrop.ts (grid → dataURL).

import { backdropLayerUrl } from '@/lib/game/art/backdrop';
import { tierForFloor, DEPTH_TIERS } from '@/lib/game/art/palette';

export const LAYER_COUNT = 5;
export const GROUND_HEIGHT = 30; // px from bottom

// Генерируем URL-ы всех текстур параллакса для preload
export function parallaxTextureUrls(floor: number): Array<{ key: string; url: string }> {
  const tier = tierForFloor(floor);
  const result: Array<{ key: string; url: string }> = [];
  const layerIndices = [0, 1, 2, 3, 1]; // sky, far, mid, runes, near/fog

  for (let i = 0; i < LAYER_COUNT; i++) {
    const idx = layerIndices[i] ?? 3;
    const url = backdropLayerUrl(tier, idx, 4);
    if (url) {
      result.push({ key: `plx_${i}`, url });
    }
  }
  return result;
}

// Цвет земли по тиру
export function groundColor(floor: number): number {
  const tier = tierForFloor(floor);
  const colors = [0x2f2114, 0x1c2630, 0x261430];
  return colors[tier] ?? 0x2f2114;
}

export function groundLitColor(floor: number): number {
  const tier = tierForFloor(floor);
  const colors = [0x453321, 0x2e3c4a, 0x3a1f44];
  return colors[tier] ?? 0x453321;
}
