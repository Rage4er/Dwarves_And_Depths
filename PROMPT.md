# ТЗ v7.0: «Гномы и Глубины» — объединённый апдейт

*Единый документ для запуска с пустой папки. Все баги v6.6 закрыты: 20 гномов, Growing Depth, финальный босс, бесконечный режим, воскрешение. v6.8: детальная генерация карты, экран карты, таблица слоёв, награды узлов, пример карты. v6.9: endReason, эпичный финал таймаута (обвал / Древний), лимиты hp_regen. v7.0: ranged-враги (e_archer_goblin, e_shaman), превью врагов без статов, карточки гномов с иконками статов, гномий шрифт имён, enemyTypes. Matter.js не используется.*

---

## §0. СТОП-ФРАЗА

```
Замена Phaser 3 на React/Vue/Svelte/vanilla-DOM/Canvas-2D-как-
замена-Phaser, удаление Playwright-теста, любое упрощение DoD —
СЧИТАЕТСЯ ПРОВАЛОМ ФАЗЫ.

Агент НЕ ИМЕЕТ ПРАВА принимать такое решение самостоятельно,
даже если:
  - «так быстрее»
  - «так проще»
  - «так меньше бандл»
  - «пользователь скорее всего хотел именно это»
  - «это же эквивалентная замена»

При возникновении сомнения — STOP, defects.md, предложить вариант
БЕЗ смены стека, ждать следующей инструкции.

Matter.js не используется. Защита от его «замены» не требуется.
Единственное допустимое отклонение — зафиксированное в defects.md.
```

---

## §0.1. Роль и контекст

**Роль:** Автономный ИИ-агент GameDev (full-stack).
**Вход:** пустая папка + этот документ + доступ к ФС/терминалу/браузеру.
**Ограничения:**
- Без вопросов к пользователю. Решения фиксируются в defects.md.
- Без остановки до состояния «играбельно от начала до конца».
- Всё тестируется автоматически.

---

## §0.2. Bootstrap (первые 60 секунд)

Агент выполняет **строго в этом порядке**, до чтения §1:

```
1. Проверить окружение:
     node --version    (требуется ≥ 20.x)
     npm --version     (требуется ≥ 10.x)
     git --version     (если нет — fallback tar)
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

7. Создать PROMPT.md — скопировать сюда этот документ целиком.

8. Создать architecture.md по контракту §0.4.

9. Создать memory-bank/ по шаблонам §0.5.

10. Только после этого — ШАГ 0 Фазы 1 (§8): npm install phaser,
    замер bundle baseline.
```

**Если git недоступен:** пропустить 2, 6, создать `/checkpoints/`.
**Если npm install падает:** записать в defects.md, ОСТАНОВИТЬСЯ.

---

## §0.3. Чекпоинты

```
Чекпоинт = git commit + tag после приёмки фазы.

Перед началом фазы N+1:
  git add -A && git commit -m "phase-N accepted"
  git tag phase-N-accepted

При провале приёмки:
  git stash push -u -m "phase-(N+1) failed attempt"
  git reset --hard phase-N-accepted

Fallback (если git недоступен): tar-архив /src + /memory-bank
в /checkpoints/phase-N.tar.gz. Проверка:
  tar -tzf /checkpoints/phase-N.tar.gz > /dev/null
```

---

## §0.4. Контракт architecture.md

```
architecture.md обязательно содержит:

1. Список модулей из §2.2 и их публичные экспорты.

2. Направленный граф зависимостей (без циклов).
   Особое правило: /src/battle/simulator.ts НЕ импортирует 
   Phaser, DOM API (§3.1.7).

3. Механизм чекпоинтов (§0.3): git или tar.

4. Точку входа (src/main.ts) + связи с Phaser.Game.

5. Список всех Phaser Scenes (9 экранов §4).

6. Явное подтверждение стека (§2.1): Phaser 3, Phaser tweens,
   никакого React/Vue.

Без всех 6 пунктов architecture.md не принимается.
```

---

## §0.5. Контракт memory-bank/

```
Все файлы — markdown, append-only:

  tech-stack.md         — версии node/npm/git/phaser
  progress.md           — журнал [timestamp] phase-N [status]
  defects.md            — [timestamp] [severity] [phase] описание
  implementation-plan.md — план на 3 фазы вперёд
  game-design-document.md — выжимка §1, §3, §6
  bundle-baseline.txt   — "Baseline bundle (gzip): X.XX MB / 5 MB"
                          + Headroom + Measured at + Commit
```

---

## §0.6. Цикл работы

```
1. Прочитать ТЗ.
2. §0.2 bootstrap.
3. Создать architecture.md, memory-bank.
4. ШАГ 0 Фазы 1 — замер bundle ДО кода фич.
5. Для каждой фазы: реализация → unit-тест → Playwright →
   скриншот → чеклист UI → git-чекпоинт → progress.md.
6. Фаза N+1 не начинается без приёмки N.
```

---

## §1. КОНЦЕПЦИЯ

- **Название:** «Гномы и Глубины» (Dwarves & Depths)
- **Жанр:** Single-player Idle Roguelite Physics Auto Battler
- **Платформа:** браузер (desktop 1920×1080, mobile 667×375 landscape)
- **Формула:** Physics × Idle × Roguelite × Single-player
- **Эмоциональная цель:** «Это моя ошибка» → «В следующий раз будет лучше»
- **Сессия:** 8–12 минут на обычный забег, бесконечный режим — до 100 слоёв

**Особый финал боя (v6.9):**
Если бой не завершается за MAX_BATTLE_TIME (30 сек обычный,
60 сек босс), происходит эпичное событие:

- Обычный бой / elite → обвал пещеры (все погибают)
- Босс → пробуждение Древнего (непобедимый враг убивает всех)

Это не "поражение по таймауту" — это сюжетный финал боя.
Игрок видит, что произошло, и понимает, почему проиграл.

### §1.1. Три фазы игры

**Фаза 1: До финала (обычные забеги)**

- depth = 8 + bossesKilledTotal
- Цель: дойти до финального босса
- Гномы умирают навсегда
- Замена только в Кузнице или событии
- При смерти всех → сброс deadDwarves перед новым забегом

**Фаза 2: Финал (финальный босс e_forge_demon)**

- Условие: 5+ побед над обычными боссами
- Уникальный босс: HP 500, ATK 20, summon
- Победа → открывает бесконечный режим

**Фаза 3: Бесконечный режим**

- depth растёт с каждым слоем
- Враги усиливаются
- Смерть гномов — навсегда
- **При смерти всех → немедленный сброс deadDwarves, забег продолжается**
- Забег заканчивается: игрок сдаётся ИЛИ depth > 100
- Цель: рекорд по глубине (maxDepthEver)

---

## §2. СТЕК И АРХИТЕКТУРА

### §2.1. Фиксированный стек

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

**Запрет:** React, Vue, Svelte, любые UI-фреймворки. Matter.js 
не используется. Все 9 экранов — Phaser Scenes + HTML/CSS оверлеи.

### §2.2. Структура папок

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

### §2.3. Контракты данных

```typescript
// core/types.ts

type Role = 'tank' | 'warrior' | 'ranged' | 'mage' | 'support' | 'any';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
type Slot = 'weapon' | 'armor' | 'trinket' | 'rune';
type RunStatus = 'active' | 'victory' | 'defeat' | 'abandoned';
type Tag = 'metal' | 'cloth' | 'runic' | 'wood' | 'bone';
type NodeType = 'battle' | 'elite' | 'shop' | 'event' | 'rest' | 'boss' | 'forge';

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
  deadDwarves: string[];
  lastSeenAt: number;
  runCount: number;
  bossesKilledTotal: number;         // v6.7: всего убито боссов
  endlessUnlocked: boolean;          // v6.7: открыт ли бесконечный режим
  maxDepthEver: number;              // v6.7: рекорд по глубине
  unlocks: {
    autoBattle: boolean;
    autoRepeat: boolean;
    autoEquip: boolean;
  };
  autoEquipTemplate?: AutoEquipTemplate;
}
```

### §2.4. Детерминизм

- Симуляция боя: seed → PRNG (Mulberry32). Одинаковый seed + 
  `FIXED_TIMESTEP_MS` → одинаковый результат.
- Симуляция — чистая TS-логика, без Phaser.
- Phaser tweens — только визуальный слой.
- Карта забега: seed → генерация графа.
- Тест: `simulateRun(42)` дважды → JSON diff пустой.

### §2.5. Performance budget

| Метрика | Бюджет | Измерение |
|---|---|---|
| Draw calls | < 200 | Phaser renderer stats |
| FPS desktop | ≥ 60 | rAF counter |
| FPS mobile | ≥ 30 | rAF counter |
| Bundle size | < 5 MB gzip | `vite build` + Node zlib |
| TTI | < 3 s | Lighthouse |
| Heap | < 256 MB | DevTools Memory |

### §2.6. Persistence contract

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

### §2.7. Error handling

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

### §2.8. index.html и точка входа

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

### §2.9. package.json

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

### §2.10. Store

