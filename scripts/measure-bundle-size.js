#!/usr/bin/env node
/**
 * Measure bundle size after build
 * Scripts: postbuild
 */
import { execSync } from 'child_process';

try {
  execSync('tsx scripts/bundle-size.ts', { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
