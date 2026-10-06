import { simulateRun } from './src/lib/game/logic/simulateRun.ts';

const r1 = simulateRun(42);
const r2 = simulateRun(42);
const d1 = JSON.stringify(r1, null, 2);
const d2 = JSON.stringify(r2, null, 2);

if (d1 === d2) {
  console.log('DETERMINISM: PASS');
} else {
  console.log('DETERMINISM: FAIL');
  const lines1 = d1.split('\n');
  const lines2 = d2.split('\n');
  for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
    if (lines1[i] !== lines2[i]) {
      console.log(`Diff at line ${i}:`);
      console.log(`  A: ${lines1[i]}`);
      console.log(`  B: ${lines2[i]}`);
    }
  }
  process.exit(1);
}
