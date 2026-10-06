// §7.5 Balance test — реальные стартовые условия
// 2 гнома (maxPartySize=2), 1 common на гнома (newRun даёт 1 предмет каждому)
// БЕЗ компенсации v7.1 (HP×5, cooldown×1.5)

import { describe, expect, test } from 'bun:test';
import { simulateRun } from './simulateRun';
import { runSummary } from './simulateRun';

describe('balance test — реальные условия (2 гнома, 1 common на гнома)', () => {
  test('seeds 1..10: win rate 40–60%', () => {
    let wins = 0;
    const results: { status: string; floor: number; gold: number }[] = [];

    for (let seed = 1; seed <= 10; seed++) {
      const run = simulateRun(seed, { realConditions: true });
      const summary = runSummary(run);
      results.push(summary);
      if (summary.status === 'victory') wins++;
    }

    const winRate = wins / 10;
    console.log('=== Balance Test (реальные условия) ===');
    console.log(`Wins: ${wins}/10 (${(winRate * 100).toFixed(0)}%)`);
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      console.log(`  seed ${i + 1}: ${r.status} (floor ${r.floor}, gold ${r.gold})`);
    }
    console.log('====================================');

    // corridor 40-60%
    expect(winRate).toBeGreaterThanOrEqual(0.4);
    expect(winRate).toBeLessThanOrEqual(0.6);
  });
});
