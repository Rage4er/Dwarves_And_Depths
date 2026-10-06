// §3.1.8 Headless-симуляция полного забега — для тестов §7 (bun test)
// Никаких Date.now()/Math.random/localStorage — только seed.

import type { Equipment, MetaState, RunNode, RunState } from '../types';
import { mulberry32, randInt, type PRNG } from '../rng';
import { mapDepth, newRun } from './run';
import { createBattle, simulateBattle } from './battle';
import { applyEventChoice } from './events';
import { eventById } from '../data/events';
import { canEquip, dwarfStats, resolveRole } from './stats';
import { forgeCost, itemPower, makeEquipment, rollRarity, rarityUpgrade, defByCatalogId, ITEM_TABLE } from '../data/items';
import { DWARF_TABLE } from '../data/dwarves';
import type { EnemyKind } from '../data/enemies';

export interface RunOptions {
  maxFloors?: number;
}

function headlessMeta(): MetaState {
  return {
    legacy: 0,
    maxSlots: 2,
    maxPartySize: 2,
    smithyLevel: 0,
    offlineBonusPerHour: 0,
    maxFloorEverReached: 1,
    maxDepthEver: 0,
    bossesKilledTotal: 0,
    deadDwarves: [],
    endlessUnlocked: false,
    unlockedDwarves: DWARF_TABLE.map((d) => d.id),
    unlockedEquipment: [],
    lastSeenAt: 0,
    runCount: 0,
    sleepLoot: [],
    skipPrepScreen: false,
  };
}

// §7.5 greedy: надевает лучшие совместимые предметы на всех живых (§3.1.8:
// scripted choices обязаны включать экипировку, иначе баланс не сходится)
function autoEquip(run: RunState, maxSlots: number): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of run.dwarves) {
      if (!d.isAlive) continue;
      const best = run.inventory
        .filter((it) => canEquip(it, d, maxSlots))
        .sort((a, b) => itemPower(b) - itemPower(a))[0];
      if (best) {
        run.inventory = run.inventory.filter((i) => i.id !== best.id);
        d.equipment.push(best);
        d.role = resolveRole({ ...d, equipment: d.equipment });
        changed = true;
      }
    }
  }
}

function battleSeed(run: RunState, node: RunNode, salt: number): number {
  return (run.seed ^ (node.difficulty * 2654435761) ^ (salt * 40503)) >>> 0;
}

function itemScore(item: Equipment): number {
  return itemPower(item);
}

function recruitCopy(dwarfId: string) {
  const def = DWARF_TABLE.find((d) => d.id === dwarfId)!;
  return {
    id: def.id,
    name: def.name,
    baseHP: def.baseHP,
    baseATK: def.baseATK,
    baseDEF: def.baseDEF,
    baseSpeed: def.baseSpeed,
    equipment: [],
    position: 'mid' as const,
    currentHP: def.baseHP,
    isAlive: true,
    speed: def.baseSpeed,
    role: 'any' as const,
    statusEffects: [],
    localSlotBonus: 0,
  };
}

function catalogItem(key: string, rng: PRNG, stageBoost = false): Equipment | null {
  const def = defByCatalogId(key);
  if (!def) return null;
  return makeEquipment(def, stageBoost && def.stage < 3 ? ((def.stage + 1) as 1 | 2 | 3) : def.stage, randInt(rng, 0, 1e9));
}

