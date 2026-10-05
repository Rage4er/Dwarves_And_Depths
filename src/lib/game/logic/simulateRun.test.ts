// §7 Тесты: детерминизм симуляции, инварианты забега, v6.8 (Growing Depth,
// бесконечный режим, перманентная смерть, миграция сейва)

import { describe, expect, test } from 'bun:test';
import { simulateRun } from './simulateRun';
import {
  ENDLESS_BONUS_LEGACY,
  ENDLESS_MAX_DEPTH,
  extendMapEndless,
  generateMap,
  getDepth,
  legacyGain,
  mapDepth,
  newRun,
} from './run';
import { DEFAULT_META, normalizeMeta, normalizeRun } from '../store';
import { nodeGold } from '../data/enemies';
import type { MetaState } from '../types';
import { DWARF_TABLE } from '../data/dwarves';
import { applyEventChoice } from './events';
import { eventById } from '../data/events';
import { mulberry32 } from '../rng';

function testMeta(overrides: Partial<MetaState> = {}): MetaState {
  return {
    ...DEFAULT_META,
    unlockedDwarves: DWARF_TABLE.map((d) => d.id),
    unlockedEquipment: [],
    skipPrepScreen: false,
    sleepLoot: [],
    ...overrides,
  };
}

describe('simulateRun — детерминизм (§2.4, §7)', () => {
  test('один и тот же сид → идентичный результат', () => {
    const a = simulateRun(42);
    const b = simulateRun(42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('разные сиды → разные карты глубин', () => {
    const a = simulateRun(1, { maxFloors: 3 });
    const b = simulateRun(2, { maxFloors: 3 });
    expect(JSON.stringify(a.map)).not.toBe(JSON.stringify(b.map));
  });
});

describe('simulateRun — инварианты (§3.3, §3.1)', () => {
  test('забег завершается; глубина = 8 + bossesKilledTotal (v6.8 Growing Depth)', () => {
    for (const seed of [1, 2, 3, 42, 777]) {
      const run = simulateRun(seed);
      expect(run.status).not.toBe('active');
      expect(run.depth).toBe(8);
      expect(mapDepth(run)).toBe(run.depth);
    }
  });

  test('элита не встречается два этажа подряд', () => {
    const run = simulateRun(5);
    const eliteFloors = run.map.filter((n) => n.type === 'elite').map((n) => n.floor);
    for (let i = 1; i < eliteFloors.length; i++) {
      expect(eliteFloors[i] - eliteFloors[i - 1]).toBeGreaterThan(1);
    }
  });
});

describe('v6.8 Growing Depth — формула глубины (§3.3.1)', () => {
  test('обычный режим: 8 + боссы, повержённые за все забеги', () => {
    expect(getDepth({ maxDepthEver: 0, bossesKilledTotal: 0 }, false, 0)).toBe(8);
    expect(getDepth({ maxDepthEver: 0, bossesKilledTotal: 5 }, false, 0)).toBe(13);
  });

  test('бесконечный: 8 + рекорд глубины + пройденные слои', () => {
    expect(getDepth({ maxDepthEver: 12, bossesKilledTotal: 3 }, true, 7)).toBe(27);
    expect(getDepth({ maxDepthEver: 200, bossesKilledTotal: 9 }, true, 0)).toBe(ENDLESS_MAX_DEPTH + 108);
  });

  test('карта валидна для любого seeds и глубины (§2.7)', () => {
    for (const seed of [1, 7, 42]) {
      for (const depth of [8, 13, 24]) {
        const { map, depth: d } = generateMap(seed, depth, []);
        const layers = [...new Set(map.map((n) => n.floor))]
          .sort((a, b) => a - b)
          .map((f) => map.filter((n) => n.floor === f));
        expect(d).toBe(depth);
        expect(layers.length).toBe(depth);
      }
    }
  });

  test('старт забега: партия + 1 предмет каждому, босс в последнем слое', () => {
    const run = newRun(99, testMeta(), ['d_brom', 'd_grim']);
    expect(run.status).toBe('active');
    expect(run.floor).toBe(1);
    expect(run.gold).toBe(0);
    expect(run.dwarves.length).toBe(2);
    expect(run.inventory.length).toBe(2);
    const bossLayer = run.map.filter((n) => n.floor === run.depth);
    expect(bossLayer.length).toBe(1);
    expect(bossLayer[0].type).toBe('boss');
  });
});

describe('v6.8 бесконечный режим (§3.3.1)', () => {
  test('endless-забег не создаётся без unlock', () => {
    const run = newRun(5, testMeta({ endlessUnlocked: false }), ['d_brom'], { isEndless: true });
    expect(run.isEndless).toBe(false);
    const unlocked = newRun(5, testMeta({ endlessUnlocked: true }), ['d_brom'], { isEndless: true });
    expect(unlocked.isEndless).toBe(true);
  });

  test('extendMapEndless дорастает до getDepth() и ставит босса каждые 3 слоя', () => {
    const meta = testMeta({ endlessUnlocked: true, maxDepthEver: 10 });
    let run = newRun(11, meta, ['d_brom', 'd_grim'], { isEndless: true });
    const before = mapDepth(run);
    expect(before).toBe(18); // 8 + maxDepthEver

    run = extendMapEndless(run, meta);
    const after = mapDepth(run);
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeLessThanOrEqual(12); // ENDLESS_CHUNK_CAP

    // в приросте босс каждый 3-й слой: floor ≡ before+2 (mod 3)
    const grown = run.map.filter((n) => n.floor > before);
    const bossFloors = grown.filter((n) => n.type === 'boss').map((n) => n.floor);
    expect(bossFloors.length).toBeGreaterThan(0);
    for (const f of bossFloors) expect((f - before - 1) % 3).toBe(2);
  });

  test('глубина бесконечного ограничена 100 (§6.4)', () => {
    const meta = testMeta({ endlessUnlocked: true, maxDepthEver: 200 });
    let run = newRun(3, meta, ['d_brom'], { isEndless: true });
    run = extendMapEndless(run, meta);
    expect(mapDepth(run)).toBeLessThanOrEqual(ENDLESS_MAX_DEPTH);
  });

  test('бонус наследия за покорение бездны', () => {
    expect(ENDLESS_BONUS_LEGACY).toBe(500);
    expect(legacyGain({ ...newRun(8, testMeta(), ['d_brom']), depth: 100, bossKilled: true, elitesKilled: 1 })).toBe(
      100 * 5 + 50 + 10,
    );
  });
});

describe('v6.8 баланс наград (§3.3.7)', () => {
  test('золото: бой 5+floor×2, элита 10+floor×3, босс 20+depth×2', () => {
    expect(nodeGold('battle', 3, 8)).toBe(11);
    expect(nodeGold('elite', 4, 8)).toBe(22);
    expect(nodeGold('boss', 8, 10)).toBe(40);
  });
});

describe('v6.8 перманентная смерть и миграция (§3.1.2, §2.6)', () => {
  test('simulateRun: павший гном отдаёт снаряжение в рюкзак и не возвращается', () => {
    for (const seed of [4, 15]) {
      const run = simulateRun(seed);
      for (const d of run.dwarves) {
        if (!d.isAlive) expect(d.equipment.length).toBe(0);
      }
    }
  });

  test('normalizeMeta: старый сейв без полей v6.8 получает дефолты', () => {
    const old = {
      legacy: 120,
      maxSlots: 3,
      maxPartySize: 4,
      unlockedDwarves: ['d_brom', 'd_grim'],
      runCount: 6,
    };
    const meta = normalizeMeta(old);
    expect(meta.legacy).toBe(120);
    expect(meta.maxSlots).toBe(3);
    expect(meta.deadDwarves).toEqual([]);
    expect(meta.maxDepthEver).toBe(0);
    expect(meta.bossesKilledTotal).toBe(0);
    expect(meta.endlessUnlocked).toBe(false);
    expect(meta.unlockedDwarves).toEqual(['d_brom', 'd_grim']);
  });

  test('normalizeMeta: мусорные значения не ломают миграцию', () => {
    const meta = normalizeMeta({ deadDwarves: 'oops', maxDepthEver: -5, endlessUnlocked: 1 });
    expect(meta.deadDwarves).toEqual([]);
    expect(meta.maxDepthEver).toBe(0);
    expect(meta.endlessUnlocked).toBe(false);
  });

  test('normalizeRun: старый сейв без bonusLegacy получает 0', () => {
    const run = newRun(9, testMeta(), ['d_brom']);
    const old = { ...run } as MetaState & typeof run;
    delete (old as { bonusLegacy?: number }).bonusLegacy;
    expect(normalizeRun(old).bonusLegacy).toBe(0);
    expect(normalizeRun(run).bonusLegacy).toBe(0);
  });
});

describe('§6.5 награда наследия из события', () => {
  test('«Дать 5 золота» в ev_lost_dwarf списывает золото и начисляет bonusLegacy', () => {
    const run = newRun(42, testMeta(), ['d_brom', 'd_grim']);
    run.gold = 30;
    const def = eventById('ev_lost_dwarf');
    expect(def).not.toBeNull();
    if (!def) return;
    const outcome = applyEventChoice(run, def, 1, mulberry32(1));
    expect(outcome.run.gold).toBe(25); // −5 золота
    expect(outcome.run.bonusLegacy).toBe(5);
    expect(legacyGain(outcome.run)).toBe(outcome.run.depth * 5 + 5); // бонус учтён в итоге
  });

  test('нормальный забег: bonusLegacy = 0 и не влияет на legacyGain', () => {
    const run = newRun(7, testMeta(), ['d_brom']);
    expect(run.bonusLegacy).toBe(0);
    expect(legacyGain(run)).toBe(run.depth * 5);
  });
});
