@echo off
rem ⛏️ «Гномы и Глубины» — production-сервер (Windows): build при необходимости + next start
rem Использование: start-prod.cmd [--port 3000]
setlocal
cd /d "%~dp0"
node scripts\serve.mjs --prod %*