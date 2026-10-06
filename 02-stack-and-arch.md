# §2. Стек и Архитектура

> Раздел §2 из ТЗ v7.2 «Гномы и Глубины».

---

## §2.1. Фиксированный стек

| Слой | Технология |
|---|---|
| Фреймворк | **Next.js 16** (App Router, React 19) |
| UI | **React 19** + TypeScript strict + Tailwind CSS |
| Анимации | CSS transitions / keyframes (≤ 300ms) |
| Состояние | Собственный immutable store (React hooks) |
| Сохранение | localStorage (JSON) |
| Звук | WebAudio API (синтез) |
| Тесты | **bun test** (headless-симуляция + unit-тесты) |
| Бандл | Next.js build, < 5 MB gzip |
| Язык | TypeScript strict mode |

**Примечание:** React — осознанное решение заказчика (отклонение от Phaser 3). Все 9 экранов — React-компоненты. Phaser не используется.

---

## §2.2. Структура папок

```
/src
  /lib/game     — game logic (state, seed, types, battle, economy,
                  progression, data, persistence, art)
  /components   — 9 экранов (React-компоненты)
    /game       — игровые экраны (MapScreen, BattleScreen, etc.)
    /ui         — переиспользуемые UI-компоненты
    /art        — процедурные SVG-спрайты (data-URI)
  /app          — Next.js App Router layout/pages
/scripts        — генерация ассетов (Node + Canvas)
/tests
  /unit         — bun test (headless-симуляция + инварианты)
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

## §2.8. App Router layout и точка входа

```
/app
  layout.tsx        — корневой layout (meta viewport, theme, fonts)
  page.tsx          — точка входа (экран Кузницы / Старт)
  /game             — игровые экраны как route-группы
```

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'Гномы и Глубины',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**Примечание:** Вместо Phaser.Game — Next.js App Router. Каждый экран — React-компонент, рендеримый через роутинг или условный рендеринг в одном page.tsx.

---

## §2.9. package.json

```json
{
  "name": "dwarves-and-depths",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "bun test",
    "gen:assets": "tsx scripts/gen-assets.ts"
  },
  "dependencies": {
    "next": "16.2.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "clsx": "^2.1.1",
    "geist": "^1.4.2",
    "next-themes": "^0.4.6",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "@types/node": "^20.19.8",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "eslint": "^9.31.0",
    "eslint-config-next": "16.2.1",
    "tailwindcss": "^3.4.18",
    "autoprefixer": "^10.4.21",
    "prettier": "latest",
    "prettier-plugin-tailwindcss": "latest"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Примечание:** `bun test` вместо `vitest`/`playwright`. Next.js берёт на себя bundling, SSR, routing.

---

## §2.10. Store

```
Собственный immutable store, без внешних зависимостей:
  getState(): State
  setState(updater: (prev: State) => State): void
  subscribe(listener: (state: State) => void): () => void

Обновления — shallow clone + spread.
```
