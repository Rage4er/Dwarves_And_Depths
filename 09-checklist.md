# §9. Финальный Чеклист, Формат Вывода, Финальное Правило

> Раздел §9-§11 + сводки изменений из ТЗ v7.2 "Гномы и Глубины".

---

## §9. ФИНАЛЬНЫЙ ЧЕКЛИСТ (Definition of Done)

**Игровые критерии (30):**
- [ ] Стек: Next.js 16 + React 19 + TypeScript strict + Tailwind CSS
- [ ] Tutorial run: старт → босс (скриншоты React-компонентов)
- [ ] Смерть гнома перманентна (deadDwarves), экипировка сохраняется в meta.unlockedEquipment
- [ ] deadDwarves НЕ воскрешаются при обычных забегах
- [ ] Мета-сохранение (localStorage + Date.now())
- [ ] Offline income (8h симуляция)
- [ ] Кузница: 4 апгрейда
- [ ] **20 гномов, разблокировка по depth**
- [ ] Синергии (4 типа)
- [ ] Пошаговый бой: раунды, инициатива по speed, волны врагов
- [ ] Pierce работает в формуле урона
- [ ] Ranged/mage: урон ×0.7, без позиционного множителя; цель — любой гном
- [ ] Явный taunt (magnet_shield) перебивает неявный
- [ ] Лимит ходов: MAX_TURNS 50 / MAX_TURNS_BOSS 100
- [ ] Лимит ходов корректно определяет таймаут босс-боя
- [ ] Taunt работает через tauntLeft (раунды)
- [ ] **Growing Depth: depth = 8 + bossesKilledTotal**
- [ ] **Финальный босс e_forge_demon (HP 2500)**
- [ ] **Бесконечный режим открывается после финала**
- [ ] **Воскрешение в бесконечном режиме при смерти всех**
- [ ] **minDamage растёт с floor**
- [ ] **scaleATK растёт медленнее (0.04 vs 0.08)**
- [ ] **Карта v6.8: босс достижим из всех узлов предбоссового слоя (validateMap), слой depth-2 — shop/rest**
- [ ] **Награды по типам узлов §3.3.7; выход из бесконечного: abandoned / victory_endless (depth > 100)**
- [ ] UI: карточка показывает "Гном" без экипировки
- [ ] Перепрофилирование через экипировку работает
- [ ] UI на 667x375 и 1920x1080
- [ ] CSS-анимации ≤ 300ms, детерминизм сохранён
- [ ] simulateBattle (headless) работает

**Критерии особого финала v6.9 (7):**
- [ ] Timeout в бою: endReason устанавливается корректно (collapse/ancient)
- [ ] Визуальная анимация таймаута: тряска, камни, гул (за 3 раунда до)
- [ ] Обвал: все юниты исчезают, экран темнеет (обычный бой, elite)
- [ ] Древний: появляется, убивает всех одним ударом (босс)
- [ ] Экран 9: заголовок и эпитафия зависят от endReason
- [ ] e_ancient: спрайт создан, не имеет хитбокса (React-компонент)
- [ ] hp_regen: cap 3 для гномов, 2 для врагов, бой всегда завершается победой

**Процессные критерии (8):**
- [ ] 0 console errors (Next.js dev)
- [ ] Скриншоты всех 9 экранов (React-компоненты)
- [ ] Determinism test: `bun test` → simulateRun(42) дважды → идентично
- [ ] Balance: 10 прогонов → 40-60% win rate
- [ ] Все ассеты процедурно (SVG data-URI)
- [ ] defects.md
- [ ] git tag для 7 фаз
- [ ] architecture.md соответствует §0.4

**Базовый DoD: 45/45 обязательны** (30 игровых + 7 v6.9 + 8 процессных).

> Примечание: критерии про Phaser/реалтайм/Playwright засчитываются по эквивалентной логике:
> - Phaser → Next.js + React (отклонение §2.1)
> - Реалтайм 60 Hz → пошаговый бой (отклонение §3.1)
> - Playwright → bun test (отклонение §7)

