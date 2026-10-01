'use client';

// §2.6 Персистентность: dnd_meta_v1 / dnd_run_v1
// §3.2 Idle-слой: offline-наследие, сон кузницы, авто-механики по runCount 3/5/7
// §3.3.5.1 Разблокировки при входе на узел, §3.3.6 unlock экипировки
// §3.1.2 Перманентная смерть: экипировка павшего → инвентарь

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type {
  AutoEquipTemplate, BattleEndReason, BattleState, Dwarf, Equipment, EquipSlots, MetaState, Position,
  RunNode, RunState, ScreenId, Slot,
} from './types';
import type { PRNG } from './rng';
import { mulberry32, pick, randInt, weighted } from './rng';
import { ENDLESS_BONUS_LEGACY, ENDLESS_MAX_DEPTH, extendMapEndless, legacyGain, mapDepth, newRun, nodeById } from './logic/run';
import { createBattle } from './logic/battle';
import { canEquip, dwarfStats, maxHP, resolveRole } from './logic/stats';
import type { EnemyKind } from './data/enemies';
import { applyEventChoice } from './logic/events';
import {
  DWARF_TABLE, SMITHY_UPGRADES, assignPosition, defByCatalogId, defaultUnlockedEquipment,
  eventById, forgeCost, itemPower, makeDwarf, makeEquipment, purchaseUpgrade,
  rarityUpgrade, sellPrice, unlockedDwarfIds,
} from './data';
import { ITEM_TABLE, rollItemStage, type ItemDef } from './data/items';

type TemplateSlot = Exclude<Slot, 'rune'>;

export const META_KEY = 'dnd_meta_v1';
export const RUN_KEY = 'dnd_run_v1';

const INVENTORY_CAP = 100; // §2.7: авто-продажа при переполнении
const OFFLINE_HOURS_CAP = 8; // §3.2: Δ capped на 8 часов
const AUTO_BATTLE_RUNS = 3; // §3.2: runCount ≥ 3
const AUTO_REPEAT_RUNS = 5; // §3.2: runCount ≥ 5
const AUTO_EQUIP_RUNS = 7; // §3.2: runCount ≥ 7
const SHOP_PARTY_CAP = 10; // §3.3.2: наём, пока партия < 10

export interface Toast {
  id: number;
  text: string;
}

export interface OfflineReport {
  legacy: number;
  items: number;
}

export interface GameState {
  meta: MetaState;
  run: RunState | null;
  screen: ScreenId;
  battle: BattleState | null;
  eventResult: string | null;
  deathNames: string[];
  rewardOptions: Equipment[];
  toasts: Toast[];
  toastId: number;
  offline: OfflineReport | null;
  loaded: boolean;
  partyEndless: boolean; // v6.8: выбран «Бесконечный спуск» в меню → START_RUN в бесконечном режиме
}

// §2.3: стартовые значения меты — Бром и Грим открыты (unlockFloor 1)
export const DEFAULT_META: MetaState = {
  legacy: 0,
  maxSlots: 2,
  maxPartySize: 2,
  smithyLevel: 0,
  offlineBonusPerHour: 0,
  maxFloorEverReached: 1,
  maxDepthEver: 0, // v6.8
  bossesKilledTotal: 0, // v6.8
  deadDwarves: [], // v6.8
  endlessUnlocked: false, // v6.8
  unlockedDwarves: DWARF_TABLE.filter((d) => d.unlockFloor <= 1).map((d) => d.id),
  unlockedEquipment: defaultUnlockedEquipment(),
  runCount: 0,
  unlocks: { autoBattle: false, autoRepeat: false, autoEquip: false },
  autoEquipTemplate: undefined,
  sleepLoot: [],
  lastSeenAt: 0,
};

type Action =
  | { type: 'HYDRATE'; meta: MetaState; run: RunState | null; offline: OfflineReport | null }
  | { type: 'START_RUN'; partyIds: string[]; seed: number; now: number }
  | { type: 'OPEN_PARTY'; endless?: boolean }
  | { type: 'CONTINUE_ENDLESS' }
  | { type: 'GOTO'; screen: ScreenId }
  | { type: 'CHOOSE_NODE'; nodeId: string }
  | { type: 'START_BATTLE' }
  | { type: 'BATTLE_FINISH'; state: BattleState }
  | { type: 'DEATH_CONTINUE' }
  | { type: 'REWARD_PICK'; index: number }
  | { type: 'TEMPLATE_SLOT'; role: keyof AutoEquipTemplate; slot: TemplateSlot }
  | { type: 'EVENT_CHOICE'; index: number }
  | { type: 'EVENT_CONTINUE' }
  | { type: 'BUY'; index: number }
  | { type: 'REST_CHOICE'; index: number }
  | { type: 'FORGE'; itemId: string }
  | { type: 'LEAVE_NODE' }
  | { type: 'EQUIP'; dwarfId: string; itemId: string }
  | { type: 'UNEQUIP'; dwarfId: string; slot: Slot }
  | { type: 'SET_POSITION'; dwarfId: string; position: Position }
  | { type: 'SET_TEMPLATE'; role: keyof AutoEquipTemplate; slot: TemplateSlot; itemKey: string | null }
  | { type: 'SMITHY_BUY'; id: 'maxSlots' | 'maxPartySize' | 'smithyLevel' | 'offlineBonusPerHour' }
  | { type: 'ABANDON' }
  | { type: 'END_TO_MENU' }
  | { type: 'DISMISS_TOAST'; id: number };

