// §3.3.1 Генерация карты v6.8 (Growing Depth) + §3.4 старт забега + §3.3.1 бесконечный режим

import type { MetaState, NodeType, RunNode, RunState, ShopItem } from '../types';
import { RARITY_PRICE, type Rarity } from '../types';
import type { PRNG } from '../rng';
import { mulberry32, pick, randInt } from '../rng';
import { makeParty } from '../data/dwarves';
import { battleWaveTotal, bossForFloor, nodeGold, poolFor, type EnemyKind } from '../data/enemies';
import { EVENTS } from '../data/events';
import { ITEM_TABLE, makeEquipment, rollRarity } from '../data/items';

export const MIN_DEPTH = 8;
// §6.4: depth > 100 в бесконечном режиме → victory_endless + бонус наследия
export const ENDLESS_MAX_DEPTH = 100;
export const ENDLESS_BONUS_LEGACY = 500;
const MAP_ATTEMPTS = 10; // §2.7: перегенерация seed+1, максимум 10 попыток
const ENDLESS_CHUNK_CAP = 12; // ограничение темпа роста карты за одно расширение

// §3.3.1 v6.8 Growing Depth: 8 + боссы (обычный) / 8 + рекорд + пройденные слои (бесконечный)
export function getDepth(
  meta: Pick<MetaState, 'maxDepthEver' | 'bossesKilledTotal'>,
  isEndless: boolean,
  endlessFloor: number,
): number {
  return isEndless ? MIN_DEPTH + meta.maxDepthEver + endlessFloor : MIN_DEPTH + meta.bossesKilledTotal;
}

// §3.3.1 v6.8 доли узлов: бой 0.50, элита 0.15+floor×0.01, лавка max(0, 0.15−floor×0.005),
// событие 0.12, привал 0.05, кузня 0.03
export function getNodeProbs(floor: number): [NodeType, number][] {
  return [
    ['battle', 0.5],
    ['elite', 0.15 + floor * 0.01],
    ['shop', Math.max(0, 0.15 - floor * 0.005)],
    ['event', 0.12],
    ['rest', 0.05],
    ['forge', 0.03],
  ];
}

// Элита исключается, если в ПРЕДЫДУЩЕМ слое была элита (правило по слоям, §3.3.8)
function determineNodeType(rng: PRNG, floor: number, prevLayerHadElite: boolean): NodeType {
  const probs = getNodeProbs(floor).filter(([t]) => !(t === 'elite' && prevLayerHadElite));
  const total = probs.reduce((s, [, p]) => s + p, 0);
  let roll = rng() * total;
  for (const [t, p] of probs) {
    roll -= p;
    if (roll <= 0) return t;
  }
  return 'battle';
}

function randomKey(rng: PRNG, unlocked: string[], rarity?: string): string {
  let pool = rarity ? ITEM_TABLE.filter((d) => d.rarity === rarity) : ITEM_TABLE;
  pool = pool.filter((d) => unlocked.includes(d.key));
  if (!pool.length) pool = ITEM_TABLE.filter((d) => unlocked.includes(d.key));
  return pick(rng, pool.length ? pool : ITEM_TABLE).key;
}

// §3.3.2: сток = 3 предмета + гном за 10 золота; фиксируется при генерации карты
function makeShopStock(rng: PRNG, difficulty: number, unlocked: string[]): ShopItem[] {
  const stock: ShopItem[] = [];
  for (let i = 0; i < 3; i++) {
    const key = randomKey(rng, unlocked, rollRarityKey(rng, difficulty));
    const def = ITEM_TABLE.find((d) => d.key === key)!;
    stock.push({ type: 'equipment', id: key, price: RARITY_PRICE[def.rarity as Rarity] });
  }
  stock.push({ type: 'dwarf', id: 'dwarf_stock', price: 10 });
  return stock;
}

function rollRarityKey(rng: PRNG, difficulty: number): string | undefined {
  const roll = rng();
  const d = Math.min(difficulty, 11);
  if (roll < 0.15 + d * 0.01) return 'rare';
  if (roll < 0.2 + d * 0.02) return 'epic';
  return undefined;
}

interface MakeNodeArgs {
  rng: PRNG;
  id: string;
  floor: number;
  nodeIndex: number;
  type: NodeType;
  depth: number;
  unlocked: string[];
  bossesKilledTotal: number;
  isEndless: boolean;
}

// §3.3.1 v7.0: enemyTypes — уникальные типы волны для превью экрана подготовки (без статов и количества)
function waveData(enemyIds: EnemyKind[]): { enemyIds: EnemyKind[]; enemyTypes: string[] } {
  return { enemyIds, enemyTypes: [...new Set(enemyIds)] };
}

