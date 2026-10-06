# §6. Данные — Часть 2: Враги, Формулы, События, Синергии

> Раздел §6.3–§6.6 из ТЗ v7.2 «Гномы и Глубины».

---

## §6.3. Enemy table (v7.1: HP ×5, balance DPS/EHP)

| Enemy ID | Name | HP | ATK | DEF | SPD | Effects | Boss | Elite |
|---|---|---|---|---|---|---|---|---|
| e_rat | Крыса | 50 | 2 | 0 | 80 | — | — | — |
| e_goblin | Гоблин | 75 | 3 | 1 | 70 | — | — | — |
| **e_archer_goblin** | **Гоблин-лучник** | **50** | **3** | **0** | **110** | **ranged (v7.0)** | — | — |
| e_spider | Паук | 60 | 3 | 0 | 100 | poison 20% | — | — |
| e_slime | Слизень | 125 | 2 | 3 | 40 | hp_regen 2 | — | — |
| e_orc | Орк | 200 | 6 | 3 | 60 | — | — | ✅ |
| **e_shaman** | **Шаман** | **100** | **2** | **2** | **80** | **ranged + poison 30% (v7.0)** | — | — |
| e_golem | Голем | 400 | 8 | 6 | 40 | stun 20% | — | ✅ |
| e_heart | Сердце Глубин | 1000 | 12 | 8 | 50 | splash 30% | ✅ | — |
| **e_forge_demon** | **Демон Кузни** | **2500** | **20** | **12** | **40** | **summon value=10** | **✅ (финал)** | — |
| **e_ancient** | **Древний** | **9999** | **999** | **999** | **10** | **—** | **✅ (только при таймауте)** | — |

### §6.3.0.1. AttackType — melee/ranged

> Каноничное определение `AttackType` — в §2.3. Здесь — контекст использования.

```typescript
type AttackType = 'melee' | 'ranged';  // см. §2.3

// attackRange:
//   melee:  80 px  (по умолчанию)
//   ranged: 260 px (e_archer_goblin, e_shaman)
```

**melee (по умолчанию):** e_rat, e_goblin, e_spider, e_slime, e_orc, e_golem, e_heart, e_forge_demon, e_ancient.

**ranged:** e_archer_goblin (floor 3+), e_shaman (floor 6+).

**Правила ranged-врагов (v7.0):**
- Урон ×0.7 (позиционный множитель линии цели НЕ применяется).
- Цель — любой живой гном из всех линий (тыл не укрытие).
- Провокация (taunt) приоритетна как обычно.

### §6.3.0.2. Особенность e_ancient (v6.9)

- Появляется **ТОЛЬКО при таймауте** в бою с боссом.
- Не имеет наград.
- Не считается в `enemyCount`.
- Не имеет хитбокса для атак гномов (нельзя ранить).
- Атакует один раз (999 урона всем).
- После атаки исчезает вместе с гномами.
- `isBoss = true`, `isElite = false`.
- Спрайт 96×96, тёмный силуэт со светящимися глазами (см. §5.2).

---

### §6.3.1. Сложность по слоям (v6.8)

| Слои (floor) | Контент |
|---|---|
| 1–3 | Стартовая зона: rat/goblin/spider/slime |
| 4–7 | Растёт доля elite (nodeProb), золото по §3.3.7 |
| 8–15 | Обычные боссы на слое depth-1: цикл [e_orc, e_golem, e_heart] (§6.3.3) |
| 16–20 | Финальная зона: при bossesKilledTotal ≥ 5 босс depth-1 = e_forge_demon (HP 2500, summon) |
| 21+ | Бесконечный режим: пул как 11–15, босс каждые 3 слоя, scaleHP/ATK от depth (§3.3.1) |

---

### §6.3.2. Enemy pool по floor

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
| 16+ | e_golem, e_orc, e_heart; скейл по depth (§6.3.4) |

