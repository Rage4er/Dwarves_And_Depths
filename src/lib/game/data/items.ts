// §6.2 Предметы (24) — 7 common, 9 rare, 4 epic, 4 legendary
// Stage: 1 = обычная добыча/лавка, 2 = elite-трофей, 3 = boss/epic-трофей (§3.3.6).
// Статы = базовые × (1 + 0.25 × (stage − 1)).

import type { Effect, Equipment, Rarity, Role, Slot, Tag } from '../types';
import { RARITY_PRICE, RARITY_RANK } from '../types';
import type { PRNG } from '../rng';
import { pick, randInt, weighted } from '../rng';

export interface ItemDef {
  key: string;
  name: string;
  slot: Slot;
  role: Role;
  rarity: Rarity;
  stage: 1 | 2 | 3;
  tags: Tag[];
  atk: number;
  def: number;
  hp: number;
  effects: Effect[];
}

export const ITEM_TABLE: ItemDef[] = [
  // ── Common (7) ──
  { key: 'e_rusty_axe', name: 'Ржавый топор', slot: 'weapon', role: 'warrior', rarity: 'common', stage: 1, tags: ['metal'], atk: 5, def: 0, hp: 0, effects: [] },
  { key: 'e_wood_shield', name: 'Деревянный щит', slot: 'armor', role: 'tank', rarity: 'common', stage: 1, tags: ['wood'], atk: 0, def: 8, hp: 0, effects: [] },
  { key: 'e_short_bow', name: 'Короткий лук', slot: 'weapon', role: 'ranged', rarity: 'common', stage: 1, tags: ['wood'], atk: 4, def: 0, hp: 0, effects: [] },
  { key: 'e_apprentice_staff', name: 'Посох ученика', slot: 'weapon', role: 'mage', rarity: 'common', stage: 1, tags: ['wood'], atk: 4, def: 0, hp: 0, effects: [] },
  { key: 'e_leather_cap', name: 'Кожаный шлем', slot: 'armor', role: 'any', rarity: 'common', stage: 1, tags: ['cloth'], atk: 0, def: 5, hp: 10, effects: [] },
  { key: 'e_lucky_ring', name: 'Кольцо удачи', slot: 'trinket', role: 'any', rarity: 'common', stage: 1, tags: ['metal'], atk: 2, def: 2, hp: 0, effects: [] },
  { key: 'e_bone_charm', name: 'Костяной оберег', slot: 'trinket', role: 'any', rarity: 'common', stage: 1, tags: ['bone'], atk: 3, def: 3, hp: 3, effects: [] },

  // ── Rare (9) ──
  { key: 'e_rune_hammer', name: 'Рунический молот', slot: 'weapon', role: 'warrior', rarity: 'rare', stage: 1, tags: ['metal'], atk: 10, def: 0, hp: 0, effects: [{ type: 'stun', value: 15 }] },
  { key: 'e_tower_shield', name: 'Башенный щит', slot: 'armor', role: 'tank', rarity: 'rare', stage: 1, tags: ['metal'], atk: 0, def: 15, hp: 20, effects: [] },
  { key: 'e_2h_axe', name: 'Двуручный топор', slot: 'weapon', role: 'warrior', rarity: 'rare', stage: 2, tags: ['metal'], atk: 18, def: -5, hp: 0, effects: [{ type: 'splash', value: 30 }] },
  { key: 'e_magnet_shield', name: 'Щит-магнит', slot: 'armor', role: 'tank', rarity: 'rare', stage: 2, tags: ['metal', 'runic'], atk: 0, def: 12, hp: 0, effects: [{ type: 'taunt', value: 2 }] },
  { key: 'e_poison_dagger', name: 'Отравленный кинжал', slot: 'weapon', role: 'warrior', rarity: 'rare', stage: 2, tags: ['metal'], atk: 8, def: 0, hp: 0, effects: [{ type: 'poison', value: 5, chance: 100 }] },
  { key: 'e_fire_staff', name: 'Огненный посох', slot: 'weapon', role: 'mage', rarity: 'rare', stage: 2, tags: ['wood', 'runic'], atk: 12, def: 0, hp: 0, effects: [{ type: 'burn', value: 8, chance: 100 }] },
  { key: 'e_iron_helm', name: 'Железный шлем', slot: 'armor', role: 'any', rarity: 'rare', stage: 2, tags: ['metal'], atk: 0, def: 8, hp: 15, effects: [] },
  { key: 'e_swift_boots', name: 'Быстрые сапоги', slot: 'trinket', role: 'any', rarity: 'rare', stage: 2, tags: ['cloth'], atk: 0, def: 0, hp: 0, effects: [{ type: 'aura_spd', value: 10 }] },
  { key: 'e_healing_charm', name: 'Целительный амулет', slot: 'trinket', role: 'support', rarity: 'rare', stage: 2, tags: ['bone', 'runic'], atk: 0, def: 0, hp: 0, effects: [{ type: 'hp_regen', value: 5 }] },

  // ── Epic (4) ──
  { key: 'e_war_drum', name: 'Барабан войны', slot: 'trinket', role: 'support', rarity: 'epic', stage: 3, tags: ['wood'], atk: 0, def: 0, hp: 0, effects: [{ type: 'aura_spd', value: 15 }] },
  { key: 'e_slayer_axe', name: 'Топор убийцы', slot: 'weapon', role: 'warrior', rarity: 'epic', stage: 3, tags: ['metal'], atk: 22, def: 0, hp: 0, effects: [{ type: 'conditional_atk', value: 50, condition: 'hp_below_30' }] },
  { key: 'e_guardian_plate', name: 'Броня стража', slot: 'armor', role: 'tank', rarity: 'epic', stage: 3, tags: ['metal'], atk: 0, def: 18, hp: 25, effects: [{ type: 'aura_def', value: 10 }] },
  { key: 'e_hunter_bow', name: 'Лук охотника', slot: 'weapon', role: 'ranged', rarity: 'epic', stage: 3, tags: ['wood'], atk: 16, def: 0, hp: 0, effects: [{ type: 'pierce', value: 50 }] },

  // ── Legendary (4) ──
  { key: 'e_vamp_blade', name: 'Клинок вампира', slot: 'weapon', role: 'warrior', rarity: 'legendary', stage: 2, tags: ['metal', 'runic'], atk: 15, def: 0, hp: 0, effects: [{ type: 'lifesteal', value: 50 }] },
  { key: 'e_mithril_beard', name: 'Борода из мифрила', slot: 'rune', role: 'any', rarity: 'legendary', stage: 3, tags: ['metal', 'runic'], atk: 5, def: 5, hp: 5, effects: [{ type: 'extra_slot', value: 0 }] },
  { key: 'e_dragon_scale', name: 'Чешуя дракона', slot: 'armor', role: 'tank', rarity: 'legendary', stage: 3, tags: ['metal'], atk: 0, def: 20, hp: 30, effects: [] },
  { key: 'e_arcane_tome', name: 'Тайный фолиант', slot: 'weapon', role: 'mage', rarity: 'legendary', stage: 3, tags: ['cloth', 'runic'], atk: 18, def: 0, hp: 0, effects: [{ type: 'double_strike', value: 50 }] },
];

