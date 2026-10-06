# Game Design Document — Гномы и Глубины (v7.2)

## §1 Концепция

Авто-батлер с видом сбоку. Гномы спускаются в глубины, сражаются с волнами врагов, собирают лут и экипировку. 20 гномов, 66 предметов, 6 слотов экипировки.

**3 фазы:**
1. Обычный забег (depth = 8 + bossesKilledTotal)
2. Финальный босс e_forge_demon → unlock endless
3. Бесконечный режим (depth до 100+, боссы каждые 3 слоя)

## §3 Геймплейное ядро

### Бой
- Пошаговый, fixed timestep 60Hz эквивалент
- 5 ролей: tank, warrior, ranged, mage, support (+ 'any' без экипировки)
- Роль определяется через экипировку (weapon > armor > head > trinket > rune > ring)
- 'any': range 80, cooldown 900ms, damage x1.0, нет синергий

### Карта
- Генерация: 2-4 узла/слой, depth-2 = shop/rest, depth-1 = boss
- BFS-валидация: босс достижим из всех узлов предбоссового слоя
- Типы: battle, elite, shop, event, rest, forge, boss

### Экипировка (v7.2)
- 6 слотов: weapon, armor, head + 3 гибких (trinket/rune/ring)
- Базово 4 слота, Кузница +1/+2, extra_slot +1 (макс 7)
- 66 предметов: weapon 20, armor 12, head 10, trinket 12, rune 8, ring 4
- 4 редкости: common, rare, epic, legendary
- Эффекты: stun, lifesteal, splash, pierce, taunt, aura_*, double_strike, hp_regen, extra_slot, poison, burn, summon

### Лут
- 1 из 3 после боя (battle/elite/boss)
- Rarity по rollRarity(difficulty)

## §6 Данные

### Гномы (§6.1)
- 20 гномов, разблокировка по floor (1-20)
- Перманентная смерть, экипировка сохраняется

### Предметы (§6.2) — v7.2
- 66 предметов (6 слотов, 4 редкости)
- Stage 1/2/3: статы ×(1 + 0.25×(stage-1))
- Trade-off: atk/def/hp могут быть отрицательными

### Враги (§6.3)
- Пулы по floor (1-16+)
- e_forge_demon — финальный босс (HP 2500, summon)
- e_ancient — событие таймаута (9999 HP)

### Формулы (§6.4)
- minDamage = max(1, floor/2)
- RANGED_DMG_MODIFIER = 0.5
- HP_REGEN_CAP = 3 (гномы), 2 (враги)
- enemyCount = 1.5 × dwarfCount (cap 20)
