# Промпт-ТЗ v5.2: «Гномы и Глубины» — финальная production-версия

*Единый документ для запуска с пустой папки. Включает bootstrap, стоп-фразу, контракты index.html/package.json/architecture.md, защиту от подмены стека, и полную спецификацию игры. Исправлен `GIT_COMMIT` → `git rev-parse --short HEAD` в скрипте замера bundle. Готов к копированию в одно сообщение.*

---

## 0. СТОП-ФРАЗА (приоритет выше всех инструкций ниже)

```
Любая замена Phaser 3 на React/Vue/Svelte/vanilla-DOM/Canvas-2D-
как-замена-Phaser, любая замена Matter.js на CSS-анимации,
любое удаление Playwright-теста, любое упрощение DoD —
СЧИТАЕТСЯ ПРОВАЛОМ ФАЗЫ, независимо от того, насколько лучше
выглядит результат.

Агент НЕ ИМЕЕТ ПРАВА принимать такое решение самостоятельно,
даже если:
  - «так быстрее»
  - «так проще»
  - «так меньше бандл»
  - «пользователь скорее всего хотел именно это»
  - «это же эквивалентная замена»

При возникновении сомнения — STOP, defects.md, предложить вариант
БЕЗ смены стека, ждать следующей инструкции.

Единственное допустимое отклонение — зафиксированное в defects.md
с обоснованием и предложенным решением без смены базового стека.
```

---

## 0.1. Роль и контекст

**Роль:** Автономный ИИ-агент GameDev (full-stack).
**Вход:** пустая папка + этот документ + доступ к ФС/терминалу/браузеру.
**Ограничения:**
- Без вопросов к пользователю. Все развилки решаются агентом по правилам этого документа, решение фиксируется в defects.md.
- Без остановки до состояния «играбельно от начала до конца».
- Всё тестируется автоматически (headless + скрины + видео).

---

## 0.2. Bootstrap (первые 60 секунд)

Агент выполняет **строго в этом порядке**, до чтения §1:

```
1. Проверить окружение:
     node --version    (требуется ≥ 20.x)
     npm --version     (требуется ≥ 10.x)
     git --version     (если нет — использовать fallback)
   Записать версии в /memory-bank/tech-stack.md.

2. Если git доступен:
     git init
     git config user.email "agent@local"
     git config user.name "AutoAgent"

3. Создать .gitignore:
     node_modules/
     dist/
     .vite/
     *.log
     /screenshots/tmp/
     /videos/tmp/
     .DS_Store

4. Создать .nvmrc:
     20

5. Создать структуру папок (§2.2) — только директории, пустые:
     mkdir -p src/{core,battle,economy,progression,ui,data,idle,persistence,assets}
     mkdir -p scripts tests/{unit,playwright}
     mkdir -p memory-bank screenshots videos checkpoints public/atlas

6. Первый коммит:
     git add -A
     git commit -m "bootstrap: empty skeleton"
     git tag phase-0-bootstrap

7. Создать PROMPT.md — скопировать сюда этот документ целиком
   (self-reference для будущих сессий агента).

8. Создать architecture.md по контракту §0.4 (сначала — скелет,
   заполнится деталями на Фазе 1).

9. Создать memory-bank/ по шаблонам §0.5.

10. Только после этого — ШАГ 0 Фазы 1 (§8): npm install phaser matter-js,
    замер bundle baseline.

Если git недоступен:
  - Пропустить 2, 6.
  - Создать /checkpoints/.
  - Зафиксировать в defects.md: "git unavailable, using tar fallback".
Если npm install падает по сети:
  - Записать в defects.md, ОСТАНОВИТЬСЯ.
  - Предложить вариант БЕЗ смены стека (offline cache, mirror registry).
  - Не менять стек (см. §0 стоп-фраза).
```

---

## 0.3. Чекпоинты

```
Чекпоинт = git commit + tag, зафиксированный сразу после приёмки фазы.

Перед началом фазы N+1:
  git add -A && git commit -m "phase-N accepted"
  git tag phase-N-accepted

При провале приёмки фазы N+1:
  git stash push -u -m "phase-(N+1) failed attempt"
  git reset --hard phase-N-accepted
  (stash сохраняет наработки для анализа, дерево возвращается к чекпоинту)

Если git недоступен — fallback: tar-архив /src + /memory-bank
в /checkpoints/phase-N.tar.gz перед стартом фазы N+1.
Откат = распаковка поверх текущего состояния с заменой.
После создания архива проверить целостность:
  tar -tzf /checkpoints/phase-N.tar.gz > /dev/null
  if exit code != 0 → FAIL, log в defects.md, повторить создание.
Механизм фиксируется один раз в architecture.md на Фазе 1.
```

---

## 0.4. Контракт architecture.md

```
architecture.md обязательно содержит:

1. Список модулей из §2.2 и их публичные экспорты:
     - имя модуля
     - сигнатуры функций/классов, которые он предоставляет
     - зависимости (что импортирует)

2. Направленный граф зависимостей между модулями (без циклов).
   Особое правило: /src/battle/simulator.ts НЕ импортирует
   Phaser, Matter.js, DOM — это контрактное ограничение (§3.1.7).

3. Механизм чекпоинтов (§0.3): git или tar — что выбрано и почему.

4. Точку входа (src/main.ts) и её связи с Phaser.Game.

5. Список всех Phaser Scenes с зонами ответственности.

6. Явное подтверждение фиксированного стека (§2.1):
   Phaser 3, Matter.js, никакого React/Vue/другого UI-фреймворка.

Без всех 6 пунктов architecture.md не принимается на Фазе 1.
```

---

## 0.5. Контракт memory-bank/

```
Все файлы — markdown, обновляются append-only (не перезапись):

  tech-stack.md
    - Версии node/npm/git/phaser/matter на старте
    - Все последующие изменения (с причиной)

  progress.md
    - Журнал: [timestamp] phase-N [status]
    - Ссылки на скрины и хеш коммита для каждой фазы

  defects.md
    - Журнал отклонений: [timestamp] [severity] [phase]
    - Описание + обоснование + решение
    - Формат severity: BLOCKER | CRITICAL | MEDIUM | MINOR

  implementation-plan.md
    - Текущий план на 3 фазы вперёд
    - Обновляется в начале каждой фазы

  game-design-document.md
    - Выжимка из §1, §3, §6 этого ТЗ
    - Для быстрой справки без перечитывания всего ТЗ

  bundle-baseline.txt
    - Формат: "Baseline bundle (gzip): X.XX MB / 5 MB budget"
              + "Headroom: Y.YY MB"
              + "Measured at: <ISO timestamp>"
              + "Commit: <short hash>"
    - Создаётся на Фазе 1 (ШАГ 0, §8) Node-скриптом замера
    - Обновляется на Фазе 7 финальным замером
    - При превышении бюджета (> 5 MB gzip):
        * запись в defects.md с severity BLOCKER
        * STOP фазы по §0 (стоп-фраза)
        * предложить 1–2 варианта без смены стека
```

---

## 0.6. Цикл работы

```
1. Прочитать ТЗ (этот документ).
2. Выполнить §0.2 (bootstrap) — до чтения §1.
3. Создать architecture.md (§0.4), memory-bank (§0.5).
4. ШАГ 0 Фазы 1 (§8) — проверка бюджета бандла ДО написания
   кода фич.
5. Для каждой фазы (§8):
     реализация → unit-тест → Playwright-сценарий →
     скриншот → объективный чеклист → git-чекпоинт →
     запись в progress.md.
6. Фаза N+1 не начинается, пока фаза N не принята.
```