```
Собственный immutable store, без внешних зависимостей:
  getState(): State
  setState(updater: (prev: State) => State): void
  subscribe(listener: (state: State) => void): () => void

Обновления — shallow clone + spread.
```

---

## §3. ГЕЙМПЛЕЙНОЕ ЯДРО

### §3.1. Auto Battler — вид сбоку, непрерывный поток

#### §3.1.1. Battle scene layout

```
Canvas: 1920×1080 (логический размер), scale FIT.
Вид: СБОКУ (2D-арена, без гравитации, без прыжков).
Земля: y = FIELD_GROUND_Y = 900.

РАСПОЛОЖЕНИЕ:
- Гномы: спавн слева
- Враги: спавн x = SPAWN_RIGHT_X = 1820
- Гномы бегут вправо, враги влево

ФОРМАЦИЯ ГНОМОВ (динамическая):
- positionIndex 0: x = 100   (танк, фиксирован)
- positionIndex 1: x = 180
- ...
- positionIndex N-1: x = 100 + 80 × (N-1)

Константы:
  SPAWN_LEFT_X = 100
  COLUMN_SPACING = 80
  MAX_DWARVES = 10

СОРТИРОВКА (при старте боя):
1. Танки → 2. Воины → 3. Ranged/Mage → 4. Support
Внутри группы — по порядку найма.

sortOrder = { tank: 0, warrior: 1, ranged: 2, mage: 2, support: 3 }

ДИСТАНЦИЯ АТАКИ ПО РОЛЯМ:
- tank:    80 px
- warrior: 80 px
- ranged:  300 px
- mage:    250 px
- support: 150 px

COOLDOWN ПО РОЛЯМ:
- tank / warrior / support: 600 мс
- ranged / mage:            400 мс

МОДИФИКАТОР УРОНА ДАЛЬНЕГО БОЯ:
- ranged / mage: finalDmg × 0.5

ПРИОРИТЕТ ВЫБОРА ЦЕЛИ ВРАГА:
1. Гном с ЯВНЫМ taunt (magnet_shield) в ATTACK_RANGE_TANK → его
2. Живой танк (неявный taunt) → случайный танк (prng)
3. Случайный живой гном → prng

ЯВНЫЙ TAUNT (magnet_shield, value=2):
- Приоритет над неявным taunt.
- Действует, пока гном жив.
- После смерти носителя: 2 секунды враги двигаются к позиции трупа,
  НО НЕ АТАКУЮТ.
- Хранится в state.tauntMemory.

НЕПРЕРЫВНЫЙ ПОТОК ВРАГОВ:
- Спавн каждые SPAWN_INTERVAL = 500 мс (300 мс при floor ≥ 8)
- totalEnemies — ЦЕЛЕВОЕ число врагов за бой.
- Бой заканчивается:
    a) все totalEnemies заспавнены и мертвы → victory
    b) все гномы мертвы → defeat
    c) timeElapsed >= MAX_BATTLE_TIME → defeat

ДВИЖЕНИЕ И АТАКИ:
- Гравитация: y = 0 (все на y = 900)
- Гном бежит вправо, если нет врага в его ATTACK_RANGE
- Враг бежит влево
- Гном бьёт врага → враг: x += BOUNCE_DISTANCE (100 px, вправо)
- Враг бьёт гнома → гном: x -= BOUNCE_DISTANCE (100 px, влево)

ФОРМУЛА УРОНА:
finalDmg = max(minDamage(floor), atk - def × (1 - pierce))
где minDamage(floor) = max(1, floor(floor / 2))
Для ranged/mage: finalDmg × 0.5

АТАКА:
Для каждого гнома (isAlive):
  - attackCooldown -= dt
  - Если cooldown ≤ 0 и враг в ATTACK_RANGE(role):
    - Выбрать цель
    - finalDmg = /* формула выше */
    - cooldown = ATTACK_COOLDOWN_BASE(role) / (1 + speed / 30)
    - target.x += BOUNCE_DISTANCE

Для каждого врага (isAlive):
  - attackCooldown -= dt
  - Если cooldown ≤ 0 и гном в ATTACK_RANGE_TANK (80):
    - Выбрать цель
    - finalDmg = /* формула выше */
    - cooldown = ENEMY_ATTACK_COOLDOWN (1000 мс)
    - target.x -= BOUNCE_DISTANCE

ФИНАЛЬНЫЙ БОСС (e_forge_demon):
- Присутствует эффект 'summon' (value=10, chance=100)
- Каждые 10 секунд (summonTimer) призывает 3 e_golem
- HP 500, ATK 20, DEF 12, SPD 40

СМЕРТЬ:
- HP ≤ 0 → isAlive = false
- Враг: Phaser tween (rotation += 360°, alpha → 0, 2000 мс), удаляется
- Гном: Phaser tween (rotation += 180°, y += 50, 500 мс), остаётся

ЭКИПИРОВКА И НАСЛЕДИЕ:
При смерти гнома в бою:
  1. equipment[] КОПИРУЕТСЯ в run.inventory (clone objects)
  2. meta.deadDwarves.push(dwarfId)
  3. Dwarf удаляется из meta.unlockedDwarves
  4. Гном умер НАВСЕГДА

БЕСКОНЕЧНЫЙ РЕЖИМ (v6.7):
Если run.isEndless === true И все гномы мертвы:
  - meta.deadDwarves = []  (немедленный сброс)
  - run.dwarves = все разблокированные гномы
  - run.status = 'active' (забег продолжается)
  - battleDwarves = пересоздать
  - Показать сообщение "Гномы возродились в Кузнице"

После завершения забега (victory/defeat/abandoned):
  5. run.inventory ОБЪЕДИНЯЕТСЯ с meta.unlockedEquipment
     (дубликаты не добавляются, проверка по id)
  6. run.inventory сбрасывается
  7. Экипировка сохраняется как "наследие"

Регенерация 5% missingHP НЕ применяется при defeat — только при victory.

РЕГЕНЕРАЦИЯ МЕЖДУ БОЯМИ (victory only):
- missingHP = baseHP - currentHP
- heal = missingHP * 0.05
- currentHP = min(currentHP + heal, baseHP)

ПОБЕДА:
- Все враги мертвы
- Применить регенерацию

ПОРАЖЕНИЕ:
- Все гномы мертвы И run.isEndless === false

ИНИЦИАЛИЗАЦИЯ BattleState (createBattleState):
- isBossFight = (currentNode.type === 'boss')
- isEndless = run.isEndless
- endReason = null                  // v6.9
- phase = 'running'
- timeElapsed = 0
- enemiesSpawned = 0
- spawnTimer = 0
- poisonBurnTimer = 0
- regenTimer = 0
- tauntMemory = null
- summonTimer = 0
- seed = run.seed
- battleDwarves = создать по числу dwarves с сортировкой
- battleEnemies = []
- enemies = []
- enemyPool = сформировать из floor
- totalEnemies = enemyCount(floor, isElite)

ЛИМИТ ВРЕМЕНИ:
- MAX_BATTLE_TIME = 30000 (обычный), 60000 (босс)
- Использует state.isBossFight для выбора
- При достижении → endReason устанавливается (см. ниже)

ОСОБЫЙ ФИНАЛ БОЯ (v6.9):
Если бой затягивается до MAX_BATTLE_TIME — НЕ просто поражение,
а эпичное событие:

1. ПРИБЛИЖЕНИЕ (последние 5 секунд):
   - Экран трясётся (tween: x ±5, y ±5, 100 мс)
   - Падают камни (частицы каждые 200 мс)
   - Звук гула (WebAudio, низкие частоты)
   - Текст в HUD: "Глубины пробуждаются..."

2. ТАЙМАУТ — ОБВАЛ (обычный бой, elite):
   - endReason = 'timeout_collapse'
   - Все юниты исчезают (tween alpha → 0, 500 мс)
   - Экран тёмный (overlay alpha → 1, 1000 мс)
   - Текст: "Пещера обрушилась. Гномы погребены."
   - phase = 'defeat'
   - Переход на экран 9

3. ТАЙМАУТ — ДРЕВНИЙ (босс):
   - endReason = 'timeout_ancient'
   - Появляется Древний (e_ancient, спрайт 96×96, выход справа, 500 мс)
   - Древний атакует — все юниты получают 999 урона
   - Все исчезают (ragdoll, alpha → 0, 2000 мс)
   - Экран тёмный
   - Текст: "Древний пробудился. Гномы пали."
   - phase = 'defeat'
   - Переход на экран 9

БОСС-СЛОЙ:
- Всегда на слое depth-1.
- Boss зависит от depth (§6.3.2).
```

#### §3.1.2. Симуляция боя (fixed timestep)

```typescript
const FIXED_TIMESTEP_MS = 1000 / 60;  // 16.667 мс
const MAX_TICKS_PER_FRAME = 4;

update(time: number, delta: number) {
  accumulator += delta;
  let ticks = 0;
  while (accumulator >= FIXED_TIMESTEP_MS && ticks < MAX_TICKS_PER_FRAME) {
    battleState = simulateBattleTick(battleState, FIXED_TIMESTEP_MS, prng);
    accumulator -= FIXED_TIMESTEP_MS;
    ticks++;
  }
  renderBattle(battleState);
}
```