```typescript
function getEnemyPool(floor: number): string[] {
  if (floor === 1) return ['e_rat', 'e_goblin'];
  if (floor === 2) return ['e_rat', 'e_goblin', 'e_slime'];
  if (floor === 3 || floor === 4) {
    return ['e_goblin', 'e_spider', 'e_slime', 'e_archer_goblin'];
  }
  if (floor === 5) return ['e_spider', 'e_slime', 'e_orc'];
  if (floor === 6 || floor === 7) {
    return ['e_spider', 'e_orc', 'e_slime', 'e_shaman'];
  }
  if (floor === 8) {
    return ['e_orc', 'e_golem', 'e_spider', 'e_archer_goblin'];
  }
  if (floor === 9) {
    return ['e_orc', 'e_golem', 'e_slime', 'e_shaman'];
  }
  if (floor === 10) return ['e_golem', 'e_orc'];
  if (floor >= 11) {
    return ['e_golem', 'e_orc', 'e_heart'];  // 11+ со скейлом по depth (§6.3.1)
  }
}
```

---

### §6.3.3. Число врагов (v7.1)

```typescript
// v7.1: 1.5 врага на гнома
function enemyCount(
  floor: number,
  isElite: boolean,
  dwarfCount: number
): number {
  const base = Math.round(dwarfCount * 1.5);
  const floorBonus = Math.floor(floor / 3);
  const eliteMod = isElite ? 1.5 : 1.0;
  const raw = Math.round((base + floorBonus) * eliteMod);
  return Math.max(3, Math.min(20, raw));
}
```

**Примеры:**
- 3 гнома, floor 1, обычный: `round(4.5 + 0) * 1.0 = 5`
- 3 гнома, floor 6, обычный: `round(4.5 + 2) * 1.0 = 7`
- 3 гнома, floor 6, elite: `round(4.5 + 2) * 1.5 = 10`
- 5 гномов, floor 10, обычный: `round(7.5 + 3) = 11`

---

### §6.3.4. spawnEnemy

```typescript
function spawnEnemy(id: string, floor: number): Enemy {
  const template = ENEMY_TABLE[id];
  if (!template) throw new Error(`Unknown enemy: ${id}`);
  const scaleHP = 1 + floor * 0.08;
  const scaleATK = 1 + floor * 0.04;  // v6.7: медленнее, чем HP
  return {
    ...template,
    currentHP: Math.round(template.baseHP * scaleHP),
    baseHP: Math.round(template.baseHP * scaleHP),
    baseATK: Math.round(template.baseATK * scaleATK),
    isAlive: true,
    statusEffects: []
  };
}
```

```typescript
// v6.9: Особый случай для Древнего
function spawnAncient(): Enemy {
  return {
    id: 'e_ancient',
    name: 'Древний',
    baseHP: 9999,
    baseATK: 999,
    baseDEF: 999,
    speed: 10,
    attackType: 'melee',
    attackRange: 80,
    effects: [],
    statusEffects: [],
    isBoss: true,
    isElite: false,
    currentHP: 9999,
    isAlive: true,
  };
}
```

**Константы скейла:**

| Параметр | Значение | Комментарий |
|---|---|---|
| `scaleHP` | `1 + floor × 0.08` | HP растёт линейно |
| `scaleATK` | `1 + floor × 0.04` | ATK растёт вдвое медленнее (v6.7) |

---

### §6.3.5. Boss for depth

```typescript
function bossForFloor(floor: number, meta: MetaState): Enemy {
  // Финальный босс
  if (
    meta.bossesKilledTotal >= 5 &&
    floor === (8 + meta.bossesKilledTotal) - 1
  ) {
    return spawnEnemy('e_forge_demon', floor);
  }
  
  // Обычные боссы — цикл по 3
  const bossPool = ['e_orc', 'e_golem', 'e_heart'];
  const idx = (floor - 8) % 3;
  const bossId = bossPool[Math.max(0, idx)];
  return spawnEnemy(bossId, floor);
}
```

**Цикл боссов:**

| depth | floor-1 | Босс |
|---|---|---|
| 8 | 7 | e_orc |
| 9 | 8 | e_golem |
| 10 | 9 | e_heart |
| 11 | 10 | e_orc |
| 12 | 11 | e_golem |
| 13 | 12 | e_heart |
| … | … | … |
| 13+ (5 побед) | 12 | **e_forge_demon** (финал) |

**Бесконечный режим:** босс каждые 3 слоя (`endlessFloor % 3 === 2`), цикл `[e_orc, e_golem, e_heart]`.

---

### §6.3.6. ENEMY_TABLE — полное определение

