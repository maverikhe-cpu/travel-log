# 漫行记 WanderLog v1.0 自动化测试指南

## 测试框架概览

| 框架 | 用途 | 状态 |
|------|------|------|
| Playwright | E2E 测试 | ✅ 已配置 |
| Lighthouse CI | 性能测试 | ✅ 已配置 |

---

## 目录结构

```
e2e/
├── helpers.ts           # 测试辅助函数
├── auth/
│   └── auth.spec.ts     # 用户认证测试
├── profile/
│   └── profile.spec.ts  # 个人中心测试
├── trips/
│   └── trips.spec.ts    # 行程管理测试
├── logs/
│   └── logs.spec.ts     # 旅行记录测试
├── gallery/
│   └── gallery.spec.ts  # 照片库测试
├── members/
│   └── members.spec.ts  # 成员管理测试
└── performance/
    └── performance.spec.ts  # 性能测试
```

---

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm test` | 运行所有 E2E 测试（无头模式） |
| `npm run test:headed` | 运行测试（有头模式，可见浏览器） |
| `npm run test:ui` | 运行测试（带 UI 界面） |
| `npm run test:debug` | 调试模式运行测试 |
| `npm run test:report` | 打开 HTML 测试报告 |
| `npm run test:performance` | 仅运行性能测试 |
| `npm run lhci` | 运行 Lighthouse CI 性能测试 |

---

## 测试账号

```typescript
// e2e/helpers.ts
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
```

---

## 创建测试账号

**测试已配置自动注册！** 无需手动创建测试账号。

### 工作原理

测试使用固定的测试账号（`test1@example.com` 等）：
1. 首次登录时，如果账号不存在，测试会自动注册
2. 后续测试直接使用已注册的账号
3. 注册功能测试使用随机邮箱，避免冲突

### 可选：预先创建账号

如果希望预先创建测试账号，可以使用以下方法：

**方法一：自动创建脚本**
```bash
# 需要 Service Role Key
export SUPABASE_SERVICE_ROLE_KEY=你的key
npm run test:users:create
```

**方法二：Supabase Dashboard**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → **Authentication** → **Users**
3. 点击 **Add user** → **Create new user**
4. 填写邮箱密码，勾选 **Auto Confirm User**

---

## 测试用例覆盖

### 用户认证 (6 个测试)
- ✅ 正常登录
- ✅ 错误密码提示
- ✅ 空邮箱验证
- ✅ 正常注册
- ✅ 密码太短提示
- ✅ 密码不一致提示
- ✅ 邀请链接登录
- ✅ 邀请提示显示
- ✅ 正常登出

### 个人中心 (4 个测试)
- ✅ 查看个人中心
- ✅ 编辑昵称
- ✅ 取消编辑昵称
- ✅ 头像上传 UI
- ✅ Dashboard 头像入口
- ✅ 显示用户昵称

### 行程管理 (8 个测试)
- ✅ 正常创建行程
- ✅ 结束日期早于开始日期
- ✅ 空名称验证
- ✅ 查看行程列表
- ✅ 点击行程卡片
- ✅ 查看行程详情
- ✅ 快捷入口跳转
- ✅ 日期网格显示
- ✅ 移动端底部导航

### 照片库 (6 个测试)
- ✅ 查看照片库
- ✅ 日期筛选
- ✅ 空状态显示
- ✅ 上传页面访问
- ✅ 文件输入存在
- ✅ 上传提示信息
- ✅ 日期必填验证
- ✅ 移动端底部导航

### 成员管理 (6 个测试)
- ✅ 查看成员列表
- ✅ 显示创建者标记
- ✅ 显示自己标记
- ✅ 成员统计显示
- ✅ 打开分享弹窗
- ✅ 复制邀请
- ✅ 显示分享码
- ✅ 显示邀请链接
- ✅ 未登录用户跳转登录

### 旅行记录 (8 个测试)
- ✅ 查看日志列表
- ✅ 空状态显示
- ✅ 编辑按钮存在
- ✅ 访问编辑页面
- ✅ 富文本编辑器存在
- ✅ 富文本工具栏
- ✅ 私密开关存在
- ✅ 切换私密状态
- ✅ 中文输入测试
- ✅ 保存日志

### 性能测试 (10 个测试)
- ✅ 首页加载性能
- ✅ 登录页加载性能
- ✅ Dashboard 加载性能
- ✅ LCP 指标
- ✅ CLS 指标
- ✅ FID 指标
- ✅ JavaScript 包大小
- ✅ 按钮点击响应
- ✅ 移动端首页加载
- ✅ 移动端触摸响应

---

## 运行测试

### 快速开始

```bash
# 直接运行测试（会自动注册测试账号）
npm test
```

首次运行时，测试会自动注册以下账号：
- `test1@example.com` / `Test123456`
- `test2@example.com` / `Test123456`
- `creator@example.com` / `Test123456`

### 2. 查看报告

```bash
# 测试完成后，查看 HTML 报告
npm run test:report
```

### 3. 调试测试

```bash
# 使用 UI 模式调试
npm run test:ui

# 或使用调试模式
npm run test:debug
```

### 4. 性能测试

```bash
# 运行 Playwright 性能测试
npm run test:performance

# 运行 Lighthouse CI（需要先构建）
npm run build
npm run lhci
```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## 测试最佳实践

### 1. 编写新测试

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../helpers';

test.describe('新功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user1');
  });

  test('测试用例名称', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');

    // Act
    await page.click('button');

    // Assert
    await expect(page).toHaveURL('/expected-url');
  });
});
```

### 2. 选择器最佳实践

| 优先级 | 选择器类型 | 示例 |
|--------|-----------|------|
| 1️⃣ 推荐 | 文本内容 | `page.locator('text=登录')` |
| 2️⃣ 可用 | ARIA 属性 | `page.locator('[data-testid="submit"]')` |
| 3️⃣ 谨慎 | CSS 选择器 | `page.locator('.btn-primary')` |
| ❌ 避免 | XPath | `page.locator('//button')` |

### 3. 等待策略

```typescript
// 等待 URL 变化
await page.waitForURL('/dashboard');

// 等待元素可见
await expect(page.locator('.success')).toBeVisible();

// 等待网络空闲
await page.waitForLoadState('networkidle');

// 等待固定时间（尽量避免）
await page.waitForTimeout(1000);
```

---

## 常见问题

### Q: 需要手动创建测试账号吗？
**A**: 不需要！测试会自动注册账号。首次运行会看到 "用户 xxx 不存在，自动注册..." 的日志。

### Q: 测试在 CI 中失败但本地通过
**A**: 检查 CI 环境变量是否正确配置 `BASE_URL`。

### Q: 如何测试文件上传？
**A**: 使用 `page.setInputFiles()` 方法：
```typescript
await page.setInputFiles('input[type="file"]', './test-image.jpg');
```

### Q: 如何测试移动端？
**A**: 设置视口大小：
```typescript
await page.setViewportSize({ width: 375, height: 667 });
```

---

## 性能基准

| 指标 | 目标 | 当前 |
|------|------|------|
| 首页加载 | < 2s | TBD |
| 登录跳转 | < 1s | TBD |
| LCP | < 2.5s | TBD |
| CLS | < 0.1 | TBD |
| FID | < 100ms | TBD |
| JS 包大小 | < 500KB | TBD |

运行 `npm run test:performance` 后更新此表。
