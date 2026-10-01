@echo off
rem ⛏️ «Гномы и Глубины» — запуск dev-сервера (Windows)
rem Использование: start-dev.cmd [--port 3000]
setlocal
cd /d "%~dp0"
node scripts\serve.mjs %*