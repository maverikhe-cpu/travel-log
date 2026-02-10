import { defineConfig, devices } from '@playwright/test';

/**
 * 川渝行迹 E2E 测试配置
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 改为顺序执行，避免并发问题
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 增加重试次数
  timeout: 60000, // 全局超时60秒
  workers: 1, // 单worker模式，更稳定

  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000, // action超时30秒
    navigationTimeout: 30000, // navigation超时30秒
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true, // 强制headless模式
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage'] // WSL优化
        }
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 13'],
        headless: true, // 强制headless模式
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: true // 强制headless模式
      },
    },
  ],

  // 本地开发服务器
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000, // 增加到120秒
        stderr: 'pipe', // 捕获stderr输出
      },
});