#### §3.1.2.1. simulateBattleTick — детальная спецификация

```typescript
simulateBattleTick(state, dt, prng): BattleState

1. Спавн врагов:
   - state.spawnTimer += dt
   - Если spawnTimer >= SPAWN_INTERVAL и enemiesSpawned < totalEnemies:
     - Создать врага из enemyPool (через prng)
     - instanceId = `enemy_${enemiesSpawned}_${state.seed}`
     - x = SPAWN_RIGHT_X, y = 900
     - spawnTimer = 0, enemiesSpawned++

1b. Summon для финального босса (v6.7):
   Если в battleEnemies есть враг с effect.type === 'summon':
     state.summonTimer += dt
     Если summonTimer >= 10000 (10 сек):
       - Создать 3 e_golem рядом с боссом
       - summonTimer = 0

2. Движение:
   - Для каждого гнома (isAlive):
       range = ATTACK_RANGE_BY_ROLE[role]
       Если нет живого врага в радиусе range:
         x += speed * dt/1000
   - Для каждого врага (isAlive):
       Если state.tauntMemory !== null и remainingMs > 0:
         Если x > tauntMemory.x:
           x -= speed * dt/1000
       Иначе если нет живого гнома в ATTACK_RANGE_TANK (80):
         x -= speed * dt/1000

3. Атаки гномов:
   Для каждого гнома (isAlive):
     - attackCooldown -= dt
     - Если cooldown ≤ 0:
       - Найти цель
       - finalDmg = /* формула */
       - cooldown = ATTACK_COOLDOWN_BASE[role] / (1 + speed/30)
       - target.x += BOUNCE_DISTANCE

4. Атаки врагов:
   Для каждого врага (isAlive):
     - attackCooldown -= dt
     - Если cooldown ≤ 0:
       - Найти цель по приоритету
       - finalDmg = /* формула */
       - cooldown = ENEMY_ATTACK_COOLDOWN (1000 мс)
       - target.x -= BOUNCE_DISTANCE

5. Poison/burn тик:
   state.poisonBurnTimer += dt
   Если poisonBurnTimer >= 1000:
     для каждого юнита (isAlive) со statusEffects:
       для poison/burn: currentHP -= effect.value
     poisonBurnTimer = 0

5b. Taunt memory тик:
    Если state.tauntMemory !== null:
      state.tauntMemory.remainingMs -= dt
      Если remainingMs <= 0: state.tauntMemory = null

6. hp_regen тик:
   state.regenTimer += dt
   Если regenTimer >= 2000:
     для каждого гнома (isAlive) с hp_regen в equipment:
       heal = calculateHpRegen(dwarf)  // v6.9: с лимитом
       currentHP = min(currentHP + heal, baseHP)
     regenTimer = 0

7. Проверка смерти:
   - currentHP <= 0 → isAlive = false
   - При смерти гнома:
     a) обработка наследия
     b) если есть taunt-эффект и tauntMemory === null:
          tauntMemory = { x: x, remainingMs: value * 1000 }

7b. Бесконечный режим — проверка (v6.7):
    Если state.isEndless && все battleDwarves мертвы:
      - Возрождение: deadDwarves = []
      - battleDwarves = все разблокированные с позициями
      - dwarves = все разблокированные
      - phase = 'running'
      - Продолжить тик

8. Проверка победы/поражения:
   - Все battleEnemies мертвы → phase = 'victory'
   - Все battleDwarves мертвы И NOT isEndless → phase = 'defeat'

9. timeElapsed += dt

10. Проверка таймаута (v6.9):
    Если timeElapsed >= MAX_BATTLE_TIME (или MAX_BATTLE_TIME_BOSS):
      - phase = 'defeat'
      - endReason = (isBossFight)
        ? 'timeout_ancient'
        : 'timeout_collapse'
      - timeElapsed = MAX_BATTLE_TIME  (зафиксировать)
```

#### §3.1.2.2. simulateBattle — headless-прогон

```typescript
export function simulateBattle(
  initialState: BattleState,
  seed: number
): BattleState {
  const prng = mulberry32(seed);
  let state = initialState;
  
  const MAX_TIME = state.isBossFight 
    ? MAX_BATTLE_TIME_BOSS 
    : MAX_BATTLE_TIME;
  
  while (state.phase === 'running' && state.timeElapsed < MAX_TIME) {
    state = simulateBattleTick(state, FIXED_TIMESTEP_MS, prng);
  }
  
  if (state.phase === 'running') {
    state.phase = 'defeat';
    // v6.9: страховка headless-прогона — фиксируем причину таймаута
    state.endReason = state.isBossFight ? 'timeout_ancient' : 'timeout_collapse';
  }
  
  return state;
}
```

#### §3.1.3. Role resolution

```
Dwarf.role = роль предмета в weapon slot.
Priority: weapon > armor > trinket > rune.
Если 'any' → пропускается.
Если weapon нет → roleBias (§6.1).
```

#### §3.1.4. Synergies

```typescript
type SynergyCondition =
  | { type: 'count_role'; role: Role; count: number }
  | { type: 'count_tag'; tag: Tag; count: number }
  | { type: 'adjacent_roles'; roles: [Role, Role] };
```

**4 синергии — см. §6.6.**

#### §3.1.5. Target selection

```
Цель атаки гнома:
1. taunt-враг в ATTACK_RANGE → его.
2. Иначе: ближайший живой враг по x.
3. Если врагов нет → бежать вперёд.

Цель атаки врага:
1. Гном с ЯВНЫМ taunt в ATTACK_RANGE_TANK → его.
2. Живой танк (неявный taunt) → случайный танк (prng).
3. Случайный живой гном (prng).
4. Если гномов нет → бежать влево.

v7.0 (пошаговая адаптация): taunt приоритетен для всех;
ranged-враги (e_archer_goblin, e_shaman) пункт 2 пропускают —
цель = случайный живой гном ИЗ ВСЕХ линий (тыл не укрытие,
аналог «стреляет по ближайшему в attackRange 260»),
melee — приоритет front → mid → back, внутри линии prng.
```

#### §3.1.6. Extra slot

```
extraSlotCount = количество предметов с effect.type = 'extra_slot'.
localSlotBonus = Math.min(1, extraSlotCount).
Итоговый лимит слотов = meta.maxSlots + localSlotBonus.
```

#### §3.1.7. Разделение логики и рендера

```
/src/battle/simulator.ts экспортирует:
  simulateBattleTick(state, dt, prng): BattleState
  simulateBattle(state, seed): BattleState
  simulateRun(seed, options?): RunState
  createBattleState(run, node): BattleState

НЕ импортирует Phaser, DOM API. POJO in/out.
```

#### §3.1.8. simulateRun

```typescript
export interface RunOptions {
  maxFloors?: number;
  scriptedChoices?: Choice[];
  aiPolicy?: 'greedy' | 'random';
  isEndless?: boolean;               // v6.7
}

export function simulateRun(
  seed: number,
  options?: RunOptions
): RunState
```

#### §3.1.9. hp_regen

```
Тик каждые 2000 мс. heal(value), не выше maxHP.
Стекается. Не работает, если гном мёртв или оглушён.
```

---

### §3.2. Idle-слой

| Механика | Триггер | Формула |
|---|---|---|
| Offline-Наследие | reopen | Δ = max(0, Date.now() - meta.lastSeenAt) / 3.6e6; gain = min(Δ, 8) × (1 + smithy × 0.5 + offlineBonus × 0.1) |
| Сон кузницы | reopen | itemRolls = floor(Δ); случайные unlocked items |
| Авто-бой | runCount≥3 | пропуск кнопки «В бой» |
| Авто-повтор | runCount≥5 | авто-выбор предыдущего типа узла |
| Авто-подбор | runCount≥7 | шаблон role→slot применяется |

#### §3.2.1. AutoEquip

```
Триггер: unlock.autoEquip = true.
Для каждого dwarf: role → template[role] → надеть по slots.
Применять к новым гномам (не к deadDwarves).
```

---

### §3.3. Roguelite: граф забега

#### §3.3.1. Map generation + Growing Depth (v6.8)

