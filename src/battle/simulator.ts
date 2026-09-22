/**
 * Battle Simulator Core Logic
 * CONTRACT §3.1.7: NO imports from Phaser, Matter.js, or DOM APIs.
 * Pure TypeScript logic only.
 */

import { PRNG } from '../core/prng';

export interface UnitStats {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isHero: boolean;
}

export interface BattleState {
  dwarves: UnitStats[];
  enemies: UnitStats[];
  round: number;
  log: string[];
  winner: 'dwarves' | 'enemies' | null;
}

export function createUnit(
  id: string,
  name: string,
  hp: number,
  attack: number,
  defense: number,
  speed: number,
  isHero: boolean = false
): UnitStats {
  return { id, name, hp, maxHp: hp, attack, defense, speed, isHero };
}

export function simulateRound(state: BattleState, prng: PRNG): BattleState {
  if (state.winner) return state;

  const newLog = [...state.log];
  // Work with mutable copies of alive units
  let dwarves = state.dwarves.filter(u => u.hp > 0);
  let enemies = state.enemies.filter(u => u.hp > 0);

  if (dwarves.length === 0) {
    return { ...state, enemies, dwarves, winner: 'enemies', log: [...newLog, 'Dwarves defeated!'] };
  }
  if (enemies.length === 0) {
    return { ...state, enemies, dwarves, winner: 'dwarves', log: [...newLog, 'Victory!'] };
  }

  // Sort by speed (descending) - use filtered arrays with current HP
  const allUnits = [...dwarves, ...enemies].sort((a, b) => b.speed - a.speed);

  for (const attacker of allUnits) {
    // Skip dead attackers
    if (attacker.hp <= 0) continue;

    // Attackers always attack the opposing team
    const targets = attacker.isHero ? enemies.filter(u => u.hp > 0) : dwarves.filter(u => u.hp > 0);
    if (targets.length === 0) break;

    // Select target randomly from opposing team
    const targetIndex = prng.nextInt(0, targets.length - 1);
    const defender = targets[targetIndex];

    // Calculate damage
    let damage = Math.max(1, attacker.attack - defender.defense);
    
    // Critical hit chance (10%)
    if (prng.nextFloat() < 0.1) {
      damage = Math.floor(damage * 1.5);
      newLog.push(`${attacker.name} lands a CRITICAL hit on ${defender.name}!`);
    }

    defender.hp = Math.max(0, defender.hp - damage);
    newLog.push(`${attacker.name} attacks ${defender.name} for ${damage} dmg.`);

    if (defender.hp === 0) {
      newLog.push(`${defender.name} has fallen!`);
      // Update the filtered array to reflect death immediately
      if (attacker.isHero) {
        enemies = enemies.filter(e => e.id !== defender.id);
      } else {
        dwarves = dwarves.filter(d => d.id !== defender.id);
      }
    }
  }

  return {
    ...state,
    dwarves: state.dwarves.map(u => dwarves.find(d => d.id === u.id) || u),
    enemies: state.enemies.map(u => enemies.find(e => e.id === u.id) || u),
    round: state.round + 1,
    log: newLog,
  };
}

export function simulateBattle(
  dwarves: UnitStats[],
  enemies: UnitStats[],
  seed: number
): BattleState {
  const prng = new PRNG(seed);
  let state: BattleState = {
    dwarves: JSON.parse(JSON.stringify(dwarves)), // Deep copy
    enemies: JSON.parse(JSON.stringify(enemies)),
    round: 0,
    log: ['Battle started!'],
    winner: null,
  };

  const maxRounds = 50; // Safety limit
  while (!state.winner && state.round < maxRounds) {
    state = simulateRound(state, prng);
  }

  if (!state.winner) {
    state.winner = 'draw';
    state.log.push('Battle ended in a draw (max rounds reached).');
  }

  return state;
}
