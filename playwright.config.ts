import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright E2E para o Portal Antifraude.
 * Suporta execução com devServer automático (npm start) ou servidor já ativo.
 */
export default defineConfig({
  testDir: './e2e/specs',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false, // Execução sequencial ordenada para estabilidade do estado dos mocks
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'e2e-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
});
