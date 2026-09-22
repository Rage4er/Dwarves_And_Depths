import { gzipSync } from 'zlib';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

// Get current commit hash
let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch (e) {
  console.warn('Could not get git commit hash');
}

const DIST_DIR = './dist';
const EXCLUDED_EXTENSIONS = ['.map'];

interface FileStats {
  path: string;
  size: number;
  gzipSize: number;
}

function getAllFiles(dir: string, baseDir: string = dir): FileStats[] {
  const files: FileStats[] = [];
  
  if (!readdirSync(dir).length) {
    return files;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (entry.isFile() && !EXCLUDED_EXTENSIONS.includes(extname(entry.name))) {
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath);
      const gzipSize = gzipSync(content).length;
      
      files.push({
        path: fullPath.replace(baseDir + '/', ''),
        size: stats.size,
        gzipSize
      });
    }
  }

  return files;
}

console.log(`\n=== Bundle Baseline Measurement ===`);
console.log(`Commit: ${commitHash}`);
console.log(`Date: ${new Date().toISOString()}`);
console.log('');

if (!readdirSync(DIST_DIR).length) {
  console.log('⚠️  dist/ directory is empty. Run build first.');
  console.log('');
  console.log('Expected baseline (Phaser + Matter.js only): ~0.3-0.5 MB gzip');
  process.exit(0);
}

const files = getAllFiles(DIST_DIR);

if (files.length === 0) {
  console.log('⚠️  No files found in dist/');
  console.log('');
  console.log('Expected baseline (Phaser + Matter.js only): ~0.3-0.5 MB gzip');
  process.exit(0);
}

let totalSize = 0;
let totalGzipSize = 0;

console.log('Files:');
console.log('-'.repeat(60));
for (const file of files) {
  console.log(`${file.path.padEnd(40)} ${(file.size / 1024).toFixed(2)} KB → ${(file.gzipSize / 1024).toFixed(2)} KB gzip`);
  totalSize += file.size;
  totalGzipSize += file.gzipSize;
}

console.log('-'.repeat(60));
console.log(`TOTAL: ${(totalSize / 1024 / 1024).toFixed(2)} MB → ${(totalGzipSize / 1024 / 1024).toFixed(2)} MB gzip`);
console.log('');

const BUDGET_MB = 5;
if (totalGzipSize / 1024 / 1024 > BUDGET_MB) {
  console.log(`❌ BLOCKER: Bundle size ${(totalGzipSize / 1024 / 1024).toFixed(2)} MB exceeds budget ${BUDGET_MB} MB`);
  console.log('→ STOP. Add to defects.md as BLOCKER.');
  process.exit(1);
} else {
  console.log(`✅ Bundle size ${(totalGzipSize / 1024 / 1024).toFixed(2)} MB within budget ${BUDGET_MB} MB`);
}

console.log('');
