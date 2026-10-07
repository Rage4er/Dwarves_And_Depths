// §3.1 Боевой движок — чистая симуляция (POJO, без DOM/Phaser)
// Один seed → один исход (§2.4). simulateRun(42) дважды → diff пустой (§3.1.8).

import type {
  BattleEvent, BattleResult, BattleState, Combatant, Dwarf, Effect, Enemy,
  Position, StatusEffect,
} from '../types';
import { HP_REGEN_CAP, ENEMY_HP_REGEN_CAP, POSITION_DAMAGE } from '../types';
import { mulberry32, pick, randInt, type PRNG } from '../rng';
import { spawnGroup, spawnEnemy, ENEMY_TABLE, type EnemyKind } from '../data/enemies';
import { dwarfStats, equipEffects } from './stats';
import { evaluateSynergies } from '../data/synergies';

const DEFAULT_STATUS_DURATION = 3;
// v6.9 §3.1.1: финал таймаута босс-боя — Древний бьёт всех юнитов на 999
const ANCIENT_STRIKE = 999;
const ANCIENT_NAME = ENEMY_TABLE.e_ancient.name;
// §3.1.1 пошаговая адаптация потока: передовой отряд, подкрепления — по 1 врагу в раунд
// (аналог SPAWN_INTERVAL 500 мс; вариант 300 мс при floor ≥ 8 непосилен при 1 действии/раунд)
// фронт 3 — по итерации пользователя: бой открывается тремя врагами; замер §7:
// win rate 5/10 и те же финальные этажи, что с фронтом 2 (кап 3 делает давление тем же)
const WAVE_FRONT = 3;
const WAVE_PER_ROUND = 1;
// живых врагов одновременно не больше 3 (пошаговый эквивалент контакта потока:
// держим давление как в старом максимуме 3 врага, но суммарный состав больше;
// кап 4 проверен замером — win rate падает до 4/10, оставлен кап 3)
const WAVE_ALIVE_CAP = 3;
// v7.0 §6.4: ranged-враги (лучник, шаман) бьют ×0.7 (реалтайм-штраф дальнего боя),
// но игнорируют позиционный множитель линии цели — «снайпят» по любому гному
const RANGED_ATTACK_MULT = 0.7;

// §3.1 Реалтайм: фиксированный шаг симуляции
export const FIXED_TIMESTEP_MS = 1000 / 60; // 16.667 мс, 60 тиков/сек
const MAX_TICKS_PER_FRAME = 4;

function clone<T>(v: T): T {
  return structuredClone(v);
}

// §2.3: инициализация taunt-таймеров для BattleState (deep-copy, без мутации исходника)
// Экспортирован для переиспользования в BattleScreen и simulateBattle (§3.1.9)
export function initTauntState(b: BattleState): BattleState {
  const s = clone(b);
  for (const a of s.allies) {
    if (a.alive) {
      const taunt = a.effects.find((e) => e.type === 'taunt');
      if (taunt) a.tauntLeft = taunt.value;
    }
  }
  return s;
}

// §3.1: speed = base + equipMod + rand(seed, 0..3); roll на каждый бой
function speedRoll(rng: PRNG, base: number, bonusPct: number): number {
  return Math.max(1, Math.round((base + randInt(rng, 0, 3)) * (1 + bonusPct / 100)));
}

function totalAura(effects: Effect[], type: Effect['type']): number {
  return effects.filter((e) => e.type === type).reduce((s, e) => s + e.value, 0);
}

function toCombatant(
  dwarf: Dwarf,
  index: number,
  rng: PRNG,
  synAtk: number,
  synDef: number,
  synSpd: number,
): Combatant {
  const stats = dwarfStats(dwarf);
  const effects = equipEffects(dwarf);
  const auraAtk = totalAura(effects, 'aura_atk');
  const auraDef = totalAura(effects, 'aura_def');
  const auraSpd = totalAura(effects, 'aura_spd');
  return {
    uid: dwarf.id,
    side: 'ally',
    name: dwarf.name,
    hp: Math.max(1, Math.round(dwarf.currentHP)),
    hpMax: stats.hp,
    atk: Math.round(stats.atk * (1 + auraAtk / 100) * synAtk),
    def: Math.max(0, Math.round(stats.def * (1 + auraDef / 100) * synDef)),
    speed: speedRoll(rng, dwarf.baseSpeed, auraSpd + (synSpd - 1) * 100),
    position: dwarf.position,
    alive: dwarf.isAlive,
    statuses: clone(dwarf.statusEffects),
    effects,
    role: dwarf.role,
    iconSeed: index + 1,
    tauntLeft: 0,
    x: 0,
    y: 0,
    attackCooldown: 0,
  };
}

