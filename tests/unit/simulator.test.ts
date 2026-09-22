import { describe, it, expect } from 'vitest';
import { createUnit, simulateBattle } from '../../src/battle/simulator';

describe('Battle Simulator', () => {
  it('should create a unit correctly', () => {
    const unit = createUnit('d1', 'Dwarf Warrior', 100, 15, 5, 10);
    expect(unit.id).toBe('d1');
    expect(unit.name).toBe('Dwarf Warrior');
    expect(unit.hp).toBe(100);
    expect(unit.maxHp).toBe(100);
    expect(unit.attack).toBe(15);
    expect(unit.defense).toBe(5);
    expect(unit.speed).toBe(10);
    expect(unit.isHero).toBe(false);
  });

  it('should simulate a battle with deterministic outcome', () => {
    const dwarf = createUnit('d1', 'Dwarf', 50, 10, 2, 5);
    const enemy = createUnit('e1', 'Goblin', 30, 8, 1, 6);

    // Same seed should produce same result
    const result1 = simulateBattle([dwarf], [enemy], 12345);
    const result2 = simulateBattle([dwarf], [enemy], 12345);

    expect(result1.winner).toBe(result2.winner);
    expect(result1.round).toBe(result2.round);
    expect(result1.log).toEqual(result2.log);
  });

  it('should end battle when one side is defeated', () => {
    const dwarf = createUnit('d1', 'Strong Dwarf', 100, 20, 5, 10, true); // Hero
    const weakEnemy = createUnit('e1', 'Weak Goblin', 10, 2, 0, 1, false);

    const result = simulateBattle([dwarf], [weakEnemy], 999);

    expect(result.winner).toBe('dwarves');
    // All enemies should be defeated (hp <= 0)
    const allEnemiesDefeated = result.enemies.every(e => e.hp <= 0);
    expect(allEnemiesDefeated).toBe(true);
    expect(result.dwarves[0].hp).toBeGreaterThan(0);
    expect(result.round).toBeGreaterThan(0);
  });

  it('should handle multiple units on each side', () => {
    const dwarves = [
      createUnit('d1', 'Dwarf 1', 40, 10, 2, 5),
      createUnit('d2', 'Dwarf 2', 40, 10, 2, 5),
    ];
    const enemies = [
      createUnit('e1', 'Goblin 1', 30, 8, 1, 6),
      createUnit('e2', 'Goblin 2', 30, 8, 1, 6),
    ];

    const result = simulateBattle(dwarves, enemies, 54321);

    expect(result.winner).toBeTruthy();
    expect(result.round).toBeGreaterThan(0);
    expect(result.log.length).toBeGreaterThan(1);
  });
});
