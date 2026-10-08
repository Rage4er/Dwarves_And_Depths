# Defects — Гномы и Глубины

## [BLOCKER] [phase-rt-2] Phaser canvas пустой

**Дата:** 2026-10-07T13:42+08:00  
**Статус:** [IN PROGRESS] — fix applied, waiting Playwright MCP  
**Теги:** phase-rt-2 (откатить)

### Описание
Phaser 3 canvas на экране боя пустой — нет гномов, врагов, фона.
Только React HUD (header, speed, log) и React-оверлеи.

### Ошибка в консоли
```
TypeError: data.dwarves is not iterable
    at BattleSceneClass.preload
    at SceneManager.bootScene
    at SceneManager.start
```

### Причина
`preload()` падал на `data.dwarves` → сцена не загружала текстуры →
`create()` не создавал спрайты → пустой canvas.

### Fix (применён)
- Убраны все итерации по `data.dwarves` из `preload()`
- `preload()` теперь загружает ВСЕ возможные текстуры (все гномы, все враги, все тиры параллакса)
- Данные из `scene.start()` читаются только в `create()` через `this.data.values`

### Код BattleScene.ts preload():
```typescript
preload(): void {
  // Загружаем ВСЕ текстуры без зависимости от данных
  const allDwarves = ['d_brom', 'd_grim', 'd_torvin', ...];
  for (const id of allDwarves) {
    registerDwarfTexture(this, id, 'any', `dwarf_${id}`);
  }
  // ...
}
```

### Код BattleCanvas.tsx scene.start():
```typescript
gameInstance.scene.start(BATTLE_SCENE_KEY, {
  battle,
  dwarves: dwarfInfo,
  speed,
});
```

### Гипотезы
1. ~~`this.data` в Phaser — это `DataManager`, а не переданный объект~~ → исправлено
2. ~~`this.data.values` доступен только ПОСЛЕ `init()`, а `preload()` ДО `init()`~~ → исправлено
3. Браузер кэшировал старый bundle — нужно `localStorage.clear()` + `location.reload()`

### Блокировка
Playwright MCP не подключается к браузеру. Визуальная проверка невозможна.
Нужно починить Playwright MCP или перезапустить браузер вручную.

### Проверка (pending)
- [ ] Phaser canvas рендерит гномов (видны на скриншоте)
- [ ] Phaser canvas рендерит врагов (видны на скриншоте)
- [ ] Параллакс 5 слоёв виден
- [ ] Отскоки при ударах видны
- [ ] Ragdoll при смерти виден
- [ ] Консоль без ошибок
- [ ] FPS ≥ 60 / ≥ 30