---

## §9.1. DoD v7.0 (дополнительные критерии)

- [ ] `AttackType` ('melee' | 'ranged') в `Enemy` и `Combatant`; attackRange: 80 melee / 260 ranged
- [ ] Новые враги `e_archer_goblin` (floor 3+) и `e_shaman` (floor 6+) — ranged, в пулах §6.3
- [ ] Ranged-враги: урон x0.7, без позиционного множителя линии цели; цель — любой живой гном (тыл не укрытие)
- [ ] `RunNode.data.enemyTypes = [...new Set(enemyIds)]` для battle/elite/boss (§3.3.1)
- [ ] Экран 3: блок "ВПЕРЕДИ" — уникальные типы, спрайт + название (гномий шрифт), БЕЗ статов и количества (§4.4)
- [ ] Экран 2: карточки гномов — имя гномьим шрифтом, спрайт 96x96, статы иконками (HP, ATK, DEF, SPD) (§4.5)
- [ ] Win rate на seeds 1..10 остаётся в коридоре 40-60% после добавления ranged-врагов

---

## §9.2. DoD v7.1 (дополнительные критерии)

- [ ] `skipPrepScreen` в `MetaState`; чекбокс "Не показывать экран подготовки" на экране 1
- [ ] `roleBias` удалён из `Dwarf`; `role` определяется через экипировку
- [ ] Гном без экипировки → role = 'any' (cooldown 900, range 80, damage x1.0)
- [ ] 'any' не активирует синергии
- [ ] Support ability: heal = ATK x 0.5, target с наименьшим HP% < 90%
- [ ] HP врагов x5 (e_rat: 50, e_goblin: 75, e_slime: 125, e_orc: 200, e_golem: 400, e_heart: 1000, e_forge_demon: 2500)
- [ ] Cooldown гномов x1.5 (tank/warrior/support: 900, ranged/mage: 600)
- [ ] enemyCount = 1.5 врага на гнома (base + floorBonus, cap 20)
- [ ] battleDifficulty в коридоре 0.8-1.2 для 80% боёв
- [ ] Маги через посохи (e_apprentice_staff, e_fire_staff, e_arcane_tome)
- [ ] Support-предметы (e_healing_charm, e_war_drum) дают роль support

---

## §9.3. DoD v7.2 (дополнительные критерии)

- [ ] 66 предметов: weapon 20, armor 12, head 10, trinket 12, rune 8, ring 4
- [ ] 6 слотов: 4 базовых + 2 гибких через Кузницу
- [ ] Гибкий слот принимает trinket/rune/ring
- [ ] Лут после боя: 1 из 3
- [ ] Экран 5: заголовок "Выбери 1 из 3"

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
    /lib/game     — game logic (pure TS, no DOM)
    /components   — React components (9 screens)
      /game       — MapScreen, BattleScreen, etc.
      /ui         — shared UI components
      /art        — procedural SVG sprites
    /app          — Next.js App Router
  /scripts/gen-assets.ts
  /tests/unit/*.test.ts        — bun test
  /screenshots/
  /checkpoints/
  /public/atlas/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  .gitignore
  PROMPT.md
```

---

## §11. ФИНАЛЬНОЕ ПРАВИЛО

```
Ничего не считается работающим, пока не увидено и не измерено.
Ничего не считается соответствующим ТЗ, пока отклонение не 
зафиксировано в defects.md.

Цепочка для каждой фичи:
  1. Реализована (React-компонент + game logic)
  2. Unit-тест проходит (bun test)
  3. Headless-симуляция проверена (simulateRun)
  4. Скриншот сделан
  5. Объективный чеклист UI пройден
  6. Только тогда → progress.md с хешем коммита и ссылкой на скрин

Остановка запрещена, пока все 45 пунктов базового DoD §9 не будут OK,
плюс все пункты §9.1 (7), §9.2 (11), §9.3 (5).
Итого: 45 + 7 + 11 + 5 = 68 критериев.

Стоп-фраза §0 имеет приоритет выше этого правила.
```
