# Progress Log — Гномы и Глубины

## [2026-10-06 11:49] v7.2 — 6 слотов, 66 предметов, 1 из 3 лут

### Изменения:
- **Slot type**: +head, +ring (6 типов: weapon, armor, head, trinket, rune, ring)
- **FlexibleSlot**: trinket | rune | ring
- **SLOT_ORDER**: weapon > armor > head > trinket > rune > ring
- **maxSlots**: 4 базовых + 0→2 через Кузницу (ур.0=4, ур.1=5, ур.2=6)
- **slotLimit**: формула 4 + maxSlots + min(1, extra_slot_count) — макс 7 с mithril_beard
- **Предметы**: 24 → 66 (weapon 20, armor 12, head 10, trinket 12, rune 8, ring 4)
- **Лут**: battle/elite/boss узлы генерируют 3 варианта вместо 2
- **Экран 5**: заголовок «Выбери 1 из 3»
- **randomItemDef**: slot weights включают head и ring

### Файлы:
- `src/lib/game/types.ts` — Slot, FlexibleSlot, SLOT_ORDER, SLOT_NAME, EquipSlots
- `src/lib/game/data/items.ts` — ITEM_TABLE 66 предметов, randomItemDef slot weights
- `src/lib/game/logic/stats.ts` — slotLimit формула v7.2
- `src/lib/game/logic/run.ts` — battle лут 3 itemIds
- `src/lib/game/store.tsx` — maxSlots 4 (DEFAULT_META)
- `src/lib/game/data/smithy.ts` — maxSlots effectPerLevel, maxLevel 1
- `src/components/game/OtherScreens.tsx` — RewardScreen заголовок
- `src/lib/game/logic/simulateRun.test.ts` — 5 новых тестов v7.2

### Тесты:
- ✅ TypeScript: 0 ошибок
- ✅ bun test: 30/30 (169 expect)
- ⚠️ Balance test: 1/10 wins (10%) — вне коридора 40-60%
- ✅ Determinism test: PASS

### Известные отклонения:
- Balance test ниже коридора — требует донастройки формул боя (§6.4)
