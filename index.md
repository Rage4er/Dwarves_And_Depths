# ТЗ v7.2: «Гномы и Глубины» — Финальная production-версия

> **Единый документ-индекс.** Ссылки на все разделы ТЗ.

**Для агента:** это навигационный хаб. Текущий статус —
в [REALTIME-PHASE-2-HANDOFF.md](REALTIME-PHASE-2-HANDOFF.md).
**§0.2 bootstrap НЕ выполнять** — проект уже существует
(v7.2 базовый принят, RT Фаза 1 принята, RT Фаза 2 в работе).
Порядок чтения: handoff → index → 00 §0/§0.7/§0.8 → progress.
DoD — в [09-checklist.md](09-checklist.md).
При сомнении — STOP, `defects.md`.
---

## Содержание

| # | Файл | Раздел | Описание |
|---|------|--------|----------|
| 0 | [00-stop-and-bootstrap.md](./00-stop-and-bootstrap.md) | §0 | Стоп-фраза, роль, bootstrap, чекпоинты, контракты архитектуры и memory-bank, цикл работы |
| 1 | [01-concept.md](./01-concept.md) | §1 | Концепция, 3 фазы игры, особый финал боя (v6.9) |
| 2 | [02-stack-and-arch.md](./02-stack-and-arch.md) | §2 | Стек (Phaser 3), структура папок, контракты данных, детерминизм, performance budget, persistence, error handling, index.html, package.json, store |
| 3 | [03-gameplay-core.md](./03-gameplay-core.md) | §3 | Auto Battler, simulateBattleTick, role resolution, synergies, target selection, **extra slot (4→7 слотов)**, simulateRun, hp_regen, idle-слой, Roguelite (граф забега, Growing Depth, shop, forge, rest, unlock table, награды узлов, пример карты), run start, кузница |
| 4 | [04-ui-ux.md](./04-ui-ux.md) | §4 | 9 экранов, критерии UI, экран карты (layout), экран итогов (endReason), превью врагов, skipPrepScreen, **гибкий слот 💎**, карточки гномов |
| 5 | [05-visual-assets.md](./05-visual-assets.md) | §5 | Стиль, минимальный набор ассетов, parallax, визуальные эффекты (tweens), asset pipeline, гномий шрифт |
| 6 | [06-data-part1.md](./06-data-part1.md) | §6.1–6.2 | Гномы (20), предметы (66): weapon, armor, head, trinket, rune, ring + маппинг slot из подзаголовка |
| 7 | [06-data-part2.md](./06-data-part2.md) | §6.3–6.6 | Враги, формулы, events (6), synergies (4) |
| 8 | [07-testing.md](./07-testing.md) | §7 | Headless-тесты, determinism test, agent-критик, video acceptance, balance test |
| 9 | [08-development.md](./08-development.md) | §8 | Процесс разработки (7 фаз), скрипт замера bundle |
| 10 | [09-checklist.md](./09-checklist.md) | §9–§11 | Финальный чеклист (68 критериев: 45 базовый + 7 v7.0 + 11 v7.1 + 5 v7.2), формат вывода, финальное правило |
| 11 | [10-version-changes.md](./10-version-changes.md) | Summary | Сводки изменений v6.6→v6.7→v6.8→v6.9→v7.0→v7.1→v7.2 |
| 12 | [11-v7.3-backlog.md](./11-v7.3-backlog.md) | v7.3 | Генератор + подготовка к 3D (черновик, не активно) |

---

## Быстрый переход по темам

| Тема | Файл |
|------|------|
| Стоп-фраза и bootstrap | [00-stop-and-bootstrap.md](./00-stop-and-bootstrap.md) |
| Типы данных (TypeScript) | [02-stack-and-arch.md](./02-stack-and-arch.md) §2.3 |
| Симуляция боя | [03-gameplay-core.md](./03-gameplay-core.md) §3.1.2 |
| Роли и синергии | [03-gameplay-core.md](./03-gameplay-core.md) §3.1.3–3.1.4 |
| Карта забега | [03-gameplay-core.md](./03-gameplay-core.md) §3.3.1 |
| 9 экранов UI | [04-ui-ux.md](./04-ui-ux.md) §4 |
| 20 гномов | [06-data-part1.md](./06-data-part1.md) §6.1 |
| 66 предметов | [06-data-part1.md](./06-data-part1.md) §6.2 |
| Враги | [06-data-part2.md](./06-data-part2.md) §6.3 |
| Формулы баланса | [06-data-part2.md](./06-data-part2.md) §6.4 |
| События | [06-data-part2.md](./06-data-part2.md) §6.5 |
| Финальный чеклист | [09-checklist.md](./09-checklist.md) §9 |
| DoD v7.0 | [09-checklist.md](./09-checklist.md) §9.1 |
| DoD v7.1 | [09-checklist.md](./09-checklist.md) §9.2 |
| DoD v7.2 | [09-checklist.md](./09-checklist.md) §9.3 |
| DoD v7.3 | [09-checklist.md](./09-checklist.md) §9.4 |
| Сводка v7.1→v7.2 | [10-version-changes.md](./10-version-changes.md) |
