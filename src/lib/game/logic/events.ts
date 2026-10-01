// Интерпретатор событий §6.5 — чистый (store и simulateRun делят его)

import type { Equipment, RunState, Dwarf } from '../types';
import type { PRNG } from '../rng';
import { pick, randInt } from '../rng';
import type { EventDef } from '../data/events';
import { DWARF_TABLE } from '../data/dwarves';
import { ITEM_TABLE, makeEquipment, rarityUpgrade } from '../data/items';

export interface EventOutcome {
  run: RunState;
  message: string;
  replaceWithBattle: boolean;
}

function firstInventoryItem(run: RunState): Equipment | null {
  return run.inventory[0] ?? null;
}

function removeInventoryItem(run: RunState, id: string): void {
  run.inventory = run.inventory.filter((it) => it.id !== id);
}

function randomUnownedDwarf(rng: PRNG, run: RunState): Dwarf | null {
  const owned = new Set(run.dwarves.map((d) => d.id));
  const pool = DWARF_TABLE.filter((d) => !owned.has(d.id));
  if (!pool.length) return null;
  const def = pick(rng, pool);
  return {
    id: def.id,
    name: def.name,
    baseHP: def.baseHP,
    baseATK: def.baseATK,
    baseDEF: def.baseDEF,
    baseSpeed: def.baseSpeed,
    equipment: [],
    position: 'mid',
    currentHP: def.baseHP,
    isAlive: true,
    speed: def.baseSpeed,
    role: def.roleBias,
    roleBias: def.roleBias,
    statusEffects: [],
    localSlotBonus: 0,
  };
}

function randomItemForRun(rng: PRNG, run: RunState, rarity?: string): Equipment {
  const pool = rarity
    ? ITEM_TABLE.filter((d) => d.rarity === rarity)
    : ITEM_TABLE.filter((d) => d.rarity === 'common');
  const def = pick(rng, pool.length ? pool : ITEM_TABLE);
  return makeEquipment(def, 1, randInt(rng, 0, 1e9));
}

export function applyEventChoice(
  run0: RunState,
  def: EventDef,
  choiceIndex: number,
  rng: PRNG,
): EventOutcome {
  const run = structuredClone(run0);
  const choice = def.choices[choiceIndex];
  const messages: string[] = [];
  let replaceWithBattle = false;

  const partyAlive = run.dwarves.filter((d) => d.isAlive);
  if (partyAlive.length === 0) {
    return { run, message: 'Отряд пал. Забег окончен.', replaceWithBattle: false };
  }

  // ── стоимость ──
  if (choice.cost) {
    const c = choice.cost;
    if (c.kind === 'gold') {
      if (run.gold < c.amount) return { run: run0, message: 'Недостаточно золота.', replaceWithBattle: false };
      run.gold -= c.amount;
      messages.push(`−${c.amount} золота`);
    } else if (c.kind === 'hp_all_pct') {
      for (const d of run.dwarves) {
        if (!d.isAlive) continue;
        d.currentHP = Math.max(1, d.currentHP - Math.ceil((d.baseHP + d.equipment.reduce((s, e) => s + e.hp, 0)) * c.pct / 100));
      }
      messages.push(`отряд теряет ${c.pct}% HP`);
    } else if (c.kind === 'item') {
      for (let i = 0; i < c.count; i++) {
        const item = firstInventoryItem(run);
        if (!item) break;
        removeInventoryItem(run, item.id);
      }
      messages.push('предмет передан');
    }
  }

  // ── награда ──
  const reward = choice.reward;
  if (reward) {
    switch (reward.kind) {
      case 'item': {
        const item = randomItemForRun(rng, run, reward.rarity);
        run.inventory.push(item);
        messages.push(`получено: ${item.name}`);
        break;
      }
      case 'item_rarity_up': {
        const item = firstInventoryItem(run);
        if (item) {
          const upgraded = rarityUpgrade(item, rng);
          if (upgraded) {
            removeInventoryItem(run, item.id);
            run.inventory.push(upgraded);
            messages.push(`${upgraded.name} улучшен до ${upgraded.rarity}`);
          } else {
            messages.push('предмет уже максимальной редкости');
          }
        }
        break;
      }
      case 'gold': {
        run.gold += reward.amount;
        messages.push(`+${reward.amount} золота`);
        break;
      }
      case 'gold_gamble': {
        if (run.gold >= reward.stake) {
          if (rng() * 100 < reward.chance) {
            run.gold += reward.win - reward.stake;
            messages.push(`Удача! +${reward.win - reward.stake} золота`);
          } else {
            run.gold = Math.max(0, run.gold - reward.stake);
            messages.push(`Мимо. −${reward.stake} золота`);
          }
        }
        break;
      }
      case 'dwarf': {
        const recruit = randomUnownedDwarf(rng, run);
        if (recruit) {
          run.dwarves.push(recruit);
          messages.push(`${recruit.name} присоединяется к отряду!`);
        } else {
          messages.push('Нового гнома не нашлось.');
        }
        break;
      }
      case 'legacy': {
        run.bonusLegacy += reward.amount;
        messages.push(`+${reward.amount} наследия (учтено при подведении итогов)`);
        break;
      }
      case 'hp_all_gamble': {
        if (rng() * 100 < reward.chance) {
          for (const d of run.dwarves) {
            if (!d.isAlive) continue;
            const max = d.baseHP + d.equipment.reduce((s, e) => s + e.hp, 0);
            d.currentHP = Math.min(max, d.currentHP + Math.ceil(max * reward.goodPct / 100));
          }
          messages.push(`Отряд восстанавливает ${reward.goodPct}% HP`);
        } else {
          for (const d of run.dwarves) {
            if (!d.isAlive) continue;
            const max = d.baseHP + d.equipment.reduce((s, e) => s + e.hp, 0);
            d.currentHP = Math.max(1, d.currentHP - Math.ceil(max * reward.badPct / 100));
          }
          messages.push(`Грибы оказались ядовиты: −${reward.badPct}% HP`);
        }
        break;
      }
      case 'item_or_battle': {
        if (rng() * 100 < reward.chance) {
          const item = randomItemForRun(rng, run, reward.rarity);
          run.inventory.push(item);
          messages.push(`Пленник отдаёт: ${item.name}`);
        } else {
          messages.push('Пленник оказался обманщиком — бой!');
          replaceWithBattle = true;
        }
        break;
      }
      case 'none':
        messages.push('Вы уходите.');
        break;
    }
  }

  return { run, message: messages.join(' · ') || 'Ничего не произошло.', replaceWithBattle };
}
