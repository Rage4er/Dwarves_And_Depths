import { test, expect } from '@playwright/test';

test.describe('Battle screen', () => {
  test('loads and renders canvas', async ({ page }) => {
    // SPA: basePath = '/Dwarves_And_Depths/'
    await page.goto('./');

    // Ждём заголовок — холодный старт Next.js может занять >30 сек
    await expect(page.locator('h1')).toContainText('Гномы и Глубины', { timeout: 120000 });

    // Таверна → Новый поход
    await page.click('button:has-text("Новый поход")');

    // SPA: URL не меняется, ждём элемент экрана
    await expect(page.getByRole('heading', { name: 'Сбор отряда' })).toBeVisible({ timeout: 10000 });

    // Выбор отряда — первые два доступных гнома
    const dwarfButtons = page.locator('button:enabled').filter({ hasText: /Гном/ });
    await dwarfButtons.first().click();
    await dwarfButtons.nth(1).click();

    // Начать спуск
    await page.click('button:has-text("Начать спуск")');

    // SPA: ждём кнопку «В бой» на экране подготовки
    await expect(page.getByRole('button', { name: 'В бой' })).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("В бой")');

    // Бой — ждём canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Ждём 3 сек — бой идёт
    await page.waitForTimeout(3000);

    // Скриншот
    await page.screenshot({
      path: 'screenshots/phase-rt-2/smoke-battle.png',
      fullPage: false,
    });

    // Проверить, что гномы отрисованы
    const hasDwarves = await page.evaluate(() => {
      const game = (window as any).__phaserGame;
      if (!game) return false;
      const scene = game.scene.getScene('BattleScene');
      return scene?.allySprites?.size > 0;
    });
    expect(hasDwarves).toBe(true);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('./');
    await page.click('button:has-text("Новый поход")');
    await expect(page.getByRole('heading', { name: 'Сбор отряд' })).toBeVisible({ timeout: 10000 });

    const dwarfButtons = page.locator('button:enabled').filter({ hasText: /Гном/ });
    await dwarfButtons.first().click();
    await dwarfButtons.nth(1).click();
    await page.click('button:has-text("Начать спуск")');
    await expect(page.getByRole('button', { name: 'В бой' })).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("В бой")');
    await page.locator('canvas').waitFor({ timeout: 15000 });
    await page.waitForTimeout(5000);

    expect(errors).toEqual([]);
  });
});