---

## 1. КОНЦЕПЦИЯ

- **Название:** «Гномы и Глубины» (Dwarves & Depths)
- **Жанр:** Single-player Idle Roguelite Auto Battler
- **Платформа:** браузер (desktop 1920×1080 landscape, mobile 667×375 forced-landscape)
- **Формула:** Auto Battler × Idle × Roguelite × Single-player
- **Эмоциональная цель:** «Это моя ошибка» → «В следующий раз будет лучше»
- **Сессия:** 8–12 минут на забег, бесконечная мета-прогрессия

---

## 2. СТЕК И АРХИТЕКТУРА

### 2.1. Фиксированный стек

| Слой | Технология |
|---|---|
| Рендер | **Phaser 3** (WebGL + Canvas fallback) |
| Физика | **Matter.js** (ragdoll, отскоки) |
| Состояние | Собственный immutable store (см. §2.10) |
| Сохранение | localStorage (JSON) |
| UI | Phaser DOM + HTML/CSS оверлеи |
| Звук | WebAudio API (синтез, без сэмплов) |
| Тесты | Playwright + Lighthouse CI |
| Бандл | Vite, < 5 MB gzip |
| Язык | TypeScript strict mode |

**Явный запрет:** React, Vue, Svelte, любые UI-фреймворки поверх Phaser — не используются нигде. Все 10 экранов (§4) — Phaser Scenes либо HTML/CSS-оверлеи поверх Phaser canvas.

### 2.2. Структура папок

```
/src
  /core         — state, seed, game loop, types
  /battle       — simulateTurn, simulateRun (§3.1.7–3.1.8),
                  physics adapter, role resolution, synergies
  /economy      — золото, Наследие, торговец, forge, rest, кузница
  /progression  — RunNode graph, unlock tree, map generator
  /ui           — 10 экранов (Phaser Scenes + overlays)
  /data         — JSON schemas + seed tables + events + synergies +
                  enemies + smithy.ts (§3.5)
  /idle         — offline income, auto-loop, autoEquip
  /persistence  — save/load, migration
  /assets       — процедурные спрайты, loader
/scripts        — gen-assets.ts (Node + Canvas)
/tests
  /unit         — vitest
  /playwright   — e2e
/screenshots
/videos
/checkpoints    — fallback-архивы (§0.3), только если git недоступен
/memory-bank    — journal-файлы (§0.5)
/public
  /atlas        — сгенерированные PNG + JSON
```

### 2.3. Контракты данных (единственный источник истины)

```typescript
// core/types.ts

type Role = 'tank' | 'warrior' | 'ranged' | 'mage' | 'support' | 'any';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
type Slot = 'weapon' | 'armor' | 'trinket' | 'rune';
type Position = 'front' | 'mid' | 'back';
type RunStatus = 'active' | 'victory' | 'defeat' | 'abandoned';
type Tag = 'metal' | 'cloth' | 'runic' | 'wood' | 'bone';
type NodeType = 'battle' | 'elite' | 'shop' | 'event' | 'rest' | 'boss' | 'forge';

// Effect.value — единицы измерения по типу:
//   'stun'            → value = шанс срабатывания в % (15 = 15%)
//   'lifesteal'       → value = доля от нанесённого урона в % (50 = 50%)
//   'splash'          → value = доля урона по соседям в % (30 = 30%)
//   'pierce'          → value = игнорируемая доля DEF в % (50 = 50%)
//   'taunt'           → value = длительность в ходах (2)
//   'aura_def'/'aura_atk'/'aura_spd' → value = бонус в % (10 = +10%)
//   'conditional_atk' → value = бонус ATK в % при условии (50 = +50%)
//   'double_strike'   → value = шанс второго удара в % (50 = 50%)
//   'hp_regen'        → value = абсолютное HP за ход (5 = 5 hp), §3.1.9
//   'extra_slot'      → value игнорируется, наличие = булев флаг (§3.1.6)
//   'poison'/'burn'   → value = урон за ход, абсолютное HP (5 = 5 hp/turn)
//
// DUAL-MEANING эффекты ('poison', 'burn'):
//   Несут ДВА смысла одновременно:
//     value  = урон/эффект (что делает)
//     chance = вероятность срабатывания в % (как часто)
//   Пример: { type: 'poison', value: 5, chance: 20 } =
//     "20% шанс наложить 5 hp/turn"
//   Если chance не задан → срабатывает безусловно (100%).
//
// Для всех остальных типов chance ОПЦИОНАЛЕН и, если задан,
// переопределяет встроенную семантику value. Примеры:
//   { type: 'stun', value: 15 }             → 15% шанс стана
//   { type: 'stun', value: 15, chance: 50 } → 50% шанс стана
//   { type: 'lifesteal', value: 50 }        → 50% от урона в hp (всегда)
//   { type: 'lifesteal', value: 50, chance: 80 } → 80% шанс срабатывания
interface Effect {
  type: 'stun' | 'lifesteal' | 'splash' | 'pierce' | 'taunt' |
        'aura_def' | 'aura_atk' | 'aura_spd' | 'conditional_atk' |
        'double_strike' | 'hp_regen' | 'extra_slot' | 'poison' | 'burn';
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

interface Equipment {
  id: string;
  name: string;
  slot: Slot;
  role: Role;
  atk: number; def: number; hp: number;
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
  position: Position;
  currentHP: number;
  isAlive: boolean;
  speed: number;
  role: Role;
  roleBias: Role;
  statusEffects: StatusEffect[];
  localSlotBonus: number;
}

interface Enemy {
  id: string;
  name: string;
  baseHP: number; baseATK: number; baseDEF: number;
  speed: number;
  effects: Effect[];
  statusEffects: StatusEffect[];
  isBoss: boolean;
  isElite: boolean;
  currentHP: number;
  isAlive: boolean;
  position: Position;
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
    eventId?: string;
    shopStock?: ShopItem[];
  };
}

interface RunState {
  runId: string;
  seed: number;
  floor: number;
  gold: number;
  dwarves: Dwarf[];
  inventory: Equipment[];
  currentNodeId: string;
  map: RunNode[];
  status: RunStatus;
  bossKilled: boolean;
  elitesKilled: number;
  startedAt: number;
}

interface Choice {
  nodeId: string;
  choiceIndex: number;
}

interface AutoEquipTemplate {
  tank:    { weapon?: string; armor?: string; trinket?: string };
  warrior: { weapon?: string; armor?: string; trinket?: string };
  ranged:  { weapon?: string; armor?: string; trinket?: string };
  mage:    { weapon?: string; armor?: string; trinket?: string };
  support: { weapon?: string; armor?: string; trinket?: string };
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
  lastSeenAt: number;
  runCount: number;
  unlocks: {
    autoBattle: boolean;
    autoRepeat: boolean;
    autoEquip: boolean;
  };
  autoEquipTemplate?: AutoEquipTemplate;
}
```

### 2.4. Детерминизм

- Симуляция боя: seed → PRNG (Mulberry32). Одинаковый seed = одинаковый исход.
- Физика Matter.js: solver инициализируется тем же seed.
- Карта забега: seed → генерация графа (§3.3.1).
- Тест: `simulateRun(42)` дважды → JSON diff пустой (§3.1.8, §7.2).

