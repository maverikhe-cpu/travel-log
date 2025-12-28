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
    name: '创建者',
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
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="startDate"]', startDate);
  await page.fill('input[name="endDate"]', endDate);
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