function toFoeCombatant(enemy: Enemy, index: number): Combatant {
  return {
    uid: `${enemy.id}_${index}`,
    side: 'foe',
    name: enemy.name,
    hp: enemy.currentHP,
    hpMax: enemy.currentHP,
    atk: enemy.baseATK,
    def: enemy.baseDEF,
    speed: enemy.speed,
    position: enemy.position,
    alive: enemy.isAlive,
    statuses: [],
    effects: enemy.effects.map((e) => ({ ...e })),
    role: 'any',
    iconSeed: index + 7,
    tauntLeft: 0,
    attackType: enemy.attackType,
    isBoss: enemy.isBoss,
    isElite: enemy.isElite,
    x: 0,
    y: 0,
    attackCooldown: 0,
  };
}

export function createBattle(
  dwarves: Dwarf[],
  enemyIds: EnemyKind[],
  floor: number,
  seed: number,
): BattleState {
  const rng = mulberry32(seed);
  const syn = evaluateSynergies({
    partyRoles: dwarves.filter((d) => d.isAlive).map((d) => ({ role: d.role, position: d.position })),
    partyTags: dwarves.filter((d) => d.isAlive).flatMap((d) => d.equipment.flatMap((e) => e.tags)),
  });
  const allies = dwarves
    .filter((d) => d.isAlive && d.currentHP > 0)
    .map((d, i) => toCombatant(d, i, rng,
      (syn.atkMultByRole[d.role] ?? 1) * syn.atkMultAll,
      syn.defMultByRole[d.role] ?? 1,
      syn.spdMultByRole[d.role] ?? 1,
    ));
  const kind = enemyIds.some((id) => ENEMY_TABLE[id as EnemyKind]?.isBoss)
    ? 'boss'
    : enemyIds.some((id) => ENEMY_TABLE[id as EnemyKind]?.isElite)
      ? 'elite'
      : 'battle';
  const groupIds: EnemyKind[] = enemyIds.length
    ? (enemyIds as EnemyKind[])
    : (spawnGroup(mulberry32(seed ^ 0x5f3759df), floor, kind).map((e) => e.id) as EnemyKind[]);
  // босс — соло (его поток — summon, §2.3); обычный бой/элита — передовой отряд + резерв подкреплений
  const front = kind === 'boss' ? groupIds.length : Math.min(WAVE_FRONT, groupIds.length);
  const foes = groupIds.slice(0, front).map((id, i) => toFoeCombatant(spawnEnemy(id, floor, i), i));
  return {
    seed,
    timeElapsed: 0,
    spawnTimer: 0,
    poisonBurnTimer: 0,
    regenTimer: 0,
    tauntMemory: null,
    summonTimer: 0,
    allies,
    foes,
    status: 'active',
    log: [],
    floor,
    endReason: null,
    enemiesTotal: groupIds.length,
    enemiesSpawned: front,
    enemyReserve: groupIds.slice(front),
    tick: 0,
  };
}

function aliveIn(side: Combatant[], pos?: Position): Combatant[] {
  return side.filter((c) => c.alive && (!pos || c.position === pos));
}

// §3.1.5 приоритет цели: провокация → front → mid → back; внутри линии — PRNG.
// v7.0: ranged-враги выбирают цель среди ВСЕХ живых гномов без приоритета линий
// (пошаговый аналог «стреляет по ближайшему в attackRange 260» — тыл не укрытие),
// провокация приоритетна для них по-прежнему
function chooseTarget(rng: PRNG, actor: Combatant, enemies: Combatant[]): Combatant | null {
  if (actor.side === 'foe') {
    const taunts = aliveIn(enemies).filter((c) => c.tauntLeft > 0);
    if (taunts.length) return pick(rng, taunts);
    const alive = aliveIn(enemies);
    if (actor.attackType === 'ranged') return alive.length ? pick(rng, alive) : null;
  }
  for (const line of ['front', 'mid', 'back'] as Position[]) {
    const candidates = aliveIn(enemies, line);
    if (candidates.length) return pick(rng, candidates);
  }
  return null;
}

function applyDamage(c: Combatant, dmg: number): void {
  c.hp = Math.max(0, c.hp - dmg);
  if (c.hp <= 0) {
    c.alive = false;
    c.statuses = [];
  }
}

function heal(c: Combatant, amount: number): void {
  if (!c.alive) return;
  c.hp = Math.min(c.hpMax, c.hp + amount);
}

