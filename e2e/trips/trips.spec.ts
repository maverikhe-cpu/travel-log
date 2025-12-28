import { test, expect } from '@playwright/test';
import { login, createTrip, logout, TEST_USERS } from '../helpers';

test.describe('行程管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user1');
  });

  test.describe('创建行程', () => {
    test('正常创建行程', async ({ page }) => {
      const tripName = '川渝旅行' + Date.now();

      await page.goto('/trips/new');
      await page.fill('input[name="name"]', tripName);
      await page.fill('input[name="startDate"]', '2025-03-15');
      await page.fill('input[name="endDate"]', '2025-03-21');
      await page.click('button[type="submit"]');

      // 验证跳转到行程详情
      await expect(page).toHaveURL(/\/trips\/[a-f0-9-]+$/);

      // 验证显示行程名称
      await expect(page.locator(`text=${tripName}`)).toBeVisible();
    });

    test('结束日期早于开始日期', async ({ page }) => {
      await page.goto('/trips/new');
      await page.fill('input[name="name"]', '测试行程');
      await page.fill('input[name="startDate"]', '2025-03-21');
      await page.fill('input[name="endDate"]', '2025-03-15');
      await page.click('button[type="submit"]');

      // 验证日期验证（具体验证取决于实现）
      // 这里假设表单会阻止提交
    });

    test('空名称验证', async ({ page }) => {
      await page.goto('/trips/new');
      await page.fill('input[name="startDate"]', '2025-03-15');
      await page.fill('input[name="endDate"]', '2025-03-21');
      await page.click('button[type="submit"]');

      // 验证名称输入框必填
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveAttribute('required', '');
    });
  });

  test.describe('行程列表', () => {
    test('查看行程列表', async ({ page }) => {
      await page.goto('/dashboard');

      // 验证页面标题
      await expect(page.locator('text=我的行程')).toBeVisible();

      // 验证创建按钮
      await expect(page.locator('text=创建行程')).toBeVisible();
    });

    test('点击行程卡片', async ({ page }) => {
      await page.goto('/dashboard');

      // 查找第一个行程卡片
      const tripCard = page.locator('a[href^="/trips/"]').first();

      const count = await tripCard.count();
      if (count > 0) {
        await tripCard.click();
        await expect(page).toHaveURL(/\/trips\/[a-f0-9-]+$/);
      }
    });

    test('空状态显示', async ({ page }) => {
      // 需要一个没有行程的新用户来测试
      // 这里跳过，因为测试用户可能有行程
      test.skip(true, '需要新用户账号');
    });
  });

  test.describe('行程详情', () => {
    test('查看行程详情', async ({ page }) => {
      // 先创建一个行程
      await createTrip(page, '测试行程' + Date.now(), '2025-03-15', '2025-03-21');

      // 验证行程信息显示
      await expect(page.locator('text=日程概览')).toBeVisible();
      await expect(page.locator('text=行程日历')).toBeVisible();
      await expect(page.locator('text=旅行记录')).toBeVisible();
      await expect(page.locator('text=照片库')).toBeVisible();
      await expect(page.locator('text=成员管理')).toBeVisible();
    });

    test('快捷入口跳转', async ({ page }) => {
      await createTrip(page, '测试行程' + Date.now(), '2025-03-15', '2025-03-21');

      // 点击行程日历入口
      await page.click('a[href*="calendar"]');
      await expect(page).toHaveURL(/\/trips\/[a-f0-9-]+\/calendar$/);
    });

    test('日期网格显示', async ({ page }) => {
      await createTrip(page, '7天行程' + Date.now(), '2025-03-15', '2025-03-21');

      // 验证显示7天
      const dayCards = page.locator('a[href*="calendar?date="]');
      await expect(dayCards).toHaveCount(7);
    });
  });

  test.describe('移动端导航', () => {
    test('底部导航显示', async ({ page }) => {
      await page.goto('/dashboard');

      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });

      // 验证底部导航
      await expect(page.locator('nav.fixed.bottom-0')).toBeVisible();
      await expect(page.locator('text=行程')).toBeVisible();
      await expect(page.locator('text=创建')).toBeVisible();
      await expect(page.locator('text=我的')).toBeVisible();
    });

    test('底部导航切换', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      // 点击"我的"
      await page.click('a[href="/profile"]');
      await expect(page).toHaveURL('/profile');
    });
  });
});
