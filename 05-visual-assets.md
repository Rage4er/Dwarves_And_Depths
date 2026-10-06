# §5. Визуал и Процедурные Ассеты

> Раздел §5 из ТЗ v7.2 «Гномы и Глубины».

---

## §5.1. Стиль

```
Пиксель-арт, 96×96 для персонажей. 32×32 для иконок.
OKLCH H=30-50, C=0.1-0.15, L=0.2-0.5.
Все ассеты — процедурно через scripts/gen-assets.ts.
```

---

## §5.2. Минимальный набор

| Категория | Кол-во | Размер | Метод |
|---|---|---|---|
| Тела гномов | 4 | 96×96 | Canvas 2D |
| Палитры | 8 | — | hue-shift |
| Анимации гномов | 4 | 96×96 | spritesheet |
| Тела врагов | 11 (v7.0: + e_archer_goblin, + e_shaman) | 96×96 | силуэт + palette |
| Анимации врагов | 4 | 96×96 | spritesheet |
| Иконки предметов | 66 | 32×32 | SVG |
| Иконки кузницы | 4 | 32×32 | Canvas |
| Параллакс | 5×3 | 2048×1080 | шум + градиент |
| Частицы | 4 | 16×16 | Canvas |
| Звуки | 8 | — | WebAudio |

**11 тел врагов** (v7.0): + e_forge_demon, + e_ancient, + e_archer_goblin, + e_shaman.

**ranged-спрайты (v7.0):** лучник — лук + колчан, шаман — посох + череп-амулет;
палитры OKLCH: лучник H=60-80 (болотный), шаман H=280-300 (фиолетовый).

**e_ancient (Древний) — особый спрайт (v6.9):**
- Размер: 96×96 (стандартный)
- Стиль: тёмный силуэт с светящимися глазами
- Палитра: OKLCH H=250-270 (фиолетовый), C=0.2, L=0.1-0.2
- Анимация: idle (4 кадра) + attack (5 кадров)
- Особенность: при появлении экран темнеет, Древний светится

---

## §5.2.1. Parallax

| Layer | Имя | Размер | Scroll |
|---|---|---|---|
| 0 | bg_far | 2048×1080 | 0.05 |
| 1 | bg_mid_rock | 2048×1080 | 0.15 |
| 2 | bg_crystals | 2048×1080 | 0.30 |
| 3 | bg_near_rock | 2048×1080 | 0.50 |
| 4 | bg_fog | 2048×1080 | 0.70 |

floorTier: 1 (≤3), 2 (≤7), 3 (≥8).

---

## §5.3. Визуальные эффекты (Phaser tweens)

```
Отскок врага (гном бьёт):
  tweens.add({ targets: enemySprite, x: x+100, duration: 200,
               ease: 'Back.easeOut' });

Отскок гнома (враг бьёт):
  tweens.add({ targets: dwarfSprite, x: x-100, duration: 200,
               ease: 'Back.easeOut' });

Ragdoll врага:
  tweens.add({ targets: enemySprite, rotation: PI*2, alpha: 0,
               duration: 2000, ease: 'Cubic.easeIn',
               onComplete: () => sprite.destroy() });

Ragdoll гнома:
  tweens.add({ targets: dwarfSprite, rotation: PI, y: y+50,
               duration: 500, ease: 'Cubic.easeIn' });

Удар (взмах):
  tweens.add({ targets: dwarfSprite, scaleX: 1.2,
               duration: 100, yoyo: true });

Summon (финальный босс):
  tweens.add({ targets: bossSprite, scaleX: 1.3, scaleY: 1.3,
               duration: 500, yoyo: true });
```

---

## §5.4. Asset pipeline

```
Формат: PNG atlas + JSON hash (Phaser 3 native).
Кадр: 96×96 (персонажи), 32×32 (иконки).
Анимации: idle(4f), run(6f), attack(5f), death(8f).
Палитра: runtime через Canvas 2D.
Генерация: npm run gen:assets → /public/atlas/*.png + *.json.
```

---

## §5.5. Гномий шрифт (v7.0)

```
font-runic — рунический дисплейный шрифт для имён гномов и заголовков.
Применение:
  - имена гномов на карточках экрана 2 и в бою;
  - заголовки экранов (Сбор отряда, Рюкзак, Событие…);
  - названия типов врагов в превью «ВПЕРЕДИ» (§4.4).
Не применяется: к тексту правил, наград, событий — читаемость важнее стиля.
Fallback-стек: 'Runic', 'Cinzel', serif — кириллица отображается,
если глифа нет в рунном наборе.
```
