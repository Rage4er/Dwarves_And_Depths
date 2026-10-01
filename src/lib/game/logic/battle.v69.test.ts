// §7 Тесты v6.9: эпичный финал таймаута (обвал/Древний), капы hp_regen §6.4,
// e_ancient вне спавна и наград, миграция сейва с endReason, баланс §7

import { describe, expect, test } from 'bun:test';
import { mulberry32 } from '../rng';
import { DEFAULT_META } from '../store';
import type { Combatant, Effect, MetaState, Side } from '../types';
import {
  ENEMY_HP_REGEN_CAP,
  HP_REGEN_CAP,
  MAX_TURNS,
  MAX_TURNS_BOSS,
} from '../types';
import {
  calculateHpRegen,
  createBattle,
  simulateBattle,
  simulateTurn,
} from './battle';
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
import { mapDepth, newRun } from './run';
import { normalizeRun } from '../store';
import { simulateRun } from './simulateRun';

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
  };
}

// Патч боя в патовую позицию: обе стороны почти бессмертны и почти не бьют —
// исход решит только лимит ходов (минимальный урон floor 1 = 1 §6.4)
function stalemate(battle: ReturnType<typeof createBattle>, hp: number): void {
  for (const c of [...battle.allies, ...battle.foes]) {
    c.hp = hp;
    c.hpMax = hp;
    c.atk = 1;
    c.def = 50;
  }
}

function runToTimeout(battle: ReturnType<typeof createBattle>) {
  let s = battle;
  const full: typeof battle.log = [];
  let guard = 0;
  while (s.status === 'active' && guard < MAX_TURNS_BOSS + 20) {
    const next = simulateTurn(s);
    full.push(...next.log); // simulateTurn отдаёт лог только своего раунда — копим, как simulateBattle
    s = next;
    guard += 1;
  }
  return { state: s, log: full };
}

// ── таймаут → обвал / Древний (§3.1.1) ──────────────────────────────

describe('v6.9 таймаут боя — endReason (§3.1.1)', () => {
  test('обычный бой: лимит 50 раундов → timeout_collapse, все погребены, наград нет', () => {
    const battle = createBattle(
      [makeDwarf('d_brom'), makeDwarf('d_grim')],
      ['e_rat', 'e_rat'],
      1,
      1234,
    );
    stalemate(battle, 9999);
    const { state: s, log } = runToTimeout(battle);

    expect(s.status).toBe('timeout');
    expect(s.endReason).toBe('timeout_collapse');
    expect(s.round).toBe(MAX_TURNS);
    for (const c of [...s.allies, ...s.foes]) expect(c.alive).toBe(false);
    expect(log.some((e) => e.kind === 'turn' && e.text === 'Глубины пробуждаются…')).toBe(true);
    expect(log.some((e) => e.kind === 'end' && e.text === 'Пещера обрушилась. Гномы погребены.')).toBe(true);
    // проигранный таймаут не даёт победы → наград по бою нет
    const result = simulateBattle(battle);
    expect(result.status).toBe('lost');
    expect(result.state.endReason).toBe('timeout_collapse');
  });

  test('элитный бой: элита — не босс → тоже timeout_collapse', () => {
    const battle = createBattle(
      [makeDwarf('d_brom'), makeDwarf('d_grim')],
      ['e_golem'],
      1,
      77,
    );
    expect(battle.foes[0].isElite).toBe(true);
    expect(battle.foes[0].isBoss).toBeFalsy();
    stalemate(battle, 9999);
    const { state: s, log } = runToTimeout(battle);

    expect(s.status).toBe('timeout');
    expect(s.endReason).toBe('timeout_collapse');
    expect(log.some((e) => e.kind === 'end' && e.text === 'Пещера обрушилась. Гномы погребены.')).toBe(true);
  });

  test('босс-бой: лимит 100 раундов → timeout_ancient, Древний убивает всех юнитов', () => {
    const battle = createBattle(
      [makeDwarf('d_brom'), makeDwarf('d_grim')],
      ['e_heart'],
      1,
      555,
    );
    expect(battle.foes[0].isBoss).toBe(true);
    stalemate(battle, 900); // переживёт чип 100 раундов, но не удар 999
    const { state: s, log } = runToTimeout(battle);

    expect(s.status).toBe('timeout');
    expect(s.endReason).toBe('timeout_ancient');
    expect(s.round).toBe(MAX_TURNS_BOSS);
    expect(log.some((e) => e.kind === 'status' && e.text === 'Из глубин поднимается Древний…')).toBe(true);
    // удар 999 по всем живым юнитам обеих сторон (§3.1.1 «все юниты»)
    const strikes = log.filter((e) => e.kind === 'hit' && e.value === 999).length;
    expect(strikes).toBe([...s.allies, ...s.foes].length);
    for (const c of [...s.allies, ...s.foes]) {
      expect(c.alive).toBe(false);
      expect(c.hp).toBe(0);
    }
    expect(log.some((e) => e.kind === 'end' && e.text === 'Древний пробудился. Гномы пали.')).toBe(true);
    expect(simulateBattle(battle).endReason).toBe('timeout_ancient');
  });
});

