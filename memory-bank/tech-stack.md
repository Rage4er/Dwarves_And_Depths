# Tech Stack

## Initial Environment (Phase 0 Bootstrap)

| Tool | Version | Timestamp |
|------|---------|-----------|
| Node.js | v20.20.2 | 2024-09-22 |
| npm | 10.8.2 | 2024-09-22 |
| git | 2.39.5 | 2024-09-22 |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| phaser | ^4.2.1 | Render engine (WebGL + Canvas fallback) |
| matter-js | ^0.20.0 | Physics engine (ragdoll, collisions) |

## Notes

- TypeScript strict mode enabled
- Vite as bundler
- Playwright for E2E testing
- No React/Vue/Svelte — Phaser 3 only (§0 стоп-фраза)