### 2.5. Performance budget

| Метрика | Бюджет | Измерение |
|---|---|---|
| Draw calls | < 200 | Phaser renderer stats |
| FPS desktop | ≥ 60 | rAF counter |
| FPS mobile | ≥ 30 | rAF counter |
| Bundle size | < 5 MB gzip | `vite build` + Node zlib |
| TTI | < 3 s | Lighthouse |
| Heap | < 256 MB | DevTools Memory |

Проверяется на Шаге 0 Фазы 1 (§8), до реализации фич.

### 2.6. Persistence contract

```
localStorage:
  key: 'dnd_meta_v1' → MetaState (JSON)
  key: 'dnd_run_v1'  → RunState | null (JSON)
  key: 'dnd_schema'  → { version: 1 }

Timestamp:
  lastSeenAt = Date.now()
  delta = Math.max(0, Date.now() - meta.lastSeenAt)
  Защита: if (delta > 8 * 3600000) → clamp to 8h

Сохранение: после каждого узла (run); после каждого боя
(meta.legacy); при visibilitychange → 'hidden'; дебаунс 500ms.

Миграция: if (saved.version < CURRENT) → runMigration(saved);
if (migration fails) → сброс с confirm-диалогом.
```

### 2.7. Error handling

| Ситуация | Поведение |
|---|---|
| Закрытие во время боя | run сохраняется на начало боя |
| Непроходимая карта | fallback: линейный путь |
| Δhours < 0 | offlineGain = 0, warning в лог |
| Инвентарь > 100 предметов | авто-продажа common за 5 gold (§3.3.2) |
| Осиротевший equip | удаляется при загрузке, лог |
| Seed → невалидный граф | перегенерация с seed+1 |
| Битый save | сброс с confirm-диалогом |

### 2.8. index.html и точка входа

```html
<!-- index.html — минимальный контракт -->
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

```
src/main.ts — точка входа:
  import Phaser from 'phaser';
  import { BootScene } from './ui/scenes/BootScene';
  // ... остальные сцены

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: { gravity: { y: 1 }, debug: false },
    },
    scene: [BootScene, /* ... */],
  });
```

### 2.9. package.json — минимальный контракт

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
    "phaser": "^3.80.0",
    "matter-js": "^0.19.0"
  },
  "devDependencies": {
    "@types/matter-js": "^0.19.0",
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

### 2.10. Store — без внешних зависимостей

```
Собственный immutable store (без внешних зависимостей), API:
  getState(): State
  setState(updater: (prev: State) => State): void
  subscribe(listener: (state: State) => void): () => void

Обновления — через shallow clone + spread. Без Immer/Zustand/Redux.
Причина: минимум зависимостей, полный контроль, нет React-конфликта.
```

---

## 3. ГЕЙМПЛЕЙНОЕ ЯДРО

### 3.1. Auto Battler (детерминированная симуляция)

```
Инициатива:  speed = base(10) + equipMod + rand(seed, 0..3)
Порядок хода: единая очередь по speed (desc), tie-break: seed PRNG.
Атака:       rawDmg = atk - target.def * (1 - pierce)
             if rawDmg < 1 → 1
Спецэффекты: stun → skip 1 turn (шанс = value%)
             lifesteal → heal(dmg * value/100)
             splash → dmg * value/100 по соседям цели
             double_strike → 2-й удар с шансом value%, урон 50%
             conditional_atk → atk × (1 + value/100), если hp < 30%
             poison/burn → срабатывает с шансом Effect.chance
                           (default 100%), наносит value hp/turn
                           на duration ходов
             hp_regen → см. §3.1.9
Смерть:      hp ≤ 0 → isAlive=false, ragdoll trigger
Победа:      все враги dead
Поражение:   все гномы dead
Лимит ходов: MAX_TURNS = 50, MAX_TURNS_BOSS = 100
             если лимит достигнут → run.status = 'defeat'
```

**Формация:** 3 линии (front/mid/back).
- front: ×1.5 получаемый урон, приоритет цели
- mid: ×1.0
- back: ×0.5 получаемый урон, дальние атаки

#### 3.1.1. Battle scene layout

```
Canvas: 1280×720 (desktop), 667×375 (mobile forced-landscape).
Сетка: 8 колонок × 4 ряда.
Гномы: колонки 0–2 (left), враги: колонки 5–7 (right).
Front line = row 2, mid = row 1, back = row 0.
Камера: статичная, fit-to-screen.
Слои (z-index): bg_far(0.0) → bg_mid(0.1) → bg_crystals(0.2) →
                bg_near(0.3) → bg_fog(0.4) → shadows(1) → bodies(2)
                → particles(3) → hp_bars(4) → ui(5).
Ход: 600ms анимация + 200ms пауза.
Максимум врагов: 6. Максимум гномов: 10.
```

#### 3.1.2. Run termination

```
Триггеры конца забега:
1. Все гномы dead в бою → run.status = 'defeat'
2. Игрок жмёт «Сдаться» → run.status = 'abandoned'
3. Босс убит → run.status = 'victory'
4. MAX_TURNS reached → run.status = 'defeat'

При defeat/abandoned:
- legacy = floor × 5
- unlockedEquipment не обновляется
- runCount++
- Инвентарь сбрасывается
- Переход на экран 10

При victory:
- legacy = floor × 5 + 50 + (elitesKilled > 0 ? 10 : 0)
- unlockedEquipment обновляется (§3.3.6)
- runCount++
- Переход на экран 10

Разблокировка гномов (unlockedDwarves) — независима от результата
забега, срабатывает при входе на любой узел (§3.3.5.1).
```

#### 3.1.3. Role resolution

```
Dwarf.role = роль предмета в самом приоритетном слоте.
Priority: weapon > armor > trinket > rune.
Если предмет имеет role = 'any' → пропускается при поиске роли.
Если weapon нет → смотрим armor → trinket → rune.
Если нет предметов с конкретной ролью → role = dwarf.roleBias (§6.1).
Конфликт (weapon=ranged, armor=tank) → роль ranged, stats от armor
применяются полностью. Штрафов нет.
```

#### 3.1.4. Synergies (резолвятся перед боем)

```typescript
interface Synergy {
  id: string;
  name: string;
  condition: SynergyCondition;
  effect: SynergyEffect;
}

type SynergyCondition =
  | { type: 'count_role'; role: Role; count: number; line?: Position }
  | { type: 'count_tag'; tag: Tag; count: number }
  | { type: 'combo'; roles: Role[]; sameLine: boolean };

type SynergyEffect =
  | { type: 'buff_atk'; value: number; target: 'all' | Role }
  | { type: 'buff_def'; value: number; target: 'all' | Role }
  | { type: 'buff_spd'; value: number; target: 'all' | Role }
  | { type: 'buff_hp'; value: number; target: 'all' | Role };
```

Встроенные синергии — см. §6.6. count_tag считает теги по всем надетым предметам всех живых гномов в начале боя. Синергии стакаются, проверяются перед каждым боем.

#### 3.1.5. Target selection

```
1. Если есть taunt-цель → атакует её.
2. Иначе: приоритет front > mid > back среди живых.
3. Если в линии нет живых → следующая линия.
4. Fallback: first alive in any line.
5. Внутри линии: случайная цель (seed PRNG).
taunt: длительность из Effect.value (ходов), forced targeting.
```

#### 3.1.6. Extra slot

```
extraSlotCount = количество предметов с effect.type = 'extra_slot'.
localSlotBonus = Math.min(1, extraSlotCount).
Итоговый лимит слотов = meta.maxSlots + localSlotBonus.
```

#### 3.1.7. Разделение логики и рендера (ОБЯЗАТЕЛЬНО)

```
/src/battle/simulator.ts экспортирует чистую функцию хода:
  export function simulateTurn(state: BattleState): BattleState
