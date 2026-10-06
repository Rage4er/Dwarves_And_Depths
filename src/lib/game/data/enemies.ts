// §6.3 Enemy seed table — 8 типов; spawn-функции §6.3.1 (v6.8: скейл HP и ATK)

import type { Effect, Enemy, Position, AttackType } from '../types';
import type { PRNG } from '../rng';
import { pick, randInt } from '../rng';

export type EnemyKind =
  | 'e_rat' | 'e_goblin' | 'e_spider' | 'e_slime' | 'e_orc' | 'e_golem' | 'e_heart'
  | 'e_forge_demon' // v6.8: финальный босс (§1.1, §6.3)
  | 'e_archer_goblin' | 'e_shaman' // v7.0 §6.3: ranged-враги
  | 'e_ancient'; // v6.9 §6.3: эпический финал таймаута босс-боя — вне пулов и спавна

export interface EnemyDef {
  id: EnemyKind;
  name: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  speed: number;
  position: Position;
  attackType: AttackType; // v7.0
  attackRange: number; // v7.0: 80 melee, 260 ranged
  effects: Effect[];
  isBoss?: boolean;
  isElite?: boolean;
}

export const ENEMY_TABLE: Record<EnemyKind, EnemyDef> = {
  e_rat: { id: 'e_rat', name: 'Крыса', baseHP: 150, baseATK: 5, baseDEF: 2, speed: 8, position: 'front', attackType: 'melee', attackRange: 80, effects: [] },
  e_goblin: { id: 'e_goblin', name: 'Гоблин', baseHP: 200, baseATK: 7, baseDEF: 3, speed: 10, position: 'front', attackType: 'melee', attackRange: 80, effects: [] },
  // v7.0: стреляет из тыла — урон ×0.7, но достаёт по любой линии
  e_archer_goblin: { id: 'e_archer_goblin', name: 'Гоблин-лучник', baseHP: 150, baseATK: 8, baseDEF: 2, speed: 11, position: 'back', attackType: 'ranged', attackRange: 260, effects: [] },
  e_spider: { id: 'e_spider', name: 'Паук', baseHP: 175, baseATK: 6, baseDEF: 2, speed: 12, position: 'mid', attackType: 'melee', attackRange: 80, effects: [{ type: 'poison', value: 5, chance: 20 }] },
  e_slime: { id: 'e_slime', name: 'Слизень', baseHP: 300, baseATK: 4, baseDEF: 8, speed: 4, position: 'front', attackType: 'melee', attackRange: 80, effects: [{ type: 'hp_regen', value: 3 }] },
  e_orc: { id: 'e_orc', name: 'Орк', baseHP: 400, baseATK: 12, baseDEF: 6, speed: 7, position: 'front', attackType: 'melee', attackRange: 80, effects: [] },
  // v7.0: колдовская поддержка в тылу — слабый удар + яд
  e_shaman: { id: 'e_shaman', name: 'Шаман', baseHP: 225, baseATK: 6, baseDEF: 4, speed: 8, position: 'back', attackType: 'ranged', attackRange: 260, effects: [{ type: 'poison', value: 4, chance: 30 }] },
  e_golem: { id: 'e_golem', name: 'Голем', baseHP: 750, baseATK: 15, baseDEF: 12, speed: 5, position: 'front', attackType: 'melee', attackRange: 80, effects: [{ type: 'stun', value: 20 }], isElite: true },
  e_heart: { id: 'e_heart', name: 'Сердце Глубин', baseHP: 1500, baseATK: 20, baseDEF: 15, speed: 6, position: 'front', attackType: 'melee', attackRange: 80, effects: [{ type: 'splash', value: 30 }], isBoss: true },
  // v6.8 §1.1/§6.3: HP 500, ATK 20, DEF 12, summon — победа открывает бесконечный режим
  e_forge_demon: { id: 'e_forge_demon', name: 'Демон Кузни', baseHP: 2500, baseATK: 20, baseDEF: 12, speed: 5, position: 'front', attackType: 'melee', attackRange: 80, effects: [{ type: 'summon', value: 10 }], isBoss: true },
  // v6.9 §6.3: Древний — непобедимый страж Глубин; в боях не спавнится, существует
  // как событие финала босс-боя по лимиту ходов (§3.1.1), наград не даёт
  e_ancient: { id: 'e_ancient', name: 'Древний', baseHP: 9999, baseATK: 999, baseDEF: 999, speed: 10, position: 'front', attackType: 'melee', attackRange: 80, effects: [], isBoss: true },
};

