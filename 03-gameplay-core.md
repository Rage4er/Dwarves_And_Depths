# §3. Геймплейное Ядро

> Раздел §3 из ТЗ v7.2 «Гномы и Глубины».

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

COOLDOWN ПО РОЛЯМ (v7.1: ×1.5):
- tank / warrior / support: 900 мс
- ranged / mage:            600 мс

SUPPORT ability (v7.1):
- Range: 150 px, Cooldown: 900 мс
- heal = ATK × 0.5, target: союзник с наименьшим HP% в радиусе 150
- Условие: HP% < 90%. Если все ≥ 90% → attack врага
- Приоритет: heal > attack

РОЛИ 'any' (v7.1): гном без экипировки с ролью
- Range: 80, Cooldown: 900, Damage: ×1.0, Taunt: ❌
- Нет синергий, нет buff'ов от ролей

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

// v7.1: Support ability (heal)
  Если role === 'support' и cooldown ≤ 0:
    - Найти союзника с наименьшим HP% в range 150
    - Если HP% < 90%:
        - heal(ATK × 0.5)
        - cooldown = ATTACK_COOLDOWN_BASE['support']
        - continue (пропустить атаку)

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
- HP 2500, ATK 20, DEF 12, SPD 40 (v7.1: HP ×5)

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

#### §3.1.3. Role resolution (v7.1)

```
Dwarf.role = роль предмета в самом приоритетном слоте.
Priority: weapon > armor > head > trinket > rune > ring.

АЛГОРИТМ:
1. Проверить weapon. Если role != 'any' → role = weapon.role
2. Иначе проверить armor. Если role != 'any' → role = armor.role
3. Иначе проверить head. Если role != 'any' → role = head.role
4. Иначе проверить trinket. Если role != 'any' → role = trinket.role
5. Иначе проверить rune. Если role != 'any' → role = rune.role
6. Иначе проверить ring. Если role != 'any' → role = ring.role
7. Если ничего нет → role = 'any'

v7.1: 'any' = гном без роли (без weapon с ролью)
      Роль присваивается ТОЛЬКО через экипировку

ГОМН БЕЗ РОЛИ ('any'):
- Range: 80 px
- Cooldown: 900 мс
- Damage: ×1.0
- Нет синергий
- Нет taunt
- Пушечное мясо
```

#### §3.1.4. Synergies (v7.1)

```typescript
type SynergyCondition =
  | { type: 'count_role'; role: Role; count: number }
  | { type: 'count_tag'; tag: Tag; count: number }
  | { type: 'adjacent_roles'; roles: [Role, Role] };
```

**4 синергии — см. §6.6.**

**СИНЕРГИИ И 'any' (v7.1):**
- Гном с role = 'any' НЕ считается ни за какую роль
- Не активирует синергии
- Не получает бонусов от синергий

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
ИТОГОВЫЙ ЛИМИТ СЛОТОВ:
  baseSlots = 4 (weapon, armor, head + 1 гибкий)
  smithySlots = meta.maxSlots (0 → 2)
  localSlotBonus = Math.min(1, extra_slot_count)
  
  Итог: 4 + smithySlots + localSlotBonus

meta.maxSlots: 0 → 1 → 2 (через Кузницу).

Ур. 0: 4 слота
Ур. 1: 5 слотов
Ур. 2: 6 слотов
+ mithril_beard (extra_slot): 7 слотов

ГИБКИЙ СЛОТ:
- В него можно положить trinket, rune или ring.
- Игрок сам решает, что надеть.
- Гибкий слот НЕ конфликтует с weapon, armor, head.
- Если у гнома 2+ гибких слота — можно надеть trinket + rune + ring одновременно.
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
3. rarity++ (см. §6.4.11 rollRarity в 06-data-part2.md). stage НЕ меняется.
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

ЛУТ (экран 5: выбор 1 из 3 — явно указать «Выбери 1 из 3»):
  battle: выбор 1 из 3, common/rare по rollRarity(difficulty)
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

### §3.4.1. Обработка результатов забега

```
При завершении забега (victory/defeat/abandoned/victory_endless):

  status === 'victory'
    → экран 9 "Победа!"
    → регенерация 5% missingHP
    → run.inventory ОБЪЕДИНЯЕТСЯ с meta.unlockedEquipment

  status === 'defeat'
    → экран 9 "Поражение"
    → meta.deadDwarves.push(dwarfId) для каждого мёртвого гнома
    → run.inventory ОБЪЕДИНЯЕТСЯ с meta.unlockedEquipment

  status === 'abandoned'
    → экран 9 "Отступление"
    → meta.deadDwarves.push(dwarfId) для каждого мёртвого гнома
    → run.inventory ОБЪЕДИНЯЕТСЯ с meta.unlockedEquipment

  status === 'victory_endless'  (depth > 100)
    → экран 9 "Рекорд глубины!"
    → бонус наследия: depth × 10
    → meta.maxDepthEver = max(meta.maxDepthEver, depth)
    → run.inventory ОБЪЕДИНЯЕТСЯ с meta.unlockedEquipment
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
    effectPerLevel: '+1 гибкий слот на гнома', baseCost: 50, maxLevel: 2,
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

**Стоимость:** 50, 75.

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