const initialState: GameState = {
  meta: DEFAULT_META,
  run: null,
  screen: 'menu',
  battle: null,
  eventResult: null,
  deathNames: [],
  rewardOptions: [],
  toasts: [],
  toastId: 1,
  offline: null,
  loaded: false,
  partyEndless: false,
};

// ── helpers ──────────────────────────────────────────────────────────

// §3.3.5.1: при входе на ЛЮБОЙ узел — maxFloorEverReached и разблокировка гномов
function registerFloor(
  meta: MetaState,
  floor: number,
  toasts: Toast[],
  toastId: number,
): { meta: MetaState; toasts: Toast[]; toastId: number } {
  const reach = Math.max(meta.maxFloorEverReached, floor);
  const unlocked = [...meta.unlockedDwarves];
  const nextToasts = [...toasts];
  let id = toastId;
  for (const def of DWARF_TABLE) {
    if (def.unlockFloor <= reach && !unlocked.includes(def.id)) {
      unlocked.push(def.id);
      nextToasts.push({ id: id++, text: `Открыт гном: ${def.name}` });
    }
  }
  return {
    meta: { ...meta, maxFloorEverReached: reach, unlockedDwarves: unlocked },
    toasts: nextToasts,
    toastId: id,
  };
}

// §3.3.6: elite → stage 2–3 rare/epic; boss → stage 3 legendary/epic
function rollEquipmentUnlock(rng: PRNG, kind: 'elite' | 'boss', unlocked: string[]): string | null {
  const pool = ITEM_TABLE.filter((d) =>
    kind === 'boss'
      ? d.stage === 3 && (d.rarity === 'legendary' || d.rarity === 'epic')
      : d.stage >= 2 && (d.rarity === 'rare' || d.rarity === 'epic'),
  );
  const fresh = pool.filter((d) => !unlocked.includes(d.key));
  if (!fresh.length) return null;
  return pick(rng, fresh).key;
}

// Детерминированный seed боя/роллов узла из seed забега и координат узла
function nodeSeed(run: RunState, node: RunNode): number {
  const m = /^f(\d+)n(\d+)$/.exec(node.id);
  const salt = m ? Number(m[1]) * 16 + Number(m[2]) : node.floor;
  return (run.seed ^ (node.difficulty * 2654435761) ^ (salt * 40503)) >>> 0;
}

// §2.7: инвентарь > 100 → авто-продажа самых дешёвых по силе
function withAutoSell(run: RunState): RunState {
  let inv = run.inventory;
  let gold = run.gold;
  while (inv.length > INVENTORY_CAP) {
    let worst = 0;
    for (let i = 1; i < inv.length; i++) {
      if (itemPower(inv[i]) < itemPower(inv[worst])) worst = i;
    }
    gold += sellPrice(inv[worst]);
    inv = inv.filter((_, i) => i !== worst);
  }
  return { ...run, inventory: inv, gold };
}

function reposition(dwarves: Dwarf[]): Dwarf[] {
  const n = dwarves.length;
  return dwarves.map((d, i) => ({ ...d, position: assignPosition(i, n) }));
}

// §3.2.1: шаблон role→slot применяется к новым гномам при найме
function applyAutoEquip(
  dwarf: Dwarf,
  inventory: Equipment[],
  template: AutoEquipTemplate,
  maxSlots: number,
): { dwarf: Dwarf; inventory: Equipment[] } {
  const tpl = template[dwarf.role as keyof AutoEquipTemplate];
  if (!tpl) return { dwarf, inventory };
  let inv = [...inventory];
  let equipment = [...dwarf.equipment];
  for (const slot of ['weapon', 'armor', 'trinket'] as const) {
    const key = tpl[slot];
    if (!key) continue;
    const idx = inv.findIndex(
      (it) => it.slot === slot && it.id.startsWith(`${key}#`) && canEquip(it, { ...dwarf, equipment }, maxSlots),
    );
    if (idx < 0) continue;
    const [item] = inv.splice(idx, 1);
    equipment = [...equipment.filter((e) => e.slot !== slot), item];
  }
  return {
    dwarf: { ...dwarf, equipment, role: resolveRole({ ...dwarf, equipment }) },
    inventory: inv,
  };
}