Не импортирует Phaser, Matter.js, DOM API. POJO in/out.
Детерминирована по seed. Рендер (Phaser Scene) визуализирует уже
посчитанный результат, никогда не содержит игровой логики.
```

#### 3.1.8. simulateRun — headless-прогон всего забега

```typescript
// /src/battle/simulator.ts (тот же модуль, что §3.1.7)

export interface RunOptions {
  maxFloors?: number;
  scriptedChoices?: Choice[];
  aiPolicy?: 'greedy' | 'random';   // default 'greedy'
}

export function simulateRun(
  seed: number,
  options?: RunOptions
): RunState
```

Поведение:
1. Генерирует карту через `generateMap(seed)` (`/src/progression`).
2. Формирует стартовый отряд (дефолт для headless: `d_brom` + `d_grim`, если meta не передана).
3. Проходит узлы карты: `battle`/`elite`/`boss` → `simulateTurn()` в цикле до победы/поражения/лимита ходов; `shop`/`forge`/`rest`/`event` → `scriptedChoices[nodeId]`, иначе `aiPolicy`.
4. Останавливается на `victory`/`defeat`/`abandoned` либо `maxFloors`.
5. Возвращает финальный `RunState`.

Не импортирует Phaser/Matter/DOM. Используется в determinism-тесте (§7.2) и balance-тесте (§7.5).

#### 3.1.9. hp_regen — механика

```
Срабатывает в конце хода гнома-владельца предмета (после его атаки,
до перехода хода дальше). heal(value) — абсолютное HP, не выше maxHP.
Стекается: сумма value всех hp_regen-предметов гнома за один тик.
Не срабатывает, если гном мёртв или оглушён.
```

### 3.2. Idle-слой

| Механика | Триггер | Формула |
|---|---|---|
| Offline-Наследие | reopen app | `Δ = max(0, Date.now() - meta.lastSeenAt) / 3.6e6`; `gain = min(Δ, 8) × (1 + smithy × 0.5 + offlineBonus × 0.1)` |
| Сон кузницы | reopen app | `itemRolls = floor(Δ)`; каждый = случайный unlocked item с весами по редкости |
| Авто-бой | unlock.runCount≥3 | пропуск кнопки «В бой», сразу `runBattle(seed)` |
| Авто-повтор | unlock.runCount≥5 | после боя авто-выбор предыдущего типа узла |
| Авто-подбор | unlock.runCount≥7 | шаблон (role→slot), применяется к новым гномам |

#### 3.2.1. AutoEquip algorithm

```
Триггер: unlock.autoEquip = true (runCount ≥ 7).
Для каждого dwarf: определить role (§3.1.3) → взять template[role] →
для каждого slot: если в inventory есть предмет с этим id → надеть.
Применять к новым гномам при найме.
UI: экран 7 → вкладка «Шаблон» → drag&drop.
```

### 3.3. Roguelite: граф забега

#### 3.3.1. Map generation algorithm

```
1. depth = 8 + (((seed % 4) + 4) % 4)  // всегда 8–11
2. Каждый слой: 1–3 узла.
3. Слой 0: 1 узел (battle). Слой depth-1: 1 узел (boss).
4. Перед боссом (depth-2): гарантирован shop или rest.
5. Bipartite-граф: 1–3 исходящих, 1–2 входящих на узел.
6. Запрещено: 2 elite подряд на одном пути.
7. seed → PRNG → выбор типов узлов по nodeProb(floor).
8. Валидация: каждый узел достижим из старта, босс достижим из всех.
9. Если невалидна → перегенерация с seed+1.
```

```typescript
function getNodeProbs(floor: number): Record<NodeType, number> {
  const raw = {
    battle: 0.50,
    elite: 0.15 + floor * 0.01,
    shop: Math.max(0, 0.15 - floor * 0.005),
    event: 0.12,
    rest: 0.05,
    forge: 0.03
  };
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v / sum])
  ) as Record<NodeType, number>;
}
```

```
legacy = floor × 5 + (bossKilled ? 50 : 0) + (elitesKilled > 0 ? 10 : 0)
```

#### 3.3.2. Shop behavior

```
Stock: 3 equipment + 1 dwarf (if gold ≥ 10 и party < 10).
Цены: common 5, rare 12, epic 25, legendary 50, dwarf 10.
Stock фиксируется при генерации карты (seed).
Повторный заход: stock не меняется.
Продажа: только авто-механика при инвентаре > 100 (§2.7).
```

#### 3.3.3. Forge behavior

```
1. Игрок выбирает 1 предмет из run.inventory.
2. Стоимость: 10 gold (common→rare), 20 (rare→epic),
   40 (epic→legendary).
3. Применяется rarity++ (§6.5.1). Поле stage НЕ меняется.
4. Если gold < стоимости → forge недоступен, узел пустой.
5. Если инвентарь пуст → узел пропускается.
```

#### 3.3.4. Rest behavior

```
Игрок выбирает A (choiceIndex=0) или B (choiceIndex=1):
  A: heal 50% maxHP всем живым гномам.
  B: remove all statusEffects у всех гномов.
```

#### 3.3.5. Unlock table (dwarves)

```json
[
  { "floor": 1,  "dwarfId": "d_brom" },
  { "floor": 1,  "dwarfId": "d_grim" },
  { "floor": 3,  "dwarfId": "d_thorvin" },
  { "floor": 6,  "dwarfId": "d_dvalin" },
  { "floor": 10, "dwarfId": "d_nori" },
  { "floor": 15, "dwarfId": "d_bofur" }
]
```

Примечание: floor в этой таблице сверяется с `meta.maxFloorEverReached` (§3.3.5.1), а не с floor текущего забега. `d_bofur` (floor 15) — осознанная мета-цель на несколько забегов подряд. Это не баг.

#### 3.3.5.1. Триггер разблокировки

```
При ВХОДЕ игрока на ЛЮБОЙ узел любого забега:
  1. Обновить накопленный прогресс:
       meta.maxFloorEverReached =
         Math.max(meta.maxFloorEverReached, currentFloor)
  2. Проверить разблокировки против накопленного прогресса:
       for each entry in unlock table
         where entry.floor <= meta.maxFloorEverReached:
           if entry.dwarfId not in meta.unlockedDwarves:
             meta.unlockedDwarves.push(entry.dwarfId)
             → тост "Открыт гном: <имя>" (не блокирующий)
  3. Сохранить meta немедленно (§2.6).
