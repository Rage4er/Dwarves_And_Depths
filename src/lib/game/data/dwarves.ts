// §6.1 Гномы — 20 именованных (v6.8); разблокировка по §3.3.5

import type { Dwarf, Position, Role } from '../types';

export interface DwarfDef {
  id: string;
  name: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  baseSpeed: number;
  roleBias: Role;
  unlockFloor: number;
}

export const DWARF_TABLE: DwarfDef[] = [
  { id: 'd_brom', name: 'Бром', baseHP: 120, baseATK: 8, baseDEF: 15, baseSpeed: 60, roleBias: 'tank', unlockFloor: 1 },
  { id: 'd_grim', name: 'Грим', baseHP: 100, baseATK: 12, baseDEF: 8, baseSpeed: 80, roleBias: 'warrior', unlockFloor: 1 },
  { id: 'd_thorvin', name: 'Торвин', baseHP: 110, baseATK: 10, baseDEF: 10, baseSpeed: 70, roleBias: 'support', unlockFloor: 3 },
  { id: 'd_bombur', name: 'Бомбур', baseHP: 140, baseATK: 6, baseDEF: 20, baseSpeed: 40, roleBias: 'tank', unlockFloor: 4 },
  { id: 'd_bifur', name: 'Бифур', baseHP: 95, baseATK: 13, baseDEF: 7, baseSpeed: 85, roleBias: 'warrior', unlockFloor: 5 },
  { id: 'd_dvalin', name: 'Двалин', baseHP: 130, baseATK: 7, baseDEF: 18, baseSpeed: 50, roleBias: 'tank', unlockFloor: 6 },
  { id: 'd_bofur_2', name: 'Бофур II', baseHP: 100, baseATK: 15, baseDEF: 5, baseSpeed: 90, roleBias: 'ranged', unlockFloor: 7 },
  { id: 'd_balin', name: 'Балин', baseHP: 115, baseATK: 9, baseDEF: 12, baseSpeed: 75, roleBias: 'support', unlockFloor: 8 },
  { id: 'd_bifur_2', name: 'Бифур II', baseHP: 105, baseATK: 12, baseDEF: 10, baseSpeed: 80, roleBias: 'warrior', unlockFloor: 9 },
  { id: 'd_nori', name: 'Нори', baseHP: 90, baseATK: 14, baseDEF: 6, baseSpeed: 100, roleBias: 'ranged', unlockFloor: 10 },
  { id: 'd_bombur_2', name: 'Бомбур II', baseHP: 125, baseATK: 8, baseDEF: 16, baseSpeed: 55, roleBias: 'tank', unlockFloor: 11 },
  { id: 'd_dwalin_2', name: 'Двалин II', baseHP: 135, baseATK: 7, baseDEF: 19, baseSpeed: 45, roleBias: 'tank', unlockFloor: 12 },
  { id: 'd_dori', name: 'Дори', baseHP: 95, baseATK: 14, baseDEF: 6, baseSpeed: 95, roleBias: 'ranged', unlockFloor: 13 },
  { id: 'd_nori_2', name: 'Нори II', baseHP: 85, baseATK: 15, baseDEF: 5, baseSpeed: 105, roleBias: 'ranged', unlockFloor: 14 },
  { id: 'd_bofur', name: 'Бофур', baseHP: 105, baseATK: 11, baseDEF: 11, baseSpeed: 70, roleBias: 'mage', unlockFloor: 15 },
  { id: 'd_oin', name: 'Оин', baseHP: 120, baseATK: 10, baseDEF: 12, baseSpeed: 65, roleBias: 'warrior', unlockFloor: 16 },
  { id: 'd_gloin', name: 'Глоин', baseHP: 110, baseATK: 11, baseDEF: 11, baseSpeed: 70, roleBias: 'support', unlockFloor: 17 },
  { id: 'd_balin_2', name: 'Балин II', baseHP: 105, baseATK: 13, baseDEF: 9, baseSpeed: 80, roleBias: 'warrior', unlockFloor: 18 },
  { id: 'd_thorin', name: 'Торин', baseHP: 130, baseATK: 12, baseDEF: 14, baseSpeed: 55, roleBias: 'tank', unlockFloor: 19 },
  { id: 'd_fili', name: 'Фили', baseHP: 90, baseATK: 16, baseDEF: 4, baseSpeed: 110, roleBias: 'ranged', unlockFloor: 20 },
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
    role: def.roleBias,
    roleBias: def.roleBias,
    statusEffects: [],
    localSlotBonus: 0,
  };
}

export function makeParty(ids: string[]): Dwarf[] {
  return ids.map((id, i) => makeDwarf(id, i, ids.length));
}

// Линейный порядок для UI (танки вперёд)
export function dwarfSortKey(dwarf: Dwarf): number {
  const idx = LINE_PRIORITY.indexOf(dwarf.roleBias);
  return idx < 0 ? 99 : idx;
}
