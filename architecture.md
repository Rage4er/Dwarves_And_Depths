# Architecture — Dwarves & Depths

## 1. Module List (§2.2)

| Module | Public Exports | Dependencies |
|--------|----------------|--------------|
| `/src/core/types.ts` | `Role`, `Rarity`, `Slot`, `Position`, `RunStatus`, `Tag`, `NodeType`, `Effect`, `StatusEffect`, `Equipment`, `Dwarf`, `Enemy`, `ShopItem`, `RunNode`, `RunState`, `GameState`, `MetaState` | none |
| `/src/core/store.ts` | `createStore()`, `getState()`, `setState()` | `types.ts` |
| `/src/core/prng.ts` | `PRNG` class (`seed()`, `next()`, `nextInt()`, `shuffle()`) | none |
| `/src/battle/simulator.ts` | `simulateTurn()`, `simulateRun()` | `types.ts`, `core/prng.ts` (**NO** Phaser/Matter/DOM) |
| `/src/battle/physics-adapter.ts` | `initPhysics()`, `syncEntities()` | `types.ts`, Phaser, Matter.js |
| `/src/economy/shop.ts` | `generateShop()`, `buyItem()` | `types.ts` |
| `/src/economy/forge.ts` | `upgradeItem()` | `types.ts` |
| `/src/progression/map-generator.ts` | `generateMap()` | `types.ts`, `prng.ts` |
| `/src/progression/unlock-tree.ts` | `unlockNode()`, `getUnlocks()` | `types.ts` |
| `/src/ui/boot-scene.ts` | `BootScene` class | Phaser |
| `/src/ui/title-scene.ts` | `TitleScene` class | Phaser |
| `/src/ui/battle-scene.ts` | `BattleScene` class | Phaser, Matter.js |
| `/src/data/smithy.ts` | `ITEM_TEMPLATES`, `ENEMY_TEMPLATES` | `types.ts` |
| `/src/idle/auto-loop.ts` | `simulateOfflineIncome()`, `autoRecruit()` | `types.ts` |
| `/src/persistence/save-load.ts` | `saveGame()`, `loadGame()`, `migrate()` | `types.ts` |

## 2. Dependency Graph (Directed, No Cycles)

```
types.ts (root, no dependencies)
    ↑
prng.ts (no dependencies)
    ↑
store.ts → types.ts
simulator.ts → types.ts, prng.ts  [CONTRACT: NO Phaser/Matter/DOM]
    ↑
physics-adapter.ts → types.ts, Phaser, Matter.js
map-generator.ts → types.ts, prng.ts
shop.ts, forge.ts → types.ts
unlock-tree.ts → types.ts
    ↑
battle-scene.ts → Phaser, Matter.js, simulator.ts, physics-adapter.ts
title-scene.ts, boot-scene.ts → Phaser
    ↑
main.ts → all scenes
```

**Critical Contract:** `/src/battle/simulator.ts` НЕ импортирует Phaser, Matter.js, DOM (§3.1.7). Это контрактное ограничение, а не пожелание.

## 3. Checkpoint Mechanism (§0.3)

**Selected:** Git-based checkpoints (git is available).

- Before phase N+1: `git commit -m "phase-N accepted" && git tag phase-N-accepted`
- On phase failure: `git stash push -u -m "phase-(N+1) failed"` + `git reset --hard phase-N-accepted`
- Fallback (if git unavailable): tar archives in `/checkpoints/`

## 4. Entry Point

**File:** `/src/main.ts`

**Responsibilities:**
- Initialize Phaser.Game with config (§2.8)
- Register all 10 scenes (§4)
- Start BootScene

## 5. Phaser Scenes (10 screens §4)

| Scene | Responsibility |
|-------|----------------|
| `BootScene` | Asset loading, progress bar |
| `TitleScene` | Title screen, start button |
| `MainMenuScene` | Main menu navigation |
| `SquadScene` | Dwarf selection before run |
| `BattleScene` | Combat visualization (Matter.js physics) |
| `MapScene` | Roguelite node graph display |
| `ShopScene` | Item/dwarf purchase UI |
| `ForgeScene` | Equipment upgrade UI |
| `EventScene` | Random event dialogs |
| `GameOverScene` | Victory/defeat summary, meta-progression |

## 6. Fixed Stack Confirmation (§2.1)

**Confirmed technologies:**
- **Render:** Phaser 3 (WebGL + Canvas fallback)
- **Physics:** Matter.js (ragdoll, collisions, bounces)
- **State:** Custom immutable store (§2.10)
- **Persistence:** localStorage (JSON)
- **UI:** Phaser DOM + HTML/CSS overlays (NO React/Vue/Svelte)
- **Sound:** WebAudio API (synthesis, no samples)
- **Testing:** Playwright + unit tests
- **Bundler:** Vite (< 5 MB gzip budget)
- **Language:** TypeScript strict mode

**Explicit prohibition:** React, Vue, Svelte, any UI framework atop Phaser — NOT USED ANYWHERE. All 10 screens are Phaser Scenes or HTML/CSS overlays atop Phaser canvas.

---

*This document satisfies §0.4 contract requirements.*
