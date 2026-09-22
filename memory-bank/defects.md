# Defects Log

## [2025-09-22T07:30:00Z] Стоп-фраза §0 принята как контракт

**Подтверждение прочтения стоп-фразы:**
Запрещена любая замена Phaser 3 на React/Vue/Svelte/vanilla-DOM. Запрещена замена Matter.js на CSS-анимации или другие физические движки. Запрещено удаление Playwright-тестов или упрощение Definition of Done (DoD). При любом нарушении — немедленная остановка работ, фиксация дефекта в этом файле, предложение решения БЕЗ смены стека. Единственное допустимое отклонение — зафиксированное в defects.md с обоснованием.

**Статус:** Контракт принят. Все дальнейшие решения сверяются со стоп-фразой.

---

## [2026-09-22T08:05:01Z] [MINOR] [phase-0] GitHub Pages настроен

- **Scenario:** GitHub Actions
- **Workflow:** .github/workflows/deploy.yml
- **Target URL:** https://rage4er.github.io/dwarves_and_depths/
- **base в vite.config.ts:** '/dwarves_and_depths/'
- **Pages mode:** переключён на "GitHub Actions" вручную в Settings
- **build output:** dist/index.html содержит пути /dwarves_and_depths/assets/...
- **bundle size:** 340.12 kB gzip (бюджет < 5 MB ✅ PASS)

