# REALTIME-PHASE-2-HANDOFF

> Точка входа для нового агента. Продолжаем реалтайм-бой, Фаза 2.
> Сессия перезапущена из-за ошибок инструмента Write/Edit.

---

## Статус

| Фаза | Статус | Тег |
|---|---|---|
| v7.2 (базовая) | ✅ | v7.2-accepted |
| RT Фаза 1 (ядро боя) | ✅ | phase-rt-1-accepted |
| RT Фаза 2 (визуал боя) | 🔄 в работе | — |
| RT Фаза 3 (баланс) | ⏳ ждёт | — |
| RT Фаза 4 (DoD) | ⏳ ждёт | — |

**Последний коммит:** b42ff47 (timeElapsed fix)

---

## Что делать

**Задача:** Фаза 2 — визуал боя на Phaser 3.

**НЕ начинать с §0.2 bootstrap** (это для пустой папки).

**Читать перед работой:**
1. `PROMPT.md` — ТЗ v7.2, §0.7 про работу с файлами
2. `index.md` — навигация по ТЗ
3. `memory-bank/progress.md` — журнал
4. `memory-bank/realtime-battle-plan.md` — план реалтайма
5. Этот файл

---

## Решение по стеку (зафиксировано)

- **Phaser 3** для экрана 4 (бой)
- **React** для UI-экранов 1-3, 5-9
- §2.1 ТЗ обновить: Next.js + React для UI, Phaser 3 для боя
- НЕ использовать raw Canvas 2D

---

## Задача Фазы 2

1. `BattleCanvas.tsx` — React-обёртка над `Phaser.Game`
2. `BattleScene.ts` — Phaser-сцена (спрайты, параллакс, update loop)
3. Анимации по §5.3: отскоки, ragdoll, удары
4. Параллакс 5 слоёв по §5.2.1
5. HUD (React-оверлей): этаж, HP-бары, враги X/Y
6. Детерминизм: Phaser НЕ влияет на `simulateBattleTick`

---

## Приёмка Фазы 2

- [ ] `BattleCanvas.tsx` с `Phaser.Game`
- [ ] Гномы визуально бегут (x растёт)
- [ ] Враги визуально бегут (x убывает)
- [ ] Отскоки работают при ударах
- [ ] Ragdoll при смерти
- [ ] Параллакс 5 слоёв
- [ ] HUD: этаж, HP, враги X/Y
- [ ] FPS ≥ 60 desktop, ≥ 30 mobile
- [ ] Детерминизм: `simulateRun(42)` × 2 → diff пустой
- [ ] Скриншот боя (гномы в движении)
- [ ] Видео 5-10 сек
- [ ] `tsc --noEmit` — 0 ошибок
- [ ] `bun test` — все pass
- [ ] git tag `phase-rt-2-accepted`

---

## ⚠️ §0.7 — работа с файлами (обязательно)

- **Write ≤ 200 строк / ≤ 8 КБ**
- **Edit ≤ 50 строк / ≤ 2 КБ**
- Если больше — разбить на N частей
- Если Write/Edit падает — Bash fallback (`cat > file << EOF`)
- Разбивать большие файлы на модули:
  - `BattleCanvas.tsx` (50 строк)
  - `BattleScene.ts` (150 строк)
  - `animations.ts` (100 строк)
  - `parallax.ts` (80 строк)
  - `sprites.ts` (100 строк)

---

## Что НЕ делать

- Не начинать с §0.2 bootstrap
- Не использовать raw Canvas 2D
- Не переписывать UI на Phaser
- Не давать Phaser влиять на `simulateBattleTick`
- Не начинать Фазу 3, пока Фаза 2 не принята
- Не вызывать Write/Edit на больших объёмах (§0.7)

---

## Git

```bash
git log --oneline -5
# b42ff47 fix: timeElapsed += dt до early return
# dc228c5 test: fix battle.rt.test.ts
# ... 

git tag | grep phase-rt
# phase-rt-1-accepted