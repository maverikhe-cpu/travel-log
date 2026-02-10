import { Page, expect } from '@playwright/test';

/**
 * E2E 测试辅助函数
 */

// 测试用户账号
export const TEST_USERS = {
  user1: {
    email: 'test1@example.com',
    password: 'Test123456',
    name: '测试用户1',
  },
  user2: {
    email: 'test2@example.com',
    password: 'Test123456',
    name: '测试用户2',
  },
  creator: {
    email: 'creator@example.com',
    password: 'Test123456',
    name: '漫游长',
  },
};

// 记录已注册的用户（跨测试共享）
const registeredUsers = new Set<string>();

/**
 * 注册新用户
 */
export async function registerUser(page: Page, email: string, password: string, name?: string) {
  await page.goto('/register');
  await page.fill('input[type="email"]', email);

  // 如果有昵称，填写昵称
  if (name) {
    const usernameInput = page.locator('input#username');
    const count = await usernameInput.count();
    if (count > 0) {
      await usernameInput.fill(name);
    }
  }

  await page.fill('input#password', password);
  await page.fill('input#confirmPassword', password);
  await page.click('button[type="submit"]');

  // 等待注册成功提示
  await page.waitForSelector('text=注册成功', { timeout: 5000 });

  // 等待跳转
  await page.waitForTimeout(1500);
}

/**
 * 登录操作
 *
 * 注意：测试账号需要预先在 Supabase Dashboard 中创建
 * 或设置环境变量 AUTO_REGISTER=true 启用自动注册
 */
export async function login(page: Page, user: keyof typeof TEST_USERS) {
  const userData = TEST_USERS[user];
  const autoRegister = process.env.AUTO_REGISTER === 'true';

  // 如果启用自动注册且用户未注册过
  if (autoRegister && !registeredUsers.has(userData.email)) {
    console.log(`注册测试用户: ${userData.email}`);
    await registerUser(page, userData.email, userData.password, userData.name);
    registeredUsers.add(userData.email);
  }

  await page.goto('/login');
  await page.fill('input[type="email"]', userData.email);
  await page.fill('input[type="password"]', userData.password);
  await page.click('button[type="submit"]');

  // 等待跳转完成
  await page.waitForURL('**', { timeout: 10000 });
}

/**
 * 注册操作（独立使用，用于测试注册功能）
 */
export async function register(page: Page, email: string, password: string, username?: string) {
  await page.goto('/register');

  await page.fill('input[type="email"]', email);

  // 填写昵称（可选）
  if (username) {
    const usernameInput = page.locator('input#username');
    const count = await usernameInput.count();
    if (count > 0) {
      await usernameInput.fill(username);
    }
  }

  await page.fill('input#password', password);
  await page.fill('input#confirmPassword', password);
  await page.click('button[type="submit"]');

  // 等待注册成功提示
  await page.waitForSelector('text=注册成功', { timeout: 5000 });

  // 记录已注册
  registeredUsers.add(email);
}

/**
 * 创建行程
 */
export async function createTrip(page: Page, name: string, startDate: string, endDate: string) {
  await page.goto('/trips/new');
  await page.fill('#name', name);
  await page.fill('#startDate', startDate);
  await page.fill('#endDate', endDate);
  await page.click('button[type="submit"]');

  // 等待跳转到行程详情
  await page.waitForURL(/\/trips\/[a-f0-9-]+$/, { timeout: 10000 });
}

/**
 * 登出操作
 */
