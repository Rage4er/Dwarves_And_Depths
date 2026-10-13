// §3.1 + §5 Phaser-сцена боя.
//
// Координаты — прямые из BattleState: арена 1920×1080, земля y = FIELD_GROUND_Y,
// юнит ставится setPosition(x, y) без маппинга «1000 → 250 px».
// Логика владеет позицией rig-контейнера; анимации (§5.3) трогают только
// дочернее тело, поэтому твин не может разойтись с симуляцией (§0.8 п.3).
//
// Phaser не импортируется на топ-уровне (SSR-safe): сцена — фабрика, её создаёт
// BattleCanvas после динамической загрузки Phaser.

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
import { spawnPopup, spawnSpark, tweenDeath, tweenHit, tweenLunge } from './sceneFx';

export interface BattleSceneData {
  battle: BattleState;
  dwarves: Array<{ id: string; name: string; role: string }>;
  speed: number;
}

export const BATTLE_SCENE_KEY = 'BattleScene';

// Все виды врагов: подкрепление и призывы не должны оставаться без текстуры
const ALL_FOE_NAMES = Object.values(ENEMY_TABLE).map((e) => e.name);

const COLOR_DAMAGE = 0xff5252;
const COLOR_HEAL = 0x69f0ae;
const COLOR_SPARK_ALLY = 0xff5252;
const COLOR_SPARK_FOE = 0xffd54f;

export function createBattleScene(Phaser: any) {
  const { Scene } = Phaser;

  class BattleSceneClass extends Scene {
    private _battleData: BattleSceneData | null = null;
    private rigs = new Map<string, UnitRig>();
    private layers: any[] = [];
    private prevHp = new Map<string, number>();
    private deadFired = new Set<string>();
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
      queueDwarfTextures(this, this._battleData?.dwarves ?? []);
      queueFoeTextures(this, ALL_FOE_NAMES);
      const floor = this._battleData?.battle?.floor ?? 1;
      for (const { key, url } of parallaxTextureUrls(floor)) {
        const full = `${floor}_${key}`;
        if (!this.textures.exists(full)) this.load.image(full, url);
      }
    }

    create(): void {
      const data = this._battleData;
      if (!data?.battle) return;
      this.rigs.clear();
      this.prevHp.clear();
      this.deadFired.clear();
      // рестарт сцены уничтожает display-объекты Phaser — список попапов обнуляем,
      // иначе cleanup будет обращаться к уже удалённым текстурам
      (this as any)._popups = [];
      this.cameras.main.setBackgroundColor('#141018');
      this.layers = createParallax(this, data.battle.floor, this.groundY);
      for (const unit of [...data.battle.allies, ...data.battle.foes]) this.addRig(unit);
    }

    update(_time: number, delta: number): void {
      scrollParallax(this.layers, delta, this.speed);
    }

    // Единственная точка входа из React: позиция и HP берутся из BattleState
    // (source of truth), эффекты — из дельты относительно прошлого кадра.
    updateFromBattle(battle: BattleState): void {
      for (const unit of [...battle.allies, ...battle.foes]) {
        const rig = this.rigs.get(unit.uid) ?? this.addRig(unit);
        if (!rig) continue;
        rig.moveTo(unit.x, unit.y);
        rig.setHp(unit.hp);
        this.applyUnitDiff(unit, rig);
      }
      this.applyLunges(battle);
    }

    private applyUnitDiff(unit: Combatant, rig: UnitRig): void {
      const was = this.prevHp.get(unit.uid);
      this.prevHp.set(unit.uid, unit.hp);
      if (was === undefined) return;
      // Гнома бьёт враг справа → отбрасывает влево; враг отлетает вправо
      const dir = unit.side === 'ally' ? -1 : 1;
      const delta = unit.hp - was;
      if (delta < 0) {
        tweenHit(this, rig, dir);
        spawnSpark(this, unit.x, unit.y - 120, unit.side === 'ally' ? COLOR_SPARK_ALLY : COLOR_SPARK_FOE);
        spawnPopup(this, unit.x, unit.y - 230, String(delta), COLOR_DAMAGE);
      } else if (delta > 0) {
        spawnPopup(this, unit.x, unit.y - 230, '+' + delta, COLOR_HEAL);
      }
      if (!unit.alive && !this.deadFired.has(unit.uid)) {
        this.deadFired.add(unit.uid);
        tweenDeath(this, rig, dir);
      }
    }

    // Рывок атакующего: имя актёра берём из лог-событий тика (§5.3),
    // остальное уже покрыто дельтой HP
    private applyLunges(battle: BattleState): void {
      for (const e of battle.log) {
        if (e.kind !== 'hit' || !e.actor) continue;
        const actor = [...battle.allies, ...battle.foes].find((c) => c.name === e.actor);
        if (!actor) continue;
        const rig = this.rigs.get(actor.uid);
        if (rig) tweenLunge(this, rig, actor.side === 'ally' ? 1 : -1);
      }
    }

    private addRig(unit: Combatant): UnitRig | null {
      const key = unit.side === 'ally' ? dwarfTextureKey(unit.uid) : foeTextureKey(unit.name);
      if (!this.textures.exists(key)) return null;
      const rig = createUnitRig(this, key, unit.x, unit.y, unit.hpMax, unit.hp);
      this.rigs.set(unit.uid, rig);
      this.prevHp.set(unit.uid, unit.hp);
      return rig;
    }
  }

  return BattleSceneClass;
}
