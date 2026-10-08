import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  // *.spec.ts + *.pw.ts (playwright-specific naming)
  testMatch: ['**/*.spec.ts', '**/*.pw.ts'],
  timeout: 60000,
  use: {
    trace: 'on-first-retry',
  },
  // Автозапуск dev-сервера перед тестами
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev -p 3000',
    url: 'http://localhost:3000/Dwarves_And_Depths/',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        baseURL: 'http://localhost:3000/Dwarves_And_Depths/',
        channel: 'chrome',
      },
    },
  ],
});