```typescript
export const ENEMY_TABLE: Record<string, Omit<Enemy, 'currentHP' | 'isAlive' | 'statusEffects'>> = {
  e_rat: {
    id: 'e_rat',
    name: 'Крыса',
    baseHP: 50, baseATK: 2, baseDEF: 0, speed: 80,
    attackType: 'melee', attackRange: 80,
    effects: [],
    isBoss: false, isElite: false,
  },
  e_goblin: {
    id: 'e_goblin',
    name: 'Гоблин',
    baseHP: 75, baseATK: 3, baseDEF: 1, speed: 70,
    attackType: 'melee', attackRange: 80,
    effects: [],
    isBoss: false, isElite: false,
  },
  e_archer_goblin: {
    id: 'e_archer_goblin',
    name: 'Гоблин-лучник',
    baseHP: 50, baseATK: 3, baseDEF: 0, speed: 110,
    attackType: 'ranged', attackRange: 260,
    effects: [],
    isBoss: false, isElite: false,
  },
  e_spider: {
    id: 'e_spider',
    name: 'Паук',
    baseHP: 60, baseATK: 3, baseDEF: 0, speed: 100,
    attackType: 'melee', attackRange: 80,
    effects: [{ type: 'poison', value: 5, chance: 20 }],
    isBoss: false, isElite: false,
  },
  e_slime: {
    id: 'e_slime',
    name: 'Слизень',
    baseHP: 125, baseATK: 2, baseDEF: 3, speed: 40,
    attackType: 'melee', attackRange: 80,
    effects: [{ type: 'hp_regen', value: 2 }],
    isBoss: false, isElite: false,
  },
  e_orc: {
    id: 'e_orc',
    name: 'Орк',
    baseHP: 200, baseATK: 6, baseDEF: 3, speed: 60,
    attackType: 'melee', attackRange: 80,
    effects: [],
    isBoss: false, isElite: true,
  },
  e_shaman: {
    id: 'e_shaman',
    name: 'Шаман',
    baseHP: 100, baseATK: 2, baseDEF: 2, speed: 80,
    attackType: 'ranged', attackRange: 260,
    effects: [{ type: 'poison', value: 5, chance: 30 }],
    isBoss: false, isElite: false,
  },
  e_golem: {
    id: 'e_golem',
    name: 'Голем',
    baseHP: 400, baseATK: 8, baseDEF: 6, speed: 40,
    attackType: 'melee', attackRange: 80,
    effects: [{ type: 'stun', value: 1, chance: 20 }],
    isBoss: false, isElite: true,
  },
  e_heart: {
    id: 'e_heart',
    name: 'Сердце Глубин',
    baseHP: 1000, baseATK: 12, baseDEF: 8, speed: 50,
    attackType: 'melee', attackRange: 80,
    effects: [{ type: 'splash', value: 30, radius: 150 }],
    isBoss: true, isElite: false,
  },
  e_forge_demon: {
    id: 'e_forge_demon',
    name: 'Демон Кузни',
    baseHP: 2500, baseATK: 20, baseDEF: 12, speed: 40,
    attackType: 'melee', attackRange: 80,
    effects: [{ type: 'summon', value: 10, chance: 100 }],
    isBoss: true, isElite: false,
  },
  e_ancient: {
    id: 'e_ancient',
    name: 'Древний',
    baseHP: 9999, baseATK: 999, baseDEF: 999, speed: 10,
    attackType: 'melee', attackRange: 80,
    effects: [],
    isBoss: true, isElite: false,
  },
};
```

---

## §6.4. Формулы (v6.7 + v7.0 + v7.1 + v7.2)

### §6.4.0. Ranged-враги (v7.0)

```typescript
// Пошаговая адаптация (defects.md): реалтайм-штраф дальнего боя ×0.7,
// позиционный множитель линии цели НЕ применяется
// (стрела достаёт по любой линии):
rawDmg(ranged) = max(
  minDamage(floor),
  round((ATK − DEF × (1 − pierce)) × 0.7)
)
// Выбор цели ranged-врага:
//   провокация → случайный живой гном ИЗ ВСЕХ линий (тыл не укрытие)
```

### §6.4.1. enemyTypes (v7.0)

При создании боевого / элитного / боссового узла:

```typescript
enemyTypes = [...new Set(enemyIds)]
```

Уникальные типы волны для превью экрана 3 (§4.4).

### §6.4.2. Константы