function makeNode({ rng, id, floor, nodeIndex, type, depth, unlocked, bossesKilledTotal, isEndless }: MakeNodeArgs): RunNode {
  const base = { id, floor, nodeIndex, difficulty: floor, rewards: { gold: 0, itemIds: [] as string[] }, next: [] as string[] };

  if (type === 'boss') {
    // §3.3.7: лут босса — 1 из 3 epic/legendary (stage 3 задаётся при выдаче, §3.3.6)
    const itemIds = [0, 1, 2].map(() => randomKey(rng, unlocked, rng() < 0.5 ? 'epic' : 'legendary'));
    return {
      ...base,
      type: 'boss',
      rewards: { gold: nodeGold('boss', floor, depth), itemIds },
      data: waveData([bossForFloor(floor, bossesKilledTotal, isEndless)]),
    };
  }

  if (type === 'elite') {
    // §3.3.7: элита — 1 из 3 rare/epic; волна §6.3: голем + подкрепление из пула слоя
    const itemIds = [0, 1, 2].map(() => randomKey(rng, unlocked, rng() < 0.5 ? 'rare' : 'epic'));
    const enemyIds: EnemyKind[] = ['e_golem'];
    for (let i = 1; i < battleWaveTotal(floor, true); i++) enemyIds.push(pick(rng, poolFor(floor)));
    return {
      ...base,
      type: 'elite',
      rewards: { gold: nodeGold('elite', floor, depth), itemIds },
      data: waveData(enemyIds),
    };
  }

  switch (type) {
    case 'battle': {
      // §3.3.7: бой — 1 из 2, common/rare по rollRarity(difficulty)
      const itemIds = [0, 1].map(() => randomKey(rng, unlocked, rollRarity(rng, floor)));
      return {
        ...base,
        type,
        rewards: { gold: nodeGold('battle', floor, depth), itemIds },
        data: waveData(enemyGroup(rng, floor)),
      };
    }
    case 'event':
      return { ...base, type, data: { eventId: pick(rng, EVENTS).id } };
    case 'shop':
      return { ...base, type, data: { shopStock: makeShopStock(rng, floor, unlocked) } };
    case 'rest':
    case 'forge':
      return { ...base, type };
    default:
      return { ...base, type: 'battle', data: waveData(enemyGroup(rng, floor)) };
  }
}

// §6.3 enemyCount (пошаговая адаптация battleWaveTotal): полный состав волны,
// боевой движок вводит его в бой порциями (передовой отряд + подкрепления)
function enemyGroup(rng: PRNG, floor: number): EnemyKind[] {
  const pool = poolFor(floor);
  const out: EnemyKind[] = [];
  for (let i = 0; i < battleWaveTotal(floor, false); i++) out.push(pick(rng, pool));
  return out;
}

// ── построение слоёв ─────────────────────────────────────────────────

function buildLayers(rng: PRNG, depth: number, unlocked: string[], bossesKilledTotal: number, isEndless: boolean): RunNode[] {
  const nodes: RunNode[] = [];
  const make = (floor: number, type: NodeType, idx: number) => {
    nodes.push(makeNode({ rng, id: `f${floor}n${idx}`, floor, nodeIndex: idx, type, depth, unlocked, bossesKilledTotal, isEndless }));
  };

  make(1, 'battle', 0);
  let prevElite = false;
  for (let floor = 2; floor <= depth - 2; floor++) {
    const count = randInt(rng, 2, 4);
    for (let i = 0; i < count; i++) {
      const t = determineNodeType(rng, floor, prevElite);
      if (t === 'elite') prevElite = true;
      make(floor, t, i);
    }
  }
  // слой depth−2: гарантированные лавка или привал (§3.3.1 v6.8)
  const preCount = randInt(rng, 2, 4);
  for (let i = 0; i < preCount; i++) make(depth - 1, rng() < 0.5 ? 'shop' : 'rest', i);
  make(depth, 'boss', 0);
  return nodes;
}

function toLayers(nodes: RunNode[]): RunNode[][] {
  const byFloor = new Map<number, RunNode[]>();
  for (const n of nodes) {
    const arr = byFloor.get(n.floor) ?? [];
    arr.push(n);
    byFloor.set(n.floor, arr);
  }
  return [...byFloor.entries()].sort((a, b) => a[0] - b[0]).map(([, arr]) => arr);
}

// Связи: 1–3 исходящих / 1–2 входящих; каждая цель следующего слоя достижима (§3.3.8)
function linkLayers(rng: PRNG, layers: RunNode[][]): void {
  for (let l = 0; l < layers.length - 1; l++) {
    linkPair(rng, layers[l], layers[l + 1]);
  }
}