// ── капы hp_regen (§6.4) ─────────────────────────────────────────────

describe('v6.9 calculateHpRegen — капы 3/2 (§6.4)', () => {
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

// ── e_ancient вне спавна и наград (§6.3) ─────────────────────────────

describe('v6.9 e_ancient — вне пулов, цикла боссов и наград (§6.3)', () => {
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
    // финал с Древним — поражение: наград за бой не начисляется
    const battle = createBattle([makeDwarf('d_brom')], ['e_heart'], 1, 909);
    stalemate(battle, 900);
    expect(simulateBattle(battle).status).toBe('lost');
  });
});

// ── миграция сейва с endReason (§2.6) ───────────────────────────────

describe('v6.9 миграция сейва — endReason (§2.6)', () => {
  test('старый сейв v6.8 без endReason → null; значение v6.9 сохраняется; глубина не теряется', () => {
    const run = newRun(7, testMeta(), ['d_brom', 'd_grim']);
    const plain = JSON.parse(JSON.stringify(run)) as Record<string, unknown>;
    delete plain.endReason; // сейв, сделанный до v6.9

    const migrated = normalizeRun(plain as never);
    expect(migrated.endReason).toBeNull();
    expect(migrated.depth).toBe(mapDepth(run));
    expect(migrated.status).toBe('active');

    const carried = normalizeRun({ ...plain, endReason: 'timeout_ancient' } as never);
    expect(carried.endReason).toBe('timeout_ancient');
  });
});

// ── волны врагов: enemyCount §6.3 и пошаговая адаптация потока §3.1.1 ─

describe('v6.9 волны врагов — enemyCount (§6.3) и подкрепления (§3.1.1)', () => {
  test('enemyCount — точная формула ТЗ: 8 на floor 1, кап 15, элита +4', () => {
    expect(enemyCount(1, false)).toBe(8);
    expect(enemyCount(2, false)).toBe(9);
    expect(enemyCount(3, false)).toBe(11);
    expect(enemyCount(10, false)).toBe(15);
    expect(enemyCount(30, false)).toBe(15);
    expect(enemyCount(1, true)).toBe(12);
  });

  test('battleWaveTotal — пошаговая адаптация (×0.3): 2 на floor 1 (обучение), с floor 2 ≥ 3, элита больше', () => {
    expect(battleWaveTotal(1, false)).toBe(2);
    expect(battleWaveTotal(2, false)).toBe(3);
    expect(battleWaveTotal(10, false)).toBe(5);
    expect(battleWaveTotal(1, true)).toBe(4);
    expect(battleWaveTotal(10, true)).toBe(5);
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
          expect(ids.length).toBe(battleWaveTotal(node.floor, false));
        }
        if (node.type === 'elite' && !sawElite) {
          sawElite = true;
          expect(ids[0]).toBe('e_golem');
          expect(ids.length).toBe(battleWaveTotal(node.floor, true));
        }
        if (node.type === 'boss' && !sawBoss) {
          sawBoss = true;
          expect(ids.length).toBe(1);
        }
    }
    expect(sawBattle && sawElite && sawBoss).toBe(true);
  });

  test('волны: передовой отряд 3 (= кап), подкрепления по 1/раунд после освобождения слота', () => {
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

    stalemate(battle, 9999); // никто не умирает — подкрепления входят пока есть место (кап 3)
    let s = battle;
    let maxAlive = 0;
    const full: typeof battle.log = [];
    for (let t = 0; t < 4; t++) {
      maxAlive = Math.max(maxAlive, s.foes.filter((c) => c.alive).length);
      const next = simulateTurn(s);
      full.push(...next.log);
      s = next;
    }
    expect(maxAlive).toBeLessThanOrEqual(3);
    expect(s.enemiesSpawned).toBe(3); // фронт уже занял кап 3 — резерв ждёт
    expect(s.enemyReserve.length).toBe(2);
    expect(full.some((e) => e.kind === 'status' && e.text.startsWith('Из туннелей выбирается'))).toBe(false);

    // освобождаем слот — резерв входит (и лог подкрепления появляется)
    s.foes[0].alive = false;
    const after = simulateTurn(s);
    expect(after.enemiesSpawned).toBe(4);
    expect(after.enemyReserve.length).toBe(1);
    expect(after.log.some((e) => e.kind === 'status' && e.text.startsWith('Из туннелей выбирается'))).toBe(true);
  });

  test('победа требует убить весь состав: пока есть резерв, бой не выигран', () => {
    const party = [makeDwarf('d_brom'), makeDwarf('d_grim')];
    for (const d of party) {
      d.atk = 60; // убивает крысу за 1–2 удара
      d.hp = 999;
      d.hpMax = 999;
    }
    const battle = createBattle(party, ['e_rat', 'e_rat', 'e_rat', 'e_rat'], 1, 777);
    const result = simulateBattle(battle);
    expect(result.status).toBe('won');
    expect(result.state.enemiesSpawned).toBe(4); // вошла вся волна
    expect(result.state.enemyReserve.length).toBe(0);
    expect(result.state.foes.every((c) => !c.alive)).toBe(true);
    expect(result.state.log.some((e) => e.kind === 'status' && e.text.startsWith('Из туннелей выбирается'))).toBe(true);
  });

  test('старый сейв: узел с 1–3 enemyIds (до волн) — бой без резерва, как раньше', () => {
    const battle = createBattle(
      [makeDwarf('d_brom')],
      ['e_goblin', 'e_rat'],
      3,
      5150,
    );
    expect(battle.enemiesTotal).toBe(2);
    expect(battle.enemiesSpawned).toBe(2);
    expect(battle.enemyReserve).toEqual([]);
    expect(battle.foes.length).toBe(2);
  });
});

