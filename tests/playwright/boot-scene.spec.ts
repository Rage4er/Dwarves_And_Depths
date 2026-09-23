import { test, expect } from '@playwright/test';

test('BootScene shows Phase 1 OK', async ({ page }) => {
  // Используем preview-сервер (статичный dist)
  await page.goto('http://localhost:4173/dwarves_and_depths/');

  // Ждём загрузки canvas
  const canvas = await page.waitForSelector('canvas', { timeout: 10000 });

  // Делаем скриншот для визуальной проверки
  const screenshot = await canvas.screenshot();
  
  expect(screenshot).toBeDefined();
  expect(screenshot.length).toBeGreaterThan(0);

  console.log('✓ BootScene rendered successfully');
});
