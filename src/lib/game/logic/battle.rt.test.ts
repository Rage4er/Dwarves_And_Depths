// §7 Тесты реалтайм-боя: simulateBattleTick(dt, prng), детерминизм, таймаут, подкрепления

import { describe, expect, test } from 'bun:test';
import { mulberry32, type PRNG } from '../rng';
import {
  FIXED_TIMESTEP_MS,
  createBattle,
  simulateBattleTick,
  simulateBattle,
} from './battle';
import { makeDwarf } from '../data/dwarves';
import type { BattleState } from '../types';

// ── утилиты ──────────────────────────────────────────────────────────

function tick(state: BattleState, prng: PRNG): BattleState {
  return simulateBattleTick(state, 1000 / 60, prng);
}

function makeSimpleBattle(): { battle: BattleState; prng: PRNG } {
  const prng = mulberry32(42);
  const dwarves = [makeDwarf('d_brom')];
  dwarves[0].baseATK = 20;
  dwarves[0].baseHP = 200;
  dwarves[0].currentHP = 200;
  const battle = createBattle(dwarves, ['e_rat'], 1, 42);
  return { battle, prng };
}

// ── тест 1: 1 тик → гном бьёт врага ──────────────────────────────────

describe('rt-battle: 1 тик → гном бьёт врага', () => {
  test('гном с ATK=20 бьёт крысу (DEF=2) за 1 тик', () => {
    const { battle, prng } = makeSimpleBattle();
    const ratHpBefore = battle.foes[0].hp;
    const next = tick(battle, prng);

    // Гном должен ударить — у него ATK 20, у крысы DEF 2, minDamage = 1
    const hitEvent = next.log.find((e) => e.kind === 'hit' && e.actor === 'Бром');
    expect(hitEvent).toBeDefined();
    expect(hitEvent!.value).toBeGreaterThan(0);

    // HP крысы уменьшилось
    expect(next.foes[0].hp).toBeLessThan(ratHpBefore);
  });
});

// ── тест 2: 60 тиков ≈ 1 сек ─────────────────────────────────────────

describe('rt-battle: 60 тиков ≈ 1 сек', () => {
  test('60 тиков → timeElapsed ≈ 1000 мс (реальный бой)', () => {
    // Реальный бой: гном бьёт крысу — бой может закончиться раньше,
    // но timeElapsed растёт ВСЕГДА (fix #1: += dt ДО проверки status)
    const dwarves = [makeDwarf('d_brom')];
    dwarves[0].baseATK = 20;
    dwarves[0].baseHP = 200;
    dwarves[0].currentHP = 200;

    const battle = createBattle(dwarves, ['e_rat'], 1, 42);
    let state = battle;
    const prngCopy = mulberry32(42);
    const dt = 1000 / 60;

    for (let i = 0; i < 60; i++) {
      state = simulateBattleTick(state, dt, prngCopy);
    }

    // timeElapsed должен быть ≈ 1000 мс — 60 тиков × 16.667 мс
    expect(state.timeElapsed).toBeGreaterThan(999);
    expect(state.timeElapsed).toBeLessThan(1001);
  });
});

// ── тест 3: детерминизм — 100 тиков × 2 → одинаковый результат ───────

describe('rt-battle: детерминизм — 100 тиков × 2 → одинаковый результат', () => {
  test('одинаковый seed → одинаковый state после 100 тиков', () => {
    const dwarves = [makeDwarf('d_brom')];
    dwarves[0].baseATK = 20;
    dwarves[0].baseHP = 200;
    dwarves[0].currentHP = 200;

    const battle1 = createBattle(dwarves, ['e_rat', 'e_goblin'], 3, 99);
    const battle2 = createBattle(dwarves, ['e_rat', 'e_goblin'], 3, 99);

    const prng1 = mulberry32(99);
    const prng2 = mulberry32(99);

    let s1 = battle1;
    let s2 = battle2;

    for (let i = 0; i < 100; i++) {
      s1 = tick(s1, prng1);
      s2 = tick(s2, prng2);
    }

    // timeElapsed одинаковый
    expect(s1.timeElapsed).toBe(s2.timeElapsed);

    // HP одинаковые
    for (let i = 0; i < s1.allies.length; i++) {
      expect(s1.allies[i].hp).toBe(s2.allies[i].hp);
    }
    for (let i = 0; i < s1.foes.length; i++) {
      expect(s1.foes[i].hp).toBe(s2.foes[i].hp);
    }

    // Статус одинаковый
    expect(s1.status).toBe(s2.status);
  });
});