// §3.2 Сон кузницы: каждый roll — случайный unlocked item с весами по редкости
const SLEEP_RARITY_WEIGHT: Record<Equipment['rarity'], number> = {
  common: 62, rare: 25, epic: 10, legendary: 3,
};

function rollSleepItemKey(rng: PRNG, unlocked: string[]): string {
  const pool = ITEM_TABLE.filter((d) => unlocked.includes(d.key));
  const def = weighted<ItemDef>(
    rng,
    (pool.length ? pool : ITEM_TABLE).map((d) => [d, SLEEP_RARITY_WEIGHT[d.rarity]]),
  );
  return def.key;
}

function startBattleState(state: GameState): GameState {
  const run = state.run;
  if (!run) return state;
  const node = nodeById(run, run.currentNodeId);
  if (!node) return state;
  const battle = createBattle(
    run.dwarves,
    (node.data?.enemyIds ?? ['e_rat']) as EnemyKind[],
    node.difficulty,
    nodeSeed(run, node),
  );
  return { ...state, battle, screen: 'battle' };
}

function enterNode(state: GameState, nodeId: string): GameState {
  const run = state.run;
  if (!run) return state;
  const node = nodeById(run, nodeId);
  if (!node || node.visited) return state;
  const reg = registerFloor(state.meta, node.floor, state.toasts, state.toastId);
  const base: GameState = {
    ...state,
    meta: reg.meta,
    toasts: reg.toasts,
    toastId: reg.toastId,
    run: { ...run, currentNodeId: nodeId, floor: node.floor },
  };
  switch (node.type) {
    case 'battle':
    case 'elite':
    case 'boss':
      // §3.2 Авто-бой: пропуск кнопки «В бой»
      return reg.meta.unlocks.autoBattle ? startBattleState(base) : { ...base, screen: 'prepare' };
    case 'event':
      return { ...base, screen: 'event', eventResult: null };
    case 'shop':
    case 'rest':
    case 'forge':
      return { ...base, screen: 'map' };
    default:
      return base;
  }
}

// Итог забега: наследие §3.3.1/§6.4, рекорд глубины, runCount, авто-разблокировки §3.2
function endRun(state: GameState, now: number, extraLegacy = 0): GameState {
  const run = state.run;
  if (!run) return state;
  const gain = legacyGain(run) + extraLegacy;
  const runCount = state.meta.runCount + 1;
  return {
    ...state,
    meta: {
      ...state.meta,
      legacy: state.meta.legacy + gain,
      maxDepthEver: Math.max(state.meta.maxDepthEver, run.floor), // §3.3.1: рекорд глубины
      runCount,
      unlocks: {
        autoBattle: runCount >= AUTO_BATTLE_RUNS,
        autoRepeat: runCount >= AUTO_REPEAT_RUNS,
        autoEquip: runCount >= AUTO_EQUIP_RUNS,
      },
      lastSeenAt: now,
    },
    screen: 'end',
  };
}

// §3.3.1 бесконечный: слой пройден (+1 endlessFloor); depth > 100 → victory_endless;
// карта дорастает до getDepth() порциями, когда впереди нет узлов
function advanceEndless(state: GameState): GameState {
  const run = state.run;
  if (!run || !run.isEndless || run.status !== 'active') return state;
  if (!nodeById(run, run.currentNodeId)) return state;
  const passed: RunState = { ...run, endlessFloor: run.endlessFloor + 1 };
  if (passed.floor >= ENDLESS_MAX_DEPTH) {
    return endRun({ ...state, run: { ...passed, status: 'victory_endless' } }, Date.now(), ENDLESS_BONUS_LEGACY);
  }
  return { ...state, run: extendMapEndless(passed, state.meta) };
}

