# §6. Данные — Часть 1: Гномы и Предметы

> Раздел §6.1–§6.2 из ТЗ v7.2 «Гномы и Глубины».

---
### §6.1. Гномы (20, v6.7; v7.1: без roleBias)

| ID | Имя | HP | ATK | DEF | SPD |
|---|---|---|---|---|---|
| d_brom | Бром | 120 | 8 | 15 | 60 |
| d_grim | Грим | 100 | 12 | 8 | 80 |
| d_thorvin | Торвин | 110 | 10 | 10 | 70 |
| d_bombur | Бомбур | 140 | 6 | 20 | 40 |
| d_bifur | Бифур | 95 | 13 | 7 | 85 |
| d_dvalin | Двалин | 130 | 7 | 18 | 50 |
| d_bofur_2 | Бофур II | 100 | 15 | 5 | 90 |
| d_balin | Балин | 115 | 9 | 12 | 75 |
| d_bifur_2 | Бифур II | 105 | 12 | 10 | 80 |
| d_nori | Нори | 90 | 14 | 6 | 100 |
| d_bombur_2 | Бомбур II | 125 | 8 | 16 | 55 |
| d_dwalin_2 | Двалин II | 135 | 7 | 19 | 45 |
| d_dori | Дори | 95 | 14 | 6 | 95 |
| d_nori_2 | Нори II | 85 | 15 | 5 | 105 |
| d_bofur | Бофур | 105 | 11 | 11 | 70 |
| d_oin | Оин | 120 | 10 | 12 | 65 |
| d_gloin | Глоин | 110 | 11 | 11 | 70 |
| d_balin_2 | Балин II | 105 | 13 | 9 | 80 |
| d_thorin | Торин | 130 | 12 | 14 | 55 |
| d_fili | Фили | 90 | 16 | 4 | 110 |

### §6.2. Предметы (66)

#### Weapon (20)

| ID | Имя | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|
| e_rusty_axe | Ржавый топор | warrior | +5 | — | — | — | common | 1 | metal |
| e_short_bow | Короткий лук | ranged | +4 | — | — | — | common | 1 | wood |
| e_apprentice_staff | Посох ученика | mage | +4 | — | — | — | common | 1 | wood |
| e_balanced_sword | Сбалансированный меч | warrior | +6 | +3 | — | — | common | 1 | metal |
| e_buckler_dagger | Кинжал с баклером | warrior | +4 | +2 | — | — | common | 1 | metal |
| e_heavy_axe | Тяжёлый топор | warrior | +8 | -3 | — | — | common | 1 | metal |
| e_rune_hammer | Рунический молот | warrior | +10 | — | — | stun 15% | rare | 1 | metal, runic |
| e_iron_sword | Железный меч | warrior | +10 | — | — | — | rare | 1 | metal |
| e_long_bow | Длинный лук | ranged | +8 | — | -5 | — | rare | 2 | wood |
| e_poison_bow | Отравленный лук | ranged | +5 | — | — | poison 20% | rare | 2 | wood, bone |
| e_hunter_bow | Лук охотника | ranged | +16 | — | — | pierce 50% | epic | 3 | wood |
| e_fire_staff | Огненный посох | mage | +6 | +2 | — | burn 2t | rare | 2 | wood, runic |
| e_frost_staff | Ледяной посох | mage | +5 | — | — | stun 15% | rare | 2 | wood, runic |
| e_arcane_tome | Тайный фолиант | mage | +18 | — | — | double_strike 50% | legendary | 3 | cloth, runic |
| e_poison_dagger | Отравленный кинжал | warrior | +8 | — | — | poison 5 | rare | 2 | metal |
| e_2h_axe | Двуручный топор | warrior | +18 | -5 | — | splash 30% | rare | 2 | metal |
| e_vamp_blade | Клинок вампира | warrior | +15 | — | — | lifesteal 50% | legendary | 2 | metal, runic |
| e_berserk_axe | Топор берсерка | warrior | +12 | -6 | -10 | — | rare | 2 | metal |
| e_slayer_axe | Топор убийцы | warrior | +22 | — | — | conditional_atk 50% | epic | 3 | metal |
| e_dragon_slayer | Драконобой | warrior | +25 | — | — | splash 40% | legendary | 3 | metal, runic |