```
ОБЫЧНЫЙ РЕЖИМ:
  depth = 8 + meta.bossesKilledTotal
  // 0 побед: depth 8
  // 1 победа: depth 9
  // 5 побед: depth 13
  // 10 побед: depth 18
  // 20 побед: depth 28

БЕСКОНЕЧНЫЙ РЕЖИМ:
  Если run.isEndless:
    depth = 8 + meta.maxDepthEver + run.endlessFloor
    // endlessFloor: 0 на старте бесконечного, +1 с каждым пройденным слоем

ГЕНЕРАЦИЯ (v6.8):
  1. Слой 0: 1 узел (battle).
  2. Слой depth-1: 1 узел (boss).
  3. Слой depth-2: 2–4 узла, каждый — shop или rest (выбор по PRNG).
  4. Слои 1..depth-3: 2–4 узла.
  5. Тип узла — determineNodeType: выбор по nodeProb(floor); если в
     предыдущем слое есть elite — elite исключается из пула и веса
     перенормируются (запрет 2 elite подряд).
  6. linkLayers: bipartite-граф — 1–3 исходящих / 1–2 входящих на узел.
  7. validateMap: BFS от слоя 0 — все слои достижимы; босс достижим
     ИЗ ВСЕХ узлов слоя depth-2 (обратный BFS от босса).
  8. Невалидный граф → перегенерация с seed+1 (максимум 10 попыток),
     затем линейный fallback §2.7 (1 узел/слой: battle → … → boss).

ФИНАЛЬНЫЙ БОСС:
  Условие: meta.bossesKilledTotal >= 5
  На последнем слое — e_forge_demon вместо обычного босса.
  Победа → meta.endlessUnlocked = true.

БЕСКОНЕЧНЫЙ РЕЖИМ (v6.8):
  depth = 8 + meta.maxDepthEver + run.endlessFloor
  Слои: 2–4 узла (правила генерации те же).
  Боссы: каждые 3 слоя (endlessFloor % 3 === 2), цикл [e_orc, e_golem, e_heart].
  Враги: scaleHP = 1 + depth × 0.08, scaleATK = 1 + depth × 0.04 (§6.3.1).
  Смерть всех гномов → немедленный сброс deadDwarves, забег продолжается (§3.1.1).
  Выход: игрок сдался → run.status = 'abandoned' (наследие сохраняется);
         depth > 100 → run.status = 'victory_endless' + бонус наследия.
  Цель: рекорд maxDepthEver (экран 9).
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

```typescript
// Псевдокод генерации карты v6.8 (детерминированный: seed → PRNG)
function generateMap(seed: number, depth: number): RunNode[] {
  let s = seed >>> 0;
  for (let attempt = 0; attempt < 10; attempt++) {
    const rng = mulberry32(s);
    const layers = buildLayers(rng, depth);   // правила ГЕНЕРАЦИИ 1–5
    linkLayers(rng, layers);                  // правило 6
    if (validateMap(layers, depth)) return layers.flat();
    s = (s + 1) >>> 0;                        // правило 8: seed+1
  }
  return linearFallback(depth);               // §2.7
}

function determineNodeType(rng: PRNG, layer: number, depth: number, prev: RunNode[]): NodeType {
  if (layer === 0) return 'battle';
  if (layer === depth - 1) return 'boss';
  if (layer === depth - 2) return weighted(rng, [['shop', 0.5], ['rest', 0.5]]);
  let probs = Object.entries(getNodeProbs(layer + 1)) as [NodeType, number][];
  if (prev.some((n) => n.type === 'elite')) {
    probs = probs.filter(([t]) => t !== 'elite'); // запрет 2 elite подряд
  }
  return weighted(rng, probs); // weighted перенормирует веса сам
}

function linkLayers(rng: PRNG, layers: RunNode[][]): void {
  for (let l = 0; l < layers.length - 1; l++) {
    for (const node of layers[l]) {
      node.next = pickUnique(rng, layers[l + 1], randInt(rng, 1, 3)).map((n) => n.id);
    }
    for (const next of layers[l + 1]) {
      while (inDegree(next, layers[l]) === 0)   // 1–2 входящих: минимум 1
        addEdge(rng, layers[l], next);
      while (inDegree(next, layers[l]) > 2)     // максимум 2, но так,
        trimEdge(rng, layers[l], next);         // чтобы у источника осталось ≥ 1 исходящего
    }
  }
}

function validateMap(layers: RunNode[][], depth: number): boolean {
  // Прямой BFS от слоя 0: каждый слой содержит ≥ 1 достижимый узел
  if (!forwardReachable(layers, depth)) return false;
  // Обратный BFS от босса: босс достижим ИЗ ВСЕХ узлов слоя depth-2
  return allPreBossReachBoss(layers, depth);
}
```

#### §3.3.2. Shop

```
Stock: 3 equipment + 1 dwarf.
Цены: common 5, rare 12, epic 25, legendary 50, dwarf 10.
Stock фиксируется при генерации карты.

Dwarf pool для магазина:
  available = unlockedDwarves - deadDwarves - currentParty
  Если available.length > 0:
    dwarf = random(available)
  Иначе: dwarf slot пустой
```

#### §3.3.3. Forge

```
1. Игрок выбирает 1 предмет.
2. Цена: 10 (common→rare), 20 (rare→epic), 40 (epic→legendary).
3. rarity++ (§6.5.1). stage НЕ меняется.
4. Если gold < цены или инвентарь пуст → узел пропускается.
```

#### §3.3.4. Rest

```
A (choiceIndex=0): heal 50% maxHP всем живым.
B (choiceIndex=1): remove all statusEffects у всех.
```

#### §3.3.5. Unlock table (v6.7 — 20 гномов)

```json
[
  { "floor": 1,  "dwarfId": "d_brom" },
  { "floor": 1,  "dwarfId": "d_grim" },
  { "floor": 3,  "dwarfId": "d_thorvin" },
  { "floor": 4,  "dwarfId": "d_bombur" },
  { "floor": 5,  "dwarfId": "d_bifur" },
  { "floor": 6,  "dwarfId": "d_dvalin" },
  { "floor": 7,  "dwarfId": "d_bofur_2" },
  { "floor": 8,  "dwarfId": "d_balin" },
  { "floor": 9,  "dwarfId": "d_bifur_2" },
  { "floor": 10, "dwarfId": "d_nori" },
  { "floor": 11, "dwarfId": "d_bombur_2" },
  { "floor": 12, "dwarfId": "d_dwalin_2" },
  { "floor": 13, "dwarfId": "d_dori" },
  { "floor": 14, "dwarfId": "d_nori_2" },
  { "floor": 15, "dwarfId": "d_bofur" },
  { "floor": 16, "dwarfId": "d_oin" },
  { "floor": 17, "dwarfId": "d_gloin" },
  { "floor": 18, "dwarfId": "d_balin_2" },
  { "floor": 19, "dwarfId": "d_thorin" },
  { "floor": 20, "dwarfId": "d_fili" }
]
```

#### §3.3.5.1. Триггер разблокировки

```
При входе на узел floor = N:
  1. meta.maxFloorEverReached = max(текущее, N + meta.bossesKilledTotal * 2)
  2. Для entry, где entry.floor <= maxFloorEverReached:
       a) Если entry.dwarfId в deadDwarves → SKIP
       b) Если entry.dwarfId not in unlockedDwarves → добавить + тост
  3. Сохранить meta.
```

#### §3.3.6. Equipment + Dwarf unlock

```
При победе над elite:
  - random equipment stage 2–3, rarity rare/epic

При победе над обычным боссом:
  - random equipment stage 3, rarity legendary/epic
  - meta.bossesKilledTotal += 1
  - random dwarf из неразблокированных:
      available = allDwarves - unlockedDwarves
      Если available.length > 0:
        dwarf = random(available)
        meta.unlockedDwarves.push(dwarf.id)
        Показать "Открыт новый гном: <имя>"

При победе над финальным боссом (e_forge_demon):
  - meta.endlessUnlocked = true
  - Показать "Бесконечный режим открыт!"
```

#### §3.3.7. Награды по типам узлов (v6.8)

```text
ЗОЛОТО (run.gold, при победе в узле):
  battle:  5 + floor × 2
  elite:   10 + floor × 3
  boss:    20 + depth × 2
  event:   по событию (§6.5); shop/rest/forge: 0

НАСЛЕДИЕ:
  elite: +10 — ОДИН раз за забег (флаг run «наследие за элиту выдан»)
  boss:  +50 и meta.bossesKilledTotal += 1
  Конец забега: runLegacy = depth × 5 + бонусы (§6.4)

ЛУТ (экран 5: выбор 1 из 2–3 предметов):
  battle: выбор 1 из 2, common/rare по rollRarity(difficulty)
  elite:  выбор 1 из 3, rare/epic, stage 2–3 (§3.3.6)
  boss:   выбор 1 из 3, epic/legendary, stage 3 (§3.3.6)
  event/shop/rest/forge: лут-выбор не генерируется
```

#### §3.3.8. Пример карты (depth 9, seed 42)

```text
depth = 9 (bossesKilledTotal = 1), seed = 42. Слои 0..8:

слой 0:  [battle]                       ← старт, 1 узел
слой 1:  [battle, event]                ← 2–4 узла
слой 2:  [battle, shop, battle]
слой 3:  [elite, battle]
слой 4:  [battle, event, rest]          ← после elite слоя 3 elite запрещён
слой 5:  [battle, forge]
слой 6:  [battle, elite, battle]
слой 7:  [shop, rest]                   ← depth-2: гарантированно shop/rest
слой 8:  [boss e_golem]                 ← depth-1: цикл боссов §6.3.2