```typescript
const FIXED_TIMESTEP_MS      = 1000 / 60;   // 16.667 мс
const MAX_TICKS_PER_FRAME    = 4;
const MAX_BATTLE_TIME        = 30000;       // 30 сек — обычный/elite
const MAX_BATTLE_TIME_BOSS   = 60000;       // 60 сек — босс
const SPAWN_INTERVAL         = 500;         // мс
const SPAWN_INTERVAL_LATE    = 300;         // мс, floor ≥ 8
const ENEMY_ATTACK_COOLDOWN  = 1000;        // мс
const FIELD_GROUND_Y         = 900;
const SPAWN_LEFT_X           = 100;
const SPAWN_RIGHT_X          = 1820;
const COLUMN_SPACING         = 80;
const MAX_DWARVES            = 10;
const BOUNCE_DISTANCE        = 100;
const ENDLESS_MAX_DEPTH      = 100;         // v6.7

const RANGED_DMG_MODIFIER    = 0.5;         // v6.7 (было 0.7)
const HP_REGEN_CAP           = 3;           // v6.9: max HP/тик для гномов
const ENEMY_HP_REGEN_CAP     = 2;           // v6.9: max HP/тик для врагов

const DIFFICULTY_MIN         = 0.8;
const DIFFICULTY_MAX         = 1.2;

const ATTACK_RANGE_BY_ROLE = {
  tank:    80,
  warrior: 80,
  ranged:  300,
  mage:    250,
  support: 150,
};

const ATTACK_COOLDOWN_BASE = {
  // v7.1: ×1.5 для баланса DPS
  tank:    900,
  warrior: 900,
  support: 900,
  ranged:  600,
  mage:    600,
};
```

### §6.4.3. battleDifficulty (v7.1)

```typescript
function battleDifficulty(
  dwarves: Dwarf[],
  enemies: Enemy[]
): number {
  const sumDps = (units: (Dwarf | Enemy)[]): number => {
    return units.reduce((sum, u) => {
      const isDwarf = 'equipment' in u;
      const cooldown = isDwarf
        ? ATTACK_COOLDOWN_BASE[(u as Dwarf).role] / (1 + u.speed / 30)
        : ENEMY_ATTACK_COOLDOWN;
      return sum + u.baseATK / (cooldown / 1000);
    }, 0);
  };
  const sumEhp = (units: (Dwarf | Enemy)[]): number => {
    return units.reduce((sum, u) => {
      const mit = u.baseDEF / (u.baseDEF + 100);
      return sum + u.baseHP / (1 - mit);
    }, 0);
  };
  const dpsDwarves = sumDps(dwarves);
  const dpsEnemies = sumDps(enemies);
  const ehpDwarves = sumEhp(dwarves);
  const ehpEnemies = sumEhp(enemies);
  if (dpsDwarves === 0 || ehpDwarves === 0) return Infinity;
  return (dpsEnemies / dpsDwarves) * (ehpEnemies / ehpDwarves);
}
```

**Коридор:** `0.8 ≤ difficulty ≤ 1.2` для 80% боёв.

### §6.4.4. minDamage

```typescript
function minDamage(floor: number): number {
  return Math.max(1, Math.floor(floor / 2));
}
```

**Прогрессия:** floor 1–2 → 1; floor 3–4 → 2; floor 5–6 → 3; … floor 20 → 10.

### §6.4.5. finalDmg

```typescript
function finalDmg(
  atk: number,
  def: number,
  pierce: number,
  role: Role,
  floor: number
): number {
  const raw = Math.max(minDamage(floor), atk - def * (1 - pierce));
  return (role === 'ranged' || role === 'mage')
    ? raw * RANGED_DMG_MODIFIER
    : raw;
}
```

**Примеры:**
- warrior ATK 12 vs DEF 3, floor 5, pierce 0: `max(3, 12 − 3) = 9`
- ranged ATK 12 vs DEF 3, floor 5, pierce 0: `max(3, 9) × 0.5 = 4.5 → 5`
- warrior ATK 5 vs DEF 8, floor 5, pierce 0: `max(3, −3) = 3` (minDamage)

### §6.4.6. calculateHpRegen (v6.9)

```typescript
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
```

**Зачем:** чтобы `hp_regen` не превосходил DPS и бой всегда завершался.

### §6.4.7. getDepth

```typescript
function getDepth(
  meta: MetaState,
  isEndless: boolean,
  endlessFloor: number
): number {
  return isEndless
    ? 8 + meta.maxDepthEver + endlessFloor
    : 8 + meta.bossesKilledTotal;
}
```

