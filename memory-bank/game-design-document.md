# Game Design Document (GDD) — «Гномы и Глубины»

## Concept

- **Title:** Dwarves & Depths (Гномы и Глубины)
- **Genre:** Single-player Idle Roguelite Auto Battler
- **Platform:** Browser (desktop 1920×1080 landscape, mobile 667×375 forced-landscape)
- **Formula:** Auto Battler × Idle × Roguelite × Single-player
- **Emotional Goal:** «Это моя ошибка» → «В следующий раз будет лучше»
- **Session Length:** 8–12 minutes per run, infinite meta-progression

## Core Loop

1. Assemble dwarf squad (idle recruitment)
2. Auto-battle through roguelite map (battle nodes, elites, events, rest, shop, forge, boss)
3. Permadeath: dwarves die permanently, equipment returns to inventory
4. Meta-progression: unlock new roles, items, synergies across runs

## Key Systems

### Battle System (§3.1)
- Turn-based auto-battle with Matter.js physics visualization
- Roles: tank, warrior, ranged, mage, support, any
- Positioning: front, mid, back
- Effects: stun, lifesteal, splash, pierce, taunt, aura_*, conditional_atk, double_strike, hp_regen, extra_slot, poison, burn
- Dual-meaning effects: value = effect magnitude, chance = trigger probability

### Economy (§3.5)
- Gold earned from battles
- Shop: buy equipment and new dwarves
- Forge: upgrade equipment (stage 1→2→3)
- Rest: heal dwarves
- Legacy currency for meta-unlocks

### Progression (§3.4)
- RunNode graph: battle → elite → event → rest → shop → forge → boss
- Unlock tree persistent across runs
- Map generator with seed-based determinism

### Idle Mechanics (§3.6)
- Offline income (simulated via Date.now())
- Auto-recruitment after runCount thresholds (3/5/7)
- Auto-equip for new recruits

## UI Screens (§4)

1. BootScene (loading)
2. Title Screen
3. Main Menu
4. Squad Selection
5. Battle Scene
6. Map/Progression
7. Shop
8. Forge/Crafting
9. Event Dialog
10. Game Over / Victory

## Technical Constraints

- **Stack:** Phaser 3 + Matter.js (fixed, §0 стоп-фраза)
- **Bundle Budget:** < 5 MB gzip
- **State:** Immutable store (§2.10)
- **Persistence:** localStorage (JSON)
- **Testing:** Playwright E2E + unit tests

---

*Extracted from TZ v5.2 §§1, 3, 6 for quick reference.*
