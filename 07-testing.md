# §7. Тестирование

> Раздел §7 из ТЗ v7.2 «Гномы и Глубины».

---

## §7.1. Headless-тесты (bun test)

```
bun test — headless-симуляция через simulateRun(seed):

simulateRun.test.ts (seed=42):
1. Детерминизм: simulateRun(42) дважды → JSON diff пустой
2. Инварианты забега: status ≠ 'active', depth = 8 + bossesKilledTotal
3. Элита не встречается два этажа подряд
4. Старт забега: party + 1 предмет каждому, босс в последнем слое
5. NormalizeMeta / NormalizeRun: миграция старых сейвов
6. Награды наследия из событий
7. 66 предметов (§6.2): распределение по слотам
8. 6 слотов (§3.1.6): slotLimit формула
9. Лут 1 из 3 (§3.3.7): itemIds.length === 3 для battle/elite/boss

battle.v69.test.ts (v6.9 эпичный финал):
10. Timeout: endReason корректен (collapse / ancient)
11. hp_regen: cap 3 для гномов, 2 для врагов
12. Бой всегда завершается победой при достаточном regen
```

---

## §7.2. Determinism test

```typescript
import { describe, expect, test } from 'bun:test';
import { simulateRun } from './simulateRun';

describe('determinism', () => {
  test('один и тот же сид → идентичный результат', () => {
    const a = simulateRun(42);
    const b = simulateRun(42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('разные сиды → разные карты глубин', () => {
    const a = simulateRun(1, { maxFloors: 3 });
    const b = simulateRun(2, { maxFloors: 3 });
    expect(JSON.stringify(a.map)).not.toBe(JSON.stringify(b.map));
  });
});
```

---

## §7.3. Agent-критик

React-компоненты → SSR-рендер → HTML-сверка (contrast, touch targets, overflow, grid) → 
чеклист §4.1 → accepted → progress.md.

---

## §7.4. Video acceptance

> Не применяется (Next.js, нет видеозаписи рендеринга).
> Визуальная проверка — скриншоты React-компонентов.

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
