# Architecture — Dwarves & Depths v5.2

## 1. Stack (Fixed per §0)
- **Engine:** Phaser 3
- **Physics:** Matter.js
- **Language:** TypeScript
- **Bundler:** Vite
- **Testing:** Vitest (unit), Playwright (E2E headless)

## 2. Project Structure
```
/workspace
├── src/
│   ├── core/          # PRNG, Store, Types, Config
│   ├── battle/        # Simulator (pure TS, no Phaser/Matter/DOM)
│   ├── economy/       # Resources, upgrades
│   ├── progression/   # Skills, talents, unlocks
│   ├── ui/            # Phaser Scenes + HTML/CSS overlays
│   ├── data/          # Static game data
│   ├── idle/          # Idle mechanics
│   ├── persistence/   # Save/Load
│   └── assets/        # Asset generation scripts
├── scripts/           # Build/generate tools
├── tests/
│   ├── unit/          # Vitest tests
│   └── playwright/    # E2E tests
├── memory-bank/       # Dev notes, defects, progress
├── public/atlas/      # Generated atlases
└── dist/              # Build output
```

## 3. Key Contracts

### 3.1 Battle Simulator (§3.1.7)
`/src/battle/simulator.ts`:
- НЕ импортирует Phaser
- НЕ импортирует Matter.js
- НЕ импортирует DOM API
- Чистая логика: input → simulation state → output

### 3.2 Screens (10 total)
Все экраны — Phaser Scenes с HTML/CSS оверлеями поверх canvas:
1. BootScene
2. PreloaderScene
3. MainMenuScene
4. LobbyScene
5. DraftScene
6. BattleScene
7. RewardScene
8. UpgradeScene
9. SettingsScene
10. GameOverScene

### 3.3 PRNG
Единый генератор псевдослучайных чисел для воспроизводимости:
- Seed-based
- Методы: `nextInt()`, `nextFloat()`, `pick()`, `shuffle()`

## 4. Data Flow
```
User Input → Scene Event → Store Update → Simulator Tick → Render
```

## 5. Budget Constraints
- **Bundle Size:** < 5 MB gzip (baseline до фич: ~0.3-0.5 MB)
- **FPS:** 60 target
- **Memory:** < 256 MB heap

## 6. Testing Strategy
- Unit: simulator, PRNG, store
- E2E: full battle flow, screen transitions
- Visual: screenshots comparison (optional)

## 7. Phase Gates
Переход к фазе N+1 только после:
- `git tag phase-N-accepted`
- Все DoD фазы N выполнены
- Bundle budget проверен
