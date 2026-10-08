# Progress Log — Гномы и Глубины

## [2026-10-07 16:36] v7.3-backlog [created]
- memory-bank/v7.3-backlog.md — генератор + подготовка к 3D
- 09-checklist.md — §9.4 DoD v7.3 (черновик)
- index.md — ссылка на v7.3-backlog.md
- 10-version-changes.md — сводка v7.2→v7.3

## [2026-10-07 16:36] v7.2 [in progress] — Фаза 2 (Phaser canvas)

## [2026-10-07 15:00] Фаза 2 — приёмка с доказательствами ✅

### Скриншоты (11 штук в screenshots/phase-rt-2/)
| # | Файл | Описание |
|---|------|----------|
| 1 | 00-page-loaded.png | Таверна (первая загрузка) |
| 2 | 00-tavern.png | Таверна (работая версия) |
| 3 | 01-party-select.png | Выбор отряда |
| 4 | 01-battle-start.png | Сразу после [В бой] |
| 5 | 02-battle-mid.png | Через 5 сек боя |
| 6 | 02-continue-run.png | Карта (продолжение забега) |
| 7 | 02-map-or-battle.png | Карта с узлом боя |
| 8 | 03-battle-hit.png | Момент удара |
| 9 | 04-battle-death.png | Поздний бой (смерти) |
| 10 | 05-battle-end.png | ПОБЕДА — "Глубины отступают" |
| 11 | 06-mobile-view.png | Mobile 667×375 |

### FPS-лог (5.5 сек measurement)
- **Desktop 1920×1080:** 68.4 FPS (376 frames)
- **Mobile 667×375:** 68.2 FPS (375 frames)
- Оба значения выше требования ≥60 desktop / ≥30 mobile

### Diff BattleScreen.tsx
- Удалено: -75 строк (React-рендер юнитов, параллакс-дивы, Ancient)
- Добавлено: +8 строк (BattleCanvas wrapper)
- Сохранено: React-HUD (header, speed, log, end screens, warning overlay)

### BattleCanvas.tsx — StrictMode safety
- ✅ `gameRef.current` guard — предотвращает двойной mount
- ✅ `gameInstance.destroy(true)` в cleanup
- ✅ `useEffect(() => {...}, [])` — один раз при монтировании
- ✅ Второй useEffect — обновление battle state при смене seed/floor

### art/dwarves.ts API
```
dwarfGrid("d_brom", "tank")  → Grid 32×32
gridToDataUrl(grid, 3, key)  → "data:image/png;base64,..."
Phaser.Textures.addBase64(key, url) → текстура готова
```

### Приёмка Фазы 2 — все критерии ✅
- [x] 5 скриншотов в screenshots/phase-rt-2/ (11 штук)
- [x] FPS-лог: Desktop 68.4, Mobile 68.2
- [x] Полный diff BattleScreen.tsx
- [x] BattleCanvas.tsx: mounted + destroy + StrictMode
- [x] art/dwarves.ts API показан
- [x] tsc 0 errors
- [x] bun test: 50/50 pass (601 expect)
- [x] bun run build: compiled successfully
- [x] git tag phase-rt-2-accepted

### Git
- `phase-rt-1-accepted` — ядро боя (simulateBattleTick)
- `phase-rt-2-accepted` — визуал боя (Phaser 3 canvas)
- Коммиты: a399aac (feat), 513856f (docs acceptance)
