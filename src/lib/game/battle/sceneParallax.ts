// §5.2.1 Параллакс: 5 слоёв из art/backdrop.ts (sky, farPeaks, midRocks, runes,
// nearGround) × 3 тира глубины. Каждый слой — TileSprite во всю ширину арены,
// нижний край тайла совмещён с линией земли: низ тайла (полоса земли nearGround)
// не обрезается. Скорость прокрутки — из данных боя (1×/2×/4×).

import { backdropLayerUrl } from '@/lib/game/art/backdrop';
import { tierForFloor } from '@/lib/game/art/palette';

// art/backdrop.ts: LAYERS = [sky, farPeaks, midRocks, runes, nearGround]
const LAYER_INDICES = [0, 1, 2, 3, 4];
const SKY_LAYER = 0;

// Сетка слоя 220×120. Тайл 880×480 (scale 4) закрывает полосу 420..900;
// небо печатаем scale 8 (1760×960) — иначе над 420 px оставалась бы пустая полоса.
const SKY_SCALE = 8;
const TILE_SCALE = 4;

// Кэффициенты параллакса: небо почти неподвижно, земля самая быстрая
const FACTORS = [0.12, 0.3, 0.5, 0.7, 0.9];
// §5.2 скорость «походки» — та же константа, что и CSS-марш в BattleScreen
const BASE_SPEED_PX_S = 62 / 0.55;

const GROUND_COLORS = [0x2f2114, 0x1c2630, 0x261430];
const GROUND_LIT_COLORS = [0x453321, 0x2e3c4a, 0x3a1f44];

export interface ParallaxLayerSpec {
  key: string;
  url: string;
  scale: number;
}

export function parallaxTextureUrls(floor: number): ParallaxLayerSpec[] {
  const tier = tierForFloor(floor);
  const out: ParallaxLayerSpec[] = [];
  for (let i = 0; i < LAYER_INDICES.length; i++) {
    const scale = i === SKY_LAYER ? SKY_SCALE : TILE_SCALE;
    const url = backdropLayerUrl(tier, LAYER_INDICES[i], scale);
    if (url) out.push({ key: `plx_${i}`, url, scale });
  }
  return out;
}

// Тайл прижимается нижним краем к земле: y + height === groundY.
// alpha = 1 — слои самодостаточны, полупрозрачность превращала их в кашу.
export function createParallax(scene: any, floor: number, groundY: number): any[] {
  const prefix = `${floor}_`;
  const width = scene.scale.width;
  const layers: any[] = [];

  const ground = scene.add.graphics();
  ground.setDepth(5);
  const tier = tierForFloor(floor);
  ground.fillStyle(GROUND_COLORS[tier] ?? GROUND_COLORS[0], 1);
  ground.fillRect(0, groundY, width, scene.scale.height - groundY);
  ground.fillStyle(GROUND_LIT_COLORS[tier] ?? GROUND_LIT_COLORS[0], 1);
  ground.fillRect(0, groundY, width, 4);

  LAYER_INDICES.forEach((_, i) => {
    const key = `${prefix}plx_${i}`;
    if (!scene.textures.exists(key)) return;
    const frame = scene.textures.get(key).get();
    const tileH = frame.height;
    const tile = scene.add.tileSprite(0, groundY - tileH, width, tileH, key);
    tile.setOrigin(0, 0).setAlpha(1).setDepth(i);
    tile._factor = FACTORS[i] ?? 0.5;
    layers.push(tile);
  });

  return layers;
}

// Прокрутка: смещение текстуры внутри тайла, а не позиция объекта, —
// тайл бесконечный, «перескок» при возврате не виден.
// Знак: в Phaser (updateCanvas) паттерн рисуется как translate(-tilePositionX)
// + fillRect(tilePositionX), то есть рост tilePositionX сдвигает узор ВЛЕВО —
// ровно то, что нужно: отряд бежит вправо, фон уходит влево.
export function scrollParallax(layers: any[], deltaMs: number, speed: number): void {
  const drift = ((BASE_SPEED_PX_S * deltaMs) / 1000) * speed;
  for (const layer of layers) {
    layer.tilePositionX += drift * (layer._factor ?? 0.5);
  }
}
