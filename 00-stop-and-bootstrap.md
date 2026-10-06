# §0. Стоп-фраза, Роль, Bootstrap, Чекпоинты, Контракты, Цикл

> Раздел §0 из ТЗ v7.2 «Гномы и Глубины».

---

## §0. СТОП-ФРАЗА

```
Замена Phaser 3 на React/Vue/Svelte/vanilla-DOM/Canvas-2D-как-
замена-Phaser, удаление Playwright-теста, любое упрощение DoD —
СЧИТАЕТСЯ ПРОВАЛОМ ФАЗЫ.

Агент НЕ ИМЕЕТ ПРАВА принимать такое решение самостоятельно,
даже если:
  - «так быстрее»
  - «так проще»
  - «так меньше бандл»
  - «пользователь скорее всего хотел именно это»
  - «это же эквивалентная замена»

При возникновении сомнения — STOP, defects.md, предложить вариант
БЕЗ смены стека, ждать следующей инструкции.

Matter.js не используется. Защита от его «замены» не требуется.
Единственное допустимое отклонение — зафиксированное в defects.md.
```

---

## §0.1. Роль и контекст

**Роль:** Автономный ИИ-агент GameDev (full-stack).
**Вход:** пустая папка + этот документ + доступ к ФС/терминалу/браузеру.
**Ограничения:**
- Без вопросов к пользователю. Решения фиксируются в defects.md.
- Без остановки до состояния «играбельно от начала до конца».
- Всё тестируется автоматически.

---

## §0.2. Bootstrap (первые 60 секунд)

Агент выполняет **строго в этом порядке**, до чтения §1:

```
1. Проверить окружение:
      node --version    (требуется ≥ 20.x)
      npm --version     (требуется ≥ 10.x)
      git --version     (если нет — fallback tar)
    Записать версии в /memory-bank/tech-stack.md.

2. Если git доступен:
      git init
      git config user.email "agent@local"
      git config user.name "AutoAgent"

3. Создать .gitignore:
      node_modules/
      dist/
      .vite/
      *.log
      /screenshots/tmp/
      /videos/tmp/
      .DS_Store

4. Создать .nvmrc:
      20

5. Создать структуру папок (§2.2) — только директории, пустые:
      mkdir -p src/{core,battle,economy,progression,ui,data,idle,persistence,assets}
      mkdir -p scripts tests/{unit,playwright}
      mkdir -p memory-bank screenshots videos checkpoints public/atlas

6. Первый коммит:
      git add -A
      git commit -m "bootstrap: empty skeleton"
      git tag phase-0-bootstrap

7. Создать PROMPT.md — скопировать туда index.md и все файлы 00–10.

8. Создать architecture.md по контракту §0.4.

9. Создать memory-bank/ по шаблонам §0.5.

10. Только после этого — ШАГ 0 Фазы 1 (§8): npm install phaser,
    замер bundle baseline.
```

**Если git недоступен:** пропустить 2, 6, создать `/checkpoints/`.
**Если npm install падает:** записать в defects.md, ОСТАНОВИТЬСЯ.

---

## §0.3. Чекпоинты

```
Чекпоинт = git commit + tag после приёмки фазы.

Перед началом фазы N+1:
  git add -A && git commit -m "phase-N accepted"
  git tag phase-N-accepted

При провале приёмки:
  git stash push -u -m "phase-(N+1) failed attempt"
  git reset --hard phase-N-accepted

Fallback (если git недоступен): tar-архив /src + /memory-bank
в /checkpoints/phase-N.tar.gz. Проверка:
  tar -tzf /checkpoints/phase-N.tar.gz > /dev/null
```

---

## §0.4. Контракт architecture.md

```
architecture.md обязательно содержит:

1. Список модулей из §2.2 и их публичные экспорты.

2. Направленный граф зависимостей (без циклов).
   Особое правило: /src/battle/simulator.ts НЕ импортирует 
   Phaser, DOM API (§3.1.7).

3. Механизм чекпоинтов (§0.3): git или tar.

4. Точку входа (src/main.ts) + связи с Phaser.Game.

5. Список всех Phaser Scenes (9 экранов §4).

6. Явное подтверждение стека (§2.1): Phaser 3, Phaser tweens,
   никакого React/Vue.

Без всех 6 пунктов architecture.md не принимается.
```

---

## §0.5. Контракт memory-bank/

```
Все файлы — markdown, append-only:

  tech-stack.md         — версии node/npm/git/phaser
  progress.md           — журнал [timestamp] phase-N [status]
  defects.md            — [timestamp] [severity] [phase] описание
  implementation-plan.md — план на 3 фазы вперёд
  game-design-document.md — выжимка §1, §3, §6
  bundle-baseline.txt   — "Baseline bundle (gzip): X.XX MB / 5 MB"
                          + Headroom + Measured at + Commit
```

---

## §0.6. Цикл работы

```
1. Прочитать ТЗ.
2. §0.2 bootstrap.
3. Создать architecture.md, memory-bank.
4. ШАГ 0 Фазы 1 — замер bundle ДО кода фич.
5. Для каждой фазы: реализация → unit-тест → Playwright →
   скриншот → чеклист UI → git-чекпоинт → progress.md.
6. Фаза N+1 не начинается без приёмки N.
```
