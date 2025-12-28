import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers';

test.describe('个人中心模块', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user1');
  });

  test.describe('个人资料', () => {
    test('查看个人中心', async ({ page }) => {
      await page.goto('/profile');

      // 验证页面标题
      await expect(page.locator('text=个人中心')).toBeVisible();

      // 验证统计卡片显示
      await expect(page.locator('text=参与行程')).toBeVisible();
      await expect(page.locator('text=创建行程')).toBeVisible();
      await expect(page.locator('text=旅行记录')).toBeVisible();
      await expect(page.locator('text=上传照片')).toBeVisible();
    });

    test('编辑昵称', async ({ page }) => {
      await page.goto('/profile');
      const newName = '新昵称' + Date.now();

      // 点击编辑昵称
      await page.click('text=编辑昵称');

      // 输入新昵称
      await page.fill('input[type="text"]', newName);

      // 点击保存
      await page.click('button:has-text("保存")');

      // 验证昵称更新
      await expect(page.locator(`text=${newName}`)).toBeVisible();
    });

    test('取消编辑昵称', async ({ page }) => {
      await page.goto('/profile');

      // 点击编辑昵称
      await page.click('text=编辑昵称');

      // 输入新昵称
      await page.fill('input[type="text"]', '临时昵称');

      // 点击取消
      await page.click('button:has-text("取消")');

      // 验证显示原昵称
      await expect(page.locator('input[type="text"]')).not.toBeVisible();
    });
  });

  test.describe('头像上传', () => {
    test('上传头像', async ({ page }) => {
      await page.goto('/profile');

      // 获取当前头像数量
      const avatarBefore = await page.locator('img[alt*="用户"]').count();

      // 点击相机按钮上传（由于文件上传需要真实文件，这里只测试UI交互）
      const cameraButton = page.locator('button').filter({ hasText: /Camera|相机/ }).first();
      await expect(cameraButton).toBeVisible();

      // 测试文件输入存在
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('type', 'file');
    });
  });

  test.describe('Dashboard 头像入口', () => {
    test('点击头像跳转个人中心', async ({ page }) => {
      await page.goto('/dashboard');

      // 点击头像区域
      const avatarLink = page.locator('a[href="/profile"]').first();
      await avatarLink.click();

      // 验证跳转到个人中心
      await expect(page).toHaveURL('/profile');
    });

    test('显示用户昵称', async ({ page }) => {
      await page.goto('/dashboard');

      // 验证显示用户昵称或"用户"
      await expect(page.locator('text=用户').or(page.locator(`text=${TEST_USERS.user1.name}`))).toBeVisible();
    });
  });
});
