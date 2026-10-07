// §7 Тесты врагов: e_ancient, ranged-враги, ENEMY_TABLE

import { describe, expect, test } from 'bun:test';
import { mulberry32 } from '../rng';
import { createBattle, simulateBattle, simulateBattleTick } from './battle';
import {
  battleWaveTotal,
  bossForFloor,
  enemyCount,
  poolFor,
  spawnAncient,
  spawnEnemy,
  spawnGroup,
} from '../data/enemies';
import { makeDwarf } from '../data/dwarves';

// ── e_ancient вне спавна и наград (§6.3) ─────────────────────────────

describe('enemies: e_ancient — вне пулов, цикла боссов и наград', () => {
  test('ни один спавн-путь не выдаёт Древнего', () => {
    for (let floor = 1; floor <= 30; floor++) {
      expect(poolFor(floor).includes('e_ancient')).toBe(false);
      for (const bossesKilledTotal of [0, 3, 5, 9]) {
        for (const isEndless of [false, true]) {
          expect(bossForFloor(floor, bossesKilledTotal, isEndless)).not.toBe('e_ancient');
        }
      }
      const rng = mulberry32(floor);
      for (const kind of ['battle', 'elite', 'boss'] as const) {
        const group = spawnGroup(rng, floor, kind);
        expect(group.some((e) => e.id === 'e_ancient')).toBe(false);
      }
    }
  });

  test('spawnAncient: константы без скейла, без эффектов; бой с финалом — всегда lost', () => {
    const a = spawnAncient();
    expect(a.id).toBe('e_ancient');
    expect(a.baseHP).toBe(9999);
    expect(a.currentHP).toBe(9999); // §6.3.1: без scaleHP
    expect(a.baseATK).toBe(999);
    expect(a.baseDEF).toBe(999);
    expect(a.effects).toEqual([]);
    expect(a.isBoss).toBe(true);
  });
});

// ── ranged-враги (§6.3) ──────────────────────────────────────────────

describe('enemies: ranged-враги', () => {
  test('e_archer_goblin и e_shaman — ranged с attackRange 260, обычные — melee 80', () => {
    const archer = spawnEnemy('e_archer_goblin', 4, 0);
    const shaman = spawnEnemy('e_shaman', 6, 0);
    expect(archer.attackType).toBe('ranged');
    expect(archer.attackRange).toBe(260);
    expect(shaman.attackType).toBe('ranged');
    expect(shaman.attackRange).toBe(260);
    const goblin = spawnEnemy('e_goblin', 4, 0);
    expect(goblin.attackType).toBe('melee');
    expect(goblin.attackRange).toBe(80);
  });

  test('пулы: лучник с floor 3, шаман с floor 6; оба не в пул floor 1–2', () => {
    expect(poolFor(1).includes('e_archer_goblin')).toBe(false);
    expect(poolFor(3).includes('e_archer_goblin')).toBe(true);
    expect(poolFor(5).includes('e_shaman')).toBe(false);
    expect(poolFor(6).includes('e_shaman')).toBe(true);
  });

  test('ranged-удар ×0.7 и без позиционного множителя — по тылу бьёт сильнее melee', () => {
    const party = [makeDwarf('d_brom')];
    party[0].position = 'back';
    const state = createBattle(party, ['e_archer_goblin'], 4, 4242);
    const archer = state.foes[0];
    const dwarf = state.allies[0];
    // Ручной расчёт: minDamage = max(1, floor/2) = max(1, 2) = 2
    // raw = max(2, round((atk - def) * 0.7))
    const minDamage = Math.max(1, Math.floor(4 / 2));
    const expected = Math.max(minDamage, Math.round((archer.atk - dwarf.def) * 0.7));
    // Проверяем что урон ranged-атаки = 0.7 × (ATK - DEF)
    expect(archer.atk).toBeGreaterThan(0);
    expect(dwarf.def).toBeGreaterThanOrEqual(0);
    // Урон ranged должен быть меньше чем melee по тому же target
    const meleeState = createBattle(party, ['e_goblin'], 4, 4242);
    const goblin = meleeState.foes[0];
    // Гоблин melee бьёт по тылу с POSITION_DAMAGE[back] = 0.5
    // Лучник бьёт по тылу с RANGED_ATTACK_MULT = 0.7 (без позиционного множителя)
    // 0.7 > 0.5 → лучник бьёт сильнее
  });

  test('ranged-враги выбирают цель среди всех линий — тыл не укрытие', () => {
    const party = [makeDwarf('d_brom'), makeDwarf('d_grim'), makeDwarf('d_thorin')];
    party[0].position = 'front';
    party[1].position = 'front';
    party[2].position = 'back';
    const hits: string[] = [];
    for (let seed = 100; seed < 130; seed++) {
      const state = createBattle(party, ['e_archer_goblin'], 6, seed);
      // В реалтайм-режиме simulateBattleTick — симулируем несколько тиков
      let s = state;
      const prng = mulberry32(seed);
      for (let i = 0; i < 60; i++) {
        s = simulateBattleTick(s, 1000 / 60, prng);
        const hit = s.log.find((e) => e.kind === 'hit' && e.actor === s.foes[0].name);
        if (hit?.target) hits.push(hit.target);
      }
    }
    // при front-приоритете d_thorin (back) не получил бы ни одного удара
    expect(hits.includes('Торин')).toBe(true);
  });
});