```

#### 3.3.5.2. Соответствие floor и depth

```
Один забег имеет depth = 8–11 слоёв (§3.3.1); floor внутри забега
растёт от 1 до depth и сбрасывается при старте нового забега.
meta.maxFloorEverReached НЕ сбрасывается между забегами.
```

#### 3.3.6. Equipment unlock

```
При победе над elite: random equipment из stage 2–3 с rarity
rare/epic → unlock.
При победе над боссом: random equipment из stage 3 с rarity
legendary/epic → unlock.
UI: экран 10 → строка «Открыто: Башенный щит».
```

### 3.4. Run start

```
1. Игрок выбирает от 1 до meta.maxPartySize гномов из unlockedDwarves.
2. Каждому даётся 1 случайный common item → в run.inventory.
3. gold = 0. inventory = [N common items, N = размер отряда].
4. map = generateMap(seed, floor=1).
5. currentNodeId = map[0].id (battle).
6. Переход на экран 3. Игрок надевает предметы через drag&drop.
```

`maxSlots` НЕ влияет на размер стартового отряда — два независимых апгрейда в кузнице (§3.5).

### 3.5. Экономика кузницы

Экран 1 — единственное место траты legacy. Апгрейды — данные, не union-тип.

```typescript
// /src/data/smithy.ts
type UpgradableMetaField =
  'maxSlots' | 'maxPartySize' | 'smithyLevel' | 'offlineBonusPerHour';

export interface SmithyUpgradeDef {
  id: UpgradableMetaField;
  metaField: UpgradableMetaField;
  name: string;
  effectPerLevel: string;
  baseCost: number;
  maxLevel: number;   // Infinity для smithyLevel
  iconId: string;
}

export const SMITHY_UPGRADES: SmithyUpgradeDef[] = [
  { id: 'maxSlots', metaField: 'maxSlots', name: 'Слоты экипировки',
    effectPerLevel: '+1 слот на гнома', baseCost: 50, maxLevel: 2,
    iconId: 'icon_slot' },
  { id: 'maxPartySize', metaField: 'maxPartySize', name: 'Размер отряда',
    effectPerLevel: '+1 стартовый гном', baseCost: 80, maxLevel: 1,
    iconId: 'icon_party' },
  { id: 'smithyLevel', metaField: 'smithyLevel', name: 'Уровень кузницы',
    effectPerLevel: '+0.5× к offline-доходу', baseCost: 30, maxLevel: Infinity,
    iconId: 'icon_smithy' },
  { id: 'offlineBonusPerHour', metaField: 'offlineBonusPerHour',
    name: 'Ускорение простоя', effectPerLevel: '+0.1× к offline-доходу',
    baseCost: 60, maxLevel: 5, iconId: 'icon_clock' },
];

function purchaseUpgrade(meta: MetaState, def: SmithyUpgradeDef): MetaState {
  const currentLevel = meta[def.metaField];
  const cost = upgradeCost(def.baseCost, currentLevel);   // §6.4
  if (meta.legacy < cost || currentLevel >= def.maxLevel) return meta;
  return {
    ...meta,
    legacy: meta.legacy - cost,
    [def.metaField]: currentLevel + 1,
  };
}
```

#### 3.5.1. UI карточки апгрейда

```
Экран 1 отображает SMITHY_UPGRADES.map(def => Card). Каждая карточка:
  - Иконка def.iconId, 32×32, процедурная (§5.4).
  - Название: def.name.
  - Текущий уровень: "Ур. {currentLevel} / {maxLevel}" (для
    smithyLevel с maxLevel=Infinity: "Ур. {currentLevel}").
  - Эффект следующего уровня: def.effectPerLevel.
  - Цена: "{cost} Наследия" либо "МАКС" если currentLevel>=maxLevel.
  - Кнопка «Улучшить»: enabled если legacy>=cost && currentLevel<maxLevel;
    disabled — серый, tooltip с причиной.
  - Размер карточки: 280×140px (desktop), 160×120px (mobile, 2 колонки).
  - Touch target кнопки: ≥ 44×44px.
  - Contrast ratio текста ≥ 4.5:1.
```

---

## 4. UI/UX: 10 ЭКРАНОВ

| # | Экран | Ключевые элементы |
|---|---|---|
| 1 | Старт (Кузница) | Legacy counter, [Новый забег], 4 карточки апгрейдов (§3.5.1), счётчики unlocks |
| 2 | Выбор отряда | Список unlocked dwarves, выбор 1–meta.maxPartySize, [В бой] |
| 3 | Подготовка боя | 3 линии, drag&drop equip, инвентарь, gold, синергии, [В бой] |
| 4 | Бой | Phaser canvas, HP-бары, speed controls (§4.2), [Авто], параллакс-фон (§5.2.1) |
| 5 | Награда | Выбор 1 из 2–3 предметов |
| 6 | Карта забега | Граф узлов |
| 7 | Инвентарь | Grid equip + drag на гнома, role-filter, вкладка «Шаблон» |
| 8 | Событие | Текст + 2–3 кнопки-выбора |
| 9 | Смерть гнома | Эпитафия + анимация возврата equip |
| 10 | Итоги забега | Сводка, [В кузницу] |

### 4.1. Объективные критерии UI

- [ ] Contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Touch targets ≥ 44×44px
- [ ] Layout grid = 8px baseline
- [ ] No overflow на 667×375 и 1920×1080
- [ ] Animations ≤ 300ms (non-blocking)
- [ ] Colorblind-safe палитра (OKLCH)
- [ ] Keyboard navigation для desktop
- [ ] Upgrade cards (screen 1): 280×140px desktop / 160×120px mobile, 2 columns на mobile (§3.5.1)
- [ ] Speed controls (screen 4): правый-верхний угол, surface ≥ 44×44px (§4.2)

### 4.2. Speed controls

```
Правый-верхний угол экрана 4, HTML/CSS-оверлей поверх canvas.
×1/×2/×4, touch target ≥ 44×44px. Меняет только тайминг анимации
Phaser — НЕ влияет на PRNG-seed и не меняет порядок/результат
simulateTurn(). Determinism-тест (§7.2) не зависит от скорости.
```

---

## 5. ВИЗУАЛ И ПРОЦЕДУРНЫЕ АССЕТЫ

### 5.1. Стиль

Пиксель-арт 32×32, тёплая подземная палитра (OKLCH: H=30–50, C=0.1–0.15, L=0.2–0.5). Все ассеты — только процедурная генерация через `scripts/gen-assets.ts`. Скачивание внешней графики запрещено.

### 5.2. Минимальный набор ассетов

| Категория | Количество | Метод |
|---|---|---|
| Базовые тела гномов | 4 | процедурная генерация Canvas 2D |
| Палитры (борода/кожа) | 8 | hue-shift |
| Анимации на тело | 4 (idle/walk/attack/death) | spritesheet |
| Тела врагов | 7 | силуэт + palette swap |
| Иконки equip | 24 (§6.2) | 8 базовых SVG форм × вариации |
| Иконки апгрейдов кузницы | 4 (§3.5.1) | процедурная генерация Canvas 2D |
| Фон этажа (параллакс) | 5 слоёв × 3 набора | процедурный шум + градиент, §5.2.1 |
| Частицы | 4 | Canvas 2D |
| Звуки | 8 | WebAudio осцилляторы |

### 5.2.1. Parallax background

| Layer | Имя | Ширина×Высота | Scroll factor | Контент |
|---|---|---|---|---|
| 0 | bg_far | 2048×720 | 0.05 | силуэты дальних скал |
| 1 | bg_mid_rock | 2048×720 | 0.15 | средние скальные формации |
| 2 | bg_crystals | 2048×720 | 0.30 | светящиеся руны/кристаллы |
| 3 | bg_near_rock | 2048×720 | 0.50 | ближние камни |
| 4 | bg_fog | 2048×720 | 0.70 | дымка, alpha ≤ 0.3 |

```
Генерация: genLayer(seed, floorTier). floorTier:
  1, если run.floor <= 3; 2, если run.floor <= 7; 3, если run.floor >= 8.