// seq — детерминированный инкремент из PRNG вызывающего (одинаковый seed → одинаковые id,
// ТЗ §2.4/§3.1.8: simulateRun(42) дважды → diff пустой)
export function makeEquipment(def: ItemDef, stage?: 1 | 2 | 3, seq: number | string = 0): Equipment {
  const s = stage ?? def.stage;
  const mult = 1 + 0.25 * (s - 1);
  return {
    id: `${def.key}#${s}#${seq}`,
    name: def.name,
    slot: def.slot,
    role: def.role,
    atk: Math.round(def.atk * mult),
    def: Math.round(def.def * mult),
    hp: Math.round(def.hp * mult),
    effects: def.effects.map((e) => ({ ...e })),
    rarity: def.rarity,
    tags: [...def.tags],
    stage: s,
  };
}

// §3.3.2: цены по редкости, без надбавки за stage
export function itemPrice(item: Equipment): number {
  return RARITY_PRICE[item.rarity];
}

export function sellPrice(item: Equipment): number {
  return Math.floor(itemPrice(item) / 2);
}

// §6.5 rarity++: +25% статов, +1 случайный эффект из пула новой редкости, stage не трогается
export const RARITY_EFFECT_POOL: Record<Exclude<Rarity, 'common'>, Effect[]> = {
  rare: [
    { type: 'stun', value: 15 },
    { type: 'double_strike', value: 20 },
    { type: 'burn', value: 5, chance: 100 },
    { type: 'poison', value: 3, chance: 100 },
    { type: 'taunt', value: 2 },
    { type: 'aura_spd', value: 10 },
  ],
  epic: [
    { type: 'splash', value: 25 },
    { type: 'pierce', value: 40 },
    { type: 'lifesteal', value: 20 },
    { type: 'aura_atk', value: 15 },
    { type: 'aura_def', value: 15 },
    { type: 'conditional_atk', value: 30, condition: 'hp_below_30' },
  ],
  legendary: [
    { type: 'lifesteal', value: 30 },
    { type: 'double_strike', value: 50 },
    { type: 'splash', value: 30 },
    { type: 'hp_regen', value: 5 },
    { type: 'stun', value: 25 },
  ],
};

export function nextRarity(r: Rarity): Rarity | null {
  return r === 'common' ? 'rare' : r === 'rare' ? 'epic' : r === 'epic' ? 'legendary' : null;
}