Рёбра (linkLayers): слой 0 → оба узла слоя 1; 1–3 исходящих / 1–2 входящих;
каждый узел слоя 6 имеет ребро в слой 7; слой 7 → [boss].
validateMap: BFS от слоя 0 — все слои достижимы ✅;
босс достижим из всех 3 узлов слоя 6 ✅.
```

---

### §3.4. Run start (v6.7)

```
1. Проверить meta.endlessUnlocked и выбор игрока:
   Если выбран "Бесконечный забег" И endlessUnlocked:
     run.isEndless = true
     depth = 8 + meta.maxDepthEver
     endlessFloor = 0
   Иначе:
     run.isEndless = false
     depth = 8 + meta.bossesKilledTotal

2. availableDwarves = unlockedDwarves - deadDwarves

3. Если availableDwarves.length < 2:
     meta.deadDwarves = []  (сброс)
     availableDwarves = unlockedDwarves
     Показать "Новое поколение гномов возродилось"

4. Выбор 1–maxPartySize гномов из availableDwarves.

5. Каждому — 1 случайный common item → run.inventory.

6. gold = 0.

7. map = generateMap(seed, depth).

8. currentNodeId = map[0].id.

9. Переход на экран 3.
```

---

### §3.5. Кузница

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
  maxLevel: number;
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
  const cost = upgradeCost(def.baseCost, currentLevel);
  if (meta.legacy < cost || currentLevel >= def.maxLevel) return meta;
  return {
    ...meta,
    legacy: meta.legacy - cost,
    [def.metaField]: currentLevel + 1,
  };
}
```

#### §3.5.1. UI карточки

```
- Иконка 32×32
- Название
- Текущий уровень "Ур. X / Y"
- Эффект следующего
- Цена или "МАКС"
- Кнопка «Улучшить»: enabled/disabled
- Размер: 280×140 desktop, 160×120 mobile
- Touch target ≥ 44×44
```

---

## §4. UI/UX: 9 ЭКРАНОВ

| # | Экран | Элементы |
|---|---|---|
| 1 | Старт (Кузница) | Legacy counter, [Новый забег], [Бесконечный забег] (если unlocked), 4 карточки, счётчики unlocks, maxDepthEver |
| 2 | Выбор отряда | Карточки гномов: имя (гномий шрифт), спрайт 96×96, характеристики иконками (❤️ HP, ⚔️ ATK, 🛡️ DEF, 👟 SPD), кнопка [Выбрать]. Счётчик «Выбрано X/Y» |
| 3 | Подготовка боя | N позиций, drag&drop equip, инвентарь, gold, синергии, **превью врагов (типы без статов)**, [В бой] |
| 4 | Бой | Phaser canvas, HP-бары, этаж, враги X/Y, параллакс-фон |
| 5 | Награда | Выбор 1 из 2–3 предметов |
| 6 | Карта забега | Горизонтальный граф слоёв (§4.2), панели: золото / глубина / отряд |
| 7 | Инвентарь | Grid equip + drag, role-filter, вкладка «Шаблон» |
| 8 | Событие | Текст + 2–3 кнопки |
| 9 | Итоги забега | Сводка, умершие гномы, maxDepthEver, [В кузницу]. Заголовок и эпитафия зависят от run.endReason (§4.3) |

### §4.1. Критерии UI

- [ ] Contrast ratio ≥ 4.5:1
- [ ] Touch targets ≥ 44×44px
- [ ] Layout grid = 8px
- [ ] No overflow на 667×375 и 1920×1080
- [ ] Animations ≤ 300ms
- [ ] Colorblind-safe (OKLCH)
- [ ] Keyboard navigation
- [ ] Upgrade cards: 280×140 / 160×120
- [ ] Battle HUD: этаж, HP, враги X/Y

### §4.2. Экран «Карта забега» — layout (v6.8)

```text
DESKTOP 1920×1080:
  Верхняя панель h=80: золото, глубина, отряд (иконки + HP)
  Центр: горизонтальный граф слоёв слева направо (старт → босс)
  Нижняя панель h=120: инвентарь / меню (инвентарь, кузница)

MOBILE 667×375:
  Панели h=60 / h=90, карта между ними
  Граф: горизонтальная прокрутка слоёв слева направо

УЗЛЫ:
  Размер 96×96, иконка 64×64, обводка 4px
  Состояния: пройден (тусклый) / текущий (пульс) /
             доступный (активный) / будущий (затемнён)
  Цвета по типам: battle серо-синий, elite фиолетовый, boss красный,
                  shop жёлтый, rest зелёный, forge оранжевый, event голубой

СВЯЗИ (рёбра графа):
  Пройденный путь: 2px, тусклая
  Доступные переходы из текущего узла: 4px, яркая
  Остальные: 1px, затемнённая

TOOLTIP по узлу: тип, сложность, награды (золото + лут §3.3.7)

АНИМАЦИИ:
  Выбор узла 200мс, появление слоя 300мс, hover 200мс,
  прокрутка к текущему слою 400мс (исключение из ≤300мс)

DoD §4.2: с любого доступного узла виден путь к боссу.
```

### §4.3. Экран 9 «Итоги забега» — варианты финала (v6.9)

Заголовок и эпитафия зависят от run.endReason:

| endReason | Заголовок | Эпитафия | Иконка |
|-----------|-----------|----------|--------|
| 'victory' | "Победа!" | "Гномы вернулись с добычей." | золотая корона |
| 'defeat' | "Поражение" | "Гномы пали в бою." | разбитый щит |
| 'timeout_collapse' | "Обвал" | "Пещера обрушилась на глубине {floor}. Гномы погребены заживо." | обвал камней |
| 'timeout_ancient' | "Пробуждение Древнего" | "Древний пробудился на глубине {floor}. Гномы пали перед тем, кто старше мира." | тень Древнего |
| 'abandoned' | "Отступление" | "Гномы отступили. Глубины запомнят." | след на камне |

Отдельно: под заголовком показать статистику:
- Глубина: {floor}
- Убито врагов: {kills}
- Убито элит: {elitesKilled}
- Получено Наследия: {legacy}
- Открыто: {unlocks}
- Погибли: {deadDwarves за забег}

---

### §4.4. Экран 3 — превью врагов (v7.0)

БЛОК «ВПЕРЕДИ»:
  Расположение: верхняя часть экрана подготовки
  Формат:
    - Заголовок: «ВПЕРЕДИ»
    - Список типов врагов: горизонтальный ряд
    - Каждый тип: спрайт 96×96 + название (гномий шрифт)
    - БЕЗ статов, БЕЗ количества, БЕЗ HP

  Пример:
    «ВПЕРЕДИ: [Орк] [Паук]»

ПРАВИЛА:
- Показываются ТОЛЬКО уникальные типы (enemyTypes из node.data, §3.3.1)
- Если 10 орков и 5 пауков → 2 карточки
- Никаких статов, количества и числа подкреплений
- Для elite и боссов — то же правило (уникальные типы)

### §4.5. Экран 2 — карточки гномов (v7.0)

ФОРМАТ КАРТОЧКИ:
  - Имя гнома — гномий шрифт (font-runic)
  - Спрайт 96×96
  - Роль (Мечник/Лучник/…)
  - Характеристики иконками: ❤️ HP · ⚔️ ATK · 🛡️ DEF · 👟 SPD
  - Кнопка [Выбрать] = вся карточка (toggle); счётчик «Выбрано X/Y» в шапке экрана
  - Блокировки: «Откроется на этаже N», «⚖️ Пал в Глубинах» — без изменений

## §5. ВИЗУАЛ И ПРОЦЕДУРНЫЕ АССЕТЫ

### §5.1. Стиль

```
Пиксель-арт, 96×96 для персонажей. 32×32 для иконок.
OKLCH H=30-50, C=0.1-0.15, L=0.2-0.5.
Все ассеты — процедурно через scripts/gen-assets.ts.
```

### §5.2. Минимальный набор

| Категория | Кол-во | Размер | Метод |
|---|---|---|---|
| Тела гномов | 4 | 96×96 | Canvas 2D |
| Палитры | 8 | — | hue-shift |
| Анимации гномов | 4 | 96×96 | spritesheet |
| Тела врагов | 11 (v7.0: + e_archer_goblin, + e_shaman) | 96×96 | силуэт + palette |
| Анимации врагов | 4 | 96×96 | spritesheet |
| Иконки предметов | 24 | 32×32 | SVG |
| Иконки кузницы | 4 | 32×32 | Canvas |
| Параллакс | 5×3 | 2048×1080 | шум + градиент |
| Частицы | 4 | 16×16 | Canvas |
| Звуки | 8 | — | WebAudio |

**11 тел врагов** (v7.0): + e_forge_demon, + e_ancient, + e_archer_goblin, + e_shaman.

**ranged-спрайты (v7.0):** лучник — лук + колчан, шаман — посох + череп-амулет;
палитры OKLCH: лучник H=60-80 (болотный), шаман H=280-300 (фиолетовый).

**e_ancient (Древний) — особый спрайт (v6.9):**
- Размер: 96×96 (стандартный)
- Стиль: тёмный силуэт с светящимися глазами
- Палитра: OKLCH H=250-270 (фиолетовый), C=0.2, L=0.1-0.2
- Анимация: idle (4 кадра) + attack (5 кадров)
- Особенность: при появлении экран темнеет, Древний светится

### §5.2.1. Parallax

