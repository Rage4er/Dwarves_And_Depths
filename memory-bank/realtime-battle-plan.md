# План: Реалтайм-бой §3.1 (2–3 недели)

> Решение заказчика: Вариант 1 — переделать бой на реалтайм.
> §0 стоп-фраза: агент НЕ имеет права сам легализовать пошаговый бой.

---

## Блокер

**§3.1 BLOCKER** — пошаговый бой вместо реалтайма.
- Текущий: `simulateTurn()` — раунды, инициатива, turn limits
- Требуется: `simulateBattleTick(state, dt, prng)` — fixed timestep 60 Hz

---

## Фаза 1: Ядро боя (2–3 дня)

**Цель:** `simulateBattleTick()` работает с fixed timestep, детерминизм сохранён.

### Изменения

| Файл | Было | Стало |
|------|------|-------|
| `battle.ts` | `simulateTurn()` | `simulateBattleTick(state, dt, prng)` |
| `battle.ts` | раунды, инициатива | fixed timestep 60 Hz, accumulator |
| `battle.ts` | нет позиции | x += speed * dt/1000, BOUNCE_DISTANCE = 100 px |
| `battle.ts` | cooldown не применяется | cooldown = ATTACK_COOLDOWN_BASE[role] / (1 + speed/30) |
| `battle.ts` | spawn в начале раунда | spawn каждые 500 мс (spawnTimer) |
| `types.ts` | BattleState | добавить x, y, attackCooldown к Combatant |

### Константы

```typescript
const FIXED_TIMESTEP_MS = 1000 / 60;  // 16.667 мс
const MAX_TICKS_PER_FRAME = 4;
const SPAWN_INTERVAL = 500;  // мс
const SPAWN_INTERVAL_DEEP = 300;  // мс, floor ≥ 8
const BOUNCE_DISTANCE = 100;  // px
const MAX_BATTLE_TIME = 30000;  // мс, обычный бой
const MAX_BATTLE_TIME_BOSS = 60000;  // мс, босс

const ATTACK_COOLDOWN_BASE = {
  tank: 900,
  warrior: 900,
  ranged: 600,
  mage: 600,
  support: 900,
  any: 900,
};

const ATTACK_RANGE_BY_ROLE = {
  tank: 80,
  warrior: 80,
  ranged: 300,
  mage: 250,
  support: 150,
  any: 80,
};
```

### simulateBattleTick — спецификация

```typescript
function simulateBattleTick(state, dt, prng): BattleState {
  // 1. Спавн врагов
  state.spawnTimer += dt;
  const interval = state.floor >= 8 ? SPAWN_INTERVAL_DEEP : SPAWN_INTERVAL;
  if (state.spawnTimer >= interval && state.enemiesSpawned < state.enemiesTotal) {
    spawnNextEnemy(state, prng);
    state.spawnTimer = 0;
    state.enemiesSpawned++;
  }

  // 2. Движение
  moveDwarves(state, dt);
  moveEnemies(state, dt);

  // 3. Атаки гномов
  attackDwarves(state, dt, prng);

  // 4. Атаки врагов
  attackEnemies(state, dt, prng);

  // 5. DOT-тики (poison/burn)
  tickStatusEffects(state, dt);

  // 6. hp_regen
  tickRegen(state, dt);

  // 7. Проверка смерти
  checkDeaths(state);

  // 8. Проверка победы/поражения
  checkEndConditions(state);

  // 9. timeElapsed
  state.timeElapsed += dt;

  // 10. Таймаут (v6.9)
  checkTimeout(state);

  return state;
}
```

### Тесты

- [ ] `simulateBattleTick` детерминирован (seed → одинаковый результат)
- [ ] Спавн каждые 500 мс (проверить spawnTimer)
- [ ] Движение: x += speed * dt/1000 (проверить позицию через N мс)
- [ ] Cooldown: ATTACK_COOLDOWN_BASE / (1 + speed/30)
- [ ] BOUNCE_DISTANCE = 100 px при ударе
- [ ] Победа: все враги мертвы → phase = 'victory'
- [ ] Поражение: все гномы мертвы → phase = 'defeat'
- [ ] Таймаут: timeElapsed >= MAX_BATTLE_TIME → endReason

### Приёмка

- [ ] `bun test` — все тесты проходят
- [ ] Детерминизм: simulateBattleTick(seed, 16.667) × N → одинаковый результат
- [ ] Нет раундов, нет turn limits — только accumulator

---

## Фаза 2: Визуал боя (3–4 дня)

**Цель:** Canvas-рендер боя, гномы бегут, враги бегут, анимации.

### Изменения

| Файл | Было | Стало |
|------|------|-------|
| `BattleScreen.tsx` | React-компонент (HP-бары) | Canvas-рендер (Phaser или raw canvas) |
| `art.ts` | SVG спрайты | Canvas-спрайты (процедурные) |
| `store.tsx` | BATTLE_FINISH → React | BATTLE_FINISH → canvas state |

