// §3.1 + §5 Phaser-сцена боя. Координаты — прямые из BattleState:
// арена 1920×1080, линия земли y = FIELD_GROUND_Y (900), спрайт ставится
// setPosition(x, y) без маппинга. Логика владеет позицией контейнера,
// анимации (ЭТАП 4) — только телом спрайта.
// Phaser не импортируется на топ-уровне (SSR-safe), сцена — фабрика.

import { FIELD_GROUND_Y } from '@/lib/game/logic/battle';
import { ENEMY_TABLE } from '@/lib/game/data/enemies';
import type { BattleState, Combatant } from '@/lib/game/types';
import {
  createUnitRig,
  dwarfTextureKey,
  foeTextureKey,
  queueDwarfTextures,
  queueFoeTextures,
  type UnitRig,
} from './sceneUnits';

export interface BattleSceneData {
  battle: BattleState;
  dwarves: Array<{ id: string; name: string; role: string }>;
  speed: number;
}

export const BATTLE_SCENE_KEY = 'BattleScene';

const TILE_W = 880;
const TILE_H = 480;
const PLX_FACTORS = [0.12, 0.3, 0.5, 0.7, 0.9];
// §5.2 скорость «походки» — та же константа, что и CSS-марш в BattleScreen
const GROUND_SPEED_PX_S = 62 / 0.55;

// Все виды врагов из таблицы данных — чтобы подкрепление и призывы не остались
// без текстуры (ключи art-сеток покрываются foeKindByName)
const ALL_FOE_NAMES = Object.values(ENEMY_TABLE).map((e) => e.name);

export function createBattleScene(Phaser: any) {
  const { Scene } = Phaser;

  class BattleSceneClass extends Scene {
    private _battleData: BattleSceneData | null = null;
    private rigs = new Map<string, UnitRig>();
    private parallaxSprites: any[] = [];
    private speed = 1;
    private groundY = FIELD_GROUND_Y;

    constructor() {
      super({ key: BATTLE_SCENE_KEY });
    }

    // Phaser вызывает init(data) ПЕРЕД preload() при scene.start(key, data)
    init(data: BattleSceneData): void {
      this._battleData = data ?? null;
      this.speed = data?.speed ?? 1;
    }

    setSpeed(speed: number): void {
      this.speed = speed;
    }

    preload(): void {
      const data = this._battleData;
      queueDwarfTextures(this, data?.dwarves ?? []);
      queueFoeTextures(this, ALL_FOE_NAMES);
      const prefix = `${data?.battle?.floor ?? 1}_`;
      for (const { key, url } of parallaxTextureUrls(data?.battle?.floor ?? 1)) {
        const full = prefix + key;
        if (!this.textures.exists(full)) this.load.image(full, url);
      }
    }

    create(): void {
      const data = this._battleData;
      if (!data?.battle) return;
      this.rigs.clear();
      this.parallaxSprites = [];
      this.cameras.main.setBackgroundColor('#141018');
      this.createParallax();
      this.createUnits(data.battle);
    }

    update(_time: number, delta: number): void {
      this.updateParallax(delta);
    }

    // Вызывается из BattleCanvas на каждый кадр симуляции: позиция и HP — только
    // из BattleState (source of truth). Новые uid (подкрепление, призыв) — rig на лету.
    updateFromBattle(battle: BattleState): void {
      for (const unit of [...battle.allies, ...battle.foes]) {
        const rig = this.rigs.get(unit.uid) ?? this.addRig(unit);
        if (!rig) continue;
        rig.moveTo(unit.x, unit.y);
        rig.setHp(unit.hp);
        rig.body.setAlpha(unit.alive ? 1 : 0.35);
      }
    }

    private addRig(unit: Combatant): UnitRig | null {
      const key = unit.side === 'ally' ? dwarfTextureKey(unit.uid) : foeTextureKey(unit.name);
      if (!this.textures.exists(key)) return null;
      const rig = createUnitRig(this, key, unit.x, unit.y, unit.hpMax, unit.hp);
      this.rigs.set(unit.uid, rig);
      return rig;
    }

    private createUnits(battle: BattleState): void {
      for (const unit of [...battle.allies, ...battle.foes]) this.addRig(unit);
    }

    private createParallax(): void {
      const width = this.scale.width;
      const floor = this._battleData?.battle?.floor ?? 1;
      const prefix = `${floor}_`;

      const ground = this.add.graphics();
      ground.setDepth(5);
      ground.fillStyle(0x2f2114, 1);
      ground.fillRect(0, this.groundY, width, this.scale.height - this.groundY);
      ground.fillStyle(0x453321, 1);
      ground.fillRect(0, this.groundY, width, 4);

      for (let i = 0; i < 5; i++) {
        const key = `${prefix}plx_${i}`;
        if (!this.textures.exists(key)) continue;
        const count = Math.ceil(width / TILE_W) + 1;
        for (let j = 0; j < count; j++) {
          const sprite = this.add.sprite(j * TILE_W, this.groundY - TILE_H / 2, key);
          sprite.setAlpha(0.4 + i * 0.12).setDepth(i);
          sprite._plxIndex = i;
          sprite._wrapW = count * TILE_W;
          this.parallaxSprites.push(sprite);
        }
      }
    }

    private updateParallax(delta: number): void {
      const drift = (GROUND_SPEED_PX_S * delta / 1000) * this.speed;
      for (const sprite of this.parallaxSprites) {
        const factor = PLX_FACTORS[sprite._plxIndex ?? 2] ?? 0.5;
        sprite.x -= drift * factor;
        if (sprite.x < -TILE_W) sprite.x += sprite._wrapW ?? TILE_W * 3;
      }
    }
  }

  return BattleSceneClass;
}

// ── Текстуры параллакса (ЭТАП 3 вынесет это в sceneParallax.ts) ──

import { backdropLayerUrl } from '@/lib/game/art/backdrop';
import { tierForFloor } from '@/lib/game/art/palette';

function parallaxTextureUrls(floor: number): Array<{ key: string; url: string }> {
  const tier = tierForFloor(floor);
  const result: Array<{ key: string; url: string }> = [];
  const layerIndices = [0, 1, 2, 3, 1];
  for (let i = 0; i < 5; i++) {
    const url = backdropLayerUrl(tier, layerIndices[i] ?? 3, 4);
    if (url) result.push({ key: `plx_${i}`, url });
  }
  return result;
}
