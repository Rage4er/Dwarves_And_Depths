// §6.1 Гномы — 20 именованных (v6.8); разблокировка по §3.3.5

import type { Dwarf, Position, Role } from '../types';

export interface DwarfDef {
  id: string;
  name: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  baseSpeed: number;
  unlockFloor: number;
}

export const DWARF_TABLE: DwarfDef[] = [
  { id: 'd_brom', name: 'Бром', baseHP: 120, baseATK: 8, baseDEF: 15, baseSpeed: 60, unlockFloor: 1 },
  { id: 'd_grim', name: 'Грим', baseHP: 100, baseATK: 12, baseDEF: 8, baseSpeed: 80, unlockFloor: 1 },
  { id: 'd_thorvin', name: 'Торвин', baseHP: 110, baseATK: 10, baseDEF: 10, baseSpeed: 70, unlockFloor: 3 },
  { id: 'd_bombur', name: 'Бомбур', baseHP: 140, baseATK: 6, baseDEF: 20, baseSpeed: 40, unlockFloor: 4 },
  { id: 'd_bifur', name: 'Бифур', baseHP: 95, baseATK: 13, baseDEF: 7, baseSpeed: 85, unlockFloor: 5 },
  { id: 'd_dvalin', name: 'Двалин', baseHP: 130, baseATK: 7, baseDEF: 18, baseSpeed: 50, unlockFloor: 6 },
  { id: 'd_bofur_2', name: 'Бофур II', baseHP: 100, baseATK: 15, baseDEF: 5, baseSpeed: 90, unlockFloor: 7 },
  { id: 'd_balin', name: 'Балин', baseHP: 115, baseATK: 9, baseDEF: 12, baseSpeed: 75, unlockFloor: 8 },
  { id: 'd_bifur_2', name: 'Бифур II', baseHP: 105, baseATK: 12, baseDEF: 10, baseSpeed: 80, unlockFloor: 9 },
  { id: 'd_nori', name: 'Нори', baseHP: 90, baseATK: 14, baseDEF: 6, baseSpeed: 100, unlockFloor: 10 },
  { id: 'd_bombur_2', name: 'Бомбур II', baseHP: 125, baseATK: 8, baseDEF: 16, baseSpeed: 55, unlockFloor: 11 },
  { id: 'd_dwalin_2', name: 'Двалин II', baseHP: 135, baseATK: 7, baseDEF: 19, baseSpeed: 45, unlockFloor: 12 },
  { id: 'd_dori', name: 'Дори', baseHP: 95, baseATK: 14, baseDEF: 6, baseSpeed: 95, unlockFloor: 13 },
  { id: 'd_nori_2', name: 'Нори II', baseHP: 85, baseATK: 15, baseDEF: 5, baseSpeed: 105, unlockFloor: 14 },
  { id: 'd_bofur', name: 'Бофур', baseHP: 105, baseATK: 11, baseDEF: 11, baseSpeed: 70, unlockFloor: 15 },
  { id: 'd_oin', name: 'Оин', baseHP: 120, baseATK: 10, baseDEF: 12, baseSpeed: 65, unlockFloor: 16 },
  { id: 'd_gloin', name: 'Глоин', baseHP: 110, baseATK: 11, baseDEF: 11, baseSpeed: 70, unlockFloor: 17 },
  { id: 'd_balin_2', name: 'Балин II', baseHP: 105, baseATK: 13, baseDEF: 9, baseSpeed: 80, unlockFloor: 18 },
  { id: 'd_thorin', name: 'Торин', baseHP: 130, baseATK: 12, baseDEF: 14, baseSpeed: 55, unlockFloor: 19 },
  { id: 'd_fili', name: 'Фили', baseHP: 90, baseATK: 16, baseDEF: 4, baseSpeed: 110, unlockFloor: 20 },
];

export function dwarfDef(id: string): DwarfDef {
  const def = DWARF_TABLE.find((d) => d.id === id);
  if (!def) throw new Error(`Unknown dwarf: ${id}`);
  return def;
}

export function unlockedDwarfIds(maxFloor: number): string[] {
  return DWARF_TABLE.filter((d) => d.unlockFloor <= maxFloor).map((d) => d.id);
}

// Расстановка по линиям (§3.1 формация): танки и воины вперёд
const LINE_PRIORITY: Role[] = ['tank', 'warrior', 'support', 'ranged', 'mage'];

export function assignPosition(index: number, total: number): Position {
  const perLine = Math.max(1, Math.ceil(total / 3));
  return index < perLine ? 'front' : index < perLine * 2 ? 'mid' : 'back';
}

export function makeDwarf(id: string, positionIndex = 0, partySize = 1): Dwarf {
  const def = dwarfDef(id);
  return {
    id: def.id,
    name: def.name,
    baseHP: def.baseHP,
    baseATK: def.baseATK,
    baseDEF: def.baseDEF,
    baseSpeed: def.baseSpeed,
    equipment: [],
    position: assignPosition(positionIndex, partySize),
    currentHP: def.baseHP,
    isAlive: true,
    speed: def.baseSpeed,
    role: 'any',
    statusEffects: [],
    localSlotBonus: 0,
  };
}

export function makeParty(ids: string[]): Dwarf[] {
  return ids.map((id, i) => makeDwarf(id, i, ids.length));
}

// Линейный порядок для UI (танки вперёд)
export function dwarfSortKey(dwarf: Dwarf): number {
  const idx = LINE_PRIORITY.indexOf(dwarf.role as Exclude<Role, 'any'>);
  return idx < 0 ? 99 : idx;
}
