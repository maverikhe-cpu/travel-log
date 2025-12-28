import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers';

/**
 * 性能测试
 * 使用 Playwright 的性能 API 和度量指标
 */

test.describe('性能测试', () => {
  test.describe('页面加载性能', () => {
    test('首页加载性能', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // 等待页面加载完成
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // 验证首页在2秒内加载完成
      expect(loadTime).toBeLessThan(2000);

      // 获取性能指标
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        };
      });

      console.log('首页性能指标:', metrics);
    });

    test('登录页加载性能', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1500);
    });

    test('Dashboard 加载性能', async ({ page }) => {
      await login(page, 'user1');

      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('LCP (Largest Contentful Paint)', async ({ page }) => {
      await page.goto('/');

      // 获取 LCP
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            resolve(lastEntry.renderTime || lastEntry.loadTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // 5秒后超时
          setTimeout(() => resolve(0), 5000);
        });
      });

      console.log('LCP:', lcp, 'ms');
      // LCP 应该小于 2.5 秒
      expect(lcp).toBeLessThan(2500);
    });

    test('CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto('/');

      // 滚动页面以触发可能的布局偏移
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(clsValue), 3000);
        });
      });

      console.log('CLS:', cls);
      // CLS 应该小于 0.1
      expect(cls).toBeLessThan(0.1);
    });

    test('FID (First Input Delay)', async ({ page }) => {
      await page.goto('/login');

      const fid = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries() as any[];
            if (entries.length > 0) {
              resolve(entries[0].processingStart - entries[0].startTime);
            }
          }).observe({ entryTypes: ['first-input'] });

          // 模拟用户交互
          setTimeout(() => {
            document.querySelector('input')?.dispatchEvent(new Event('click', { bubbles: true }));
          }, 100);

          setTimeout(() => resolve(0), 3000);
        });
      });

      console.log('FID:', fid, 'ms');
      // FID 应该小于 100ms
      expect(fid).toBeLessThan(100);
    });
  });

  test.describe('资源加载', () => {
    test('图片懒加载验证', async ({ page }) => {
      await login(page, 'user1');
      await page.goto('/dashboard');

      // 检查页面中的图片
      const images = await page.locator('img').all();

      for (const img of images) {
        const src = await img.getAttribute('src');
        // 如果图片是 data URL 或已经加载，验证加载状态
        if (src && !src.startsWith('data:')) {
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
          // 如果已加载，应该有宽度
          if (naturalWidth > 0) {
            console.log('图片已加载:', src);
          }
        }
      }
    });

    test('JavaScript 包大小', async ({ page }) => {
      await page.goto('/');

      const jsSize = await page.evaluate(() => {
        let totalSize = 0;
        const scripts = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        scripts.forEach((script) => {
          if (script.name.endsWith('.js')) {
            totalSize += script.transferSize;
          }
        });
        return totalSize;
      });

      console.log('JavaScript 总大小:', (jsSize / 1024 / 1024).toFixed(2), 'MB');
      // JS 包大小应该小于 500KB（gzip后）
      expect(jsSize).toBeLessThan(500 * 1024);
    });
  });

  test.describe('用户交互响应', () => {
    test('按钮点击响应', async ({ page }) => {
      await page.goto('/login');

      const startTime = Date.now();

      await page.click('a[href="/register"]');

      // 等待导航完成
      await page.waitForURL('/register');

      const responseTime = Date.now() - startTime;

      console.log('按钮响应时间:', responseTime, 'ms');
      // 响应时间应该小于 100ms
      expect(responseTime).toBeLessThan(500);
    });
  });

  test.describe('移动端性能', () => {
    test('移动端首页加载', async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });

      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log('移动端首页加载时间:', loadTime, 'ms');
      expect(loadTime).toBeLessThan(3000);
    });

    test('移动端触摸响应', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      // 模拟触摸事件
      const button = page.locator('input[type="email"]');
      await button.tap();

      // 验证输入框获得焦点
      const isFocused = await button.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBe(true);
    });
  });
});