### Элементы

- [ ] Canvas 1920×1080, scale FIT
- [ ] Вид сбоку, земля y = 900
- [ ] Гномы спавн x = 100, бегут вправо
- [ ] Враги спавн x = 1820, бегут влево
- [ ] HP-бары над юнитами
- [ ] Анимации ударов (BOUNCE_DISTANCE = 100 px)
- [ ] Частицы при ударах
- [ ] Параллакс-фон

### Приёмка

- [ ] FPS ≥ 60 desktop, ≥ 30 mobile
- [ ] Детерминизм: canvas-рендер не влияет на логику (логика → POJO)
- [ ] Скриншоты всех состояний боя

---

## Фаза 3: Баланс под реалтайм (3–4 дня)

**Цель:** Win rate 40–60% на seeds 1..10 под реалтаймом.

### Изменения

| Файл | Было | Стало |
|------|------|-------|
| `simulateRun.ts` | simulateTurn() цикл | simulateBattleTick() с dt |
| `enemies.ts` | enemyCount × 0.3 | enemyCount (формула §6.3) |
| `enemies.ts` | scaleHP 0.05 | scaleHP 0.08 (возврат к ТЗ) |
| `store.tsx` | regen 30% missing | regen 5% missing (возврат к ТЗ) |
| `store.tsx` | rest 15% | rest 5% (возврат к ТЗ) |
| `battle.ts` | MAX_TURNS 50/100 | MAX_BATTLE_TIME 30000/60000 |

### Тесты

- [ ] Balance test: seeds 1..10 → win rate 40–60%
- [ ] Battle difficulty: 0.8–1.2 для 80% боёв
- [ ] Средний бой: 15–30 сек (обычный), 35–55 (босс)
- [ ] Смертность гномов: 30–50% за забег

### Приёмка

- [ ] `bun test` — balance test проходит
- [ ] Таблица 10 сидов: win/loss, battleDifficulty, TTK

---

## Фаза 4: DoD-чеклист (2–3 дня)

**Цель:** Пройти DoD заново, критерии «гномы бегут», «60 Hz», «cooldown 600 мс» — ✅.

### Обновить

- [ ] `defects.md` — удалить §3.1 BLOCKER
- [ ] `02-stack-and-arch.md` — §2.1: добавить Phaser 3
- [ ] `04-ui-ux.md` — §4: Phaser canvas
- [ ] `09-checklist.md` — §9: DoD критерии реалтайма
- [ ] `07-testing.md` — §7: Playwright e2e

### Проверить

- [ ] §9: «Стек: Phaser 3 + Phaser tweens» — ✅
- [ ] §9: «Вид сбоку, гномы бегут, непрерывный поток врагов» — ✅
- [ ] §9: «FPS >= 30 mobile / >= 60 desktop» — ✅
- [ ] §9: «Fixed timestep 60 Hz, детерминизм сохранён» — ✅
- [ ] §9: «simulateBattle (headless) работает» — ✅
- [ ] §9.1: «Ranged/mage стреляют с 300/250 px, cooldown 600 мс, урон ×0.5» — ✅
- [ ] §9.2: «Cooldown гномов x1.5 (tank/warrior/support: 900, ranged/mage: 600)» — ✅

### Приёмка

- [ ] 68/68 DoD критериев ✅
- [ ] `bun test` — все тесты проходят
- [ ] `npm run build` — 0 ошибок

---

## Итого

| Фаза | Срок | Критерий приёмки |
|------|------|------------------|
| 1. Ядро боя | 2–3 дня | simulateBattleTick() детерминирован, fixed timestep |
| 2. Визуал боя | 3–4 дня | Canvas-рендер, FPS ≥ 60, скриншоты |
| 3. Баланс | 3–4 дня | Win rate 40–60%, balance test проходит |
| 4. DoD-чеклист | 2–3 дня | 68/68 DoD ✅, defects.md обновлён |
| **Итого** | **2–3 недели** | **Все фазы приняты** |

---

## Стоп-фраза §0

- Любое упрощение DoD — провал фазы
- Агент НЕ имеет права сам менять механику боя
- При сомнении — STOP, defects.md, ждать инструкции

---

> **Напоминание (§0.7): Правило работы с файлами**
>
> - Write ≤ 200 строк / ≤ 8 КБ; Edit ≤ 50 строк / ≤ 2 КБ.
> - Новый файл: Write("") → Edit частями по 10-50 строк.
> - Правка > 50 строк → разбить на N последовательных Edit.
> - Если Write/Edit падает: уменьшить в 2×, затем Bash fallback, записать в defects.md.
> - Признаки разбивки: файл > 200 строк, правка > 50 строк, вложенные объекты, повторные падения.