// ── reducer ──────────────────────────────────────────────────────────

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, meta: action.meta, run: action.run, offline: action.offline, loaded: true };

    case 'START_RUN': {
      const dead = new Set(state.meta.deadDwarves); // §3.1.2: мёртвые недоступны
      const available = state.meta.unlockedDwarves.filter((id) => !dead.has(id));
      const ids = action.partyIds
        .filter((id) => available.includes(id))
        .slice(0, Math.max(1, state.meta.maxPartySize));
      if (!ids.length) return state;
      let run = newRun(action.seed >>> 0, state.meta, ids, {
        startedAt: action.now,
        isEndless: state.partyEndless,
      });
      let meta = state.meta;
      // Сон кузницы: накопленные ключи превращаются в предметы стартового инвентаря
      if (meta.sleepLoot.length) {
        const rng = mulberry32((action.seed ^ 0x51ed270b) >>> 0);
        const items = meta.sleepLoot
          .map((key) => {
            const def = defByCatalogId(key);
            return def ? makeEquipment(def, def.stage, randInt(rng, 0, 1e9)) : null;
          })
          .filter((x): x is Equipment => x !== null);
        run = { ...run, inventory: [...run.inventory, ...items] };
        meta = { ...meta, sleepLoot: [] };
      }
      run = withAutoSell(run);
      return {
        ...state,
        meta,
        run,
        screen: 'prepare',
        battle: null,
        eventResult: null,
        deathNames: [],
        rewardOptions: [],
      };
    }

    case 'GOTO':
      return { ...state, screen: action.screen };

    case 'OPEN_PARTY': {
      const endless = action.endless === true && state.meta.endlessUnlocked;
      let meta = state.meta;
      let toasts = state.toasts;
      let toastId = state.toastId;
      // §3.4: если живых гномов < 2 — полное восстановление перед новым забегом
      const available = meta.unlockedDwarves.filter((id) => !meta.deadDwarves.includes(id));
      if (available.length < 2) {
        meta = { ...meta, deadDwarves: [] };
        toasts = [...toasts, { id: toastId++, text: 'Новое поколение гномов возродилось' }];
      }
      return { ...state, meta, toasts, toastId, screen: 'party', partyEndless: endless };
    }

    case 'CONTINUE_ENDLESS': {
      // §3.4: после победы — выбор «в меню / бесконечный забег»; бесконечный требует unlock
      const run = state.run;
      if (!run || run.status !== 'victory' || !state.meta.endlessUnlocked) return state;
      const revived = run.dwarves.map((d) =>
        d.isAlive ? { ...d, currentHP: maxHP(d), statusEffects: [] } : d,
      );
      const reset: RunState = {
        ...run,
        status: 'active',
        isEndless: true,
        endlessFloor: 0,
        bossKilled: false,
        endReason: null, // новый виток: причина прошлого забега не должна попасть на экран 9
        dwarves: revived, // §3.3.1: восстановление HP/статусов между слоями
      };
      return {
        ...state,
        run: extendMapEndless(reset, state.meta),
        screen: 'map',
        battle: null,
        rewardOptions: [],
        deathNames: [],
        eventResult: null,
      };
    }

    case 'CHOOSE_NODE':
      return enterNode(state, action.nodeId);

    case 'START_BATTLE':
      return startBattleState(state);

    case 'BATTLE_FINISH': {
      const run = state.run;
      const node = run ? nodeById(run, run.currentNodeId) : null;
      if (!run || !node || action.state.status === 'active') return state;
      const won = action.state.status === 'won';
      const rng = mulberry32(nodeSeed(run, node));

      // §3.1.2: перманентная смерть — экипировка павшего в инвентарь, гном выбывает навсегда
      const fallen: string[] = [];
      const fallenIds: string[] = [];
      const fallenEquipment: Equipment[] = [];
      const dwarves = run.dwarves.map((d) => {
        const c = action.state.allies.find((a) => a.uid === d.id);
        if (!c) return d;
        if (c.alive && d.isAlive) {
          return { ...d, currentHP: Math.max(1, c.hp), statusEffects: c.statuses.map((s) => ({ ...s })) };
        }
        if (!d.isAlive) return d;
        fallen.push(d.name);
        fallenIds.push(d.id);
        fallenEquipment.push(...d.equipment);
        return { ...d, isAlive: false, currentHP: 0, statusEffects: [], equipment: [] };
      });

      // v6.9 §4.3: причина финала последнего боя → run.endReason (экран 9);
      // таймаут-сюжеты уже несут endReason в BattleState, обычные исходы — тут
      const runEndReason: BattleEndReason = won ? 'victory' : (action.state.endReason ?? 'defeat');
      let updated: RunState = {
        ...run,
        endReason: runEndReason,
        dwarves,
        inventory: [...run.inventory, ...fallenEquipment],
        map: run.map.map((n) => (n.id === node.id ? { ...n, visited: true } : n)),
      };

      let meta = state.meta;
      let toasts = state.toasts;
      let toastId = state.toastId;
      const pushToast = (text: string) => {
        toasts = [...toasts, { id: toastId++, text }];
      };
      const deadUnion = [...new Set([...meta.deadDwarves, ...fallenIds])];

      if (won) {
        updated = withAutoSell({ ...updated, gold: updated.gold + node.rewards.gold });
        if (node.type === 'elite') {
          updated = { ...updated, elitesKilled: updated.elitesKilled + 1 };
          // §3.3.7 v6.8: элита — +10 наследия, один раз за забег, сразу
          if (!updated.eliteLegacyGranted) {
            updated = { ...updated, eliteLegacyGranted: true };
            meta = { ...meta, legacy: meta.legacy + 10 };
            pushToast('+10 наследия за элиту');
          }
        }
        if (node.type === 'boss') {
          // §3.3.7: +50 наследия и +1 босс сразу; §3.3.1: рекорд глубины; §3.3.6: новый гном
          updated = { ...updated, bossKilled: true, bossesKilled: updated.bossesKilled + 1 };
          meta = {
            ...meta,
            legacy: meta.legacy + 50,
            bossesKilledTotal: meta.bossesKilledTotal + 1,
            maxDepthEver: Math.max(meta.maxDepthEver, node.floor),
          };
          pushToast('+50 наследия: босс повержен');
          const bossId = node.data?.enemyIds?.[0];
          if (bossId === 'e_forge_demon' && !meta.endlessUnlocked) {
            meta = { ...meta, endlessUnlocked: true };
            pushToast('Бесконечный режим открыт!');
          }
          const locked = DWARF_TABLE.filter((d) => !meta.unlockedDwarves.includes(d.id));
          if (locked.length) {
            const dwarf = pick(rng, locked);
            meta = { ...meta, unlockedDwarves: [...meta.unlockedDwarves, dwarf.id] };
            pushToast(`Открыт гном: ${dwarf.name}`);
          }
          // §3.4: обычный забег завершается победой; в бесконечном — продолжаем спуск
          if (!updated.isEndless) updated = { ...updated, status: 'victory' };
        }
        if (node.type === 'elite' || node.type === 'boss') {
          const key = rollEquipmentUnlock(
            rng,
            node.type === 'boss' ? 'boss' : 'elite',
            meta.unlockedEquipment,
          );
          if (key) {
            meta = { ...meta, unlockedEquipment: [...meta.unlockedEquipment, key] };
            pushToast(`Открыто: ${defByCatalogId(key)?.name ?? key}`);
          }
        }
        meta = { ...meta, deadDwarves: deadUnion };
      } else if (updated.isEndless) {
        // §3.3.1 бесконечный: смерть всех гномов — сброс deadDwarves, новое поколение, забег продолжается
        meta = { ...meta, deadDwarves: [] };
        updated = {
          ...updated,
          dwarves: updated.dwarves.map((d) => ({ ...d, isAlive: true, currentHP: maxHP(d), statusEffects: [] })),
        };
        pushToast('Новое поколение гномов возродилось');
      } else {
        updated = { ...updated, status: 'defeat' };
        meta = { ...meta, deadDwarves: deadUnion };
      }

      // §4 экран 5: выбор 1 из 2–3 предметов
      const rewardOptions: Equipment[] = won
        ? node.rewards.itemIds.slice(0, 3).flatMap((key) => {
            const def = defByCatalogId(key);
            if (!def) return [];
            const stage = rollItemStage(rng, node.difficulty, node.type === 'elite', node.type === 'boss');
            return [makeEquipment(def, Math.max(def.stage, stage) as 1 | 2 | 3, randInt(rng, 0, 1e9))];
          })
        : [];

      const next: GameState = {
        ...state,
        run: updated,
        meta,
        toasts,
        toastId,
        battle: action.state,
        rewardOptions,
      };
      if (!won) {
        if (updated.isEndless) {
          // §3.3.1 бесконечный: поражение не завершает забег — новое поколение, продолжаем спуск
          return advanceEndless({ ...next, screen: 'map' });
        }
        return endRun(next, Date.now());
      }
      if (fallen.length) return { ...next, deathNames: fallen, screen: 'death' };
      return { ...next, screen: 'reward' };
    }

    case 'DEATH_CONTINUE': {
      const run = state.run;
      if (!run) return state;
      if (state.rewardOptions.length) return { ...state, deathNames: [], screen: 'reward' };
      return endRun({ ...state, deathNames: [] }, Date.now());
    }

    case 'REWARD_PICK': {
      const run = state.run;
      if (!run) return state;
      const item = state.rewardOptions[action.index];
      if (!item) return state;
      const updated = withAutoSell({ ...run, inventory: [...run.inventory, item] });
      if (updated.status === 'victory') {
        return endRun({ ...state, run: updated, rewardOptions: [] }, Date.now());
      }
      const advanced = advanceEndless({ ...state, run: updated, rewardOptions: [] });
      const advancedRun = advanced.run;
      // §3.2 Авто-повтор: авто-выбор узла того же типа, что и предыдущий
      if (state.meta.unlocks.autoRepeat && advanced.screen === 'map' && advancedRun) {
        const finished = nodeById(advancedRun, run.currentNodeId);
        const same = finished
          ? finished.next
              .map((id) => nodeById(advancedRun, id))
              .find((n) => n && !n.visited && n.type === finished.type)
          : null;
        if (same) {
          return enterNode({ ...advanced, screen: 'map' }, same.id);
        }
      }
      return { ...advanced, screen: 'map' };
    }

    case 'EVENT_CHOICE': {
      const run = state.run;
      if (!run) return state;
      const node = nodeById(run, run.currentNodeId);
      const def = node?.data?.eventId ? eventById(node.data.eventId) : null;
      if (!node || !def) return state;
      const outcome = applyEventChoice(run, def, action.index, mulberry32(nodeSeed(run, node)));
      let updated: RunState = {
        ...outcome.run,
        dwarves: reposition(outcome.run.dwarves),
        map: run.map.map((n) =>
          n.id === node.id && outcome.replaceWithBattle
            ? {
                ...n,
                type: 'battle' as const,
                rewards: { gold: 10, itemIds: [] as string[] },
                data: { enemyIds: ['e_goblin', 'e_rat'] },
              }
            : n,
        ),
      };
      updated = withAutoSell(updated);
      return { ...state, run: updated, eventResult: outcome.message };
    }

    case 'EVENT_CONTINUE': {
      const run = state.run;
      if (!run) return state;
      const node = nodeById(run, run.currentNodeId);
      if (!node) return state;
      // Пленник-обманщик: узел заменён боем — входим в него
      if (node.type === 'battle') return enterNode({ ...state, eventResult: null }, node.id);
      return {
        ...advanceEndless({
          ...state,
          run: {
            ...run,
            map: run.map.map((n) => (n.id === node.id ? { ...n, visited: true } : n)),
          },
          eventResult: null,
        }),
        screen: 'map',
      };
    }

    case 'BUY': {
      const run = state.run;
      if (!run) return state;
      const node = nodeById(run, run.currentNodeId);
      const stock = node?.data?.shopStock;
      if (!node || !stock) return state;
      const entry = stock[action.index];
      if (!entry || run.gold < entry.price) return state;

      if (entry.type === 'dwarf') {
        if (run.dwarves.length >= SHOP_PARTY_CAP) return state;
        const owned = new Set(run.dwarves.map((d) => d.id));
        // §3.1.2: мёртвые гномы не возвращаются в лавки
        const candidates = DWARF_TABLE.filter(
          (d) => !owned.has(d.id) && !state.meta.deadDwarves.includes(d.id),
        );
        if (!candidates.length) return state;
        const rng = mulberry32((nodeSeed(run, node) ^ 0x7777) >>> 0);
        let dwarf = makeDwarf(pick(rng, candidates).id, run.dwarves.length, run.dwarves.length + 1);
        let inventory = run.inventory;
        if (state.meta.unlocks.autoEquip && state.meta.autoEquipTemplate) {
          const applied = applyAutoEquip(dwarf, inventory, state.meta.autoEquipTemplate, state.meta.maxSlots);
          dwarf = applied.dwarf;
          inventory = applied.inventory;
        }
        return {
          ...state,
          run: {
            ...run,
            gold: run.gold - entry.price,
            dwarves: reposition([...run.dwarves, dwarf]),
            inventory,
            map: run.map.map((n) =>
              n.id === node.id
                ? { ...n, data: { ...n.data, shopStock: stock.filter((_, i) => i !== action.index) } }
                : n,
            ),
          },
        };
      }

      const def = defByCatalogId(entry.id);
      if (!def) return state;
      const rng = mulberry32((nodeSeed(run, node) ^ 0x9999) >>> 0);
      const item = makeEquipment(def, def.stage, randInt(rng, 0, 1e9));
      const updated = withAutoSell({
        ...run,
        gold: run.gold - entry.price,
        inventory: [...run.inventory, item],
      });
      return {
        ...state,
        run: {
          ...updated,
          map: updated.map.map((n) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, shopStock: stock.filter((_, i) => i !== action.index) } }
              : n,
          ),
        },
      };
    }

    case 'REST_CHOICE': {
      // §3.3.4: A — heal 50% maxHP живым; B — снять все statusEffects
      const run = state.run;
      if (!run) return state;
      const dwarves = action.index === 0
        ? run.dwarves.map((d) =>
            d.isAlive
              ? { ...d, currentHP: Math.min(dwarfStats(d).hp, d.currentHP + Math.ceil(dwarfStats(d).hp * 0.5)) }
              : d,
          )
        : run.dwarves.map((d) => ({ ...d, statusEffects: [] }));
      return { ...state, run: { ...run, dwarves } };
    }

    case 'FORGE': {
      // §3.3.3: rarity++ за 10/20/40 золота, stage не меняется
      const run = state.run;
      if (!run) return state;
      const item = run.inventory.find((i) => i.id === action.itemId);
      if (!item) return state;
      const cost = forgeCost(item.rarity);
      if (run.gold < cost) return state;
      const node = nodeById(run, run.currentNodeId);
      const rng = mulberry32((node ? nodeSeed(run, node) : run.seed) ^ 0x1337);
      const upgraded = rarityUpgrade(item, rng);
      if (!upgraded) return state;
      return {
        ...state,
        run: {
          ...run,
          gold: run.gold - cost,
          inventory: run.inventory.map((i) => (i.id === item.id ? upgraded : i)),
        },
      };
    }

    case 'LEAVE_NODE': {
      const run = state.run;
      if (!run) return state;
      return {
        ...advanceEndless({
          ...state,
          run: {
            ...run,
            map: run.map.map((n) => (n.id === run.currentNodeId ? { ...n, visited: true } : n)),
          },
        }),
        screen: 'map',
      };
    }

    case 'EQUIP': {
      const run = state.run;
      if (!run) return state;
      const item = run.inventory.find((i) => i.id === action.itemId);
      const dwarf = run.dwarves.find((d) => d.id === action.dwarfId);
      if (!item || !dwarf || !canEquip(item, dwarf, state.meta.maxSlots)) return state;
      const replaced = dwarf.equipment.find((e) => e.slot === item.slot) ?? null;
      const equipment = [...dwarf.equipment.filter((e) => e.slot !== item.slot), item];
      const updated: Dwarf = {
        ...dwarf,
        equipment,
        role: resolveRole({ ...dwarf, equipment }),
        currentHP: dwarf.isAlive ? Math.min(dwarf.currentHP, maxHP({ ...dwarf, equipment })) : 0,
      };
      return {
        ...state,
        run: {
          ...run,
          inventory: [...run.inventory.filter((i) => i.id !== item.id), ...(replaced ? [replaced] : [])],
          dwarves: run.dwarves.map((d) => (d.id === dwarf.id ? updated : d)),
        },
      };
    }

    case 'UNEQUIP': {
      const run = state.run;
      if (!run) return state;
      const dwarf = run.dwarves.find((d) => d.id === action.dwarfId);
      const item = dwarf?.equipment.find((e) => e.slot === action.slot);
      if (!dwarf || !item) return state;
      const equipment = dwarf.equipment.filter((e) => e.slot !== action.slot);
      const updated: Dwarf = {
        ...dwarf,
        equipment,
        role: resolveRole({ ...dwarf, equipment }),
        currentHP: dwarf.isAlive ? Math.min(dwarf.currentHP, maxHP({ ...dwarf, equipment })) : 0,
      };
      return {
        ...state,
        run: {
          ...run,
          dwarves: run.dwarves.map((d) => (d.id === dwarf.id ? updated : d)),
          inventory: [...run.inventory, item],
        },
      };
    }

    case 'SET_POSITION':
      return {
        ...state,
        run: state.run
          ? {
              ...state.run,
              dwarves: state.run.dwarves.map((d) =>
                d.id === action.dwarfId ? { ...d, position: action.position } : d,
              ),
            }
          : state.run,
      };

    case 'SET_TEMPLATE': {
      const template: AutoEquipTemplate = state.meta.autoEquipTemplate ?? {
        tank: {}, warrior: {}, ranged: {}, mage: {}, support: {},
      };
      const roleSlots: EquipSlots = { ...template[action.role] };
      if (action.itemKey === null) delete roleSlots[action.slot];
      else roleSlots[action.slot] = action.itemKey;
      return {
        ...state,
        meta: { ...state.meta, autoEquipTemplate: { ...template, [action.role]: roleSlots } },
      };
    }

    case 'SMITHY_BUY': {
      // §3.5: апгрейды — данные; цена baseCost × 1.5^level (§6.4)
      const def = SMITHY_UPGRADES.find((d) => d.id === action.id);
      if (!def) return state;
      return { ...state, meta: purchaseUpgrade(state.meta, def) };
    }

    case 'ABANDON': {
      const run = state.run;
      if (!run || run.status !== 'active') return state;
      return endRun({ ...state, run: { ...run, status: 'abandoned', endReason: 'abandoned' } }, Date.now());
    }

    case 'END_TO_MENU':
      return { ...state, run: null, battle: null, screen: 'menu' };

    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    default:
      return state;
  }
}