function addStatus(target: Combatant, type: StatusEffect['type'], value: number, turns: number): void {
  const existing = target.statuses.find((s) => s.type === type);
  if (existing) {
    existing.remainingTurns = Math.max(existing.remainingTurns, turns);
    existing.value = Math.max(existing.value, value);
  } else {
    target.statuses.push({ id: `${type}_${target.uid}`, type, remainingTurns: turns, value });
  }
}

function rolled(rng: PRNG, e: Effect): boolean {
  const chance = e.chance ?? 100;
  return chance >= 100 || rng() * 100 < chance;
}

// §6.4: minDamage(floor) = max(1, floor/2) — удары не слабее пыли с глубиной
function minDamage(floor: number): number {
  return Math.max(1, Math.floor(floor / 2));
}

function strike(
  rng: PRNG,
  actor: Combatant,
  target: Combatant,
  targetTeam: Combatant[],
  log: BattleEvent[],
  floor: number,
): void {
  const pierce = actor.effects
    .filter((e) => e.type === 'pierce')
    .reduce((m, e) => Math.max(m, e.value), 0);
  let atk = actor.atk;
  for (const e of actor.effects) {
    if (e.type === 'conditional_atk' && actor.hp < actor.hpMax * 0.3) {
      atk = Math.round(atk * (1 + e.value / 100));
    }
  }
  // §3.1: rawDmg = ATK − DEF×(1 − pierce/100); <minDamage → minDamage(floor) §6.4;
  // позиция цели — множитель получаемого (аналог RANGED_DMG_MODIFIER в пошаговой системе).
  // v7.0: ranged-враги — ×0.7 без позиционного множителя (стрела достаёт по любой линии)
  const raw =
    actor.attackType === 'ranged'
      ? Math.max(minDamage(floor), Math.round((atk - target.def * (1 - pierce / 100)) * RANGED_ATTACK_MULT))
      : Math.max(
          minDamage(floor),
          Math.round((atk - target.def * (1 - pierce / 100)) * POSITION_DAMAGE[target.position]),
        );
  applyDamage(target, raw);
  log.push({ kind: 'hit', actor: actor.name, target: target.name, value: raw, text: `${actor.name} → ${target.name}: −${raw}` });
  if (!target.alive) log.push({ kind: 'death', target: target.name, text: `${target.name} погибает` });

  for (const e of actor.effects) {
    if (!target.alive) break;
    if (e.type === 'lifesteal' && rolled(rng, e)) {
      const healed = Math.max(1, Math.round(raw * e.value / 100));
      heal(actor, healed);
      log.push({ kind: 'lifesteal', actor: actor.name, value: healed, text: `${actor.name} впитывает ${healed}` });
    } else if ((e.type === 'poison' || e.type === 'burn') && rolled(rng, e)) {
      addStatus(target, e.type, e.value, e.duration ?? DEFAULT_STATUS_DURATION);
      log.push({
        kind: 'status', actor: actor.name, target: target.name,
        text: `${target.name}: ${e.type === 'poison' ? 'отравление' : 'горение'} ${e.value}/ход`,
      });
    } else if (e.type === 'stun' && rolled(rng, e)) {
      addStatus(target, 'stun', 0, 1);
      log.push({ kind: 'stun', actor: actor.name, target: target.name, text: `${target.name} оглушён` });
    }
  }

  for (const e of actor.effects) {
    if (e.type !== 'splash') continue;
    for (const nb of targetTeam.filter((c) => c.alive && c !== target && c.position === target.position)) {
      const dmg = Math.max(1, Math.round(raw * e.value / 100));
      applyDamage(nb, dmg);
      log.push({ kind: 'splash', actor: actor.name, target: nb.name, value: dmg, text: `${actor.name} → ${nb.name} (по площади): −${dmg}` });
      if (!nb.alive) log.push({ kind: 'death', target: nb.name, text: `${nb.name} погибает` });
    }
  }

  for (const e of actor.effects) {
    if (e.type === 'double_strike' && target.alive && rolled(rng, e)) {
      const dmg = Math.max(1, Math.round(raw * 0.5));
      applyDamage(target, dmg);
      log.push({ kind: 'double', actor: actor.name, target: target.name, value: dmg, text: `${actor.name} бьёт дважды: −${dmg}` });
      if (!target.alive) log.push({ kind: 'death', target: target.name, text: `${target.name} погибает` });
    }
  }
}