function linkPair(rng: PRNG, from: RunNode[], to: RunNode[]): void {
  for (const node of from) {
    node.next = [];
    const count = Math.min(randInt(rng, 1, 3), to.length);
    node.next = pickManyUnique(rng, to, count).map((n) => n.id);
  }
  // каждая цель — минимум 1 входящее ребро
  for (const target of to) {
    while (!from.some((n) => n.next.includes(target.id))) {
      const withRoom = from.filter((n) => n.next.length < 3);
      const src = withRoom.length ? pick(rng, withRoom) : pick(rng, from);
      src.next.push(target.id);
    }
  }
  // входящих не больше 2, но у источника должно остаться ≥1 исходящего
  for (const target of to) {
    for (;;) {
      const sources = from.filter((n) => n.next.includes(target.id));
      if (sources.length <= 2) break;
      const removable = sources.filter((n) => n.next.length > 1);
      if (!removable.length) break;
      const src = pick(rng, removable);
      src.next = src.next.filter((id) => id !== target.id);
    }
  }
}

function pickManyUnique<T>(rng: PRNG, arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// §2.7 валидация v6.8: BFS от старта — все узлы достижимы; босс достижим
// из КАЖДОГО узла предбоссового слоя (обратный BFS)
export function mapIsValid(layers: RunNode[][]): boolean {
  const byId = new Map<string, RunNode>();
  for (const layer of layers) for (const n of layer) byId.set(n.id, n);
  if (!layers.length || !layers[0].length) return false;
  const bossLayer = layers[layers.length - 1];
  if (bossLayer.length !== 1) return false;
  const boss = bossLayer[0];

  const start = layers[0][0];
  const seen = new Set<string>([start.id]);
  const stack = [start];
  while (stack.length) {
    const node = stack.pop()!;
    for (const id of node.next) {
      if (!seen.has(id)) {
        const next = byId.get(id);
        if (!next) return false;
        seen.add(id);
        stack.push(next);
      }
    }
  }
  if (seen.size !== byId.size) return false;
  for (const node of byId.values()) {
    if (node !== boss && node.next.length === 0) return false;
  }

  const reaching = new Set<string>([boss.id]);
  const revStack: string[] = [boss.id];
  const reverse = new Map<string, string[]>();
  for (const node of byId.values()) {
    for (const id of node.next) {
      reverse.set(id, [...(reverse.get(id) ?? []), node.id]);
    }
  }
  while (revStack.length) {
    const id = revStack.pop()!;
    for (const prev of reverse.get(id) ?? []) {
      if (!reaching.has(prev)) {
        reaching.add(prev);
        revStack.push(prev);
      }
    }
  }
  const preBoss = layers[layers.length - 2] ?? [];
  return preBoss.every((n) => reaching.has(n.id));
}

function linearFallback(
  seed: number,
  depth: number,
  unlocked: string[],
  bossesKilledTotal: number,
  isEndless: boolean,
): RunNode[] {
  const rng = mulberry32(seed);
  const map: RunNode[] = [];
  for (let floor = 1; floor <= depth; floor++) {
    const type: NodeType = floor === depth ? 'boss' : floor === depth - 1 ? 'rest' : 'battle';
    const node = makeNode({ rng, id: `f${floor}n0`, floor, nodeIndex: 0, type, depth, unlocked, bossesKilledTotal, isEndless });
    map.push(node);
    if (floor > 1) map[floor - 2].next.push(node.id);
  }
  return map;
}

// §2.7: неудачная валидация → перегенерация с seed+1 (до 10 попыток), затем линейный fallback
export function generateMap(
  seed: number,
  depth: number,
  unlocked: string[],
  bossesKilledTotal = 0,
  isEndless = false,
): { map: RunNode[]; depth: number; seed: number } {
  let s = seed >>> 0;
  for (let attempt = 0; attempt < MAP_ATTEMPTS; attempt++) {
    const rng = mulberry32(s);
    const nodes = buildLayers(rng, depth, unlocked, bossesKilledTotal, isEndless);
    const layers = toLayers(nodes);
    linkLayers(rng, layers);
    if (mapIsValid(layers)) return { map: nodes, depth, seed: s };
    s = (s + 1) >>> 0;
  }
  return { map: linearFallback(seed, depth, unlocked, bossesKilledTotal, isEndless), depth, seed };
}

// ── бесконечный режим (§3.3.1): карта дорастает порциями до getDepth() ──

export function extendMapEndless(run: RunState, meta: MetaState): RunState {
  const startFloor = mapDepth(run);
  if (startFloor >= ENDLESS_MAX_DEPTH) return run;
  const tail = run.map.filter((n) => n.floor === startFloor);
  if (tail.some((n) => n.next.length > 0)) return run;

  const target = Math.min(
    ENDLESS_MAX_DEPTH,
    Math.max(startFloor + 3, getDepth(meta, true, run.endlessFloor)),
  );
  const endFloor = Math.min(target, startFloor + ENDLESS_CHUNK_CAP);
  if (endFloor <= startFloor) return run;

  const unlocked = meta.unlockedEquipment.length ? meta.unlockedEquipment : defaultUnlockedKeys();
  const rng = mulberry32((run.seed ^ (startFloor * 2654435761)) >>> 0);
  const chunk: RunNode[] = [];
  const layers: RunNode[][] = [];
  let prevElite = tail.some((n) => n.type === 'elite');

  for (let floor = startFloor + 1; floor <= endFloor; floor++) {
    // §3.3.1 бесконечный: босс каждые 3 слоя (endlessFloor % 3 === 2)
    const isBossLayer = (floor - startFloor - 1) % 3 === 2;
    const layer: RunNode[] = [];
    const count = isBossLayer ? 1 : randInt(rng, 2, 4);
    for (let i = 0; i < count; i++) {
      const type: NodeType = isBossLayer ? 'boss' : determineNodeType(rng, floor, prevElite);
      if (type === 'elite') prevElite = true;
      const node = makeNode({
        rng, id: `f${floor}n${i}`, floor, nodeIndex: i, type, depth: endFloor,
        unlocked, bossesKilledTotal: meta.bossesKilledTotal, isEndless: true,
      });
      layer.push(node);
      chunk.push(node);
    }
    layers.push(layer);
  }

  linkPair(rng, tail, layers[0]);
  linkLayers(rng, layers);
  return { ...run, map: [...run.map, ...chunk], depth: endFloor };
}

export interface NewRunOptions {
  startedAt?: number;
  isEndless?: boolean;
}

// §3.4 старт забега: партия из выбранных гномов, каждому — 1 randomItem(common) в инвентарь
export function newRun(seed: number, meta: MetaState, partyIds: string[], opts?: NewRunOptions): RunState {
  const isEndless = opts?.isEndless === true && meta.endlessUnlocked;
  // §6.4: глубина ограничена 100 и в старте, и при доращивании карты
  const depth = Math.min(ENDLESS_MAX_DEPTH, getDepth(meta, isEndless, 0));
  const rng = mulberry32(seed);
  const unlocked = meta.unlockedEquipment.length ? meta.unlockedEquipment : defaultUnlockedKeys();
  const { map } = generateMap(seed, depth, unlocked, meta.bossesKilledTotal, isEndless);
  const dwarves = makeParty(partyIds);
  const inventory = [];
  for (let i = 0; i < dwarves.length; i++) {
    const key = randomKey(rng, unlocked, 'common');
    const def = ITEM_TABLE.find((d) => d.key === key)!;
    inventory.push(makeEquipment(def, 1, randInt(rng, 0, 1e9)));
  }
  return {
    runId: `run_${(seed >>> 0).toString(36)}`,
    seed,
    floor: 1,
    depth, // v6.8 Growing Depth: 8 + bossesKilledTotal / 8 + maxDepthEver + endlessFloor
    gold: 0,
    dwarves,
    inventory,
    currentNodeId: map[0].id,
    map,
    status: 'active',
    bossKilled: false,
    elitesKilled: 0,
    bossesKilled: 0,
    startedAt: opts?.startedAt ?? 0,
    isEndless,
    endlessFloor: 0,
    eliteLegacyGranted: false,
    endReason: null, // v6.9 §2.3: заполняется при финале боя
    bonusLegacy: 0, // §6.5: наследие из событий забега
  };
}

function defaultUnlockedKeys(): string[] {
  return ITEM_TABLE.filter((d) => d.rarity === 'common').map((d) => d.key);
}

export function nodeById(run: RunState, id: string): RunNode | null {
  return run.map.find((n) => n.id === id) ?? null;
}

export function mapDepth(run: RunState): number {
  return run.map.reduce((m, n) => Math.max(m, n.floor), 0);
}

// §6.4: legacy = depth × 5 + (bossKilled ? 50 : 0) + (elitesKilled > 0 ? 10 : 0)
// §6.5: + наследие, накопленное событиями забега (награда kind: 'legacy')
export function legacyGain(run: RunState): number {
  return (
    run.depth * 5 +
    (run.bossKilled ? 50 : 0) +
    (run.elitesKilled > 0 ? 10 : 0) +
    (run.bonusLegacy ?? 0)
  );
}