// жадная политика для headless-баланса (§7: win rate 40–60% на seeds 1..10)
// §3.1.8: scripted choices обязаны включать экипировку, иначе баланс не сходится
export function simulateRun(seed: number, options?: RunOptions): RunState {
  const meta = headlessMeta();
  const rng: PRNG = mulberry32(seed ^ 0x9e3779b9);
  const run = newRun(seed, meta, ['d_brom', 'd_grim']);
  const maxFloors = options?.maxFloors ?? mapDepth(run) + 2;
  let salt = 0;
  let guard = 0;

  const alive = () => run.dwarves.filter((d) => d.isAlive);

  while (run.status === 'active' && run.floor <= maxFloors && guard < 64) {
    guard += 1;
    autoEquip(run, meta.maxSlots);
    const node = run.map.find((n) => n.id === run.currentNodeId);
    if (!node) break;

    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      const battle = createBattle(run.dwarves, (node.data?.enemyIds ?? ['e_rat']) as EnemyKind[], node.difficulty, battleSeed(run, node, salt++));
      const result = simulateBattle(battle);
      for (const c of result.state.allies) {
        const dwarf = run.dwarves.find((d) => d.id === c.uid);
        if (!dwarf) continue;
        if (c.alive) {
          dwarf.currentHP = c.hp;
          dwarf.statusEffects = c.statuses.map((s) => ({ ...s }));
          // §3.3.4: регенерация между боями — 30% missing HP
          const maxHp = dwarfStats(dwarf).hp;
          const missing = maxHp - dwarf.currentHP;
          if (missing > 0) {
            dwarf.currentHP = Math.min(maxHp, dwarf.currentHP + Math.ceil(missing * 0.30));
          }
        } else {
          // §3.1.2: перманентная смерть — экипировка в инвентарь, гном вне отряда
          run.inventory.push(...dwarf.equipment);
          dwarf.equipment = [];
          dwarf.isAlive = false;
          dwarf.currentHP = 0;
        }
      }
      if (result.status === 'won') {
        run.gold += node.rewards.gold;
        if (node.type === 'elite') run.elitesKilled += 1;
        if (node.type === 'boss') {
          run.bossKilled = true;
          run.status = 'victory';
          break;
        }
        // награда: лучший из node.rewards.itemIds (в UI — выбор игрока, §4 экран 5)
        const lootRng = mulberry32(battleSeed(run, node, salt++));
        const candidates = node.rewards.itemIds
          .map((key) => catalogItem(key, lootRng, true))
          .filter((x): x is Equipment => !!x);
        if (candidates.length) {
          candidates.sort((a, b) => itemScore(b) - itemScore(a));
          run.inventory.push(candidates[0]);
        }
      } else {
        run.status = 'defeat';
        break;
      }
      if (alive().length === 0) {
        run.status = 'defeat';
        break;
      }
      advance(run, node);
      continue;
    }

    if (node.type === 'shop') {
      for (const stock of node.data?.shopStock ?? []) {
        if (stock.type === 'dwarf' && run.gold >= stock.price && run.dwarves.length < 10) {
          const owned = new Set(run.dwarves.map((d) => d.id));
          const recruit = DWARF_TABLE.find((d) => !owned.has(d.id));
          if (recruit) {
            run.gold -= stock.price;
            run.dwarves.push(recruitCopy(recruit.id));
          }
        } else if (stock.type === 'equipment' && run.gold >= stock.price) {
          const item = catalogItem(stock.id, rng);
          if (item) {
            run.gold -= stock.price;
            run.inventory.push(item);
          }
        }
      }
      advance(run, node);
      continue;
    }

    if (node.type === 'rest') {
      for (const d of alive()) {
        d.currentHP = dwarfStats(d).hp;
      }
      for (const d of run.dwarves) d.statusEffects = [];
      advance(run, node);
      continue;
    }

    if (node.type === 'forge') {
      if (run.inventory.length && run.gold >= forgeCost(run.inventory[0].rarity)) {
        run.gold -= forgeCost(run.inventory[0].rarity);
        const upgraded = rarityUpgrade(run.inventory[0], rng);
        if (upgraded) run.inventory[0] = upgraded;
      }
      advance(run, node);
      continue;
    }

    if (node.type === 'event') {
      const def = eventById(node.data?.eventId ?? '');
      if (def) {
        let best = def.choices.length - 1;
        let bestScore = -Infinity;
        for (let i = 0; i < def.choices.length; i++) {
          const c = def.choices[i];
          let score = 0;
          if (c.cost?.kind === 'gold') score -= c.cost.amount;
          if (c.reward?.kind === 'gold') score += c.reward.amount;
          if (c.reward?.kind === 'item') score += 12;
          if (c.reward?.kind === 'item_rarity_up') score += run.inventory.length ? 14 : -5;
          if (c.reward?.kind === 'dwarf') score += run.dwarves.length < 4 ? 25 : 0;
          if (c.cost?.kind === 'item') score -= run.inventory.length > 1 ? 4 : 30;
          if (c.cost?.kind === 'hp_all_pct') score -= alive().some((d) => d.currentHP < dwarfStats(d).hp * 0.5) ? 40 : 8;
          if (c.reward?.kind === 'gold_gamble') score += (c.reward.chance * c.reward.win) / 100 - c.reward.stake;
          if (c.reward?.kind === 'item_or_battle') score += (c.reward.chance * 10) / 100 + (1 - c.reward.chance / 100) * -20;
          if (c.reward?.kind === 'hp_all_gamble') {
            score += (c.reward.chance * c.reward.goodPct - (100 - c.reward.chance) * c.reward.badPct) / 3;
          }
          if (c.reward?.kind === 'none') score += 1;
          if (c.disabledIf === 'party_full' && run.dwarves.length >= 10) score = -Infinity;
          if (c.disabledIf === 'inventory_empty' && !run.inventory.length) score = -Infinity;
          if (score > bestScore) { bestScore = score; best = i; }
        }
        const outcome = applyEventChoice(run, def, best, mulberry32(battleSeed(run, node, salt++)));
        if (outcome.replaceWithBattle) {
          const enemyNode: RunNode = {
            ...node,
            type: 'battle',
            rewards: { gold: 10, itemIds: [] },
            data: { enemyIds: ['e_goblin', 'e_rat'] },
          };
          run.map[run.map.indexOf(node)] = enemyNode;
          run.currentNodeId = enemyNode.id;
          continue;
        }
      }
      advance(run, node);
      continue;
    }

    advance(run, node);
  }

  return run;
}

function advance(state: RunState, node: RunNode): void {
  const nextId = node.next[0];
  if (!nextId) {
    if (state.status === 'active') state.status = 'victory';
    return;
  }
  const next = state.map.find((n) => n.id === nextId)!;
  state.currentNodeId = next.id;
  state.floor = next.floor;
}

// Экспорт для тестов баланса
export function runSummary(run: RunState): { status: string; floor: number; gold: number } {
  return { status: run.status, floor: run.floor, gold: run.gold };
}

// Используется тестами баланса: редкость лута соответствует сложности
export function expectedLootRarity(seed: number): string {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  return rollRarity(rng, 5);
}