// §6.3.1: scaleHP = 1 + floor × 0.05; scaleATK = 1 + floor × 0.04
export function spawnEnemy(id: EnemyKind, floor: number, index: number): Enemy {
  const template = ENEMY_TABLE[id];
  if (!template) throw new Error(`Unknown enemy: ${id}`);
  const scaleHP = 1 + floor * 0.05;
  const scaleATK = 1 + floor * 0.04;
  return {
    id: template.id,
    name: template.name,
    baseHP: template.baseHP,
    baseATK: Math.round(template.baseATK * scaleATK),
    baseDEF: template.baseDEF,
    speed: template.speed,
    attackType: template.attackType,
    attackRange: template.attackRange,
    effects: template.effects.map((e) => ({ ...e })),
    statusEffects: [],
    isBoss: !!template.isBoss,
    isElite: !!template.isElite,
    position: template.position,
    currentHP: Math.round(template.baseHP * scaleHP),
    isAlive: true,
    // position из таблицы; дубликаты сдвигаем в глубину, чтобы линии не пустовали
    ...(index > 0 ? { position: shiftPosition(template.position, index) } : {}),
  };
}

// v6.9 §6.3.1: Древний — без скейла HP/ATK от floor (константы 9999/999/999);
// не входит в poolFor/bossForFloor/spawnGroup — вызывается только движком финала
export function spawnAncient(): Enemy {
  const t = ENEMY_TABLE.e_ancient;
  return {
    id: t.id,
    name: t.name,
    baseHP: t.baseHP,
    baseATK: t.baseATK,
    baseDEF: t.baseDEF,
    speed: t.speed,
    attackType: t.attackType,
    attackRange: t.attackRange,
    effects: [],
    statusEffects: [],
    isBoss: true,
    isElite: false,
    position: t.position,
    currentHP: t.baseHP,
    isAlive: true,
  };
}

// Превью для экрана подготовки (§4.3): скейл по слою узла
export function enemyPreview(id: EnemyKind, floor: number): { name: string; hp: number; atk: number; def: number; speed: number } {
  const template = ENEMY_TABLE[id];
  return {
    name: template.name,
    hp: Math.round(template.baseHP * (1 + floor * 0.05)),
    atk: Math.round(template.baseATK * (1 + floor * 0.04)),
    def: template.baseDEF,
    speed: template.speed,
  };
}

function shiftPosition(p: Position, i: number): Position {
  if (p === 'front') return i % 3 === 1 ? 'mid' : 'back';
  if (p === 'mid') return 'back';
  return 'front';
}

// §6.3 таблица пулов по слоям (v6.8; v7.0: лучник с floor 3, шаман с floor 6)
const POOLS: { maxFloor: number; pool: EnemyKind[] }[] = [
  { maxFloor: 1, pool: ['e_rat', 'e_goblin'] },
  { maxFloor: 2, pool: ['e_rat', 'e_goblin', 'e_slime'] },
  { maxFloor: 4, pool: ['e_goblin', 'e_spider', 'e_slime', 'e_archer_goblin'] },
  { maxFloor: 5, pool: ['e_spider', 'e_slime', 'e_orc'] },
  { maxFloor: 6, pool: ['e_spider', 'e_orc', 'e_slime', 'e_shaman'] },
  { maxFloor: 7, pool: ['e_orc', 'e_spider', 'e_slime', 'e_shaman'] },
  { maxFloor: 8, pool: ['e_orc', 'e_golem', 'e_spider', 'e_archer_goblin'] },
  { maxFloor: 9, pool: ['e_orc', 'e_golem', 'e_slime', 'e_shaman'] },
  { maxFloor: 10, pool: ['e_golem', 'e_orc'] },
];

