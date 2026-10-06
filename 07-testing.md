# §7. Тестирование

> Раздел §7 из ТЗ v7.2 «Гномы и Глубины».

---

## §7.1. Headless-тесты

```
§7.1 НЕ применяется до завершения Фазы 2.

tutorial-run.spec.ts (seed=42):
1. Кузница (скрин)
2. Выбор отряда → Бром + Грим (скрин)
3. Экипировка → drag&drop (скрин)
4. Бой 1 → непрерывный поток врагов (скрин + FPS)
5. После победы: экран Награды → Карта забега → возврат в Кузницу
6. Закрытие → reopen через Date.now() + 3600000 → offline проверен
7. 0 console errors
8. FPS ≥ 30 на viewport 667×375

Дополнительно (v6.7):
9. Финальный босс доступен после 5+ побед
10. Бесконечный режим открывается
11. Воскрешение в бесконечном режиме
```

---

## §7.2. Determinism test

```typescript
test('determinism', async () => {
  const run1 = simulateRun(42);
  const run2 = simulateRun(42);
  expect(run1).toEqual(run2);
});
```

---

## §7.3. Agent-критик

Скрины → автопроверка (contrast, touch targets, overflow, grid) → 
чеклист §4.1 → accepted → progress.md.

---

## §7.4. Video acceptance

```typescript
import { getVideoDurationInSeconds } from 'get-video-duration';
import fs from 'node:fs';

const videoPath = await page.video()?.path();
if (!videoPath) throw new Error('No video');

const duration = await getVideoDurationInSeconds(videoPath);
expect(duration).toBeGreaterThanOrEqual(180);
expect(duration).toBeLessThanOrEqual(360);

const size = fs.statSync(videoPath).size;
expect(size).toBeGreaterThan(1_000_000);
```

---

## §7.5. Balance test

```
aiPolicy: 'greedy':
  1. Highest rarity item
  2. Использовать автоматическую сортировку §3.1.1
  3. В событиях — max expected value
  4. В shop — если gold ≥ цена
  5. В rest — heal, если avg HP < 60%

Прогон: simulateRun(seed, {aiPolicy:'greedy'}) для seed = 1..10.

Acceptance:
- Win rate: 40–60%
- Battle difficulty: 0.8–1.2 (для 80% боёв)
- Средний бой: 15–30 сек (обычный), 35–55 (босс)
- Смертность гномов: 30–50% за забег

Логирование в progress.md:
- Средний battleDifficulty
- Средний TTK на бой
- Боёв с difficulty > 1.2: < 10%

Дополнительно:
- Проверить: 20 гномов разблокируются за 15-20 забегов
- Проверить: финальный босс достижим за 20-30 забегов
- Проверить: бесконечный режим — depth 100 достижим
```