### §6.4.8. Offline-доход

```typescript
function offlineGain(
  deltaHours: number,
  meta: MetaState
): number {
  return Math.min(deltaHours, 8) * (
    1
    + meta.smithyLevel * 0.5
    + meta.offlineBonusPerHour * 0.1
  );
}
```

### §6.4.9. runLegacy

```typescript
function runLegacy(run: RunState): number {
  return (
    run.depth * 5
    + (run.bossKilled ? 50 : 0)
    + (run.elitesKilled > 0 ? 10 : 0)
  );
}
```

**Бонус за `victory_endless`:** `+ depth × 10` (см. §3.3.1).

### §6.4.10. upgradeCost

```typescript
function upgradeCost(baseCost: number, level: number): number {
  return baseCost * Math.pow(1.5, level);
}
```

**Стоимости кузницы:**

| Апгрейд | baseCost | Ур. 0→1 | Ур. 1→2 | maxLevel |
|---|---|---|---|---|
| maxSlots | 50 | 50 | 75 | 2 |
| maxPartySize | 80 | 80 | — | 1 |
| smithyLevel | 30 | 30 | 45 | ∞ |
| offlineBonusPerHour | 60 | 60 | 90 | 5 |

### §6.4.11. rollRarity

```typescript
function rollRarity(
  difficulty: number,
  prng: PRNG
): Rarity {
  // Чем выше difficulty, тем больше шанс редких предметов
  const roll = prng();
  const bonus = Math.max(0, difficulty - 1);  // cap на bonus: нет (может расти для high difficulty)
  if (roll < 0.02 + bonus * 0.1) return 'legendary';
  if (roll < 0.10 + bonus * 0.2) return 'epic';
  if (roll < 0.35 + bonus * 0.3) return 'rare';
  return 'common';
}
```

**Использование:** в §3.3.7 при генерации лута после боя (экран 5).

### §6.4.12. Сводная таблица ключевых констант

| Константа | Значение | Где менялось |
|---|---|---|
| `FIXED_TIMESTEP_MS` | 16.667 | v6.6 |
| `MAX_BATTLE_TIME` | 30000 | v6.6 |
| `MAX_BATTLE_TIME_BOSS` | 60000 | v6.6 |
| `SPAWN_INTERVAL` | 500 | v6.6 |
| `SPAWN_INTERVAL_LATE` | 300 | v6.7 |
| `ENEMY_ATTACK_COOLDOWN` | 1000 | v6.6 |
| `BOUNCE_DISTANCE` | 100 | v6.6 |
| `RANGED_DMG_MODIFIER` | 0.5 | v6.7 (было 0.7) |
| `HP_REGEN_CAP` (гномы) | 3 | v6.9 |
| `ENEMY_HP_REGEN_CAP` | 2 | v6.9 |
| `ATTACK_COOLDOWN_BASE` (tank/warrior/support) | 900 | v7.1 (было 600) |
| `ATTACK_COOLDOWN_BASE` (ranged/mage) | 600 | v7.1 (было 400) |
| `ENEMY_HP ×5` | ×5 | v7.1 |
| `enemyCount` | 1.5 × dwarfCount + floorBonus | v7.1 |
| `ENDLESS_MAX_DEPTH` | 100 | v6.7 |
| `DIFFICULTY_MIN/MAX` | 0.8 / 1.2 | v7.1 |

---

## §6.5. Events (6)

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

### §6.5.1. Формат эффектов событий

| Токен | Значение |
|---|---|
| `hp:-20%_all` | Все живые гномы теряют 20% maxHP |
| `hp:+30%_all` | Все живые гномы лечатся на 30% maxHP |
| `gold:-N` / `gold:+N` | Изменение золота |
| `legacy:+N` | Изменение Наследия |
| `item:common` / `item:rare` | Выдать 1 предмет указанной редкости |
| `item:rarity++` | Повысить редкость выбранного предмета |
| `item:-1` | Забрать 1 предмет из инвентаря |
| `dwarf:+1 (random)` | Добавить случайного гнома |
| `node:replace_battle` | Заменить следующий узел на battle |
| `none` | Ничего |

**Условный шанс:** `reward: "A (X%) | B (Y%)"` — ролл через PRNG, `X + Y = 100`.

### §6.5.2. Dwarf pool для `ev_lost_dwarf`

