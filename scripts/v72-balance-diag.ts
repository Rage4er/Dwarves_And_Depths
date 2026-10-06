// Диагностика баланса v7.2 — почему 10% win rate
import { simulateRun } from '../src/lib/game/logic/simulateRun';
import { ITEM_TABLE } from '../src/lib/game/data/items';
import { DWARF_TABLE } from '../src/lib/game/data/dwarves';
import { ENEMY_TABLE } from '../src/lib/game/data/enemies';

console.log('=== БАЛАНС: статы гномов ===');
const dwarves = DWARF_TABLE.slice(0, 2); // d_brom, d_grim
for (const d of dwarves) {
  console.log(`${d.id}: HP=${d.baseHP} ATK=${d.baseATK} DEF=${d.baseDEF} SPD=${d.baseSpeed}`);
}

console.log('\n=== БАЛАНС: статы врагов ===');
for (const [key, e] of Object.entries(ENEMY_TABLE)) {
  console.log(`${key}: HP=${e.baseHP} ATK=${e.baseATK} DEF=${e.baseDEF} SPD=${e.speed} isBoss=${e.isBoss} isElite=${e.isElite}`);
}

console.log('\n=== БАЛАНС: пул floor 1 ===');
// simulateRun использует spawnGroup для battle узлов

console.log('\n=== БАЛАНС: 10 прогонов детально ===');
for (let seed = 1; seed <= 10; seed++) {
  const run = simulateRun(seed);
  console.log(`seed=${seed}: status=${run.status} floor=${run.floor} depth=${run.depth} gold=${run.gold} dwarvesAlive=${run.dwarves.filter(d => d.isAlive).length}/${run.dwarves.length} inventory=${run.inventory.length}`);
}

console.log('\n=== БАЛАНС: headlessMeta ===');
console.log('maxSlots=2 → slotLimit = 4 + 2 + 0 = 6 слотов на гнома');
console.log('unlockedEquipment=[] — но newRun использует fallback на ITEM_TABLE');
console.log('party: d_brom + d_grim (2 гнома)');