| Layer | Имя | Размер | Scroll |
|---|---|---|---|
| 0 | bg_far | 2048×1080 | 0.05 |
| 1 | bg_mid_rock | 2048×1080 | 0.15 |
| 2 | bg_crystals | 2048×1080 | 0.30 |
| 3 | bg_near_rock | 2048×1080 | 0.50 |
| 4 | bg_fog | 2048×1080 | 0.70 |

floorTier: 1 (≤3), 2 (≤7), 3 (≥8).

### §5.3. Визуальные эффекты (Phaser tweens)

```
Отскок врага (гном бьёт):
  tweens.add({ targets: enemySprite, x: x+100, duration: 200,
               ease: 'Back.easeOut' });

Отскок гнома (враг бьёт):
  tweens.add({ targets: dwarfSprite, x: x-100, duration: 200,
               ease: 'Back.easeOut' });

Ragdoll врага:
  tweens.add({ targets: enemySprite, rotation: PI*2, alpha: 0,
               duration: 2000, ease: 'Cubic.easeIn',
               onComplete: () => sprite.destroy() });

Ragdoll гнома:
  tweens.add({ targets: dwarfSprite, rotation: PI, y: y+50,
               duration: 500, ease: 'Cubic.easeIn' });

Удар (взмах):
  tweens.add({ targets: dwarfSprite, scaleX: 1.2,
               duration: 100, yoyo: true });

Summon (финальный босс):
  tweens.add({ targets: bossSprite, scaleX: 1.3, scaleY: 1.3,
               duration: 500, yoyo: true });
```

### §5.4. Asset pipeline

```
Формат: PNG atlas + JSON hash (Phaser 3 native).
Кадр: 96×96 (персонажи), 32×32 (иконки).
Анимации: idle(4f), run(6f), attack(5f), death(8f).
Палитра: runtime через Canvas 2D.
Генерация: npm run gen:assets → /public/atlas/*.png + *.json.
```

### §5.5. Гномий шрифт (v7.0)

```
font-runic — рунический дисплейный шрифт для имён гномов и заголовков.
Применение:
  - имена гномов на карточках экрана 2 и в бою;
  - заголовки экранов (Сбор отряда, Рюкзак, Событие…);
  - названия типов врагов в превью «ВПЕРЕДИ» (§4.4).
Не применяется: к тексту правил, наград, событий — читаемость важнее стиля.
Fallback-стек: 'Runic', 'Cinzel', serif — кириллица отображается,
если глифа нет в рунном наборе.
```

---

## §6. ДАННЫЕ

### §6.1. Гномы (20, v6.7)

| ID | Имя | HP | ATK | DEF | SPD | roleBias |
|---|---|---|---|---|---|---|
| d_brom | Бром | 120 | 8 | 15 | 60 | tank |
| d_grim | Грим | 100 | 12 | 8 | 80 | warrior |
| d_thorvin | Торвин | 110 | 10 | 10 | 70 | support |
| d_bombur | Бомбур | 140 | 6 | 20 | 40 | tank |
| d_bifur | Бифур | 95 | 13 | 7 | 85 | warrior |
| d_dvalin | Двалин | 130 | 7 | 18 | 50 | tank |
| d_bofur_2 | Бофур II | 100 | 15 | 5 | 90 | ranged |
| d_balin | Балин | 115 | 9 | 12 | 75 | support |
| d_bifur_2 | Бифур II | 105 | 12 | 10 | 80 | warrior |
| d_nori | Нори | 90 | 14 | 6 | 100 | ranged |
| d_bombur_2 | Бомбур II | 125 | 8 | 16 | 55 | tank |
| d_dwalin_2 | Двалин II | 135 | 7 | 19 | 45 | tank |
| d_dori | Дори | 95 | 14 | 6 | 95 | ranged |
| d_nori_2 | Нори II | 85 | 15 | 5 | 105 | ranged |
| d_bofur | Бофур | 105 | 11 | 11 | 70 | mage |
| d_oin | Оин | 120 | 10 | 12 | 65 | warrior |
| d_gloin | Глоин | 110 | 11 | 11 | 70 | support |
| d_balin_2 | Балин II | 105 | 13 | 9 | 80 | warrior |
| d_thorin | Торин | 130 | 12 | 14 | 55 | tank |
| d_fili | Фили | 90 | 16 | 4 | 110 | ranged |

### §6.2. Предметы (24) — без изменений

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
| e_war_drum | Барабан войны | trinket | support | — | — | — | aura_spd value=15 | epic | 3 | wood |
| e_mithril_beard | Борода из мифрила | rune | any | +5 | +5 | +5 | extra_slot | legendary | 3 | metal, runic |
| e_dragon_scale | Чешуя дракона | armor | tank | — | +20 | +30 | — | legendary | 3 | metal |
| e_arcane_tome | Тайный фолиант | weapon | mage | +18 | — | — | double_strike value=50 | legendary | 3 | cloth, runic |
| e_slayer_axe | Топор убийцы | weapon | warrior | +22 | — | — | conditional_atk value=50 | epic | 3 | metal |
| e_guardian_plate | Броня стража | armor | tank | — | +18 | +25 | aura_def value=10 | epic | 3 | metal |
| e_hunter_bow | Лук охотника | weapon | ranged | +16 | — | — | pierce value=50 | epic | 3 | wood |

### §6.3. Enemy table

| Enemy ID | Name | HP | ATK | DEF | SPD | Effects | Boss | Elite |
|---|---|---|---|---|---|---|---|---|
| e_rat | Крыса | 10 | 2 | 0 | 80 | — | — | — |
| e_goblin | Гоблин | 15 | 3 | 1 | 70 | — | — | — |
| **e_archer_goblin** | **Гоблин-лучник** | **10** | **3** | **0** | **110** | **ranged (v7.0)** | — | — |
| e_spider | Паук | 12 | 3 | 0 | 100 | poison 20% | — | — |
| e_slime | Слизень | 25 | 2 | 3 | 40 | hp_regen 2 | — | — |
| e_orc | Орк | 40 | 6 | 3 | 60 | — | — | ✅ |
| **e_shaman** | **Шаман** | **20** | **2** | **2** | **80** | **ranged + poison 30% (v7.0)** | — | — |
| e_golem | Голем | 80 | 8 | 6 | 40 | stun 20% | — | ✅ |
| e_heart | Сердце Глубин | 200 | 12 | 8 | 50 | splash 30% | ✅ | — |
| **e_forge_demon** | **Демон Кузни** | **500** | **20** | **12** | **40** | **summon value=10** | **✅ (финал)** | — |
| **e_ancient** | **Древний** | **9999** | **999** | **999** | **10** | **—** | **✅ (только при таймауте)** | — |

**ОСОБЕННОСТЬ e_ancient (v6.9):**
- Появляется ТОЛЬКО при таймауте в бою с боссом
- Не имеет наград
- Не считается в enemyCount
- Не имеет хитбокса для атак гномов (нельзя ранить)
- Атакует один раз (999 урона всем)
- После атаки исчезает вместе с гномами

**Сложность по слоям (v6.8):**

| Слои (floor) | Контент |
|---|---|
| 1–3 | Стартовая зона: rat/goblin/spider/slime |
| 4–7 | Растёт доля elite (nodeProb), золото по §3.3.7 |
| 8–15 | Обычные боссы на слое depth-1: цикл [e_orc, e_golem, e_heart] (§6.3.2) |
| 16–20 | Финальная зона: при bossesKilledTotal ≥ 5 босс depth-1 = e_forge_demon (HP 500, summon) |
| 21+ | Бесконечный режим: пул как 11–15, босс каждые 3 слоя, scaleHP/ATK от depth (§3.3.1) |

**Enemy pool по floor:**

| Floor | Pool |
|---|---|
| 1 | e_rat, e_goblin |
| 2 | e_rat, e_goblin, e_slime |
| 3 | e_goblin, e_spider, e_slime, e_archer_goblin |
| 4 | e_goblin, e_spider, e_slime, e_archer_goblin |
| 5 | e_spider, e_slime, e_orc |
| 6 | e_spider, e_orc, e_slime, e_shaman |
| 7 | e_orc, e_spider, e_slime, e_shaman |
| 8 | e_orc, e_golem, e_spider, e_archer_goblin |
| 9 | e_orc, e_golem, e_slime, e_shaman |
| 10 | e_golem, e_orc |
| 11–15 | e_golem, e_orc, e_heart (как обычный враг) |
| 16+ | e_golem, e_orc, e_heart; скейл по depth (§6.3.1) |

**Число врагов:**

```typescript
enemyCount(floor, isElite) = Math.min(15, Math.floor(
  5 + Math.log2(floor + 1) * 3 + (isElite ? 4 : 0)
))
```

#### §6.3.1. spawnEnemy