// ── баланс §7: win rate не деградировал от капов регена и волн ───────

describe('v6.9 баланс (§7)', () => {
  test('win rate на seeds 1..10 остаётся 40–60%', () => {
    let wins = 0;
    for (let seed = 1; seed <= 10; seed++) {
      if (simulateRun(seed).status === 'victory') wins += 1;
    }
    expect(wins).toBeGreaterThanOrEqual(4);
    expect(wins).toBeLessThanOrEqual(6);
  });
});

// ── v7.0 §6.3: ranged-враги, enemyTypes, превью ──────────────────────

describe('v7.0: ranged-враги (§6.3)', () => {
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
    // собираем фактические статы: atk лучника и def гнома в бою
    const archer = state.foes[0];
    const dwarf = state.allies[0];
    const hit = simulateTurn(state).log.find((e) => e.kind === 'hit' && e.actor === archer.name);
    expect(hit).toBeDefined();
    const minDamage = Math.max(1, Math.floor(4 / 2));
    const expected = Math.max(minDamage, Math.round((archer.atk - dwarf.def) * 0.7));
    expect(hit?.value).toBe(expected);
  });

  test('ranged-враги выбирают цель среди всех линий — тыл не укрытие', () => {
    const party = [makeDwarf('d_brom'), makeDwarf('d_grim'), makeDwarf('d_thorin')];
    party[0].position = 'front';
    party[1].position = 'front';
    party[2].position = 'back';
    const hits: string[] = [];
    for (let seed = 100; seed < 130; seed++) {
      const state = createBattle(party, ['e_archer_goblin'], 6, seed);
      const turn = simulateTurn(state);
      const hit = turn.log.find((e) => e.kind === 'hit' && e.actor === turn.foes[0].name);
      if (hit?.target) hits.push(hit.target);
    }
    // при front-приоритете d_thorin (back) не получил бы ни одного удара
    expect(hits.includes('Торин')).toBe(true);
  });
});

describe('v7.0: enemyTypes на карте (§3.3.1)', () => {
  test('каждый боевой/элитный/боссовый узел несёт enemyTypes = уникальные типы волны', () => {
    const run = newRun(21, testMeta({ unlockedDwarves: ['d_brom', 'd_grim'] }), ['d_brom', 'd_grim']);
    for (const node of run.map) {
      if (!['battle', 'elite', 'boss'].includes(node.type)) continue;
      const ids = node.data?.enemyIds ?? [];
      const types = node.data?.enemyTypes ?? [];
      expect(types.length).toBeGreaterThan(0);
      expect(types.length).toBeLessThanOrEqual(ids.length);
      expect(new Set(types).size).toBe(types.length);
      for (const t of types) expect(ids).toContain(t);
    }
  });
});