// Слои 11+ и 16+: голем/орк/сердце как обычные враги (скейл по depth §6.3.1)
const DEEP_POOL: EnemyKind[] = ['e_golem', 'e_orc', 'e_heart'];

export function poolFor(floor: number): EnemyKind[] {
  const row = POOLS.find((r) => floor <= r.maxFloor);
  return row ? row.pool : DEEP_POOL;
}

// Цикл боссов §6.3.2: (floor − 8) mod 3; e_forge_demon — финальный босс обычного забега
const BOSS_CYCLE: EnemyKind[] = ['e_orc', 'e_golem', 'e_heart'];

export function bossForFloor(floor: number, bossesKilledTotal: number, isEndless: boolean): EnemyKind {
  if (!isEndless && bossesKilledTotal >= 5) return 'e_forge_demon';
  const idx = (((floor - 8) % 3) + 3) % 3;
  return BOSS_CYCLE[idx];
}

// §6.3 Число врагов: v7.1 — 1.5 врага на гнома, + floor/3, элита ×1.5
export function enemyCount(floor: number, isElite: boolean, dwarfCount: number): number {
  const base = Math.round(dwarfCount * 1.5);
  const floorBonus = Math.floor(floor / 3);
  const eliteMod = isElite ? 1.5 : 1.0;
  const raw = Math.round((base + floorBonus) * eliteMod);
  return Math.max(3, Math.min(20, raw));
}

// Пошаговая адаптация §6.3/§3.1.1: в реалтайме гном бьёт 2–3 раза/сек и держит 8–15 врагов,
// в пошаговом — 1 удар/раунд, поэтому целевой состав масштабируется коэффициентом темпа
// (волны: передовой отряд 3 + по 1 подкреплению в раунд, не больше WAVE_ALIVE_CAP живых).
// Минимум 2, не 3: на floor 1 у отряда ещё нет снаряжения — замер мин-3 дал 1/10 побед
// (каскад ранних потерь), против 5/10 базлайна; с floor 2 состав и так ≥ 3
export const WAVE_SCALE = 0.3;
export const WAVE_CAP = 8;
export function battleWaveTotal(floor: number, isElite: boolean, dwarfCount: number): number {
  return Math.min(WAVE_CAP, Math.max(2, Math.round(enemyCount(floor, isElite, dwarfCount) * WAVE_SCALE)));
}

// §3.1.1: состав волны фиксируется при генерации карты (enemyIds узла);
// spawnGroup остаётся фолбэком для боёв без зафиксированного списка
export function spawnGroup(
  rng: PRNG,
  floor: number,
  kind: 'battle' | 'elite' | 'boss',
  enemyIds?: string[],
): Enemy[] {
  if (enemyIds && enemyIds.length) return enemyIds.map((id, i) => spawnEnemy(id as EnemyKind, floor, i));
  if (kind === 'boss') return [spawnEnemy('e_heart', floor, 0)];
  if (kind === 'elite') {
    const extra = randInt(rng, 0, 1);
    const out = [spawnEnemy('e_golem', floor, 0)];
    for (let i = 0; i < extra; i++) out.push(spawnEnemy(pick(rng, poolFor(floor)), floor, i + 1));
    return out;
  }
  const count = floor <= 2 ? randInt(rng, 1, 2) : randInt(rng, 1, 3);
  const pool = poolFor(floor);
  const out: Enemy[] = [];
  for (let i = 0; i < count; i++) out.push(spawnEnemy(pick(rng, pool), floor, i));
  return out;
}

// §3.3.7 (v6.8): бой 5+floor×2, элита 10+floor×3, босс 20+depth×2
export function nodeGold(type: 'battle' | 'elite' | 'boss', floor: number, depth: number): number {
  if (type === 'boss') return 20 + depth * 2;
  if (type === 'elite') return 10 + floor * 3;
  return 5 + floor * 2;
}
