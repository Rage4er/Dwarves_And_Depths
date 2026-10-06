// Determinism + Balance test v7.2
import { simulateRun } from '../src/lib/game/logic/simulateRun';

// Determinism test
const a = JSON.stringify(simulateRun(42));
const b = JSON.stringify(simulateRun(42));
console.log('Determinism test:', a === b ? 'PASS' : 'FAIL');

// Balance test: 10 runs, count wins (без ограничения maxFloors — полный забег)
let wins = 0;
let losses = 0;
let timeouts = 0;
for (let i = 1; i <= 10; i++) {
  const run = simulateRun(i);
  if (run.status === 'victory' || run.status === 'victory_endless') {
    wins++;
  } else if (run.status === 'defeat') {
    losses++;
  } else {
    timeouts++;
  }
}
const winRate = (wins / 10) * 100;
console.log(`Balance test: ${wins}W / ${losses}L / ${timeouts}T (${winRate}%)`);
console.log(winRate >= 40 && winRate <= 60 ? 'PASS (40-60%)' : 'WARN (outside 40-60%)');
