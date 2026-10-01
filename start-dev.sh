#!/usr/bin/env sh
# ⛏️ «Гномы и Глубины» — запуск dev-сервера (Linux/macOS)
# Использование: ./start-dev.sh [--port 3000]
cd "$(dirname "$0")" || exit 1
exec node scripts/serve.mjs "$@"