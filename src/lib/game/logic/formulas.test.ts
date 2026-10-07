// §7 Тесты формул: calculateHpRegen, enemyCount, minDamage

import { describe, expect, test } from 'bun:test';
import { mulberry32 } from '../rng';
import type { Combatant, Effect, MetaState, Side } from '../types';
import {
  ENEMY_HP_REGEN_CAP,
  HP_REGEN_CAP,
} from '../types';
import {
  calculateHpRegen,
  createBattle,
} from './battle';
import {
  battleWaveTotal,
  enemyCount,
  poolFor,
  spawnEnemy,
} from '../data/enemies';
import { makeDwarf } from '../data/dwarves';
import { DEFAULT_META } from '../store';
import { mapDepth, newRun } from './run';

// ── фикстуры ─────────────────────────────────────────────────────────

function testMeta(overrides: Partial<MetaState> = {}): MetaState {
  return { ...DEFAULT_META, ...overrides };
}

function mkUnit(side: Side, effects: Effect[]): Combatant {
  return {
    uid: `u_${side}_${Math.random().toString(36).slice(2, 7)}`,
    side,
    name: 'Юнит',
    hp: 10,
    hpMax: 10,
    atk: 5,
    def: 2,
    speed: 6,
    position: 'front',
    alive: true,
    statuses: [],
    effects,
    role: 'warrior',
    iconSeed: 1,
    tauntLeft: 0,
    x: 0,
    y: 0,
    attackCooldown: 0,
  };
}

// ── calculateHpRegen капы 3/2 (§6.4) ─────────────────────────────────

describe('formulas: calculateHpRegen — капы 3/2', () => {
  test('стек из нескольких hp_regen у гнома ограничен капом 3', () => {
    expect(HP_REGEN_CAP).toBe(3);
    const ally = mkUnit('ally', [
      { type: 'hp_regen', value: 2 },
      { type: 'hp_regen', value: 2 },
      { type: 'hp_regen', value: 1 },
    ]);
    expect(ally.effects.filter((e) => e.type === 'hp_regen').length).toBe(3);
    expect(calculateHpRegen(ally)).toBe(3);
  });

  test('стек ниже капа не режется; враг ограничен капом 2', () => {
    const under = mkUnit('ally', [{ type: 'hp_regen', value: 1 }, { type: 'hp_regen', value: 1 }]);
    expect(calculateHpRegen(under)).toBe(2);

    expect(ENEMY_HP_REGEN_CAP).toBe(2);
    const foe = mkUnit('foe', [
      { type: 'hp_regen', value: 3 }, // e_slime: value 3 — без капа ломал бы баланс
      { type: 'hp_regen', value: 3 },
    ]);
    expect(calculateHpRegen(foe)).toBe(2);
  });
});

// ── enemyCount 1.5 × dwarfCount + floorBonus, cap 3–20 (§6.3) ───────

describe('formulas: enemyCount', () => {
  test('v7.1: 1.5 врага на гнома (dwarfCount=2), cap 3–20', () => {
    expect(enemyCount(1, false, 2)).toBe(3);
    expect(enemyCount(2, false, 2)).toBe(3);
    expect(enemyCount(3, false, 2)).toBe(4);
    expect(enemyCount(10, false, 2)).toBe(6);
    expect(enemyCount(30, false, 2)).toBe(13);
    expect(enemyCount(1, true, 2)).toBe(5);
  });

  test('cap: не меньше 3, не больше 20', () => {
    // 1 гном, floor 1 — минимум 3
    expect(enemyCount(1, false, 1)).toBeGreaterThanOrEqual(3);
    // 100 гномов — максимум 20
    expect(enemyCount(100, false, 100)).toBe(20);
  });

  test('босс: battleWaveTotal — пошаговая адаптация (×0.3)', () => {
    expect(battleWaveTotal(1, false, 2)).toBe(2);
    expect(battleWaveTotal(2, false, 2)).toBe(2);
    expect(battleWaveTotal(10, false, 2)).toBe(2);
    expect(battleWaveTotal(1, true, 2)).toBe(2);
    expect(battleWaveTotal(10, true, 2)).toBe(3);
  });

  test('карта фиксирует полный состав волны: бой/элита по battleWaveTotal, босс соло', () => {
    const run = newRun(11, testMeta(), ['d_brom', 'd_grim']);
    let sawBattle = false;
    let sawElite = false;
    let sawBoss = false;
    for (const node of run.map) {
      const ids = (node.data?.enemyIds ?? []) as string[];
      if (node.type === 'battle' && !sawBattle) {
        sawBattle = true;
        expect(ids.length).toBe(battleWaveTotal(node.floor, false, 2));
      }
      if (node.type === 'elite' && !sawElite) {
        sawElite = true;
        expect(ids[0]).toBe('e_golem');
        expect(ids.length).toBe(battleWaveTotal(node.floor, true, 2));
      }
      if (node.type === 'boss' && !sawBoss) {
        sawBoss = true;
        expect(ids.length).toBe(1);
      }
    }
    expect(sawBattle && sawElite && sawBoss).toBe(true);
  });

  test('волны: передовой отряд 3 (= кап), подкрепления по 1/раунд', () => {
    const battle = createBattle(
      [makeDwarf('d_brom'), makeDwarf('d_grim')],
      ['e_rat', 'e_rat', 'e_rat', 'e_rat', 'e_rat'],
      1,
      4242,
    );
    expect(battle.foes.length).toBe(3); // WAVE_FRONT
    expect(battle.enemiesTotal).toBe(5);
    expect(battle.enemiesSpawned).toBe(3);
    expect(battle.enemyReserve).toEqual(['e_rat', 'e_rat']);
  });
});