// ── Нормализация меты (миграция старых/частичных сохранений) ─────────

// Экспорт для тестов миграции (§2.5): старый dnd_meta_v1 без новых полей
export function normalizeMeta(raw: unknown): MetaState {
  const partial = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<MetaState>;
  const meta: MetaState = { ...DEFAULT_META, ...partial };
  if (!Array.isArray(meta.unlockedDwarves) || !meta.unlockedDwarves.length) {
    meta.unlockedDwarves = unlockedDwarfIds(Math.max(1, meta.maxFloorEverReached));
  }
  if (!Array.isArray(meta.unlockedEquipment) || !meta.unlockedEquipment.length) {
    meta.unlockedEquipment = DEFAULT_META.unlockedEquipment;
  }
  if (!Array.isArray(meta.sleepLoot)) meta.sleepLoot = [];
  // v6.8 миграция: старый dnd_meta_v1 без новых полей → дефолты, прогресс не теряется
  if (!Array.isArray(meta.deadDwarves)) meta.deadDwarves = [];
  if (!Number.isFinite(meta.maxDepthEver) || meta.maxDepthEver < 0) meta.maxDepthEver = 0;
  if (!Number.isFinite(meta.bossesKilledTotal) || meta.bossesKilledTotal < 0) meta.bossesKilledTotal = 0;
  if (typeof meta.endlessUnlocked !== 'boolean') meta.endlessUnlocked = false;
  meta.unlocks = {
    autoBattle: meta.runCount >= AUTO_BATTLE_RUNS,
    autoRepeat: meta.runCount >= AUTO_REPEAT_RUNS,
    autoEquip: meta.runCount >= AUTO_EQUIP_RUNS,
  };
  return meta;
}

