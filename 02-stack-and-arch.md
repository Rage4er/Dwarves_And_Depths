# §2. Стек и Архитектура

> Раздел §2 из ТЗ v7.2 «Гномы и Глубины».

---

## §2.1. Фиксированный стек

| Слой | Технология |
|---|---|
| Рендер | **Phaser 3** (WebGL + Canvas fallback) |
| Анимации | **Phaser tweens** (отскоки, ragdoll, удары) |
| Состояние | Собственный immutable store |
| Сохранение | localStorage (JSON) |
| UI | Phaser DOM + HTML/CSS оверлеи |
| Звук | WebAudio API (синтез) |
| Тесты | Playwright + Lighthouse CI |
| Бандл | Vite, < 5 MB gzip |
| Язык | TypeScript strict mode |

**Запрет:** React, Vue, Svelte, любые UI-фреймворки. Matter.js не используется. Все 9 экранов — Phaser Scenes + HTML/CSS оверлеи.

---

## §2.2. Структура папок

```
/src
  /core         — state, seed, game loop, types
  /battle       — simulateBattleTick, simulateBattle, simulateRun,
                  createBattleState, role resolution, synergies
  /economy      — золото, Наследие, торговец, forge, rest, кузница
  /progression  — RunNode graph, unlock tree, map generator,
                  endless mode
  /ui           — 9 экранов (Phaser Scenes + overlays)
  /data         — JSON schemas + seed tables + events + synergies +
                  enemies + smithy.ts + dwarves.ts (20 гномов)
  /idle         — offline income, auto-loop, autoEquip
  /persistence  — save/load, migration
  /assets       — процедурные спрайты, loader
/scripts        — gen-assets.ts (Node + Canvas)
/tests
  /unit         — vitest
  /playwright   — e2e
/screenshots
/videos
/checkpoints
/memory-bank
/public
  /atlas
```

---

## §2.3. Контракты данных

```typescript
// core/types.ts

type Role = 'tank' | 'warrior' | 'ranged' | 'mage' | 'support' | 'any';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
// v7.2: 6 типов слотов
// 4 базовых: weapon, armor, head + 1 гибкий (trinket/rune/ring)
// 2 дополнительных гибких открываются в Кузнице
type Slot = 'weapon' | 'armor' | 'head' | 'trinket' | 'rune' | 'ring';
type FlexibleSlot = 'trinket' | 'rune' | 'ring';
type RunStatus = 'active' | 'victory' | 'defeat' | 'abandoned' | 'victory_endless';
type Tag = 'metal' | 'cloth' | 'runic' | 'wood' | 'bone';
type NodeType = 'battle' | 'elite' | 'shop' | 'event' | 'rest' | 'boss' | 'forge';

type AttackType = 'melee' | 'ranged';

// v6.9: причина окончания боя
type BattleEndReason =
  | 'victory'
  | 'defeat'
  | 'timeout_collapse'    // обвал пещеры (обычный бой)
  | 'timeout_ancient'     // пробуждение Древнего (элита/босс)
  | 'abandoned';

interface Effect {
  type: 'stun' | 'lifesteal' | 'splash' | 'pierce' | 'taunt' |
        'aura_def' | 'aura_atk' | 'aura_spd' | 'conditional_atk' |
        'double_strike' | 'hp_regen' | 'extra_slot' | 'poison' | 'burn' |
        'summon';                    // v6.7: для финального босса
  value: number;
  chance?: number;
  radius?: number;
  condition?: 'hp_below_30';
  duration?: number;
}

interface StatusEffect {
  id: string;
  type: 'poison' | 'burn' | 'stun' | 'bleed';
  remainingTurns: number;
  value: number;
}

// v7.2: atk/def/hp могут быть отрицательными (trade-off)
interface Equipment {
  id: string;
  name: string;
  slot: Slot;
  role: Role;
  atk: number; def: number; hp: number;   // могут быть отрицательными (trade-off)
  effects: Effect[];
  rarity: Rarity;
  tags: Tag[];
  stage: 1 | 2 | 3;
}

interface Dwarf {
  id: string;
  name: string;
  baseHP: number; baseATK: number; baseDEF: number;
  equipment: Equipment[];
  currentHP: number;
  isAlive: boolean;
  speed: number;
  role: Role;              // v7.1: 'any' если нет экипировки с ролью
  statusEffects: StatusEffect[];
  localSlotBonus: number;
}

interface Enemy {
  id: string;
  name: string;
  baseHP: number; baseATK: number; baseDEF: number;
  speed: number;
  attackType: AttackType;         // v7.0: 'melee' | 'ranged'
  attackRange: number;            // v7.0: 80 melee, 260 ranged
  effects: Effect[];
  statusEffects: StatusEffect[];
  isBoss: boolean;
  isElite: boolean;
  currentHP: number;
  isAlive: boolean;
}

interface BattleDwarf {
  dwarfId: string;
  positionIndex: number;
  x: number;
  y: number;
  attackCooldown: number;
}

interface BattleEnemy {
  enemyId: string;
  instanceId: string;
  x: number;
  y: number;
  attackCooldown: number;
}

interface BattleState {
  phase: 'running' | 'victory' | 'defeat';
  isBossFight: boolean;
  isEndless: boolean;                // v6.7: бесконечный режим
  endReason: BattleEndReason | null; // v6.9: почему бой закончился
  dwarves: Dwarf[];
  battleDwarves: BattleDwarf[];
  enemies: Enemy[];
  battleEnemies: BattleEnemy[];
  timeElapsed: number;
  seed: number;
  log: string[];
  totalEnemies: number;
  enemiesSpawned: number;
  spawnTimer: number;
  enemyPool: string[];
  poisonBurnTimer: number;
  regenTimer: number;
  tauntMemory: {
    x: number;
    remainingMs: number;
  } | null;
  summonTimer: number;               // v6.7: для e_forge_demon
}

interface ShopItem {
  type: 'equipment' | 'dwarf';
  id: string;
  price: number;
}

interface RunNode {
  id: string;
  type: NodeType;
  difficulty: number;
  rewards: { gold: number; itemIds: string[] };
  next: string[];
  data?: {
    enemyIds?: string[];
    enemyTypes?: string[];            // v7.0: уникальные типы волны (§3.3.1) — превью экрана 3
    eventId?: string;
    shopStock?: ShopItem[];
  };
}

interface RunState {
  runId: string;
  seed: number;
  floor: number;
  depth: number;                     // v6.7: текущая глубина
  gold: number;
  dwarves: Dwarf[];
  inventory: Equipment[];
  currentNodeId: string;
  map: RunNode[];
  status: RunStatus;
  bossKilled: boolean;
  elitesKilled: number;
  startedAt: number;
  isEndless: boolean;                // v6.7: бесконечный режим
  endlessFloor: number;              // v6.7: номер слоя в бесконечном
}

interface Choice {
  nodeId: string;
  choiceIndex: number;
}

interface MetaState {
  legacy: number;
  maxSlots: number;
  maxPartySize: number;
  smithyLevel: number;
  offlineBonusPerHour: number;
  maxFloorEverReached: number;
  unlockedDwarves: string[];
  unlockedEquipment: string[];
  deadDwarves: string[];
  lastSeenAt: number;
  runCount: number;
  bossesKilledTotal: number;         // v6.7: всего убито боссов
  endlessUnlocked: boolean;          // v6.7: открыт ли бесконечный режим
  maxDepthEver: number;              // v6.7: рекорд по глубине
  skipPrepScreen: boolean;           // v7.1: UI-настройка «Не показывать экран подготовки»
}
```