#### Armor (12)

| ID | Имя | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|
| e_wood_shield | Деревянный щит | tank | — | +8 | — | — | common | 1 | wood |
| e_buckler | Баклер | tank | +2 | +5 | — | — | common | 1 | metal |
| e_iron_shield | Железный щит | tank | -2 | +15 | — | — | rare | 2 | metal |
| e_tower_shield | Башенный щит | tank | — | +15 | +20 | — | rare | 1 | metal |
| e_magnet_shield | Щит-магнит | tank | — | +12 | — | taunt 2t | rare | 2 | metal, runic |
| e_spiked_shield | Шипастый щит | tank | +3 | +10 | — | — | rare | 2 | metal |
| e_leather_armor | Кожаная броня | tank | — | +6 | +5 | — | common | 1 | cloth |
| e_chain_mail | Кольчуга | tank | -1 | +12 | — | — | rare | 2 | metal |
| e_plate_armor | Пластинчатая броня | tank | -3 | +18 | +10 | — | epic | 3 | metal |
| e_dragon_scale | Чешуя дракона | tank | — | +20 | +30 | — | legendary | 3 | metal |
| e_guardian_plate | Броня стража | tank | — | +18 | +25 | aura_def +10% | epic | 3 | metal |
| e_shadow_cloak | Плащ тени | ranged | +3 | +6 | — | — | rare | 2 | cloth |

#### Head (10)

| ID | Имя | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|
| e_leather_cap | Кожаный шлем | any | — | +5 | +10 | — | common | 1 | cloth |
| e_hood | Капюшон | any | — | +2 | +20 | — | common | 1 | cloth |
| e_iron_helm | Железный шлем | any | — | +8 | +15 | — | rare | 2 | metal |
| e_horned_helm | Рогатый шлем | warrior | +3 | +5 | — | — | rare | 2 | metal |
| e_hunter_hood | Капюшон охотника | ranged | +2 | +3 | +10 | — | rare | 2 | cloth |
| e_mage_hat | Шляпа мага | mage | +2 | — | — | aura_atk +5% | rare | 2 | cloth, runic |
| e_priest_hood | Капюшон жреца | support | — | +3 | +10 | hp_regen 3 | rare | 2 | cloth |
| e_crown | Корона | any | +5 | -2 | — | — | epic | 3 | metal, runic |
| e_dragon_helm | Шлем дракона | tank | — | +12 | +20 | — | legendary | 3 | metal |
| e_berserker_helm | Шлем берсерка | warrior | +6 | -2 | — | — | epic | 3 | metal |

#### Trinket (12)

| ID | Имя | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|
| e_lucky_ring | Кольцо удачи | any | +2 | +2 | — | — | common | 1 | metal |
| e_bone_charm | Костяной оберег | any | +3 | +3 | +3 | — | common | 1 | bone |
| e_ring_of_power | Кольцо силы | any | +5 | -2 | — | — | common | 1 | metal |
| e_ring_of_vitality | Кольцо живучести | any | — | — | +25 | — | common | 1 | metal |
| e_swift_boots | Быстрые сапоги | any | — | — | — | aura_spd +10% | rare | 2 | cloth |
| e_healing_charm | Целительный амулет | support | — | — | — | hp_regen 5 | rare | 2 | bone, runic |
| e_poison_charm | Ядовитый оберег | any | — | — | — | poison 15% | rare | 2 | bone |
| e_amulet_of_speed | Амулет скорости | any | — | — | — | aura_spd +20% | rare | 2 | cloth |
| e_war_drum | Барабан войны | support | — | — | — | aura_spd +15% | epic | 3 | wood |
| e_dragon_heart | Сердце дракона | any | +5 | +5 | +15 | — | epic | 3 | runic |
| e_phoenix_feather | Перо феникса | any | — | — | +30 | hp_regen 10 | legendary | 3 | runic |
| e_shadow_amulet | Амулет тени | ranged | +3 | +5 | — | — | epic | 3 | cloth, runic |

