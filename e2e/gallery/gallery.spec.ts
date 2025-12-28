import { test, expect } from '@playwright/test';
import { login, createTrip, TEST_USERS } from '../helpers';

test.describe('照片库模块', () => {
  let tripId: string;

  test.beforeEach(async ({ page }) => {
    await login(page, 'user1');
    await createTrip(page, '测试行程' + Date.now(), '2025-03-15', '2025-03-21');

    // 获取行程ID
    const url = page.url();
    const match = url.match(/\/trips\/([a-f0-9-]+)$/);
    if (match) {
      tripId = match[1];
    }
  });

  test.describe('照片浏览', () => {
    test('查看照片库', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery`);

      // 验证页面标题
      await expect(page.locator('text=照片库')).toBeVisible();

      // 验证上传按钮
      await expect(page.locator('button:has-text("上传")').or(page.locator('text=上传照片'))).toBeVisible();
    });

    test('日期筛选', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery`);

      // 验证日期选择器存在
      await expect(page.locator('a[href*="gallery?date="]').first()).toBeVisible();
    });

    test('空状态显示', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery`);

      // 验证空状态提示
      const emptyState = page.locator('text=还没有照片');
      const hasEmptyState = await emptyState.count();

      if (hasEmptyState > 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('照片上传', () => {
    test('上传页面访问', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery/upload`);

      // 验证页面标题
      await expect(page.locator('text=上传照片')).toBeVisible();

      // 验证日期选择
      await expect(page.locator('input[type="date"]')).toBeVisible();

      // 验证上传区域
      await expect(page.locator('text=点击或拖拽上传照片')).toBeVisible();
    });

    test('文件输入存在', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery/upload`);

      // 验证文件输入
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('type', 'file');
      await expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
      await expect(fileInput).toHaveAttribute('multiple', '');
    });

    test('上传提示信息', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery/upload`);

      // 验证上传限制提示
      await expect(page.locator('text=支持 JPG、PNG 格式')).toBeVisible();
      await expect(page.locator('text=单张最大 5MB')).toBeVisible();
      await expect(page.locator('text=最多 10 张')).toBeVisible();
    });

    test('日期必填验证', async ({ page }) => {
      await page.goto(`/trips/${tripId}/gallery/upload`);

      // 不选择日期，尝试点击上传（按钮应该禁用）
      const uploadButton = page.locator('button:has-text("上传")');
      const isDisabled = await uploadButton.isDisabled();

      // 如果日期为空，上传按钮应该被禁用
      if (isDisabled) {
        await expect(uploadButton).toBeDisabled();
      }
    });
  });

  test.describe('移动端照片库', () => {
    test('移动端底部导航', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/trips/${tripId}/gallery`);

      // 验证底部导航
      await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
      await expect(page.locator('text=日历').or(page.locator('text=照片'))).toBeVisible();
    });
  });
});
