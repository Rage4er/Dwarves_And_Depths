// §6.6 Встроенные синергии — формат ТЗ (condition/effect), стакаются

import type { Position, Role, Tag } from '../types';

export type SynergyCondition =
  | { type: 'count_role'; role: Role; count: number; line?: Position }
  | { type: 'count_tag'; tag: Tag; count: number }
  | { type: 'combo'; roles: Role[]; sameLine: boolean };

export type SynergyEffect =
  | { type: 'buff_atk'; value: number; target: 'all' | Role }
  | { type: 'buff_def'; value: number; target: 'all' | Role }
  | { type: 'buff_spd'; value: number; target: 'all' | Role }
  | { type: 'buff_hp'; value: number; target: 'all' | Role };

export interface SynergyDef {
  id: string;
  name: string;
  condition: SynergyCondition;
  effect: SynergyEffect;
}

export const SYNERGY_DEFS: SynergyDef[] = [
  {
    id: 'syn_wall',
    name: 'Стена',
    condition: { type: 'count_role', role: 'tank', count: 2, line: 'front' },
    effect: { type: 'buff_def', value: 20, target: 'tank' },
  },
  {
    id: 'syn_volley',
    name: 'Залп',
    condition: { type: 'count_role', role: 'ranged', count: 2, line: 'back' },
    effect: { type: 'buff_atk', value: 15, target: 'ranged' },
  },
  {
    id: 'syn_fury',
    name: 'Ярость',
    condition: { type: 'combo', roles: ['warrior', 'mage'], sameLine: true },
    effect: { type: 'buff_atk', value: 25, target: 'warrior' },
  },
  {
    id: 'syn_forge',
    name: 'Кузня',
    condition: { type: 'count_tag', tag: 'metal', count: 3 },
    effect: { type: 'buff_atk', value: 10, target: 'all' },
  },
];

export interface SynergyCheck {
  partyRoles: { role: Role; position: Position }[];
  partyTags: Tag[];
}

export interface SynergyResult {
  active: SynergyDef[];
  // множители, применяемые к роли / всему отряду (value из §6.6 = %)
  atkMultByRole: Partial<Record<Role, number>>;
  defMultByRole: Partial<Record<Role, number>>;
  spdMultByRole: Partial<Record<Role, number>>;
  atkMultAll: number;
}

const EMPTY: SynergyResult = {
  active: [],
  atkMultByRole: {},
  defMultByRole: {},
  spdMultByRole: {},
  atkMultAll: 1,
};

export function evaluateSynergies(check: SynergyCheck): SynergyResult {
  const active: SynergyDef[] = [];
  const atkMultByRole: Partial<Record<Role, number>> = {};
  const defMultByRole: Partial<Record<Role, number>> = {};
  const spdMultByRole: Partial<Record<Role, number>> = {};
  let atkMultAll = 1;

  const push = (def: SynergyDef) => {
    active.push(def);
    const { effect } = def;
    const mult = 1 + effect.value / 100;
    if (effect.type === 'buff_atk') {
      if (effect.target === 'all') atkMultAll *= mult;
      else atkMultByRole[effect.target] = (atkMultByRole[effect.target] ?? 1) * mult;
    } else if (effect.type === 'buff_def') {
      if (effect.target !== 'all') defMultByRole[effect.target] = (defMultByRole[effect.target] ?? 1) * mult;
    } else if (effect.type === 'buff_spd') {
      if (effect.target !== 'all') spdMultByRole[effect.target] = (spdMultByRole[effect.target] ?? 1) * mult;
    }
  };

  for (const def of SYNERGY_DEFS) {
    const c = def.condition;
    if (c.type === 'count_role') {
      const hit = check.partyRoles.filter(
        (p) => p.role === c.role && (!c.line || p.position === c.line),
      );
      if (hit.length >= c.count) push(def);
    } else if (c.type === 'count_tag') {
      if (check.partyTags.filter((t) => t === c.tag).length >= c.count) push(def);
    } else if (c.type === 'combo') {
      const lines: Position[] = ['front', 'mid', 'back'];
      for (const line of lines) {
        const inLine = check.partyRoles.filter((p) => p.position === line);
        if (c.roles.every((r) => inLine.some((p) => p.role === r))) {
          push(def);
          break;
        }
      }
    }
  }

  return { active, atkMultByRole, defMultByRole, spdMultByRole, atkMultAll };
}

export { EMPTY as EMPTY_SYNERGIES };