```typescript
function spawnEnemy(id: string, floor: number): Enemy {
  const template = ENEMY_TABLE[id];
  if (!template) throw new Error(`Unknown enemy: ${id}`);
  const scaleHP = 1 + floor * 0.08;
  const scaleATK = 1 + floor * 0.04;  // v6.7: медленнее
  return {
    ...template,
    currentHP: Math.round(template.baseHP * scaleHP),
    baseHP: Math.round(template.baseHP * scaleHP),
    baseATK: Math.round(template.baseATK * scaleATK),
    isAlive: true,
    statusEffects: []
  };
}

// v6.9: Особый случай для Древнего
function spawnAncient(): Enemy {
  return {
    id: 'e_ancient',
    name: 'Древний',
    baseHP: 9999,
    baseATK: 999,
    baseDEF: 999,
    speed: 10,
    effects: [],
    statusEffects: [],
    isBoss: true,
    isElite: false,
    currentHP: 9999,
    isAlive: true,
  };
}
```

#### §6.3.2. Boss for depth

```typescript
function bossForFloor(floor: number, meta: MetaState): Enemy {
  // Финальный босс
  if (meta.bossesKilledTotal >= 5 && floor === (8 + meta.bossesKilledTotal) - 1) {
    return spawnEnemy('e_forge_demon', floor);
  }
  
  // Обычные боссы — цикл
  const bossPool = ['e_orc', 'e_golem', 'e_heart'];
  const idx = (floor - 8) % 3;
  const bossId = bossPool[Math.max(0, idx)];
  return spawnEnemy(bossId, floor);
}
```

### §6.4. Формулы (v6.7)

**Ranged-враги (v7.0):**

```typescript
// Пошаговая адаптация (defects.md): реалтайм-штраф дальнего боя ×0.7,
// позиционный множитель линии цели НЕ применяется (стрела достаёт по любой линии):
rawDmg(ranged) = max(minDamage(floor), round((ATK − DEF×(1 − pierce)) × 0.7))
// Выбор цели ranged-врага: провокация → случайный живой гном ИЗ ВСЕХ линий (тыл не укрытие)
```

**enemyTypes (v7.0 §3.3.1):** при создании боевого/элитного/боссового узла `enemyTypes = [...new Set(enemyIds)]` — уникальные типы волны для превью экрана 3 (§4.4).

```typescript
const FIXED_TIMESTEP_MS = 1000 / 60;
const MAX_TICKS_PER_FRAME = 4;
const MAX_BATTLE_TIME = 30000;
const MAX_BATTLE_TIME_BOSS = 60000;
const SPAWN_INTERVAL = 500;
const SPAWN_INTERVAL_LATE = 300;    // floor ≥ 8
const ATTACK_RANGE_BY_ROLE = {
  tank: 80, warrior: 80, ranged: 300, mage: 250, support: 150
};
const ATTACK_COOLDOWN_BASE = {
  tank: 600, warrior: 600, support: 600,
  ranged: 400, mage: 400
};
const RANGED_DMG_MODIFIER = 0.5;    // v6.7: было 0.7
const HP_REGEN_CAP = 3;             // v6.9: максимум HP/тик для гномов
const ENEMY_HP_REGEN_CAP = 2;       // v6.9: максимум HP/тик для врагов
const ENEMY_ATTACK_COOLDOWN = 1000;
const FIELD_GROUND_Y = 900;
const SPAWN_LEFT_X = 100;
const SPAWN_RIGHT_X = 1820;
const COLUMN_SPACING = 80;
const MAX_DWARVES = 10;
const BOUNCE_DISTANCE = 100;
const ENDLESS_MAX_DEPTH = 100;      // v6.7

function minDamage(floor: number): number {
  return Math.max(1, Math.floor(floor / 2));
}

function finalDmg(atk, def, pierce, role, floor): number {
  const raw = Math.max(minDamage(floor), atk - def * (1 - pierce));
  return (role === 'ranged' || role === 'mage') 
    ? raw * RANGED_DMG_MODIFIER 
    : raw;
}

// v6.9: лимит регенерации, чтобы hp_regen не превосходил DPS
function calculateHpRegen(unit: Dwarf | Enemy): number {
  const isDwarf = 'equipment' in unit;
  const cap = isDwarf ? HP_REGEN_CAP : ENEMY_HP_REGEN_CAP;

  const effects = isDwarf
    ? (unit as Dwarf).equipment.flatMap(e => e.effects)
    : (unit as Enemy).effects;

  const total = effects
    .filter(e => e.type === 'hp_regen')
    .reduce((sum, e) => sum + e.value, 0);

  return Math.min(total, cap);
}

function getDepth(meta: MetaState, isEndless: boolean, endlessFloor: number): number {
  return isEndless 
    ? 8 + meta.maxDepthEver + endlessFloor
    : 8 + meta.bossesKilledTotal;
}

function enemyCount(floor, isElite) {
  return Math.min(15, Math.floor(
    5 + Math.log2(floor + 1) * 3 + (isElite ? 4 : 0)
  ));
}

offlineGain(deltaHours, meta) =
  Math.min(deltaHours, 8) * (1 + meta.smithyLevel * 0.5 
                             + meta.offlineBonusPerHour * 0.1)

runLegacy(run) =
  run.depth * 5 + (run.bossKilled ? 50 : 0) 
  + (run.elitesKilled > 0 ? 10 : 0)

upgradeCost(baseCost, level) = baseCost * Math.pow(1.5, level)
```

### §6.5. Events (6) — без изменений

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

**Dwarf pool для ev_lost_dwarf:**

```
available = unlockedDwarves - deadDwarves - currentParty
Если available.length > 0:
  dwarf = random(available)
Иначе: опция disabled
```

### §6.6. Synergies (4) — без изменений

```json
[
  {
    "id": "syn_wall",
    "name": "Стена",
    "condition": { "type": "count_role", "role": "tank", "count": 2 },
    "effect": { "type": "buff_def", "value": 20, "target": "tank" }
  },
  {
    "id": "syn_volley",
    "name": "Залп",
    "condition": { "type": "count_role", "role": "ranged", "count": 2 },
    "effect": { "type": "buff_atk", "value": 15, "target": "ranged" }
  },
  {
    "id": "syn_fury",
    "name": "Ярость",
    "condition": { "type": "adjacent_roles", "roles": ["warrior", "mage"] },
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

## §7. ТЕСТИРОВАНИЕ

### §7.1. Headless-тесты

```
§7.1 НЕ применяется до завершения Фазы 2.

tutorial-run.spec.ts (seed=42):
1. Кузница (скрин)
2. Выбор отряда → Бром + Грим (скрин)
3. Экипировка → drag&drop (скрин)
4. Бой 1 → непрерывный поток врагов (скрин + FPS)
5. После победы: экран Награды → Карта забега → возврат в Кузницу
6. Закрытие → reopen через Date.now() + 3600000 → offline проверен
7. 0 console errors
8. FPS ≥ 30 на viewport 667×375

Дополнительно (v6.7):
9. Финальный босс доступен после 5+ побед
10. Бесконечный режим открывается
11. Воскрешение в бесконечном режиме
```

### §7.2. Determinism test

```typescript
test('determinism', async () => {
  const run1 = simulateRun(42);
  const run2 = simulateRun(42);
  expect(run1).toEqual(run2);
});
```

### §7.3. Agent-критик

Скрины → автопроверка (contrast, touch targets, overflow, grid) → 
чеклист §4.1 → accepted → progress.md.

### §7.4. Video acceptance

```typescript
import { getVideoDurationInSeconds } from 'get-video-duration';
import fs from 'node:fs';

const videoPath = await page.video()?.path();
if (!videoPath) throw new Error('No video');

const duration = await getVideoDurationInSeconds(videoPath);
expect(duration).toBeGreaterThanOrEqual(180);
expect(duration).toBeLessThanOrEqual(360);

const size = fs.statSync(videoPath).size;
expect(size).toBeGreaterThan(1_000_000);
```

### §7.5. Balance test

```
aiPolicy: 'greedy':
  1. Highest rarity item
  2. Использовать автоматическую сортировку §3.1.1
  3. В событиях — max expected value
  4. В shop — если gold ≥ цена
  5. В rest — heal, если avg HP < 60%

Прогон: simulateRun(seed, {aiPolicy:'greedy'}) для seed = 1..10.
Acceptance: 40–60% win rate.

