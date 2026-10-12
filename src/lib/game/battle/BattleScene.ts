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
import {
  createParallax,
  parallaxTextureUrls,
  scrollParallax,
} from './sceneParallax';

export interface BattleSceneData {
  battle: BattleState;
  dwarves: Array<{ id: string; name: string; role: string }>;
  speed: number;
}

export const BATTLE_SCENE_KEY = 'BattleScene';

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
      const floor = this._battleData?.battle?.floor ?? 1;
      this.parallaxSprites = createParallax(this, floor, this.groundY);
    }

    private updateParallax(delta: number): void {
      scrollParallax(this.parallaxSprites, delta, this.speed);
    }
  }

  return BattleSceneClass;
}
