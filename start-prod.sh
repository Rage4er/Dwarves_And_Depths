#!/usr/bin/env sh
# ⛏️ «Гномы и Глубины» — production-сервер (Linux/macOS): build при необходимости + next start
# Использование: ./start-prod.sh [--port 3000]
cd "$(dirname "$0")" || exit 1
exec node scripts/serve.mjs --prod "$@"