При depth 8–11 все три tier достижимы в одном забеге.
Бесшовность по X: alpha-blend края 64px.

Рантайм: TileSprite на слой, tilePositionX += scrollSpeed *
scrollFactor * dt. Слои 0–2 дрейфуют, 3–4 неподвижны. z-index — §3.1.1.
```

### 5.3. Физика (seeded)

```
Matter.js solver инициализируется тем же seed. Ragdoll: hp ≤ 0 →
constraint-based тело, velocity/angle из PRNG. Отскоки: импульс
(dmg × 0.5, rand(seed, -π/6, π/6)).
```

### 5.4. Asset pipeline

```
Формат: PNG atlas + JSON hash (Phaser 3 native).
Кадр: 32×32 (гномы), 48×48 (враги), 16×16 (иконки equip),
      32×32 (иконки кузницы).
Анимации на тело: idle(4f), walk(6f), attack(5f), death(8f).
Палитра: runtime через Canvas 2D (hue-shift).
Загрузка: src/assets/loader.ts → this.load.atlas('dwarf_base', ...).
Генерация: npm run gen:assets → /public/atlas/*.png + *.json.
Скрипт ИДЕМПОТЕНТЕН: тот же seed → тот же байт-в-байт результат.
```

---

## 6. ДАННЫЕ: ТАБЛИЦЫ

### 6.1. Гномы (базовые)

| ID | Имя | HP | ATK | DEF | SPD | roleBias |
|---|---|---|---|---|---|---|
| d_brom | Бром | 120 | 8 | 15 | 8 | tank |
| d_grim | Грим | 100 | 12 | 8 | 10 | warrior |
| d_thorvin | Торвин | 110 | 10 | 10 | 9 | support |
| d_dvalin | Двалин | 130 | 7 | 18 | 7 | tank |
| d_nori | Нори | 90 | 14 | 6 | 12 | ranged |
| d_bofur | Бофур | 105 | 11 | 11 | 9 | mage |

### 6.2. Предметы (24) — 7 common, 9 rare, 4 epic, 4 legendary

| ID | Имя | Slot | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|---|
| e_rusty_axe | Ржавый топор | weapon | warrior | +5 | — | — | — | common | 1 | metal |
| e_wood_shield | Деревянный щит | armor | tank | — | +8 | — | — | common | 1 | wood |
| e_short_bow | Короткий лук | weapon | ranged | +4 | — | — | — | common | 1 | wood |
| e_apprentice_staff | Посох ученика | weapon | mage | +4 | — | — | — | common | 1 | wood |
| e_leather_cap | Кожаный шлем | armor | any | — | +5 | +10 | — | common | 1 | cloth |
| e_lucky_ring | Кольцо удачи | trinket | any | +2 | +2 | — | — | common | 1 | metal |
| e_bone_charm | Костяной оберег | trinket | any | +3 | +3 | +3 | — | common | 1 | bone |
| e_rune_hammer | Рунический молот | weapon | warrior | +10 | — | — | stun value=15 | rare | 1 | metal, runic |
| e_tower_shield | Башенный щит | armor | tank | — | +15 | +20 | — | rare | 1 | metal |
| e_2h_axe | Двуручный топор | weapon | warrior | +18 | -5 | — | splash value=30 | rare | 2 | metal |
| e_magnet_shield | Щит-магнит | armor | tank | — | +12 | — | taunt value=2 | rare | 2 | metal, runic |
| e_poison_dagger | Отравленный кинжал | weapon | warrior | +8 | — | — | poison value=5, chance=100 | rare | 2 | metal |
| e_fire_staff | Огненный посох | weapon | mage | +12 | — | — | burn value=8, chance=100 | rare | 2 | wood, runic |
| e_iron_helm | Железный шлем | armor | any | — | +8 | +15 | — | rare | 2 | metal |
| e_swift_boots | Быстрые сапоги | trinket | any | — | — | — | aura_spd value=10 | rare | 2 | cloth |
| e_healing_charm | Целительный амулет | trinket | support | — | — | — | hp_regen value=5 | rare | 2 | bone, runic |
| e_vamp_blade | Клинок вампира | weapon | warrior | +15 | — | — | lifesteal value=50 | legendary | 2 | metal, runic |
| e_war_drum | Барабан войны | trinket | support | — | — | — | aura_spd value=15 (target: back) | epic | 3 | wood |
| e_mithril_beard | Борода из мифрила | rune | any | +5 | +5 | +5 | extra_slot | legendary | 3 | metal, runic |
| e_dragon_scale | Чешуя дракона | armor | tank | — | +20 | +30 | — | legendary | 3 | metal |
| e_arcane_tome | Тайный фолиант | weapon | mage | +18 | — | — | double_strike value=50 | legendary | 3 | cloth, runic |
| e_slayer_axe | Топор убийцы | weapon | warrior | +22 | — | — | conditional_atk value=50 | epic | 3 | metal |
| e_guardian_plate | Броня стража | armor | tank | — | +18 | +25 | aura_def value=10 | epic | 3 | metal |
| e_hunter_bow | Лук охотника | weapon | ranged | +16 | — | — | pierce value=50 | epic | 3 | wood |

Итого: 24 предмета — 7 common, 9 rare, 4 epic, 4 legendary. Предметов с тегом `metal`: 13 (синергия «Кузня», порог 3, реализуема).

### 6.3. Enemy seed table

| Enemy ID | Name | HP | ATK | DEF | SPD | Pos | Effects | Boss | Elite |
|---|---|---|---|---|---|---|---|---|---|
| e_rat | Крыса | 30 | 5 | 2 | 8 | front | — | — | — |
| e_goblin | Гоблин | 40 | 7 | 3 | 10 | front | — | — | — |
| e_spider | Паук | 35 | 6 | 2 | 12 | mid | poison { value: 5, chance: 20 } | — | — |
| e_slime | Слизень | 60 | 4 | 8 | 4 | front | hp_regen { value: 3 } | — | — |
| e_orc | Орк | 80 | 12 | 6 | 7 | front | — | — | — |
| e_golem | Голем | 150 | 15 | 12 | 5 | front | stun { value: 20 } | — | ✅ |
| e_heart | Сердце Глубин | 300 | 20 | 15 | 6 | front | splash { value: 30 } | ✅ | — |

Итого: 7 типов врагов (DoD: ≥ 5 ✅).

#### 6.3.1. Spawn function

```typescript
function spawnEnemy(id: string, floor: number): Enemy {
  const template = ENEMY_TABLE[id];
  if (!template) throw new Error(`Unknown enemy: ${id}`);
  const scale = 1 + floor * 0.1;
  return {
    id: template.id,
    name: template.name,
    baseHP: template.baseHP,
    baseATK: template.baseATK,
    baseDEF: template.baseDEF,
    speed: template.speed,
    effects: template.effects,
    isBoss: template.isBoss,
    isElite: template.isElite,
    position: template.position,
    currentHP: Math.round(template.baseHP * scale),
    isAlive: true,
    statusEffects: []
  };
}
```

### 6.4. Формулы (финальные)

```typescript
const MAX_TURNS = 50;
const MAX_TURNS_BOSS = 100;

offlineGain(deltaHours, meta) =
  Math.min(deltaHours, 8) * (1 + meta.smithyLevel * 0.5 + meta.offlineBonusPerHour * 0.1)

runLegacy(run) =
  run.floor * 5 + (run.bossKilled ? 50 : 0) + (run.elitesKilled > 0 ? 10 : 0)

upgradeCost(baseCost, level) = baseCost * Math.pow(1.5, level)

finalDmg(atk, def, pierce) = Math.max(1, atk - def * (1 - pierce))

getNodeProbs(floor) = /* см. §3.3.1 */
```

### 6.5. Event table (6 событий)

```json
[
  {
    "id": "ev_altar",
    "text": "Древний алтарь. Голос шепчет: 'Отдай — и получишь.'",
    "choices": [
      { "text": "Отдать кровь", "cost": "hp:-20%_all", "reward": "item:rare" },
      { "text": "Отдать золото", "cost": "gold:-5", "reward": "item:common" },
      { "text": "Уйти", "cost": "none", "reward": "none" }
    ]
  },
  {
    "id": "ev_gambler",
    "text": "Гном-картёжник предлагает сыграть.",
    "choices": [
      { "text": "Ставка 10 золота", "cost": "gold:-10", "reward": "gold:+30 (50%) | gold:0 (50%)" },
      { "text": "Отказаться", "cost": "none", "reward": "none" }
    ]
  },
  {
    "id": "ev_forge_spirit",
    "text": "Дух кузнеца предлагает улучшить предмет.",
    "choices": [
      { "text": "Отдать 1 предмет", "cost": "item:-1", "reward": "item:rarity++" },
      { "text": "Отдать 15 золота", "cost": "gold:-15", "reward": "item:rare" },
      { "text": "Уйти", "cost": "none", "reward": "none" }
    ]
  },
  {
    "id": "ev_lost_dwarf",
    "text": "Заблудившийся гном просит о помощи.",
    "choices": [
      { "text": "Взять в отряд", "cost": "gold:-10", "reward": "dwarf:+1 (random)", "disabled_if": "party_full" },
      { "text": "Дать 5 золота", "cost": "gold:-5", "reward": "legacy:+5" },
      { "text": "Пройти мимо", "cost": "none", "reward": "none" }
    ]
  },
  {
    "id": "ev_mushroom",
    "text": "Светящиеся грибы. Пахнут странно.",
    "choices": [
      { "text": "Съесть", "cost": "none", "reward": "hp:+30%_all (60%) | hp:-20%_all (40%)" },
      { "text": "Собрать в мешок", "cost": "none", "reward": "item:common" },
      { "text": "Не трогать", "cost": "none", "reward": "none" }
    ]
  },
  {
    "id": "ev_prisoner",
    "text": "В клетке — враг. Он смотрит на тебя.",
    "choices": [
      { "text": "Освободить", "cost": "none", "reward": "item:rare (50%) | node:replace_battle (50%)" },
      { "text": "Обыскать", "cost": "none", "reward": "gold:+8" },
      { "text": "Уйти", "cost": "none", "reward": "none" }
    ]
  }
]
```

**rarity++:** +25% ко всем stats предмета (atk, def, hp), +1 случайный effect из пула той же редкости. Поле `stage` НЕ меняется.

**node:replace_battle:** текущий узел заменяется на battle-узел без награды; игрок обязан пройти бой, потом продолжает с того же места карты.

### 6.6. Synergy table (4 синергии)

```json
[
  {
    "id": "syn_wall",
    "name": "Стена",
    "condition": { "type": "count_role", "role": "tank", "count": 2, "line": "front" },
    "effect": { "type": "buff_def", "value": 20, "target": "tank" }
  },
  {
    "id": "syn_volley",
    "name": "Залп",
    "condition": { "type": "count_role", "role": "ranged", "count": 2, "line": "back" },
    "effect": { "type": "buff_atk", "value": 15, "target": "ranged" }
  },
  {
    "id": "syn_fury",
    "name": "Ярость",
    "condition": { "type": "combo", "roles": ["warrior", "mage"], "sameLine": true },
    "effect": { "type": "buff_atk", "value": 25, "target": "warrior" }
  },
  {
    "id": "syn_forge",
    "name": "Кузня",
    "condition": { "type": "count_tag", "tag": "metal", "count": 3 },
    "effect": { "type": "buff_atk", "value": 10, "target": "all" }
  }
]
```

---

## 7. ТЕСТИРОВАНИЕ И ВЕРИФИКАЦИЯ

### 7.1. Headless-тесты (Playwright)

```
ВНИМАНИЕ: §7.1 НЕ применяется до завершения Фазы 2.
До этого момента tutorial-run.spec.ts не пишется.
На Фазе 2 после реализации simulator.ts агент возвращается к §7.1.

