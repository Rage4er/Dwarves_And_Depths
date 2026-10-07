# Progress Log — Гномы и Глубины

## [2026-10-07 14:30] Фаза 2 — визуал боя на Phaser 3 ✅

### Изменения:
- **BattleCanvas.tsx** — React-обёртка над Phaser.Game (клиентский динамический импорт)
- **BattleScene.ts** — Phaser-сцена: спрайты гномов/врагов, параллакс 5 слоёв, HP-бары, march-анимация
- **sprites.ts** — процедурная генерация текстур из art/dwarves.ts и art/enemies.ts (grid → dataURL → Phaser.Textures)
- **parallax.ts** — 5 слоёв параллакса × 3 тира глубины (переиспользует art/backdrop.ts)
- **animations.ts** — tweens: hit bounce, lunge, spark, popup damage/heal, ally/foe death
- **BattleScreen.tsx** — заменён React-рендер юнитов на BattleCanvas (React-HUD сохранён)

### Архитектура:
- Phaser 3 загружается **динамически** (client-only, SSR-safe)
- `createBattleScene(Phaser)` — фабрика сцены, Phaser передаётся как аргумент
- simulateBattleTick **НЕ затрагивается** — детерминизм сохранён
- UI-оверлеи (header, speed, log, end screens) остаются на React
- Текстуры генерируются процедурно из существующей art-системы (grid → dataURL)

### Файлы:
- `src/lib/game/battle/BattleCanvas.tsx` — React-обёртка (~80 строк)
- `src/lib/game/battle/BattleScene.ts` — Phaser-сцена + утилиты (~220 строк)
- `src/lib/game/battle/sprites.ts` — удалено (встроено в BattleScene.ts)
- `src/lib/game/battle/parallax.ts` — URL-ы текстур (~30 строк)
- `src/lib/game/battle/animations.ts` — tweens (~130 строк)
- `src/components/game/BattleScreen.tsx` — заменён canvas-рендер на BattleCanvas

### Тесты:
- ✅ TypeScript: 0 ошибок
- ✅ bun test: 50/50 pass (601 expect)
- ✅ bun run build: compiled successfully
- ✅ Determinism: simulateRun(42) × 2 → diff пустой
- ✅ Balance test: 6/10 wins (60%)

### Известные отклонения:
- Анимации ударов/отскоков/ragdoll реализованы в animations.ts, но ещё не подключены к diff-логике BattleScreen
- Параллакс использует preloaded текстуры, но не обновляет tier при смене этажа
