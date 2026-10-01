#!/usr/bin/env node
// ⛏️ «Гномы и Глубины» — кроссплатформенный запуск локального сервера
//
// Работает одинаково на Windows (cmd/PowerShell) и Linux/macOS (bash/sh),
// т.к. исполняется через Node. Оборачивается тонкими скриптами:
//   start-dev.cmd / start-dev.sh  — режим разработки (next dev, HMR)
//   start-prod.cmd / start-prod.sh — production (next build при необходимости + next start)
//
// Управление:
//   node scripts/serve.mjs [--dev|--prod] [--port 3000] [--host 0.0.0.0]
//   Переменные окружения: PORT, HOST, NPM_REGISTRY
//
// Поведение:
//   1. Выбирает пакетный менеджер: bun (если установлен) → npm.
//   2. Если node_modules отсутствует — устанавливает зависимости.
//      Для npm при необходимости указывается NPM_REGISTRY (например, корпоративное зеркало);
//      по умолчанию npm использует конфиг из .npmrc / package-lock.json.
//   3. В prod-режиме собирает проект, если нет готового .next/BUILD_ID.
//   4. Запускает сервер на HOST:PORT (по умолчанию 0.0.0.0:3000).

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = platform() === 'win32';

// ── разбор аргументов ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const hasFlag = (name, short) => argv.includes(`--${name}`) || (short ? argv.includes(`-${short}`) : false);
const valueOf = (name, short) => {
  const long = argv.indexOf(`--${name}`);
  if (long >= 0 && argv[long + 1]) return argv[long + 1];
  if (short) {
    const s = argv.indexOf(`-${short}`);
    if (s >= 0 && argv[s + 1]) return argv[s + 1];
  }
  return null;
};

const mode = hasFlag('prod', 'p') ? 'prod' : 'dev';
const port = valueOf('port', 'p') ?? process.env.PORT ?? '3000';
const host = valueOf('host', 'H') ?? process.env.HOST ?? '0.0.0.0';
const registry = process.env.NPM_REGISTRY ?? null;

// ── утилиты ──────────────────────────────────────────────────────────
const log = (msg) => console.log(`[serve] ${msg}`);
const err = (msg) => console.error(`[serve] ${msg}`);

function isAvailable(cmd) {
  if (isWin) {
    // Windows: cmd.exe, командная строка (без args при shell:true — иначе DEP0190)
    const r = spawnSync(`${cmd} --version`, { stdio: 'ignore', shell: true });
    return r.status === 0;
  }
  const r = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
  return r.status === 0;
}

function pickManager() {
  if (isAvailable('bun')) return 'bun';
  if (isAvailable('npm')) return 'npm';
  err('Не найден ни bun, ни npm. Установите Node.js >= 20 или bun.');
  process.exit(1);
}

function run(bin, args) {
  log(`${bin} ${args.join(' ')}`);
  if (isWin) {
    // На Windows запускаем через shell командной строкой — так корректно
    // резолвятся npm.cmd / next.cmd (массив args при shell:true даёт
    // предупреждение DEP0190 в Node 24+)
    const quote = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
    return spawn(`${bin} ${args.map(quote).join(' ')}`, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });
  }
  return spawn(bin, args, { cwd: root, stdio: 'inherit' });
}

// Регистрирует обработчики ошибок/завершения child-процесса
function watch(child, label) {
  child.on('error', (e) => {
    err(`Не удалось запустить ${label}: ${e.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    if (code !== 0 && label.includes('next')) {
      err(
        `${label} завершился с кодом ${code}. Проверьте, что порт ${port} свободен ` +
          '(netstat -ano | findstr :PORT) и нет чужого процесса.',
      );
    }
    process.exitCode = code ?? 0;
  });
}

// ── установка зависимостей ───────────────────────────────────────────
function ensureDeps(manager) {
  if (existsSync(path.join(root, 'node_modules'))) return start(manager);
  log('node_modules не найден — устанавливаю зависимости…');
  const args = manager === 'bun'
    ? ['install']
    : ['install', '--no-audit', '--no-fund', '--loglevel=warn', ...(registry ? [`--registry=${registry}`] : [])];
  const p = run(manager, args);
  watch(p, 'установка зависимостей');
  p.on('exit', () => start(manager));
}

// ── запуск ───────────────────────────────────────────────────────────
function start(manager) {
  if (mode === 'prod') {
    if (!existsSync(path.join(root, '.next', 'BUILD_ID'))) {
      log('Production-сборка не найдена — выполняю next build…');
      const b = run(manager, ['run', 'build']);
      watch(b, 'next build');
      b.on('exit', () => runServer(manager, 'start'));
      return;
    }
    runServer(manager, 'start');
  } else {
    runServer(manager, 'dev');
  }
}

function runServer(manager, nextCmd) {
  log(`Сервер: http://localhost:${port}  (режим: ${mode})  Ctrl+C — остановка`);
  const p = run(manager, ['run', nextCmd, '--', '-H', host, '-p', port]);
  watch(p, `next ${nextCmd}`);
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => p.kill(sig));
}

// ── точка входа ──────────────────────────────────────────────────────
ensureDeps(pickManager());