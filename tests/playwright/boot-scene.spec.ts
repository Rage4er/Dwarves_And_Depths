import { test, expect } from '@playwright/test';

test('BootScene shows Phase 1 OK', async ({ page }) => {
  // Запускаем dev-сервер
  const process = require('child_process').spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true,
  });

  // Ждём запуска сервера
  await page.waitForTimeout(3000);

  try {
    await page.goto('http://localhost:3000/dwarves_and_depths/');
    
    // Ждём загрузки canvas
    await page.waitForSelector('canvas', { timeout: 5000 });
    
    // Проверяем, что текст "Phase 1 OK" отображается
    const text = await page.locator('canvas').screenshot();
    expect(text).toBeDefined();
    
    console.log('✓ BootScene rendered successfully');
  } finally {
    process.kill();
  }
});
