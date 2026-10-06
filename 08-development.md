# §8. Процесс Разработки (7 фаз)

> Раздел §8 из ТЗ v7.2 «Гномы и Глубины».

---

## Таблица фаз

| # | Фаза | Deliverables | Acceptance |
|---|------|--------------|------------|
| 1 | Архитектура + бюджет | architecture.md, core/types.ts, package.json, tsconfig.json, vite.config.ts, index.html, src/main.ts. ШАГ 0: `npm install phaser`, `npm run build`, замер через Node zlib. | tsc --noEmit; 100% §2.3; unit-тест PRNG; мок «1 гном vs 1 крыса»; bundle-baseline.txt; скрин «Phase 1 OK»; git tag phase-1-accepted |
| 2 | Ядро + Бой | core/, battle/ (simulateBattleTick, simulateBattle, simulateRun, createBattleState) | Determinism test; Playwright: dwarf vs rat; скрин боя; seed=42 trace; git tag phase-2-accepted |
| 3 | Roguelite | progression/, economy/ | Playwright: run to boss; скрин карты; скрин кузницы; git tag phase-3-accepted |
| 4 | UI | ui/ (9 экранов + параллакс + tweens) | Скрины всех экранов; чеклист §4.1; git tag phase-4-accepted |
| 5 | Idle + Persistence | idle/, persistence/ | Offline 8h; localStorage roundtrip; скрин reopen; git tag phase-5-accepted |
| 6 | Балансировка | data/ tuning | 10 прогонов greedy → 40–60% win rate; git tag phase-6-accepted |
| 7 | Финализация | интеграция, smoke, README | Все пункты §9 ✅; видео; bundle < 5 MB; git tag phase-7-accepted |

---

## Скрипт замера bundle (Шаг 0 Фазы 1)

```javascript
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

let commit = 'no-git';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) {}

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
```