export function forgeCost(r: Rarity): number {
  return r === 'common' ? 10 : r === 'rare' ? 20 : r === 'epic' ? 40 : 0;
}

export function rarityUpgrade(item: Equipment, rng: PRNG): Equipment | null {
  const next = nextRarity(item.rarity);
  if (!next) return null;
  const bonus = pick(rng, RARITY_EFFECT_POOL[next as Exclude<Rarity, 'common'>]);
  return {
    ...item,
    name: item.name,
    rarity: next,
    atk: Math.round(item.atk * 1.25),
    def: Math.round(item.def * 1.25),
    hp: Math.round(item.hp * 1.25),
    effects: [...item.effects.map((e) => ({ ...e })), { ...bonus }],
  };
}

export function rollRarity(rng: PRNG, difficulty: number): Rarity {
  const d = Math.min(difficulty, 11);
  return weighted<Rarity>(rng, [
    ['common', Math.max(10, 62 - d * 5)],
    ['rare', 25 + d],
    ['epic', 10 + d * 1.5],
    ['legendary', 3 + d],
  ]);
}

export function randomItemDef(rng: PRNG, difficulty: number, unlocked: string[]): ItemDef {
  const rarity = rollRarity(rng, difficulty);
  const slot = pick(rng, ['weapon', 'weapon', 'weapon', 'armor', 'armor', 'armor', 'trinket', 'trinket', 'rune'] as Slot[]);
  const inPool = ITEM_TABLE.filter(
    (d) => d.slot === slot && d.rarity === rarity && unlocked.includes(d.key),
  );
  const byRarity = ITEM_TABLE.filter((d) => d.rarity === rarity && unlocked.includes(d.key));
  const bySlot = ITEM_TABLE.filter((d) => d.slot === slot && unlocked.includes(d.key));
  const pool = inPool.length ? inPool : byRarity.length ? byRarity : bySlot.length ? bySlot : ITEM_TABLE.filter((d) => unlocked.includes(d.key));
  return pick(rng, pool);
}

export function rollItemStage(rng: PRNG, difficulty: number, isElite: boolean, isBoss: boolean): 1 | 2 | 3 {
  if (isBoss) return 3;
  if (isElite) return randInt(rng, 2, 3) as 1 | 2 | 3;
  return rng() < Math.min(0.35, difficulty * 0.05) ? 2 : 1;
}

export function randomItem(
  rng: PRNG,
  difficulty: number,
  unlocked: string[],
  opts?: { isElite?: boolean; isBoss?: boolean; rarity?: Rarity },
): Equipment {
  let def = randomItemDef(rng, difficulty, unlocked);
  if (opts?.rarity) {
    const forced = ITEM_TABLE.filter((d) => d.rarity === opts.rarity && unlocked.includes(d.key));
    if (forced.length) def = pick(rng, forced);
  }
  const stage = rollItemStage(rng, difficulty, opts?.isElite ?? false, opts?.isBoss ?? false);
  return makeEquipment(def, Math.max(def.stage, stage) as 1 | 2 | 3, randInt(rng, 0, 1e9));
}

export function itemByCatalogId(key: string, stage?: 1 | 2 | 3, seq: number | string = 0): Equipment | null {
  const def = ITEM_TABLE.find((d) => d.key === key);
  return def ? makeEquipment(def, stage, seq) : null;
}

export function defByCatalogId(key: string): ItemDef | null {
  return ITEM_TABLE.find((d) => d.key === key) ?? null;
}

// Первично открыты все common (лавка и стартовые награды работают с первого забега)
export function defaultUnlockedEquipment(): string[] {
  return ITEM_TABLE.filter((d) => d.rarity === 'common').map((d) => d.key);
}

export function itemPower(item: Equipment): number {
  return item.atk * 2 + item.def * 2 + item.hp + RARITY_RANK[item.rarity] * 10;
}

export function itemSummary(item: Equipment): string {
  const parts: string[] = [];
  if (item.atk) parts.push(`АТК +${item.atk}`);
  if (item.def) parts.push(`ЗЩ +${item.def}`);
  if (item.hp) parts.push(`HP +${item.hp}`);
  for (const e of item.effects) {
    if (e.type === 'extra_slot') parts.push('доп. слот');
    else if (e.type === 'taunt') parts.push(`провокация ${e.value}х`);
    else if (e.type === 'hp_regen') parts.push(`реген ${e.value}/ход`);
    else if (e.type === 'poison' || e.type === 'burn') parts.push(`${e.type === 'poison' ? 'яд' : 'горение'} ${e.value}/ход${e.chance ? ` ${e.chance}%` : ''}`);
    else parts.push(`${e.value}% ${e.type}`);
  }
  return parts.join(', ') || '—';
}
