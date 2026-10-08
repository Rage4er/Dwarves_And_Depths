// §3.1 + §5 Phaser-сцена боя
// НЕ импортирует Phaser на топ-уровне (SSR-safe).
// Загружается динамически через BattleCanvas.tsx.

import type { BattleState } from '@/lib/game/types';

export interface BattleSceneData {
  battle: BattleState;
  dwarves: Array<{ id: string; name: string; role: string }>;
  speed: number;
}

export const BATTLE_SCENE_KEY = 'BattleScene';

const GROUND_SPEED_PX_S = 62 / 0.55;

// Экспортируем фабрику сцены — Phaser загружается только на клиенте
export function createBattleScene(Phaser: any) {
  const { Scene } = Phaser;

  class BattleSceneClass extends Scene {
    declare data: any;
    private _battleData: BattleSceneData | null = null;
    private allySprites = new Map<string, any>();
    private foeSprites = new Map<string, any>();
    private hpBars = new Map<string, any>();
    private parallaxSprites: any[] = [];
    private groundGraphics: any = null;

    constructor() {
      super({ key: BATTLE_SCENE_KEY });
    }

    // Phaser: init(data) вызывается ПЕРЕД preload() при scene.start(key, data).
    // Сохраняем данные в поле — они доступны в preload и create.
    init(data: BattleSceneData): void {
      this._battleData = data ?? null;
    }

    // FIX: используем this.load.base64() вместо this.textures.addBase64().
    // Phaser ждёт загрузки ВСЕХ base64-текстур перед create().
    // textures.addBase64() — async (Image.onload), create() запускается
    // пока текстуры не готовы → спрайты с "missing texture".
    preload(): void {
      const floor = this._battleData?.battle?.floor ?? 1;

      // Гномы — все доступные + текущий бой
      const allDwarves = ['d_brom', 'd_grim', 'd_torvin', 'd_bombur', 'd_bifur', 'd_dvalin', 'd_bofur2', 'd_balin', 'd_bifur2', 'd_nori', 'd_bombur2', 'd_dvalin2', 'd_dori', 'd_nori2', 'd_bofur'];
      for (const id of allDwarves) {
        registerDwarfTexture(this, id, 'any', `dwarf_${id}`);
      }
      // Враги — все доступные + текущий бой
      const allFoes = ['goblin', 'orc', 'spider', 'skeleton', 'troll', 'demon'];
      for (const name of allFoes) {
        registerFoeTexture(this, name, `foe_${name}`);
      }
      // Параллакс для текущего этажа
      const urls = parallaxTextureUrls(floor);
      for (const { key, url } of urls) {
        this.load.base64(`${floor}_${key}`, url);
      }
    }

    create(): void {
      // FIX: читаем из _battleData (установлен в init()). this.data.values
      // undefined при авто-старте через config → спрайты не создавались.
      const data = this._battleData;
      if (!data?.battle) return;

      const { battle } = data;
      const { width, height } = this.scale;

      this.cameras.main.setBackgroundColor('#141018');
      this.createParallax(width, height);
      this.createUnits(battle, data.dwarves);
    }

    update(_time: number, delta: number): void {
      this.updateParallax(delta);
      this.updateMarch(delta);
    }

    updateFromBattle(battle: BattleState, _diff: any): void {
      for (const ally of battle.allies) {
        const sprite = this.allySprites.get(ally.uid);
        if (sprite) {
          sprite.setPosition(ally.x, ally.y);
          const bar = this.hpBars.get(ally.uid);
          if (bar) bar.update(ally.hp);
          if (!ally.alive) {
            sprite.setAlpha(0.4).setScale(0.6);
          }
        }
      }
      for (const foe of battle.foes) {
        const sprite = this.foeSprites.get(foe.uid);
        if (sprite) {
          sprite.setPosition(foe.x, foe.y);
          const bar = this.hpBars.get(foe.uid);
          if (bar) bar.update(foe.hp);
          if (!foe.alive) {
            sprite.setAlpha(0.3).setScale(0.5);
          }
        }
      }
    }

    private createParallax(width: number, height: number): void {
      const groundY = height - 30;
      const floor = this._battleData?.battle?.floor ?? 1;
      const prefix = `${floor}_`;
      this.groundGraphics = this.add.graphics();
      this.groundGraphics.setDepth(50);
      this.groundGraphics.fillStyle(0x2f2114, 1);
      this.groundGraphics.fillRect(0, groundY, width, 30);
      this.groundGraphics.fillStyle(0x453321, 1);
      this.groundGraphics.fillRect(0, groundY, width, 3);

      for (let i = 0; i < 5; i++) {
        const tileW = 880;
        const tileH = 480;
        const count = Math.ceil(width / tileW) + 2;
        const alpha = 0.4 + i * 0.12;

        for (let j = 0; j < count; j++) {
          const key = `${prefix}plx_${i}`;
          if (!this.textures.exists(key)) continue;
          const sprite = this.add.sprite(
            j * tileW - tileW * 0.5,
            groundY - tileH * 0.3,
            key,
          );
          sprite.setAlpha(alpha).setDepth(i);
          (sprite as any)._plxIndex = i;
          (sprite as any)._plxTileW = tileW;
          this.parallaxSprites.push(sprite);
        }
      }
    }

    private createUnits(battle: BattleState, dwarves: BattleSceneData['dwarves']): void {
      for (const ally of battle.allies) {
        const dwarfInfo = dwarves.find((d) => d.id === ally.uid);
        if (!dwarfInfo) continue;
        const sprite = createDwarfSprite(
          this, ally.x, ally.y,
          dwarfInfo.id, dwarfInfo.role,
          `dwarf_${ally.uid}`,
        );
        this.allySprites.set(ally.uid, sprite);
        this.hpBars.set(ally.uid, createHpBar(this, sprite, ally.hpMax, ally.hp));
      }
      for (const foe of battle.foes) {
        const sprite = createFoeSprite(
          this, foe.x, foe.y,
          foe.name, `foe_${foe.uid}`,
        );
        this.foeSprites.set(foe.uid, sprite);
        this.hpBars.set(foe.uid, createHpBar(this, sprite, foe.hpMax, foe.hp));
      }
    }

    private updateParallax(delta: number): void {
      const data = (this.data as any).values as BattleSceneData;
      const speed = data?.speed ?? 2;
      const dt = (delta / 1000) * speed;
      const groundPx = GROUND_SPEED_PX_S * dt;

      for (const sprite of this.parallaxSprites) {
        const idx = (sprite as any)._plxIndex ?? 2;
        const factors = [0.12, 0.3, 0.5, 0.7, 0.9];
        const sp = factors[idx] ?? 0.5;
        const tileW = (sprite as any)._plxTileW ?? 880;
        sprite.x -= groundPx * sp;
        if (sprite.x < -tileW * 0.5) {
          sprite.x += tileW * 2;
        }
      }
    }

    private updateMarch(_delta: number): void {
      const time = (this.time as any).now ?? 0;
      for (const [uid, sprite] of this.allySprites) {
        const offset = uid.charCodeAt(0) ?? 0;
        sprite.y += Math.sin(time * 0.005 + offset) * 0.05;
      }
    }
  }

  return BattleSceneClass;
}