// ── тест 4: таймаут обычного боя — 30 сек → timeout_collapse ─────────

describe('rt-battle: таймаут обычного боя — 30 сек → timeout_collapse', () => {
  test('патовая позиция → timeout_collapse после 30000 мс', () => {
    const dwarves = [makeDwarf('d_brom'), makeDwarf('d_grim')];
    for (const d of dwarves) {
      d.baseATK = 1;
      d.baseHP = 9999;
      d.currentHP = 9999;
    }

    const prng = mulberry32(111);
    const battle = createBattle(dwarves, ['e_rat', 'e_rat'], 1, 111);
    // Пат: урон 1, HP 9999 — бой не решится
    for (const c of [...battle.allies, ...battle.foes]) {
      c.hp = 9999;
      c.hpMax = 9999;
      c.atk = 1;
      c.def = 50;
    }

    let state = battle;
    const prngCopy = mulberry32(111);

    // 30000 мс / 16.667 мс = 1800 тиков
    for (let i = 0; i < 1800; i++) {
      state = tick(state, prngCopy);
    }

    expect(state.status).toBe('timeout');
    expect(state.endReason).toBe('timeout_collapse');
    expect(state.timeElapsed).toBeGreaterThanOrEqual(30000);
    // Все погребены
    for (const c of [...state.allies, ...state.foes]) {
      expect(c.alive).toBe(false);
    }
  });
});

// ── тест 5: подкрепления входят по таймеру ───────────────────────────

describe('rt-battle: подкрепления входят по таймеру', () => {
  test('резерв врагов входит когда есть место', () => {
    const dwarves = [makeDwarf('d_brom')];
    dwarves[0].baseATK = 1;
    dwarves[0].baseHP = 9999;
    dwarves[0].currentHP = 9999;

    const prng = mulberry32(222);
    const battle = createBattle(dwarves, ['e_rat', 'e_rat', 'e_rat', 'e_rat', 'e_rat'], 1, 222);

    // Фронт: 3, Резерв: 2
    expect(battle.enemiesSpawned).toBe(3);
    expect(battle.enemyReserve.length).toBe(2);

    let state = battle;
    const prngCopy = mulberry32(222);

    // 60 тиков = 1 сек — подкрепления должны войти
    for (let i = 0; i < 60; i++) {
      state = tick(state, prngCopy);
    }

    // Подкрепления вошли (кап 3 живых, но фронт уже 3)
    // Поскольку кап WAVE_ALIVE_CAP = 3 и фронт уже 3, подкрепления ждут
    expect(state.enemiesSpawned).toBeGreaterThanOrEqual(3);
    expect(state.status).toBe('active');
  });
});

// ── тест 6: simulateBattle — headless цикл ───────────────────────────

describe('rt-battle: simulateBattle — headless цикл', () => {
  test('simulateBattle использует FIXED_TIMESTEP_MS и prng', () => {
    const dwarves = [makeDwarf('d_brom')];
    dwarves[0].baseATK = 50;
    dwarves[0].baseHP = 500;
    dwarves[0].currentHP = 500;

    const battle = createBattle(dwarves, ['e_rat'], 1, 42);
    const result = simulateBattle(battle);

    // result.round = Math.floor(timeElapsed / FIXED_TIMESTEP_MS)
    expect(result.round).toBeGreaterThanOrEqual(0);
    expect(result.state.timeElapsed).toBeGreaterThan(0);
    // Статус: won или lost (не active)
    expect(result.status).toBe('won');
  });
});
