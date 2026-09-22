#!/usr/bin/env node
/**
 * Check PRNG reproducibility before build
 * Scripts: prebuild
 */
import { execSync } from 'child_process';

console.log('=== PRNG Reproducibility Check ===');

// Run a simple test to verify PRNG is deterministic
const testCode = `
import { PRNG } from './src/core/prng';

const prng1 = new PRNG(12345);
const prng2 = new PRNG(12345);

const seq1 = [prng1.nextInt(0, 100), prng1.nextFloat(), prng1.nextInt(0, 100)];
const seq2 = [prng2.nextInt(0, 100), prng2.nextFloat(), prng2.nextInt(0, 100)];

if (JSON.stringify(seq1) !== JSON.stringify(seq2)) {
  console.error('PRNG is NOT reproducible!');
  process.exit(1);
}

console.log('PRNG reproducibility: OK');
process.exit(0);
`;

try {
  execSync(`tsx -e "${testCode}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('❌ PRNG check failed');
  process.exit(1);
}