// ── Вспомогательные функции (без Phaser на топ-уровне) ──

import { dwarfGrid } from '@/lib/game/art/dwarves';
import { foeGrid, foeKindByName } from '@/lib/game/art/enemies';
import { gridToDataUrl } from '@/lib/game/art/px';
import { backdropLayerUrl } from '@/lib/game/art/backdrop';
import { tierForFloor } from '@/lib/game/art/palette';

const SCALE = 3;

function registerDwarfTexture(scene: any, id: string, role: string, key: string): void {
  const g = dwarfGrid(id, role);
  const url = gridToDataUrl(g, SCALE, `phaser:d:${id}:${role}`);
  if (url && !scene.textures.exists(key)) {
    scene.textures.addBase64(key, url);
  }
}

function registerFoeTexture(scene: any, name: string, key: string): void {
  const kind = foeKindByName(name);
  const g = foeGrid(kind);
  const url = gridToDataUrl(g, SCALE, `phaser:f:${kind}`);
  if (url && !scene.textures.exists(key)) {
    scene.textures.addBase64(key, url);
  }
}

function createDwarfSprite(scene: any, x: number, y: number, id: string, role: string, key?: string): any {
  const k = key ?? `dwarf_${id}`;
  registerDwarfTexture(scene, id, role, k);
  return scene.add.sprite(x, y, k).setScale(2).setOrigin(0.5, 1);
}

function createFoeSprite(scene: any, x: number, y: number, name: string, key?: string): any {
  const k = key ?? `foe_${name}_${Math.random().toString(36).slice(2, 6)}`;
  registerFoeTexture(scene, name, k);
  return scene.add.sprite(x, y, k).setScale(2).setOrigin(0.5, 1);
}

function createHpBar(scene: any, parent: any, maxHp: number, currentHp: number): any {
  const barW = 60;
  const barH = 5;
  const g = scene.add.graphics();
  g.setDepth(30);
  g.setPosition(parent.x, parent.y - (parent.texture?.width ?? 48) - 14);
  g.setOrigin(0.5, 0);
  g.fillStyle(0x1a1a1a, 0.8);
  g.fillRect(-barW / 2, 0, barW, barH);
  updateHpBar(g, barW, barH, maxHp, currentHp);
  return { update: (hp: number) => updateHpBar(g, barW, barH, maxHp, hp) };
}

function updateHpBar(g: any, barW: number, barH: number, maxHp: number, hp: number): void {
  g.clear(true);
  g.fillStyle(0x1a1a1a, 0.8);
  g.fillRect(-barW / 2, 0, barW, barH);
  const pct = Math.max(0, hp / maxHp);
  const color = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xcccc44 : 0xcc4444;
  g.fillStyle(color, 1);
  g.fillRect(-barW / 2, 0, barW * pct, barH);
}

function parallaxTextureUrls(floor: number): Array<{ key: string; url: string }> {
  const tier = tierForFloor(floor);
  const result: Array<{ key: string; url: string }> = [];
  const layerIndices = [0, 1, 2, 3, 1];
  for (let i = 0; i < 5; i++) {
    const idx = layerIndices[i] ?? 3;
    const url = backdropLayerUrl(tier, idx, 4);
    if (url) result.push({ key: `plx_${i}`, url });
  }
  return result;
}