```typescript
function getAvailableDwarfForEvent(
  meta: MetaState,
  currentParty: string[],
  prng: () => number
): string | null {
  const available = meta.unlockedDwarves.filter(
    id => !meta.deadDwarves.includes(id) && !currentParty.includes(id)
  );
  if (available.length === 0) return null;
  return available[Math.floor(prng() * available.length)];
}
```

> **Важно:** используется `prng` (Mulberry32), а не `Math.random()`, для детерминизма (§7.2).

**Если `available.length === 0`:** опция «Взять в отряд» **disabled**.

### §6.5.3. Интеграция событий в граф забега

**При создании узла `type: 'event'`:**
1. Выбрать случайное событие из `EVENTS` через PRNG.
2. Записать в `node.data.eventId`.
3. При входе на узел → экран 8 показывает текст и кнопки.

**Резолв выбора:**
```typescript
function resolveEventChoice(
  run: RunState,
  meta: MetaState,
  eventId: string,
  choiceIndex: number,
  prng: PRNG
): { run: RunState; meta: MetaState; log: string[] } {
  const event = EVENTS.find(e => e.id === eventId);
  const choice = event.choices[choiceIndex];
  
  // Проверить disabled_if
  if (choice.disabled_if === 'party_full' && isPartyFull(run)) {
    return { run, meta, log: ['Choice disabled: party full'] };
  }
  
  const log: string[] = [];
  
  // Применить cost (§6.5.1)
  applyCost(run, meta, choice.cost, log);
  
  // Применить reward (§6.5.1) через prng для шансов
  applyReward(run, meta, choice.reward, prng, log);
  
  return { run, meta, log };
}
```

> **Псевдокод:** `applyCost` и `applyReward` парсят токены (gold:+N, hp:-X%, item:rare и т.д.) из §6.5.1.

---

## §6.6. Synergies (4)

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

### §6.6.1. Типы условий

```typescript
type SynergyCondition =
  | { type: 'count_role'; role: Role; count: number }
  | { type: 'count_tag'; tag: Tag; count: number }
  | { type: 'adjacent_roles'; roles: [Role, Role] };
```

| Тип | Смысл |
|---|---|
| `count_role` | N+ гномов с указанной ролью в отряде |
| `count_tag` | N+ предметов с указанным тегом надето на отряд |
| `adjacent_roles` | Два гнома с указанными ролями стоят рядом (по `positionIndex`) |

### §6.6.2. Типы эффектов

```typescript
type SynergyEffect =
  | { type: 'buff_def'; value: number; target: 'tank' | 'all' }
  | { type: 'buff_atk'; value: number; target: Role | 'all' };
```

| Эффект | Смысл |
|---|---|
| `buff_def` | +N DEF целевым гномам (в %) |
| `buff_atk` | +N ATK целевым гномам (в %) |

### §6.6.3. Резолв синергий

```typescript
interface SynergyDef {
  id: string;
  name: string;
  condition: SynergyCondition;
  effect: SynergyEffect;
}

function resolveSynergies(
  dwarves: Dwarf[],
  synergies: SynergyDef[]
): SynergyDef[] {
  return synergies.filter(syn => checkSynergyCondition(syn.condition, dwarves));
}

function checkSynergyCondition(
  cond: SynergyCondition,
  dwarves: Dwarf[]
): boolean {
  switch (cond.type) {
    case 'count_role':
      return dwarves.filter(
        d => d.role === cond.role && d.isAlive
      ).length >= cond.count;
    
    case 'count_tag': {
      const allTags = dwarves
        .filter(d => d.isAlive)
        .flatMap(d => d.equipment.flatMap(e => e.tags));
      return allTags.filter(t => t === cond.tag).length >= cond.count;
    }
    
    case 'adjacent_roles': {
      const sorted = [...dwarves]
        .filter(d => d.isAlive)
        .sort((a, b) => a.positionIndex - b.positionIndex);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i].role;
        const b = sorted[i + 1].role;
        if (
          (a === cond.roles[0] && b === cond.roles[1]) ||
          (a === cond.roles[1] && b === cond.roles[0])
        ) return true;
      }
      return false;
    }
  }
}
```

### §6.6.4. Синергии и 'any' (v7.1)

**Правило:** гном с `role = 'any'` **НЕ считается** ни за какую роль.