export async function logout(page: Page) {
  await page.click('form[action="/auth/signout"] button');
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * 生成随机分享码
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * 截图对比
 */
export async function screenshotMatch(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * 清空用户输入
 */
export async function clearInput(page: Page, selector: string) {
  await page.fill(selector, '');
}

/**
 * 费用相关类型定义
 */
export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'ticket' | 'shopping' | 'other';

/**
 * 创建费用记录
 * @param page Page 实例
 * @param data 费用数据
 * @returns 费用标题（用于后续查找）
 */
export async function createExpense(page: Page, data: {
  title: string;
  amount: string;
  category: ExpenseCategory;
  payerName?: string; // 垫付人名称，如"我"、"Alice"等
  date?: string; // YYYY-MM-DD 格式
  participants?: number; // 参与人数，默认全选
}): Promise<string> {
  // 打开添加费用模态框
  await page.click('[data-testid="add-expense-button"]');

  // 填写金额
  await page.fill('[data-testid="expense-amount-input"]', data.amount);

  // 填写标题
  await page.fill('[data-testid="expense-title-input"]', data.title);

  // 选择分类
  await page.selectOption('[data-testid="expense-category-select"]', data.category);

  // 选择日期（如果提供）
  if (data.date) {
    await page.fill('[data-testid="expense-date-input"]', data.date);
  }

  // 选择垫付人（如果提供）
  if (data.payerName) {
    await page.selectOption('[data-testid="expense-payer-select"]', [{ label: data.payerName }]);
  }

  // 默认全选参与者，不做修改
  // 如果需要部分参与者，可以点击取消选中

  // 提交表单
  await page.click('[data-testid="expense-submit-button"]');

  // 等待模态框关闭
  await page.waitForSelector('[data-testid="expense-amount-input"]', { state: 'hidden', timeout: 5000 });

  return data.title;
}

/**
 * 编辑费用记录
 * @param page Page 实例
 * @param expenseTitle 费用标题（用于查找）
 * @param newData 要更新的数据
 */
export async function editExpense(page: Page, expenseTitle: string, newData: {
  title?: string;
  amount?: string;
  category?: ExpenseCategory;
}): Promise<void> {
  // 找到对应的费用卡片并点击编辑按钮
  const expenseCard = page.locator(`.expense-item`).filter({ hasText: expenseTitle });
  await expenseCard.locator('button').filter({ hasText: '编辑' }).click();

  // 更新数据
  if (newData.title !== undefined) {
    await page.fill('[data-testid="expense-title-input"]', newData.title);
  }
  if (newData.amount !== undefined) {
    await page.fill('[data-testid="expense-amount-input"]', newData.amount);
  }
  if (newData.category !== undefined) {
    await page.selectOption('[data-testid="expense-category-select"]', newData.category);
  }

  // 提交更新
  await page.click('[data-testid="expense-submit-button"]');

  // 等待模态框关闭
  await page.waitForSelector('[data-testid="expense-title-input"]', { state: 'hidden', timeout: 5000 });
}

/**
 * 删除费用记录
 * @param page Page 实例
 * @param expenseTitle 费用标题（用于查找）
 */
export async function deleteExpense(page: Page, expenseTitle: string): Promise<void> {
  // 找到对应的费用卡片并点击菜单按钮
  const expenseCard = page.locator(`[data-testid^="expense-item-"]`).filter({ hasText: expenseTitle });

  // 点击三个点菜单
  await expenseCard.locator('button').filter({ hasText: '' }).first().click();

  // 点击删除按钮
  await page.click('[data-testid^="expense-delete-"]');

  // 确认删除
  page.on('dialog', dialog => dialog.accept());
}

/**
 * 验证统计数据
 * @param page Page 实例
 * @param stats 期望的统计数据
 */
export async function expectDashboardStats(page: Page, stats: {
  total: string;
  myExpense?: string;
  myAdvance?: string;
}): Promise<void> {
  const totalAmount = await page.textContent('[data-testid="dashboard-total-amount"]');
  // 移除 ¥ 符号和空格进行比较
  const normalizeAmount = (s: string | null) => s?.replace(/[\s¥]/g, '') || '';
  expect(normalizeAmount(totalAmount)).toBe(stats.total);

  if (stats.myExpense !== undefined) {
    const myExpenseAmount = await page.textContent('[data-testid="dashboard-my-expense-amount"]');
    expect(normalizeAmount(myExpenseAmount)).toBe(stats.myExpense);
  }

  if (stats.myAdvance !== undefined) {
    const myAdvanceAmount = await page.textContent('[data-testid="dashboard-my-advance-amount"]');
    expect(normalizeAmount(myAdvanceAmount)).toBe(stats.myAdvance);
  }
}

/**
 * 获取费用卡片数量
 */
export async function getExpenseCount(page: Page): Promise<number> {
  return await page.locator('[data-testid^="expense-item-"]').count();
}

/**
 * 打开结算报告
 */
export async function openSettlementReport(page: Page): Promise<void> {
  await page.click('[data-testid="settlement-report-button"]');
  await page.waitForSelector('.settlement-modal, [data-testid="settlement-modal"]', { timeout: 5000 });
}

/**
 * 等待费用出现在列表中
 */
export async function waitForExpense(page: Page, expenseTitle: string): Promise<void> {
  await page.waitForSelector(`[data-testid^="expense-item-"]`, { timeout: 5000 });
  const expenseCard = page.locator(`[data-testid^="expense-item-"]`).filter({ hasText: expenseTitle });
  await expect(expenseCard).toBeVisible();
}

/**
 * 获取分类中文名称
 */
export function getCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    food: '餐饮',
    transport: '交通',
    accommodation: '住宿',
    ticket: '门票',
    shopping: '购物',
    other: '其他',
  };
  return labels[category];
}