---

## §2.4. Детерминизм

- Симуляция боя: seed → PRNG (Mulberry32). Одинаковый seed + `FIXED_TIMESTEP_MS` → одинаковый результат.
- Симуляция — чистая TS-логика, без Phaser.
- Phaser tweens — только визуальный слой.
- Карта забега: seed → генерация графа.
- Тест: `simulateRun(42)` дважды → JSON diff пустой.

---

## §2.5. Performance budget

| Метрика | Бюджет | Измерение |
|---|---|---|
| Draw calls | < 200 | Phaser renderer stats |
| FPS desktop | ≥ 60 | rAF counter |
| FPS mobile | ≥ 30 | rAF counter |
| Bundle size | < 5 MB gzip | `vite build` + Node zlib |
| TTI | < 3 s | Lighthouse |
| Heap | < 256 MB | DevTools Memory |

---

## §2.6. Persistence contract

```
localStorage:
  key: 'dnd_meta_v1' → MetaState (JSON)
  key: 'dnd_run_v1'  → RunState | null (JSON)
  key: 'dnd_schema'  → { version: 1 }

Timestamp:
  lastSeenAt = Date.now()
  delta = Math.max(0, Date.now() - meta.lastSeenAt)
  Защита: if (delta > 8 * 3600000) → clamp to 8h

Сохранение: после каждого узла; после каждого боя; при 
visibilitychange → 'hidden'; дебаунс 500ms.

ВАЖНО: BattleState НЕ сохраняется. BattleDwarf/BattleEnemy — 
runtime-only.
```

---

## §2.7. Error handling

| Ситуация | Поведение |
|---|---|
| Закрытие во время боя | RunState сохраняется на начало боя |
| Непроходимая карта | fallback: линейный путь |
| Δhours < 0 | offlineGain = 0, warning |
| Инвентарь > 100 | авто-продажа common за 5 gold |
| Осиротевший equip | удаляется, лог |
| Seed → невалидный граф | перегенерация с seed+1 |
| Битый save | сброс с confirm |
| availableDwarves < 2 | сброс deadDwarves |

---

## §2.8. index.html и точка входа

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Гномы и Глубины</title>
</head>
<body>
  <div id="game"></div>
  <div id="ui-overlay"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

```typescript
// src/main.ts
import Phaser from 'phaser';
import { BootScene } from './ui/scenes/BootScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
});
```

---

## §2.9. package.json

```json
{
  "name": "dwarves-and-depths",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "gen:assets": "tsx scripts/gen-assets.ts",
    "prebuild": "npm run gen:assets",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.5.0",
    "@playwright/test": "^1.43.0",
    "tsx": "^4.7.0",
    "@napi-rs/canvas": "^0.1.50",
    "get-video-duration": "^4.1.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## §2.10. Store

```
Собственный immutable store, без внешних зависимостей:
  getState(): State
  setState(updater: (prev: State) => State): void
  subscribe(listener: (state: State) => void): () => void

Обновления — shallow clone + spread.
```
