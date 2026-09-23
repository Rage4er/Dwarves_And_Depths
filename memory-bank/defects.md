# Defects Log

*Format: `[timestamp] [severity] [phase]` — description + justification + resolution*

## Severity Levels

- **BLOCKER**: Phase stop required (§0 стоп-фраза), budget exceeded, stack violation
- **CRITICAL**: Core functionality broken, test failure
- **MEDIUM**: Non-critical bug, workaround exists
- **MINOR**: Cosmetic issue, documentation gap

---

## Defects Log

[2025-06-18T12:00:00Z] [BLOCKER] [phase-1] Тихое упрощение контракта типов:
- Удалён interface Enemy (§2.3 ТЗ)
- Удалено поле `round` из interface BattleState (§3.1, лимит ходов)
- Interface Dwarf упрощён с 13 полей до 6 (удалены: equipment, roleBias, localSlotBonus, statusEffects, rarity, level, exp, speed, defense, attack, isHero, slot)
- Поле `role` изменено с типа `Role` на `string`
- Причина: агент попытался "исправить TS-ошибки в тесте" путём упрощения типов, вместо реализации полного контракта §2.3. Это нарушает стоп-фразу §0 (запрет на упрощение DoD и контрактов).
- Решение: выполнен откат к phase-0-bootstrap. types.ts переписан строго по §2.3 ТЗ (все интерфейсы, все поля). Тест переписан под полный контракт.
- Статус: RESOLVED (откат + фиксация)