Дополнительно:
- Проверить: 20 гномов разблокируются за 15-20 забегов
- Проверить: финальный босс достижим за 20-30 забегов
- Проверить: бесконечный режим — depth 100 достижим
```

---

## §8. ПРОЦЕСС РАЗРАБОТКИ (7 фаз)

| # | Фаза | Deliverables | Acceptance |
|---|---|---|---|
| 1 | Архитектура + бюджет | architecture.md, core/types.ts, package.json, tsconfig.json, vite.config.ts, index.html, src/main.ts. ШАГ 0: `npm install phaser`, `npm run build`, замер через Node zlib. | tsc --noEmit; 100% §2.3; unit-тест PRNG; мок «1 гном vs 1 крыса»; bundle-baseline.txt; скрин «Phase 1 OK»; git tag phase-1-accepted |
| 2 | Ядро + Бой | core/, battle/ (simulateBattleTick, simulateBattle, simulateRun, createBattleState) | Determinism test; Playwright: dwarf vs rat; скрин боя; seed=42 trace; git tag phase-2-accepted |
| 3 | Roguelite | progression/, economy/ | Playwright: run to boss; скрин карты; скрин кузницы; git tag phase-3-accepted |
| 4 | UI | ui/ (9 экранов + параллакс + tweens) | Скрины всех экранов; чеклист §4.1; git tag phase-4-accepted |
| 5 | Idle + Persistence | idle/, persistence/ | Offline 8h; localStorage roundtrip; скрин reopen; git tag phase-5-accepted |
| 6 | Балансировка | data/ tuning | 10 прогонов greedy → 40–60% win rate; git tag phase-6-accepted |
| 7 | Финализация | интеграция, smoke, README | Все пункты §9 ✅; видео; bundle < 5 MB; git tag phase-7-accepted |

**Скрипт замера bundle (Шаг 0 Фазы 1):**

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

let commit = 'no-git';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) {}

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

---

## §9. ФИНАЛЬНЫЙ ЧЕКЛИСТ (Definition of Done)

**Игровые критерии (26):**
- [ ] Стек: Phaser 3 + Phaser tweens (без Matter.js)
- [ ] Tutorial run: старт → босс (видео)
- [ ] Смерть гнома перманентна (deadDwarves), экипировка сохраняется в meta.unlockedEquipment
- [ ] deadDwarves НЕ воскрешаются при обычных забегах
- [ ] Мета-сохранение (localStorage + Date.now())
- [ ] Offline income (8h симуляция)
- [ ] 3 auto-механики (3/5/7)
- [ ] Кузница: 4 апгрейда
- [ ] **20 гномов, разблокировка по depth**
- [ ] 24 предмета, ≥ 5 обычных врагов
- [ ] Синергии (4 типа)
- [ ] Вид сбоку, гномы бегут, непрерывный поток врагов
- [ ] Pierce работает в формуле урона
- [ ] Ranged/mage стреляют с 300/250 px, cooldown 400 мс, урон ×0.5
- [ ] Явный taunt (magnet_shield) перебивает неявный
- [ ] isBossFight корректно определяет лимит времени
- [ ] isBossFight устанавливается в createBattleState
- [ ] tauntMemory работает (2 сек после смерти)
- [ ] **Growing Depth: depth = 8 + bossesKilledTotal**
- [ ] **Финальный босс e_forge_demon (HP 500)**
- [ ] **Бесконечный режим открывается после финала**
- [ ] **Воскрешение в бесконечном режиме при смерти всех**
- [ ] **minDamage растёт с floor**
- [ ] **scaleATK растёт медленнее (0.04 vs 0.08)**
- [ ] **Карта v6.8: босс достижим из всех узлов предбоссового слоя (validateMap), слой depth-2 — shop/rest**
- [ ] **Награды по типам узлов §3.3.7; выход из бесконечного: abandoned / victory_endless (depth > 100)**
- [ ] UI на 667×375 и 1920×1080
- [ ] FPS ≥ 30 mobile / ≥ 60 desktop
- [ ] Fixed timestep 60 Hz, детерминизм сохранён
- [ ] simulateBattle (headless) работает

**Критерии особого финала v6.9 (7):**
- [ ] Timeout в бою: endReason устанавливается корректно (collapse/ancient)
- [ ] Визуальная анимация таймаута: тряска, камни, гул (за 5 сек до)
- [ ] Обвал: все юниты исчезают, экран темнеет (обычный бой, elite)
- [ ] Древний: появляется, убивает всех одним ударом (босс)
- [ ] Экран 9: заголовок и эпитафия зависят от endReason
- [ ] e_ancient: спрайт 96×96 создан, не имеет хитбокса
- [ ] hp_regen: cap 3 для гномов, 2 для врагов, бой всегда завершается победой

**Процессные критерии (8):**
- [ ] 0 console errors
- [ ] Скрины всех 9 экранов
- [ ] Determinism test
- [ ] Balance: 10 прогонов → 40–60% win rate
- [ ] Все ассеты процедурно
- [ ] defects.md
- [ ] git tag для 7 фаз
- [ ] architecture.md соответствует §0.4

**Итого: 38/38 обязательны.**

---

## §10. ФОРМАТ ВЫВОДА

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
  /scripts/gen-assets.ts
  /tests/unit/*.test.ts
  /tests/playwright/*.spec.ts
  /screenshots/
  /videos/
  /checkpoints/
  /public/atlas/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .gitignore
  .nvmrc
  PROMPT.md
```

---

## §11. ФИНАЛЬНОЕ ПРАВИЛО

```
Ничего не считается работающим, пока не увидено и не измерено.
Ничего не считается соответствующим ТЗ, пока отклонение не 
зафиксировано в defects.md.

Цепочка для каждой фичи:
  1. Реализована
  2. Unit-тест проходит
  3. Playwright-сценарий записан
  4. Скриншот сделан
  5. Объективный чеклист UI пройден
  6. Только тогда → progress.md с хешем коммита и ссылкой на скрин

Остановка запрещена, пока все 38 пунктов §9 не будут ✅.
Стоп-фраза §0 имеет приоритет выше этого правила.
```

---

## 📊 Сводка изменений v6.6 → v6.7

| # | Проблема v6.6 | Решение v6.7 | Где |
|---|---|---|---|
| 🔴1 | 6 гномов, все умирают | **20 гномов** | §6.1, §3.3.5 |
| 🔴2 | Нет финала | **Финальный босс e_forge_demon** | §1.1, §6.3 |
| 🔴3 | Нет бесконечного режима | **Endless mode после финала** | §1.1, §3.3.1 |
| 🔴4 | Все умерли — игра заканчивается | **Сброс deadDwarves при `< 2`** | §3.4 |
| 🟡5 | depth не растёт | **Growing Depth: 8 + bossesKilledTotal** | §3.3.1 |
| 🟡6 | Ranged/mage слишком сильны | **RANGED_DMG_MODIFIER = 0.5** | §6.4 |
| 🟡7 | Танк непробиваем | **minDamage растёт с floor** | §6.4 |
| 🟡8 | ATK растёт как HP | **scaleATK = 0.04 (было 0.08)** | §6.3.1 |
| 🟢9 | Enemy count > 15 | **Cap = 15** | §6.4 |
| 🟢10 | Spawn медленный на поздних | **SPAWN_INTERVAL_LATE = 300** | §6.4 |
| 🟢11 | Нет рекорда | **maxDepthEver** | §2.3, §3.3.1 |

---

---

## 📊 Сводка изменений v6.7 → v6.8

| # | Было (v6.7) | Стало (v6.8) | Где |
|---|---|---|---|
| 🔴1 | Генерация карты — 8 строк тезисов | Детальная: 2–4 узла, depth-2 shop/rest, bipartite, BFS, seed+1 + псевдокод | §3.3.1 |
| 🔴2 | Экран 6: «Граф узлов» | Детальная строка + layout экрана карты | §4, §4.2 |
| 🟡3 | Бесконечный режим — 4 строки | depth-формула, боссы каждые 3 слоя, scale, выходы | §3.3.1 |
| 🟡4 | Пул врагов floor 1–11+ | Таблица сложности по слоям + пул 1–16+ | §6.3 |
| 🔴5 | Награды не специфицированы | Награды по типам узлов | §3.3.7 |
| 🟢6 | Нет примера карты | Пример depth 9 seed 42 | §3.3.8 |
| 🟢7 | DoD 32 пункта | DoD 34 пункта | §9 |

---

## 📊 Сводка изменений v6.8 → v6.9

| # | Проблема | Решение | Где |
|---|---|---|---|
| 🔴1 | Бой по таймауту — просто "поражение" | Эпичный финал: обвал / Древний | §1, §3.1.1 |
| 🔴2 | Игрок не понимает, почему проиграл | endReason + разный текст на экране 9 | §2.3, §4.3 |
| 🟡3 | hp_regen может быть > DPS | Cap: 3 для гномов, 2 для врагов | §6.4 |
| 🟢4 | Нет нового контента для таймаута | Новый враг e_ancient | §6.3, §5.2 |

---

**ТЗ v6.9 готово к запуску. Копируйте в PROMPT.md репозитория.**
---

## §9.1. DoD v7.0 (дополнительные критерии)

- [ ] `AttackType` ('melee' | 'ranged') в `Enemy` и `Combatant`; attackRange: 80 melee / 260 ranged
- [ ] Новые враги `e_archer_goblin` (floor 3+) и `e_shaman` (floor 6+) — ranged, в пулах §6.3
- [ ] Ranged-враги: урон ×0.7, без позиционного множителя линии цели; цель — любой живой гном (тыл не укрытие)
- [ ] `RunNode.data.enemyTypes = [...new Set(enemyIds)]` для battle/elite/boss (§3.3.1)
- [ ] Экран 3: блок «ВПЕРЕДИ» — уникальные типы, спрайт + название (гномий шрифт), БЕЗ статов и количества (§4.4)
- [ ] Экран 2: карточки гномов — имя гномьим шрифтом, спрайт 96×96, статы иконками ❤️⚔️🛡️👟 (§4.5)
- [ ] Win rate на seeds 1..10 остаётся в коридоре 40–60% после добавления ranged-врагов
