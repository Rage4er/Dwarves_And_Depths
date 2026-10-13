# Progress Log — Гномы и Глубины

## [2026-10-07 16:36] v7.3-backlog [created]
- memory-bank/v7.3-backlog.md — генератор + подготовка к 3D
- 09-checklist.md — §9.4 DoD v7.3 (черновик)
- index.md — ссылка на v7.3-backlog.md
- 10-version-changes.md — сводка v7.2→v7.3

## [2026-10-13T15:30] phase-rt-2 [accepted] — визуал боя: арена 1920×1080,
  Scale.FIT + CENTER_BOTH, rig = контейнер + тело + HP-бар (дочерний).
  Позиции — прямые из BattleState (setPosition(x, y), без маппинга /1000*250),
  groundY = FIELD_GROUND_Y (900), UNIT_SCALE 2 (96×96 → 192 px).
  Текстуры через load.image. Коммит `ced031d`.

## [2026-10-13T15:30] phase-rt-3 [accepted] — параллакс 5 слоёв
  (sceneParallax.ts), низ тайла на y=900, setSpeed из UI (1×/2×/4×).
  Удалены дубли animations.ts/parallax.ts/sprites.ts. Коммит `052e520`.

## [2026-10-13T15:30] phase-rt-4 [accepted] — анимации боя (sceneFx.ts):
  tweenHit (вспышка+тряска), tweenLunge (рывок атакующего), tweenDeath
  (ragdoll), spawnSpark (искра), spawnPopup (число урона/лечения, лимит 10).
  Твины — по rig.body, не по контейнеру. Коммит `b0aa163`.

## [2026-10-13T15:27] phase-rt-1.1 [accepted] — lane-спавн: front ближе
  к врагу (порядок колонн по линии, а не по индексу списка).
  Патч к Фазе 1, отдельный коммит. Коммит `be657be`.

### Git
- `phase-rt-4-accepted` — анимации боя (sceneFx)
- `phase-rt-1.1-accepted` — lane-спавн (патч к Фазе 1)
- `phase-rt-1.5-accepted` — движение (ETAPE 1)
- `phase-rt-1-accepted` — ядро боя (simulateBattleTick)
- `v7.2-accepted` — базовый v7.2
- `v7.2-docs-legalized` — документация

## [2026-10-08T12:31] phase-rt-2 [in progress] — canvas пустой,
  data.dwarves is not iterable, НЕ принято.
  Причина: Phaser сцена получает данные некорректно.
  План: переписать BattleCanvas.tsx + BattleScene.ts
  (см. AGENTS.md, RT Фаза 2).