// §6.4 v6.9: сумма hp_regen с капом по стороне (гном 3 / враг 2) — стек предметов не пробивает лимит
export function calculateHpRegen(unit: Combatant): number {
  const cap = unit.side === 'ally' ? HP_REGEN_CAP : ENEMY_HP_REGEN_CAP;
  const total = unit.effects
    .filter((e) => e.type === 'hp_regen')
    .reduce((sum, e) => sum + e.value, 0);
  return Math.min(total, cap);
}

function finishActorTurn(actor: Combatant, log: BattleEvent[]): void {
  // §3.1.9: hp_regen срабатывает В КОНЦЕ хода носителя, только пока жив
  const regen = calculateHpRegen(actor);
  if (regen > 0 && actor.alive) {
    heal(actor, regen);
    log.push({ kind: 'regen', actor: actor.name, value: regen, text: `${actor.name} восстанавливает ${regen}` });
  }
}

export function simulateBattleTick(state: BattleState, dt: number, prng: PRNG): BattleState {
  const s = clone(state);
  // §3.1.2.1: timeElapsed += dt — ВСЕГДА, даже если бой завершён
  s.timeElapsed += dt;
  s.spawnTimer -= dt;
  s.poisonBurnTimer -= dt;
  s.regenTimer -= dt;
  s.summonTimer -= dt;
  if (s.status !== 'active') return s;
  const rng = prng; // используем переданный PRNG для детерминизма
  const log: BattleEvent[] = [];

  // §3.1.1: подкрепления входят в начале раунда (пошаговый аналог спавна раз в 500 мс),
  // пока не исчерпан резерв и живых врагов меньше капа; состав зафиксирован на карте —
  // без бросков rng, детерминизм не нарушается
  if (s.enemyReserve.length) {
    const room = Math.max(0, WAVE_ALIVE_CAP - s.foes.filter((c) => c.alive).length);
    const arriving = Math.min(room, WAVE_PER_ROUND, s.enemyReserve.length);
    for (let i = 0; i < arriving; i++) {
      const id = s.enemyReserve.shift() as EnemyKind;
      const foe = toFoeCombatant(spawnEnemy(id, s.floor, s.foes.length), s.foes.length);
      s.foes.push(foe);
      s.enemiesSpawned += 1;
      log.push({ kind: 'status', actor: 'Подкрепление', text: `Из туннелей выбирается ${foe.name}!` });
    }
  }

  const order = [...s.allies, ...s.foes]
    .filter((c) => c.alive)
    .sort((a, b) => b.speed - a.speed || (a.side === 'ally' ? -1 : 1));

  for (const actor of order) {
    if (!actor.alive) continue;
    const enemies = actor.side === 'ally' ? s.foes : s.allies;
    const ownTeam = actor.side === 'ally' ? s.allies : s.foes;

    // DOT-тики в начале хода носителя (§3.1.9)
    let dotDied = false;
    for (const st of actor.statuses) {
      if (st.type === 'poison' || st.type === 'burn' || st.type === 'bleed') {
        applyDamage(actor, st.value);
        log.push({ kind: 'dot', actor: actor.name, value: st.value, text: `${st.type === 'poison' ? 'Яд' : 'Горение'}: ${actor.name} −${st.value}` });
        st.remainingTurns -= 1;
        if (!actor.alive) { dotDied = true; break; }
      }
    }
    actor.statuses = actor.statuses.filter((st) => st.remainingTurns > 0);
    if (dotDied) {
      log.push({ kind: 'death', target: actor.name, text: `${actor.name} погибает` });
      continue;
    }
    if (actor.statuses.some((st) => st.type === 'stun')) {
      actor.statuses = actor.statuses.filter((st) => st.type !== 'stun');
      log.push({ kind: 'stun', actor: actor.name, text: `${actor.name} пропускает ход` });
      continue;
    }

    // §3.1.5: taunt — форс цели, пока жив провокатор и не истекла длительность
    if (actor.side === 'foe') {
      const taunters = s.allies.filter((c) => c.alive && c.tauntLeft > 0);
      if (taunters.length) {
        strike(rng, actor, pick(rng, taunters), ownTeam, log, s.floor);
        finishActorTurn(actor, log);
        continue;
      }
    }

    const target = chooseTarget(rng, actor, enemies);
    if (!target) break;
    strike(rng, actor, target, ownTeam, log, s.floor);
    finishActorTurn(actor, log);

    // §2.3: summon — призыв подмоги (не больше 4 живых врагов, значение = HP);
    // так реализован эффект Демона Кузни в пошаговой системе
    const summon = actor.effects.find((e) => e.type === 'summon');
    if (summon && actor.side === 'foe' && actor.alive && s.foes.filter((c) => c.alive).length < 4) {
      const minion = toFoeCombatant(spawnEnemy('e_rat', s.floor, s.foes.length), s.foes.length);
      const hp = Math.max(2, Math.round(summon.value * (1 + s.floor * 0.08)));
      minion.uid = `${actor.uid}_sm${s.foes.length}`;
      minion.hp = hp;
      minion.hpMax = hp;
      s.foes.push(minion);
      log.push({ kind: 'status', actor: actor.name, text: `${actor.name} призывает подмогу!` });
    }

    if ((s.foes.every((c) => !c.alive) && !s.enemyReserve.length) || s.allies.every((c) => !c.alive)) break;
  }

  for (const c of [...s.allies, ...s.foes]) {
    if (c.alive && c.tauntLeft > 0) c.tauntLeft -= 1;
  }

  // лимит времени: если за отведённое время ни одна сторона не решила бой —
  // поражение, иначе «танк против брони» может длиться бесконечно.
  // v6.9 §3.1.1: таймаут — сюжетный финал (обвал / Древний), не «просто поражение»
  const battleTimeLimit = s.foes.some((c) => c.isBoss) ? 60000 : 30000;
  const warnTime = battleTimeLimit - 5000;
  if (s.foes.every((c) => !c.alive) && !s.enemyReserve.length) s.status = 'won';
  else if (s.allies.every((c) => !c.alive)) s.status = 'lost';
  else if (s.timeElapsed >= warnTime && s.timeElapsed < warnTime + FIXED_TIMESTEP_MS) {
    // предупреждение перед финалом (последние 5 секунд)
    log.push({ kind: 'turn', text: 'Глубины пробуждаются…' });
  } else if (s.timeElapsed >= battleTimeLimit) {
    s.status = 'timeout';
    const ancient = s.foes.some((c) => c.isBoss);
    s.endReason = ancient ? 'timeout_ancient' : 'timeout_collapse';
    if (ancient) {
      // Древний: появление + удар 999 по всем живым юнитам (без хитбокса — событие)
      log.push({ kind: 'status', actor: ANCIENT_NAME, text: 'Из глубин поднимается Древний…' });
      for (const c of [...s.allies, ...s.foes]) {
        if (!c.alive) continue;
        applyDamage(c, ANCIENT_STRIKE);
        log.push({ kind: 'hit', actor: ANCIENT_NAME, target: c.name, value: ANCIENT_STRIKE, text: `${ANCIENT_NAME} → ${c.name}: −${ANCIENT_STRIKE}` });
        if (!c.alive) log.push({ kind: 'death', target: c.name, text: `${c.name} погибает` });
      }
    } else {
      // обвал: все юниты погребены заживо (BattleScreen убирает их по endReason)
      for (const c of [...s.allies, ...s.foes]) {
        if (c.alive) {
          c.hp = 0;
          c.alive = false;
        }
      }
    }
  }
  if (s.status !== 'active') {
    log.push({
      kind: 'end',
      text: s.status === 'won'
        ? 'Победа!'
        : s.status === 'timeout'
          ? s.endReason === 'timeout_ancient'
            ? 'Древний пробудился. Гномы пали.'
            : 'Пещера обрушилась. Гномы погребены.'
          : 'Поражение…',
    });
  }
  s.log = log;
  return s;
}

