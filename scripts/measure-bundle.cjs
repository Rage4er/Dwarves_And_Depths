const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) :
    e.name.endsWith('.js') ? [path.join(dir, e.name)] : []
  );
}

const files = walk('dist');
let total = 0;
for (const f of files) {
  const gz = zlib.gzipSync(fs.readFileSync(f));
  total += gz.length;
}

const mb = (total / 1024 / 1024).toFixed(2);
const headroom = (5 - mb).toFixed(2);

// Получить текущий commit hash (с fallback, если git недоступен)
let commit = 'no-git';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) { /* git недоступен — оставляем fallback */ }

const line = 'Baseline bundle (gzip): ' + mb + ' MB / 5 MB budget\n' +
             'Headroom: ' + headroom + ' MB\n' +
             'Measured at: ' + new Date().toISOString() + '\n' +
             'Commit: ' + commit + '\n';

fs.writeFileSync('memory-bank/bundle-baseline.txt', line);
console.log(line);

if (parseFloat(mb) > 5) {
  fs.appendFileSync('memory-bank/defects.md',
    '\n[' + new Date().toISOString() + '] [BLOCKER] [phase-1] ' +
    'Bundle budget exceeded: ' + mb + ' MB > 5 MB\n');
  process.exit(1);
}