#### Rune (8)

| ID | Имя | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|
| e_rune_of_strength | Руна силы | any | +10 | — | — | — | rare | 2 | runic |
| e_rune_of_protection | Руна защиты | any | — | +12 | — | — | rare | 2 | runic |
| e_rune_of_life | Руна жизни | any | — | — | +30 | — | rare | 2 | runic |
| e_mithril_beard | Борода из мифрила | any | +5 | +5 | +5 | extra_slot | legendary | 3 | metal, runic |
| e_rune_of_chaos | Руна хаоса | any | +15 | -5 | -10 | — | epic | 3 | runic |
| e_rune_of_fire | Руна огня | any | +6 | — | — | burn 3t | epic | 3 | runic |
| e_rune_of_frost | Руна льда | any | — | +8 | — | stun 20% | epic | 3 | runic |
| e_rune_of_blood | Руна крови | any | +5 | — | +20 | lifesteal 30% | legendary | 3 | runic |

#### Ring (4) — открывается на maxSlots ур. 2

| ID | Имя | Role | ATK | DEF | HP | Effect | Rarity | Stage | Tags |
|---|---|---|---|---|---|---|---|---|---|
| e_ring_of_haste | Кольцо спешки | any | — | — | — | aura_spd +15% | rare | 2 | metal |
| e_ring_of_warding | Кольцо защиты | any | — | +8 | +10 | — | rare | 2 | metal |
| e_ring_of_fury | Кольцо ярости | any | +8 | — | -5 | — | epic | 3 | metal |
| e_ring_of_kings | Кольцо королей | any | +10 | +10 | +10 | — | legendary | 3 | metal, runic |

**Итого: 20 + 12 + 10 + 12 + 8 + 4 = 66.**

**Примечание:** ATK, DEF, HP могут быть отрицательными. Это **trade-off** — предмет даёт одно, но забирает другое.

**МАГИ (v7.1):**
- Магов-гномов в таблице НЕТ
- Роль mage даётся только через посохи:
  * e_apprentice_staff (weapon, mage)
  * e_fire_staff (weapon, mage)
  * e_frost_staff (weapon, mage)
  * e_arcane_tome (weapon, mage)
- Если гном надел посох → role = 'mage'
- Если снял посох → role = 'any' (или другая роль по armor)

**SUPPORT-ПРЕДМЕТЫ (v7.1):**
- Предметы с role: support дают гному роль support:
  * e_healing_charm (trinket, support, hp_regen)
  * e_war_drum (trinket, support, aura_spd)
  * e_priest_hood (head, support, hp_regen)
- Если гном с support-предметом:
  * role = 'support'
  * Может лечить союзников (heal = ATK × 0.5)

### §6.3. Enemy table (v7.1: HP ×5, balance DPS/EHP)

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

**Число врагов (v7.1):**

```typescript
// v7.1: 1.5 врага на гнома
enemyCount(floor, isElite, dwarfCount) = Math.min(20, Math.max(3,
  Math.round((Math.round(dwarfCount * 1.5) + Math.floor(floor / 3)) * (isElite ? 1.5 : 1.0))
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
  // v7.1: ×1.5 для баланса DPS
  tank: 900, warrior: 900, support: 900,
  ranged: 600, mage: 600
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

// v7.1: расчёт сложности боя через DPS/EHP
function battleDifficulty(dwarves: Dwarf[], enemies: Enemy[]): number {
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

const DIFFICULTY_MIN = 0.8;
const DIFFICULTY_MAX = 1.2;

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

// v7.1: 1.5 врага на гнома
function enemyCount(floor, isElite, dwarfCount) {
  const base = Math.round(dwarfCount * 1.5);
  const floorBonus = Math.floor(floor / 3);
  const eliteMod = isElite ? 1.5 : 1.0;
  const raw = Math.round((base + floorBonus) * eliteMod);
  return Math.max(3, Math.min(20, raw));
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