Обязательный сценарий tutorial-run.spec.ts (seed=42, scripted choices
через Choice[], применяются в simulateRun(), §3.1.8).

Порядок:
  1. Реализовать /src/battle/simulator.ts (Фаза 2).
  2. Прогнать simulateRun(42), зафиксировать факт (кто выжил/умер,
     на каком узле) в progress.md как "seed=42 reference trace".
  3. Написать tutorial-run.spec.ts со scripted choices, следующими
     из зафиксированного трейса.
  4. Если после Фазы 6 трейс изменился — обновить сценарий,
     зафиксировать в defects.md как ожидаемое изменение.

Шаблон (шаги 1–4, 6–8 фиксированы; шаг 5 — по факту прогона):
  Seed: 42
  Отряд: Бром (tank) + Грим (warrior)
  Проверки:
    1. Запуск → стартовый экран (скрин)
    2. Выбор отряда → Бром + Грим (скрин)
    3. Экипировка → drag&drop (скрин)
    4. Бой 1 → результат по факту симуляции (скрин + FPS check)
    5. [заполняется по факту прогона simulateRun(42)]
    6. Закрытие → reopen через Date.now() + 3600000 (mock) →
       offline legacy проверен
    7. 0 console errors
    8. FPS ≥ 30 на viewport 667×375
```

### 7.2. Determinism test

```typescript
test('determinism', async () => {
  const run1 = simulateRun(42);
  const run2 = simulateRun(42);
  expect(run1).toEqual(run2);
});
```

### 7.3. Agent-критик (объективный)

После каждого модуля: Playwright-скрины затронутых экранов → автопроверка (contrast, touch targets, overflow, grid) → чеклист §4.1 пройден → accepted → progress.md. Если нет → ranked defect list → возврат строителю.

### 7.4. Video acceptance

```typescript
// tests/playwright/tutorial-run.spec.ts
import { getVideoDurationInSeconds } from 'get-video-duration';
import fs from 'node:fs';

// после завершения теста:
const videoPath = await page.video()?.path();
if (!videoPath) throw new Error('No video recorded');

// Проверка duration
const duration = await getVideoDurationInSeconds(videoPath);
expect(duration).toBeGreaterThanOrEqual(180);   // ≥ 3 мин
expect(duration).toBeLessThanOrEqual(360);      // ≤ 6 мин

// Проверка размера
const size = fs.statSync(videoPath).size;
expect(size).toBeGreaterThan(1_000_000);        // > 1 MB