export function simulateBattle(battle: BattleState): BattleResult {
  let state = initTauntState(clone(battle));
  const prng = mulberry32(battle.seed);
  const battleTimeLimit = state.foes.some((c) => c.isBoss) ? 60000 : 30000;
  let guard = 0;
  while (state.status === 'active' && state.timeElapsed < battleTimeLimit && guard < 3600) {
    const next = simulateBattleTick(state, FIXED_TIMESTEP_MS, prng);
    next.log = [...state.log, ...next.log];
    state = next;
    guard += 1;
  }
  // v6.9 §3.1.2.2: страховка headless-прогона — если симуляция вышла из цикла
  // без решения (или мимо финала таймаута), фиксируем причину по правилу isBoss
  if (state.status === 'active') {
    state.status = 'timeout';
    state.log.push({ kind: 'end', text: 'Пещера обрушилась. Гномы погребены.' });
  }
  if (state.status === 'timeout' && !state.endReason) {
    state.endReason = state.foes.some((c) => c.isBoss) ? 'timeout_ancient' : 'timeout_collapse';
  }
  return {
    state,
    round: Math.floor(state.timeElapsed / FIXED_TIMESTEP_MS),
    status: state.status === 'won' ? 'won' : 'lost',
    deadAllies: state.allies.filter((c) => !c.alive).map((c) => c.uid),
    endReason: state.endReason,
  };
}