| Ситуация | Считается? |
|---|---|
| 2 гнома с `role = 'tank'` + 1 гном `'any'` | ✅ `syn_wall` активна (2 танка) |
| 1 гном `'tank'` + 1 гном `'any'` | ❌ `syn_wall` не активна (только 1 танк) |
| Гном `'any'` носит 3 metal предмета | ✅ `syn_forge` может активироваться (тег считается) |

**Важно:** для `count_tag` теги считаются независимо от роли гнома.

### §6.6.5. Применение синергий

```typescript
function applySynergies(
  state: BattleState,
  activeSynergies: SynergyDef[]
): BattleState {
  // Применяется ОДИН раз при старте боя (createBattleState).
  // ВАЖНО: мутирует battleDwarves, но НЕ run.dwarves.
  // run.dwarves остаётся неизменным для детерминизма.
  // При каждом createBattleState создаётся новый массив battleDwarves
  // из run.dwarves, поэтому мутация не накапливается.
  
  const battleDwarves = state.battleDwarves.map(bd => {
    const dwarf = { ...state.dwarves.find(d => d.id === bd.dwarfId)! };
    return { ...bd, dwarf };
  });
  
  for (const syn of activeSynergies) {
    for (const bd of battleDwarves) {
      const dwarf = bd.dwarf;
      if (!dwarf.isAlive) continue;
      if (syn.effect.target === 'all' || syn.effect.target === dwarf.role) {
        if (syn.effect.type === 'buff_atk') {
          bd.atkBonus = (bd.atkBonus || 0) + syn.effect.value;
        } else if (syn.effect.type === 'buff_def') {
          bd.defBonus = (bd.defBonus || 0) + syn.effect.value;
        }
      }
    }
  }
  
  return { ...state, battleDwarves };
}
```

> **Детерминизм:** `applySynergies` мутирует **только** `battleDwarves` (локальный массив createBattleState), а не `run.dwarves`. Это гарантирует, что `simulateRun(42)` дважды даёт идентичный результат.
>
> **Формула итогового ATK:** `finalATK = baseATK * (1 + atkBonus / 100)`
> **Формула итогового DEF:** `finalDEF = baseDEF * (1 + defBonus / 100)`

### §6.6.6. Примеры активных комбинаций

| Отряд | Активные синергии |
|---|---|
| 2 танка + 1 воин | `syn_wall` (2 танка) |
| 2 ranged + 1 support | `syn_volley` (2 ranged) |
| warrior + mage рядом | `syn_fury` |
| 3+ metal предмета на отряде | `syn_forge` |
| 2 танка + 3 metal | `syn_wall` + `syn_forge` |

---

## 📎 Приложение A: сводка §6.3–§6.6

| Подраздел | Содержание | Строк |
|---|---|---|
| §6.3 | Enemy table (11 врагов), AttackType, пул по floor, enemyCount, spawnEnemy, bossForFloor, ENEMY_TABLE | ~280 |
| §6.4 | Формулы: ranged, enemyTypes, константы, battleDifficulty, minDamage, finalDmg, calculateHpRegen, getDepth, offlineGain, runLegacy, upgradeCost, rollRarity | ~250 |
| §6.5 | Events (6), формат эффектов, dwarf pool, интеграция | ~130 |
| §6.6 | Synergies (4), типы условий/эффектов, резолв, применение, примеры | ~150 |

**Всего:** ~810 строк.

---

## 📎 Приложение B: отличия v7.2 от v7.1 в §6.3–§6.6

| Раздел | Что изменилось в v7.2 |
|---|---|
| §6.3 | ❌ Нет изменений: 11 врагов, HP ×5, ranged (e_archer_goblin, e_shaman), e_ancient — всё из v7.0/v7.1 |
| §6.4 | ❌ Нет изменений: константы, формулы, battleDifficulty — всё из v6.7–v7.1 |
| §6.5 | ❌ Нет изменений: 6 событий как в v6.6 |
| §6.6 | ❌ Нет изменений: 4 синергии как в v6.6 |

**Вывод:** §6.3–§6.6 не менялись в v7.2. Изменения v7.2 (§6.2, §3.1.6, §3.3.7, §4, §5.2, §9) уже внесены в соответствующие файлы.

---

## 📎 Приложение C: чек-лист для `06-data-part2.md`

Проверьте, что в файле есть:
...
**Если все пункты ✅ — `06-data-part2.md` готов к использованию агентом.**