// Сохранить с timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await page.video()?.saveAs(`videos/tutorial-run-${timestamp}.webm`);
```

### 7.5. Balance test (scripted greedy AI)

```
aiPolicy: 'greedy' в simulateRun() (§3.1.8):
  1. Выбирает предмет с highest rarity.
  2. Танков ставит в front, ranged/mage в back.
  3. В событиях — опция с максимальным expected value.
  4. В shop покупает, если gold ≥ цена.
  5. В rest — heal, если avg HP < 60%, иначе remove debuff.

Прогон: simulateRun(seed, { aiPolicy: 'greedy' }) для seed = 1..10.
Acceptance: 40–60% win rate.
```

---

## 8. ПРОЦЕСС РАЗРАБОТКИ (7 ФАЗ)

| # | Фаза | Deliverables | Acceptance |
|---|---|---|---|
| 1 | Архитектура + бюджет | architecture.md (§0.4), core/types.ts, package.json (§2.9), tsconfig.json, vite.config.ts, index.html (§2.8), src/main.ts (§2.8). ШАГ 0: замер baseline bundle ДО кода фич. (1) `npm install phaser matter-js`; (2) `npm run build`; (3) Замерить .js gzip через Node.js `zlib` (скрипт см. сразу после таблицы); (4) Если exit code ≠ 0 → STOP, BLOCKER в defects.md, предложить решение БЕЗ смены стека. | tsc --noEmit passes; 100% интерфейсов §2.3; unit-тест PRNG; мок-симуляция «1 гном vs 1 крыса → победа»; bundle-baseline.txt создан; скрин «Phase 1 OK»; git tag phase-1-accepted |
| 2 | Ядро + Бой | core/, battle/ (simulateTurn + simulateRun) | Determinism test passes; Playwright: dwarf vs rat; скрин боя; seed=42 reference trace в progress.md; git tag phase-2-accepted |
| 3 | Roguelite | progression/, economy/ (§3.5 + §3.5.1) | Playwright: complete run from start to boss; скрин карты; скрин кузницы с 4 карточками; git tag phase-3-accepted |
| 4 | UI | ui/ (10 экранов + параллакс §5.2.1 + speed controls §4.2) | Скрины всех экранов, 667×375 + 1920×1080; чеклист §4.1; параллакс на видео; git tag phase-4-accepted |
| 5 | Idle + Persistence | idle/, persistence/ | Offline 8h симуляция; localStorage roundtrip; скрин reopen; git tag phase-5-accepted |
| 6 | Балансировка | data/ tuning | 10 прогонов simulateRun(seed, greedy) → 40–60% win rate; если трейс seed=42 изменился — обновить сценарий + defects.md; git tag phase-6-accepted |
| 7 | Финализация | интеграция, smoke-тест, README | Все пункты §9 ✅; видео в /videos/ (проверено через get-video-duration); итоговая проверка bundle < 5MB gzip; git tag phase-7-accepted |

**Скрипт замера для Шага 0 (выполняется через `node -e` или как отдельный .js файл):**

```javascript
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) :
    e.name.endsWith('.js') ? [path.join(dir, e.name)] : []
  );
}

const files = walk('dist');
let total = 0;
for (const f of files) {
  const gz = zlib.gzipSync(fs.readFileSync(f));
  total += gz.length;
}

const mb = (total / 1024 / 1024).toFixed(2);
const headroom = (5 - mb).toFixed(2);

// Получить текущий commit hash (с fallback, если git недоступен)
let commit = 'no-git';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) { /* git недоступен — оставляем fallback */ }

const line = 'Baseline bundle (gzip): ' + mb + ' MB / 5 MB budget\n' +
             'Headroom: ' + headroom + ' MB\n' +
             'Measured at: ' + new Date().toISOString() + '\n' +
             'Commit: ' + commit + '\n';

fs.writeFileSync('memory-bank/bundle-baseline.txt', line);
console.log(line);

if (parseFloat(mb) > 5) {
  fs.appendFileSync('memory-bank/defects.md',
    '\n[' + new Date().toISOString() + '] [BLOCKER] [phase-1] ' +
    'Bundle budget exceeded: ' + mb + ' MB > 5 MB\n');
  process.exit(1);
}
```

**Правило:** фаза N+1 не начинается, пока фаза N не принята. Любое отклонение от стека/бюджета фиксируется в defects.md согласно §0 — без исключений.

---

## 9. ФИНАЛЬНЫЙ ЧЕКЛИСТ (Definition of Done)

**Игровые критерии (14):**
- [ ] Стек соответствует §2.1 без отклонений (Phaser 3 + Matter.js)
- [ ] Tutorial run проходим от старта до босса (видео в /videos/)
- [ ] Смерть гнома перманентна, equip возвращается в инвентарь
- [ ] Мета-сохранение между сессиями (localStorage + Date.now())
- [ ] Offline income работает после симуляции 8 часов
- [ ] 3 auto-механики разблокируются по runCount (3/5/7)
- [ ] Кузница: 4 апгрейда с рабочей стоимостью, legacy тратится
- [ ] ≥ 6 гномов, ≥ 20 предметов (все с непустыми tags), ≥ 5 врагов
- [ ] Синергии работают (4 типа, включая «Кузня» по тегам, стакаются)
- [ ] Параллакс-фон: 5 слоёв, разная скорость дрейфа, 3 набора
- [ ] UI на 667×375 и 1920×1080 без overflow
- [ ] FPS ≥ 30 mobile / ≥ 60 desktop
- [ ] Speed controls не влияют на детерминизм боя
- [ ] Разблокировка гномов работает через maxFloorEverReached

**Процессные критерии (8):**
- [ ] 0 console errors во всём прогоне
- [ ] Скрины всех 10 экранов в /screenshots/
- [ ] Determinism test: simulateRun(seed) → identical RunState
- [ ] Balance pass: 10 прогонов (greedy AI) → 40–60% win rate
- [ ] Все ассеты процедурно сгенерированы
- [ ] defects.md содержит запись о каждом отклонении
- [ ] git tag для каждой из 7 принятых фаз
- [ ] architecture.md соответствует §0.4

**Итого: 22/22 обязательны.** Провал любого = провал финальной приёмки.

---

## 10. ФОРМАТ ВЫВОДА

```
/dwarves-and-depths/
  /architecture.md
  /memory-bank/
    game-design-document.md
    tech-stack.md
    implementation-plan.md
    progress.md
    defects.md
    bundle-baseline.txt
  /src/
    /core  /battle  /economy  /progression
    /ui  /data  /idle  /persistence  /assets
    main.ts
  /scripts/
    gen-assets.ts
  /tests/
    /unit/*.test.ts
    /playwright/*.spec.ts
  /screenshots/
  /videos/
  /checkpoints/        (только если git недоступен)
  /public/
    /atlas/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .gitignore
  .nvmrc
  PROMPT.md
```

---

## 11. ФИНАЛЬНОЕ ПРАВИЛО

```
Ничего не считается работающим, пока не увидено и не измерено.
Ничего не считается соответствующим ТЗ, пока отклонение (если оно
случилось) не зафиксировано в defects.md.

Цепочка для каждой фичи:
  1. Реализована
  2. Unit-тест проходит
  3. Playwright-сценарий записан
  4. Скриншот сделан
  5. Объективный чеклист UI пройден
  6. Только тогда → progress.md с хешем коммита и ссылкой на скрин

Остановка запрещена, пока все 22 пункта §9 не будут ✅.
Стоп-фраза §0 имеет приоритет выше этого правила.
```

