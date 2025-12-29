import { test, expect } from '@playwright/test';
import { login, createTrip, createExpense, editExpense, deleteExpense, expectDashboardStats, getExpenseCount, waitForExpense } from '../helpers';

/**
 * 费用管理模块 CRUD 测试
 *
 * 测试范围：
 * - TC-CRUD-001 ~ TC-CRUD-010: 创建费用（各分类、分摊场景）
 * - TC-CRUD-011 ~ TC-CRUD-017: 编辑费用（标题、金额、分类、成员）
 * - TC-CRUD-018 ~ TC-CRUD-020: 删除费用
 */

// 测试数据
const TRIP_NAME = `费用测试行程_${Date.now()}`;
const START_DATE = '2025-06-01';
const END_DATE = '2025-06-05';

test.describe('费用管理 - CRUD 基础测试', () => {
  let tripId: string;
  let tripUrl: string;

  // 每个测试前：登录并创建测试行程
  test.beforeEach(async ({ page }) => {
    await login(page, 'creator');
    await createTrip(page, TRIP_NAME, START_DATE, END_DATE);

    // 提取 tripId
    const url = page.url();
    const match = url.match(/\/trips\/([a-f0-9-]+)$/);
    if (match) {
      tripId = match[1];
      tripUrl = `/trips/${tripId}/expenses`;
    }

    // 导航到费用页面
    await page.goto(tripUrl);
    await page.waitForLoadState('networkidle');
  });

  test.describe('创建费用', () => {
    test('TC-CRUD-001: 创建餐饮类费用', async ({ page }) => {
      const expenseTitle = `午餐_${Date.now()}`;
      const amount = '150.00';

      await createExpense(page, {
        title: expenseTitle,
        amount: amount,
        category: 'food',
      });

      // 验证费用出现在列表中
      await waitForExpense(page, expenseTitle);

      // 验证统计数据更新
      await expectDashboardStats(page, {
        total: '150.00',
        myExpense: '150.00',
        myAdvance: '150.00',
      });
    });

    test('TC-CRUD-002: 创建交通类费用', async ({ page }) => {
      const expenseTitle = `打车费_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '50.00',
        category: 'transport',
      });

      await waitForExpense(page, expenseTitle);
      // 验证分类标签显示
      const expenseCard = page.locator('[data-testid^="expense-item-"]').filter({ hasText: expenseTitle });
      await expect(expenseCard.locator('text=交通')).toBeVisible();
    });

    test('TC-CRUD-003: 创建住宿类费用', async ({ page }) => {
      const expenseTitle = `酒店住宿_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '800.00',
        category: 'accommodation',
      });

      await waitForExpense(page, expenseTitle);
      await expectDashboardStats(page, { total: '800.00' });
    });

    test('TC-CRUD-004: 创建门票类费用（小数点金额）', async ({ page }) => {
      const expenseTitle = `景点门票_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '125.50',
        category: 'ticket',
      });

      await waitForExpense(page, expenseTitle);
      await expectDashboardStats(page, { total: '125.50' });
    });

    test('TC-CRUD-005: 创建购物类费用', async ({ page }) => {
      const expenseTitle = `特产购买_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '200.00',
        category: 'shopping',
      });

      await waitForExpense(page, expenseTitle);
    });

    test('TC-CRUD-006: 创建其他类费用', async ({ page }) => {
      const expenseTitle = `杂费_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '30.00',
        category: 'other',
      });

      await waitForExpense(page, expenseTitle);
    });

    test('TC-CRUD-007: 创建多笔费用并验证累加', async ({ page }) => {
      const title1 = `费用1_${Date.now()}`;
      const title2 = `费用2_${Date.now()}`;

      await createExpense(page, { title: title1, amount: '100.00', category: 'food' });
      await createExpense(page, { title: title2, amount: '200.00', category: 'transport' });

      await waitForExpense(page, title1);
      await waitForExpense(page, title2);

      // 验证总金额累加
      await expectDashboardStats(page, {
        total: '300.00',
        myExpense: '300.00',
        myAdvance: '300.00',
      });

      // 验证费用数量
      const count = await getExpenseCount(page);
      expect(count).toBe(2);
    });

    test('TC-CRUD-008: 创建带指定日期的费用', async ({ page }) => {
      const expenseTitle = `历史费用_${Date.now()}`;
      const expenseDate = '2025-06-02';

      await createExpense(page, {
        title: expenseTitle,
        amount: '100.00',
        category: 'food',
        date: expenseDate,
      });

      await waitForExpense(page, expenseTitle);
      // 验证日期显示
      const expenseCard = page.locator('[data-testid^="expense-item-"]').filter({ hasText: expenseTitle });
      await expect(expenseCard.locator('text=06月02日')).toBeVisible();
    });

    test('TC-CRUD-009: 创建整数金额费用', async ({ page }) => {
      const expenseTitle = `整数金额_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '100',
        category: 'food',
      });

      await waitForExpense(page, expenseTitle);
      // 验证金额格式化显示
      const expenseCard = page.locator('[data-testid^="expense-item-"]').filter({ hasText: expenseTitle });
      await expect(expenseCard.locator('text=¥100.00')).toBeVisible();
    });

    test('TC-CRUD-010: 费用列表按创建时间倒序排列', async ({ page }) => {
      const title1 = `第一笔_${Date.now()}`;
      const title2 = `第二笔_${Date.now()}`;

      await createExpense(page, { title: title1, amount: '100.00', category: 'food' });
      await page.waitForTimeout(500); // 确保时间差
      await createExpense(page, { title: title2, amount: '200.00', category: 'food' });

      // 最新创建的费用应该在最前面
      const firstCard = page.locator('[data-testid^="expense-item-"]').first();
      await expect(firstCard).toContainText(title2);
    });
  });

  test.describe('编辑费用', () => {
    test('TC-CRUD-011: 修改费用标题', async ({ page }) => {
      const originalTitle = `原始标题_${Date.now()}`;
      const newTitle = `修改后标题_${Date.now()}`;

      await createExpense(page, {
        title: originalTitle,
        amount: '100.00',
        category: 'food',
      });

      await editExpense(page, originalTitle, { title: newTitle });

      // 验证新标题显示
      await waitForExpense(page, newTitle);

      // 验证旧标题不存在
      const oldCard = page.locator('[data-testid^="expense-item-"]').filter({ hasText: originalTitle });
      await expect(oldCard).not.toBeVisible();
    });

    test('TC-CRUD-012: 修改费用金额并验证统计更新', async ({ page }) => {
      const expenseTitle = `待修改费用_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '100.00',
        category: 'food',
      });

      await expectDashboardStats(page, { total: '100.00' });

      await editExpense(page, expenseTitle, { amount: '250.00' });

      // 验证统计数据更新
      await expectDashboardStats(page, { total: '250.00' });
    });

    test('TC-CRUD-013: 修改费用分类', async ({ page }) => {
      const expenseTitle = `分类修改测试_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '100.00',
        category: 'food',
      });

      await editExpense(page, expenseTitle, { category: 'transport' });

      // 验证分类标签变化
      const expenseCard = page.locator('[data-testid^="expense-item-"]').filter({ hasText: expenseTitle });
      await expect(expenseCard.locator('text=交通')).toBeVisible();
    });

    test('TC-CRUD-014: 同时修改标题和金额', async ({ page }) => {
      const originalTitle = `多字段修改_${Date.now()}`;
      const newTitle = `已修改_${Date.now()}`;

      await createExpense(page, {
        title: originalTitle,
        amount: '100.00',
        category: 'food',
      });

      await editExpense(page, originalTitle, {
        title: newTitle,
        amount: '188.88',
      });

      await waitForExpense(page, newTitle);
      await expectDashboardStats(page, { total: '188.88' });
    });
  });

  test.describe('删除费用', () => {
    test('TC-CRUD-018: 删除自己创建的费用', async ({ page }) => {
      const expenseTitle = `待删除费用_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '100.00',
        category: 'food',
      });

      await waitForExpense(page, expenseTitle);

      // 删除费用
      await deleteExpense(page, expenseTitle);
      await page.waitForTimeout(1000); // 等待删除完成

      // 验证费用从列表消失
      const deletedCard = page.locator('[data-testid^="expense-item-"]').filter({ hasText: expenseTitle });
      await expect(deletedCard).not.toBeVisible();

      // 验证统计数据清零
      await expectDashboardStats(page, { total: '0.00' });
    });

    test('TC-CRUD-019: 删除多笔费用中的一笔', async ({ page }) => {
      const title1 = `保留费用_${Date.now()}`;
      const title2 = `删除费用_${Date.now()}`;

      await createExpense(page, { title: title1, amount: '100.00', category: 'food' });
      await createExpense(page, { title: title2, amount: '200.00', category: 'food' });

      await expectDashboardStats(page, { total: '300.00' });

      // 删除第二笔费用
      await deleteExpense(page, title2);
      await page.waitForTimeout(1000);

      // 验证第一笔费用还在
      await waitForExpense(page, title1);

      // 验证总金额更新
      await expectDashboardStats(page, { total: '100.00' });
    });

    test('TC-CRUD-020: 删除后验证空状态显示', async ({ page }) => {
      const expenseTitle = `唯一费用_${Date.now()}`;

      await createExpense(page, {
        title: expenseTitle,
        amount: '100.00',
        category: 'food',
      });

      // 删除费用
      await deleteExpense(page, expenseTitle);
      await page.waitForTimeout(1000);

      // 验证空状态提示
      await expect(page.locator('text=暂时没有支出记录')).toBeVisible();
    });
  });

  test.describe('综合场景测试', () => {
    test('完整的费用管理流程', async ({ page }) => {
      // 1. 创建第一笔费用
      const title1 = `早餐_${Date.now()}`;
      await createExpense(page, {
        title: title1,
        amount: '50.00',
        category: 'food',
      });

      // 2. 创建第二笔费用
      const title2 = `打车_${Date.now()}`;
      await createExpense(page, {
        title: title2,
        amount: '30.00',
        category: 'transport',
      });

      // 验证统计数据
      await expectDashboardStats(page, {
        total: '80.00',
        myExpense: '80.00',
        myAdvance: '80.00',
      });

      // 3. 编辑第一笔费用
      await editExpense(page, title1, { amount: '60.00' });
      await expectDashboardStats(page, { total: '90.00' });

      // 4. 删除第二笔费用
      await deleteExpense(page, title2);
      await page.waitForTimeout(1000);
      await expectDashboardStats(page, { total: '60.00' });

      // 5. 最终验证
      const finalCount = await getExpenseCount(page);
      expect(finalCount).toBe(1);
    });

    test('六种费用分类创建测试', async ({ page }) => {
      const categories = ['food', 'transport', 'accommodation', 'ticket', 'shopping', 'other'] as const;
      const categoryLabels = ['餐饮', '交通', '住宿', '门票', '购物', '其他'];

      for (const category of categories) {
        await createExpense(page, {
          title: `${category}_测试_${Date.now()}`,
          amount: '100.00',
          category: category,
        });
      }

      // 验证创建了 6 笔费用
      const count = await getExpenseCount(page);
      expect(count).toBe(6);

      // 验证总金额
      await expectDashboardStats(page, { total: '600.00' });

      // 验证所有分类标签都存在
      for (const label of categoryLabels) {
        await expect(page.locator(`text=${label}`).first()).toBeVisible();
      }
    });
  });
});
