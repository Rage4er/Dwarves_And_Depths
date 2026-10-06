// §3.1.3 Статистика гнома: base + equip; роль по приоритету слотов

import type { Dwarf, Equipment, Effect, Role, Slot } from '../types';
import { SLOT_ORDER } from '../types';

export interface DwarfStats {
  hp: number;
  atk: number;
  def: number;
}

export function equipmentOf(dwarf: Dwarf): Equipment[] {
  return dwarf.equipment;
}

// §3.1.3: weapon > armor > trinket > rune; role 'any' пропускается;
// ничего не найдено → 'any' (гном без роли)
export function resolveRole(dwarf: Dwarf): Role {
  for (const slot of SLOT_ORDER) {
    const item = dwarf.equipment.find((e) => e.slot === slot);
    if (item && item.role !== 'any') return item.role;
  }
  return 'any';
}

export function dwarfStats(dwarf: Dwarf): DwarfStats {
  let hp = dwarf.baseHP;
  let atk = dwarf.baseATK;
  let def = dwarf.baseDEF;
  for (const item of dwarf.equipment) {
    hp += item.hp;
    atk += item.atk;
    def += item.def;
  }
  return { hp: Math.max(1, hp), atk, def: Math.max(0, def) };
}

export function maxHP(dwarf: Dwarf): number {
  return dwarfStats(dwarf).hp;
}

// §3.1.6 v7.2: 4 базовых + smithy maxSlots (0→1→2) + localSlotBonus(extra_slot, макс 1)
// Итого: Ур.0 = 4, Ур.1 = 5, Ур.2 = 6, + mithril_beard = 7
export function slotLimit(dwarf: Dwarf, maxSlots: number): number {
  const extras = dwarf.equipment.filter((e) =>
    e.effects.some((eff) => eff.type === 'extra_slot'),
  ).length;
  return 4 + maxSlots + Math.min(1, extras);
}

export function canEquip(item: Equipment, dwarf: Dwarf, maxSlots: number): boolean {
  const sameSlot = dwarf.equipment.filter((e) => e.slot === item.slot).length;
  if (sameSlot > 0) return false;
  return dwarf.equipment.length < slotLimit(dwarf, maxSlots);
}

export function equipEffects(dwarf: Dwarf): Effect[] {
  return dwarf.equipment.flatMap((e) => e.effects);
}

// Слот для UI-подсказок
export function slotOfItem(item: Equipment): Slot {
  return item.slot;
}