// v6.8 миграция активного забега из старого сейва: новые поля → дефолты, depth — по карте
// Экспорт для тестов миграции (§2.5), как normalizeMeta
export function normalizeRun(raw: RunState): RunState {
  return {
    ...raw,
    depth: Number.isFinite(raw.depth) && raw.depth > 0 ? raw.depth : mapDepth(raw),
    isEndless: raw.isEndless === true,
    endlessFloor: Number.isFinite(raw.endlessFloor) && raw.endlessFloor > 0 ? raw.endlessFloor : 0,
    eliteLegacyGranted: raw.eliteLegacyGranted === true,
    bossesKilled: Number.isFinite(raw.bossesKilled) && raw.bossesKilled > 0 ? raw.bossesKilled : 0,
    endReason: raw.endReason ?? null, // v6.9: старый сейв без endReason → null
    bonusLegacy: Number.isFinite(raw.bonusLegacy) && raw.bonusLegacy > 0 ? raw.bonusLegacy : 0, // §6.5
  };
}

// ── Контекст ─────────────────────────────────────────────────────────

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // §2.6: загрузка + offline-расчёт (§3.2) при открытии приложения
  useEffect(() => {
    try {
      const metaRaw = localStorage.getItem(META_KEY);
      const runRaw = localStorage.getItem(RUN_KEY);
      let meta = metaRaw ? normalizeMeta(JSON.parse(metaRaw)) : DEFAULT_META;
      let run: RunState | null = runRaw ? normalizeRun(JSON.parse(runRaw)) : null;
      if (run && run.status !== 'active') run = null;

      const now = Date.now();
      let offline: OfflineReport | null = null;
      if (meta.lastSeenAt > 0) {
        const deltaH = Math.max(0, (now - meta.lastSeenAt) / 3.6e6);
        if (deltaH >= 1) {
          // Offline-наследие: gain = min(Δ, 8) × (1 + smithy×0.5 + offlineBonus×0.1)
          const mult = 1 + meta.smithyLevel * 0.5 + meta.offlineBonusPerHour * 0.1;
          const legacy = Math.round(Math.min(deltaH, OFFLINE_HOURS_CAP) * mult);
          // Сон кузницы: itemRolls = floor(Δ), каждый — random unlocked item
          const rolls = Math.min(OFFLINE_HOURS_CAP, Math.floor(deltaH));
          const rng = mulberry32(now >>> 0);
          const keys: string[] = [];
          for (let i = 0; i < rolls; i++) keys.push(rollSleepItemKey(rng, meta.unlockedEquipment));
          meta = { ...meta, legacy: meta.legacy + legacy, sleepLoot: [...meta.sleepLoot, ...keys] };
          offline = { legacy, items: keys.length };
        }
      }
      meta = { ...meta, lastSeenAt: now };
      dispatch({ type: 'HYDRATE', meta, run, offline });
    } catch {
      dispatch({ type: 'HYDRATE', meta: DEFAULT_META, run: null, offline: null });
    }
  }, []);

  // §2.6: сохранение при каждом изменении (вкл. мгновенное при разблокировках)
  useEffect(() => {
    if (!state.loaded) return;
    try {
      localStorage.setItem(META_KEY, JSON.stringify(state.meta));
      if (state.run) localStorage.setItem(RUN_KEY, JSON.stringify(state.run));
      else localStorage.removeItem(RUN_KEY);
    } catch {
      /* storage может быть недоступен */
    }
  }, [state.meta, state.run, state.loaded]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame вне GameProvider');
  return ctx;
}
