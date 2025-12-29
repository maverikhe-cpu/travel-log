# 漫行记测试计划

本文档定义了漫行记项目的完整测试策略，包括单元测试、集成测试、E2E测试和回归测试。

## 测试概览

### 测试层级

| 测试类型 | 覆盖范围 | 工具/框架 | 执行频率 |
|---------|---------|----------|---------|
| 单元测试 | 独立函数和组件 | Jest, React Testing Library | 每次提交 |
| 集成测试 | 多组件协作 | Jest, Supabase Test Client | 每次提交 |
| E2E测试 | 完整用户流程 | Playwright | 每次PR，发布前 |
| 回归测试 | 已验证功能 | Playwright | 发布前 |
| 性能测试 | 页面加载速度 | Lighthouse CI | 发布前 |

### 测试环境

- **开发环境**: localhost:3000
- **测试数据库**: Supabase 测试项目
- **测试用户**: 预定义测试账号（见下方）
- **浏览器**: Chrome, Firefox, Safari (E2E)

---

## 1. 单元测试计划

### 1.1 工具函数 (`src/lib/utils.ts`)

#### 测试用例

**`cn(...inputs)` - 类名合并**
```typescript
describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should handle conflicting classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'block')).toBe('base block');
  });
});
```

**`generateShareCode()` - 分享码生成**
```typescript
describe('generateShareCode', () => {
  it('should generate 6-character code', () => {
    const code = generateShareCode();
    expect(code).toHaveLength(6);
  });

  it('should only contain alphanumeric characters', () => {
    const code = generateShareCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
  });

  it('should exclude ambiguous characters', () => {
    const code = generateShareCode();
    expect(code).not.toMatch(/[IO1]/);
  });

  it('should generate unique codes', () => {
    const codes = new Set(Array.from({ length: 1000 }, generateShareCode));
    expect(codes.size).toBe(1000);
  });
});
```

**`formatDate(date, format)` - 日期格式化**
```typescript
describe('formatDate', () => {
  it('should format as short (M/D)', () => {
    expect(formatDate('2025-03-15', 'short')).toBe('3/15');
  });

  it('should format as long (M月D日)', () => {
    expect(formatDate('2025-03-15', 'long')).toBe('3月15日');
  });

  it('should format as weekday (周X)', () => {
    expect(formatDate('2025-03-15', 'weekday')).toBe('周六');
  });
});
```

**`getDaysRange(startDate, endDate)` - 日期范围**
```typescript
describe('getDaysRange', () => {
  it('should return array of dates', () => {
    const days = getDaysRange('2025-03-15', '2025-03-17');
    expect(days).toHaveLength(3);
  });

  it('should include start and end dates', () => {
    const days = getDaysRange('2025-03-15', '2025-03-15');
    expect(days).toHaveLength(1);
    expect(days[0].toISOString().split('T')[0]).toBe('2025-03-15');
  });
});
```

**`compressImage(file, maxWidth, quality)` - 图片压缩**
```typescript
describe('compressImage', () => {
  it('should compress large image', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', {
      type: 'image/jpeg',
    });
    const { blob } = await compressImage(largeFile, 2000, 0.92);
    expect(blob.size).toBeLessThan(largeFile.size);
  });

  it('should preserve PNG transparency', async () => {
    const pngFile = new File([''], 'test.png', { type: 'image/png' });
    const { blob } = await compressImage(pngFile, 2000, 0.92);
    expect(blob.type).toBe('image/png');
  });
});
```

### 1.2 Supabase 客户端 (`src/lib/supabase/`)

#### 测试用例

**客户端创建**
```typescript
describe('createClient', () => {
  it('should create browser client', () => {
    const client = createClient();
    expect(client).toHaveProperty('auth');
    expect(client).toHaveProperty('from');
  });

  it('should have correct URL and key', () => {
    const client = createClient();
    // Verify client configuration
  });
});
```

### 1.3 业务逻辑库

#### 费用管理 (`src/lib/expenses.ts`)

```typescript
describe('Expenses Service', () => {
  describe('createExpense', () => {
    it('should create expense with splits', async () => {
      const expense = await createExpense({
        trip_id: 'test-trip',
        title: 'Test Expense',
        amount: 100,
        splits: [{ user_id: 'user1', amount: 50 }],
      });
      expect(expense).toHaveProperty('id');
    });

    it('should validate total split amount', async () => {
      await expect(
        createExpense({
          trip_id: 'test-trip',
          title: 'Test',
          amount: 100,
          splits: [{ user_id: 'user1', amount: 150 }],
        })
      ).rejects.toThrow();
    });
  });
});
```

#### 结算算法 (`src/lib/settlement.ts`)

```typescript
describe('Settlement Calculation', () => {
  it('should calculate simple 2-person settlement', () => {
    const balances = { user1: 50, user2: -50 };
    const settlements = calculateSettlements(balances);
    expect(settlements).toEqual([
      { from: 'user2', to: 'user1', amount: 50 },
    ]);
  });

  it('should minimize number of transactions', () => {
    const balances = { user1: 100, user2: -30, user3: -70 };
    const settlements = calculateSettlements(balances);
    expect(settlements).toHaveLength(2);
  });

  it('should handle zero balances', () => {
    const balances = { user1: 0, user2: 0 };
    const settlements = calculateSettlements(balances);
    expect(settlements).toEqual([]);
  });
});
```

#### 高德地图 (`src/lib/amap.ts`)

```typescript
describe('AMap Service', () => {
  it('should load AMap script', async () => {
    await loadAMap();
    expect(window.AMap).toBeDefined();
  });

  it('should search POI', async () => {
    const results = await searchPOI('成都大熊猫基地');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should create map instance', () => {
    const container = document.createElement('div');
    const map = createMap(container, { lng: 104.066, lat: 30.572 });
    expect(map).toBeDefined();
  });
});
```

### 1.4 React 组件

#### UI 组件 (`src/components/ui/`)

**Button 组件**
```typescript
describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button disabled>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### 业务组件

**PhotoCard 组件**
```typescript
describe('PhotoCard', () => {
  const mockPhoto = {
    id: '1',
    public_url: 'https://example.com/photo.jpg',
    user_id: 'user1',
    day_date: '2025-03-15',
  };

  it('should display photo', () => {
    render(<PhotoCard photo={mockPhoto} currentUserId="user1" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', mockPhoto.public_url);
  });

  it('should show delete button for owner', () => {
    render(<PhotoCard photo={mockPhoto} currentUserId="user1" />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should not show delete button for non-owner', () => {
    render(<PhotoCard photo={mockPhoto} currentUserId="user2" />);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
```

**ExpenseFormModal 组件**
```typescript
describe('ExpenseFormModal', () => {
  it('should validate required fields', async () => {
    render(<ExpenseFormModal tripId="test-trip" />);
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(screen.getByText(/请输入标题/)).toBeInTheDocument();
    });
  });

  it('should calculate splits automatically', async () => {
    render(<ExpenseFormModal tripId="test-trip" />);
    // Input amount and participants
    // Verify split calculation
  });
});
```

---

## 2. E2E测试计划

### 2.1 测试用户配置

```typescript
// e2e/test-users.ts
export const TEST_USERS = {
  owner: {
    email: 'test-owner@example.com',
    password: 'Test123456',
    username: '测试所有者',
  },
  editor: {
    email: 'test-editor@example.com',
    password: 'Test123456',
    username: '测试编辑者',
  },
  viewer: {
    email: 'test-viewer@example.com',
    password: 'Test123456',
    username: '测试查看者',
  },
};
```

### 2.2 核心流程测试

#### T1: 用户注册和登录

**文件**: `e2e/auth/auth.spec.ts`

```typescript
test.describe('用户认证', () => {
  test('应该允许新用户注册', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Test123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('应该允许用户登录', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERS.owner.email);
    await page.fill('input[name="password"]', TEST_USERS.owner.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('应该显示登录错误', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=登录失败')).toBeVisible();
  });
});
```

#### T2: 行程创建和编辑

**文件**: `e2e/trips/trip-creation.spec.ts`

```typescript
test.describe('行程管理', () => {
  test('应该创建新行程', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/dashboard');
    await page.click('text=创建行程');

    await page.fill('input[name="name"]', '川渝之旅');
    await page.fill('input[name="description"]', '成都重庆7日游');
    await page.fill('input[name="start_date"]', '2025-04-01');
    await page.fill('input[name="end_date"]', '2025-04-07');

    // Upload cover
    await page.setInputFiles('input[type="file"]', 'test/fixtures/cover.jpg');
    await page.click('button:has-text("创建")');

    await expect(page.locator('text=川渝之旅')).toBeVisible();
  });

  test('创建者应该能编辑行程', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip-id');

    await page.click('[data-testid="edit-trip-button"]');
    await page.fill('input[name="name"]', '川渝之旅（已更新）');
    await page.click('button:has-text("保存")');

    await expect(page.locator('text=川渝之旅（已更新）')).toBeVisible();
  });

  test('非创建者不应该看到编辑按钮', async ({ page }) => {
    await loginAs(page, TEST_USERS.viewer);
    await page.goto('/trips/test-trip-id');

    await expect(page.locator('[data-testid="edit-trip-button"]')).not.toBeVisible();
  });
});
```

#### T3: 日历和活动管理

**文件**: `e2e/calendar/calendar.spec.ts`

```typescript
test.describe('日历与活动', () => {
  test('应该显示7天日历视图', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/calendar');

    await expect(page.locator('.calendar-grid')).toBeVisible();
    await expect(page.locator('.day-card')).toHaveCount(7);
  });

  test('应该创建新活动', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/calendar');

    await page.click('text=添加活动');
    await page.selectOption('select[name="category"]', 'attraction');
    await page.fill('input[name="title"]', '参观武侯祠');
    await page.fill('input[name="location"]', '武侯祠');
    await page.fill('input[name="start_time"]', '09:00');
    await page.fill('input[name="end_time"]', '11:00');

    await page.click('button:has-text("搜索位置")');
    await page.click('.poi-search-result:first-child');
    await page.click('button:has-text("保存")');

    await expect(page.locator('text=参观武侯祠')).toBeVisible();
  });

  test('应该编辑活动', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/calendar');

    await page.click('[data-activity-id="test-activity"]');
    await page.click('text=编辑');
    await page.fill('input[name="title"]', '参观武侯祠（更新）');
    await page.click('button:has-text("保存")');

    await expect(page.locator('text=参观武侯祠（更新）')).toBeVisible();
  });

  test('应该删除活动', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/calendar');

    await page.click('[data-activity-id="test-activity"]');
    await page.click('text=删除');
    await page.click('button:has-text("确认")');

    await expect(page.locator('[data-activity-id="test-activity"]')).not.toBeVisible();
  });
});
```

#### T4: 旅行记录

**文件**: `e2e/logs/travel-logs.spec.ts`

```typescript
test.describe('旅行记录', () => {
  test('应该创建新的旅行记录', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/logs');

    await page.click('text=新建记录');
    await page.fill('input[name="title"]', '成都第一日');
    await page.fill('textarea[name="content"]', '今天到达成都，吃了火锅');

    // Upload images
    await page.setInputFiles('input[type="file"]', [
      'test/fixtures/photo1.jpg',
      'test/fixtures/photo2.jpg',
    ]);

    await page.click('button:has-text("保存")');
    await expect(page.locator('text=成都第一日')).toBeVisible();
    await expect(page.locator('img[alt*="上传的图片"]')).toHaveCount(2);
  });

  test('应该显示多条记录并按时间排序', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/logs?date=2025-04-01');

    // Create first log
    await createLog(page, { title: '上午记录', content: '早上去了宽窄巷子' });
    await page.waitForTimeout(1000);

    // Create second log
    await createLog(page, { title: '下午记录', content: '下午去了武侯祠' });

    // Verify newest first
    const logTitles = await page.locator('.log-title').allTextContents();
    expect(logTitles[0]).toBe('下午记录');
    expect(logTitles[1]).toBe('上午记录');
  });

  test('应该编辑记录并移除图片', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/logs');

    await page.click('[data-log-id="test-log"]');
    await page.click('text=编辑');

    // Remove one image
    await page.click('.image-remove-button:first-child');
    await page.click('button:has-text("保存")');

    // Verify image removed from both log and gallery
    await page.goto('/trips/test-trip/gallery');
    await expect(page.locator('img[src*="removed-image"]')).not.toBeVisible();
  });
});
```

#### T5: 照片库

**文件**: `e2e/gallery/gallery.spec.ts`

```typescript
test.describe('照片库', () => {
  test('应该按日期分组显示照片', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/gallery');

    await expect(page.locator('.date-group:first-child')).toBeVisible();
    await expect(page.locator('.photo-card').first()).toBeVisible();
  });

  test('应该筛选用户照片', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/gallery');

    await page.selectOption('select[name="user"]', TEST_USERS.editor.id);
    await expect(page.locator('.photo-card')).toHaveCount(3);
  });

  test('应该打开灯箱查看照片', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/gallery');

    await page.click('.photo-card:first-child');
    await expect(page.locator('.lightbox')).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Escape');

    await expect(page.locator('.lightbox')).not.toBeVisible();
  });

  test('应该在灯箱中旋转照片', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/gallery');

    await page.click('.photo-card:first-child');
    await page.click('button:has-text("旋转")');

    await expect(page.locator('.lightbox-image')).toHaveCSS(/transform/, /rotate/);
  });

  test('应该删除照片', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/gallery');

    const photoCount = await page.locator('.photo-card').count();
    await page.hover('.photo-card:first-child');
    await page.click('.delete-photo-button');
    await page.click('button:has-text("确认")');

    await expect(page.locator('.photo-card')).toHaveCount(photoCount - 1);
  });
});
```

#### T6: 费用管理

**文件**: `e2e/expenses/expenses.spec.ts`

```typescript
test.describe('费用管理', () => {
  test('应该创建新费用', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/expenses');

    await page.click('text=记一笔');
    await page.fill('input[name="title"]', '团队晚餐');
    await page.fill('input[name="amount"]', '500');
    await page.selectOption('select[name="category"]', 'food');
    await page.selectOption('select[name="payer_id"]', TEST_USERS.owner.id);

    // Select all members
    await page.click('input[type="checkbox"][value="user1"]');
    await page.click('input[type="checkbox"][value="user2"]');

    await page.click('button:has-text("保存")');

    await expect(page.locator('text=团队晚餐')).toBeVisible();
    await expect(page.locator('text=¥500')).toBeVisible();
  });

  test('应该显示费用统计', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/expenses');

    await expect(page.locator('.stat-total')).toContainText('¥1500');
    await expect(page.locator('.stat-my-spending')).toContainText('¥500');
    await expect(page.locator('.stat-my-advance')).toContainText('¥300');
  });

  test('应该生成结算报告', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/expenses');

    await page.click('text=结算报告');
    await expect(page.locator('.settlement-modal')).toBeVisible();

    // Verify settlement suggestions
    await expect(page.locator('text=应付款')).toBeVisible();
    await expect(page.locator('.settlement-item')).toHaveCount(2);
  });

  test('应该筛选费用', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/expenses');

    await page.selectOption('select[name="category"]', 'food');
    await expect(page.locator('.expense-card')).toHaveCount(5);

    await page.selectOption('select[name="payer"]', TEST_USERS.editor.id);
    await expect(page.locator('.expense-card')).toHaveCount(2);
  });
});
```

#### T7: 团队协作

**文件**: `e2e/collaboration/members.spec.ts`

```typescript
test.describe('团队协作', () => {
  test('应该通过分享码邀请成员', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/members');

    await page.click('text=邀请成员');
    const shareCode = await page.locator('.share-code').textContent();

    // Open as new user
    const context = await browser.newContext();
    const newPage = await context.newPage();
    await newPage.goto(`/join/${shareCode}`);
    await newPage.click('text=加入行程');

    await expect(newPage).toHaveURL(/\/trips\/.+/);
  });

  test('所有者应该能修改成员权限', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/members');

    await page.click(`[data-member-id="${TEST_USERS.editor.id}"]`);
    await page.selectOption('select[name="role"]', 'viewer');
    await page.click('button:has-text("保存")');

    await expect(page.locator('text=查看者')).toBeVisible();
  });

  test('编辑者应该能编辑但不能删除行程', async ({ page }) => {
    await loginAs(page, TEST_USERS.editor);
    await page.goto('/trips/test-trip');

    await expect(page.locator('[data-testid="edit-trip-button"]')).toBeVisible();
    // Verify delete option not available
  });
});
```

#### T8: 地图功能

**文件**: `e2e/map/map.spec.ts`

```typescript
test.describe('地图功能', () => {
  test('应该加载地图并显示活动标记', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/map');

    await expect(page.locator('.amap-container')).toBeVisible();
    await expect(page.locator('.amap-marker')).toHaveCount(5);
  });

  test('应该点击标记查看活动详情', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/map');

    await page.click('.amap-marker:first-child');
    await expect(page.locator('.marker-info-window')).toBeVisible();
    await expect(page.locator('text=武侯祠')).toBeVisible();
  });

  test('应该搜索POI', async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
    await page.goto('/trips/test-trip/activities/new');

    await page.fill('input[name="location"]', '成都大熊猫基地');
    await page.click('button:has-text("搜索")');

    await expect(page.locator('.poi-search-result')).toHaveCountGreaterThan(0);
    await page.click('.poi-search-result:first-child');

    await expect(page.locator('input[name="location"]')).toHaveValue(/成都大熊猫基地/);
  });
});
```

---

## 3. 回归测试计划

### 3.1 回归测试套件

回归测试确保现有功能在新版本中仍然正常工作。

#### 回归测试清单

| ID | 测试场景 | 优先级 | 执行频率 |
|----|---------|--------|---------|
| R1 | 用户注册登录流程 | P0 | 每次发布 |
| R2 | 创建新行程 | P0 | 每次发布 |
| R3 | 编辑行程信息 | P0 | 每次发布 |
| R4 | 上传行程封面 | P0 | 每次发布 |
| R5 | 查看日历视图 | P0 | 每次发布 |
| R6 | 添加/编辑/删除活动 | P0 | 每次发布 |
| R7 | 创建多条旅行记录 | P0 | 每次发布 |
| R8 | 上传照片到记录 | P0 | 每次发布 |
| R9 | 查看照片库 | P0 | 每次发布 |
| R10 | 灯箱功能（导航、旋转、下载） | P1 | 每次发布 |
| R11 | 创建费用记录 | P0 | 每次发布 |
| R12 | 生成结算报告 | P0 | 每次发布 |
| R13 | 邀请成员 | P1 | 每次发布 |
| R14 | 修改成员权限 | P1 | 每次发布 |
| R15 | 地图显示活动标记 | P1 | 每次发布 |
| R16 | POI搜索功能 | P2 | 每次发布 |
| R17 | 移动端响应式布局 | P1 | 每次发布 |
| R18 | 底部导航栏（移动端） | P1 | 每次发布 |
| R19 | 个人资料编辑 | P2 | 每次发布 |
| R20 | 图片自动压缩 | P2 | 每次发布 |

### 3.2 回归测试执行

**文件**: `e2e/regression/full-suite.spec.ts`

```typescript
test.describe('回归测试套件', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.owner);
  });

  test('R1-R5: 基础功能', async ({ page }) => {
    // 用户登录
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();

    // 创建行程
    await page.goto('/trips/new');
    // ... create trip

    // 编辑行程
    await page.click('[data-testid="edit-trip-button"]');
    // ... edit trip

    // 查看日历
    await page.goto('/trips/test-trip/calendar');
    await expect(page.locator('.calendar-grid')).toBeVisible();
  });

  test('R6-R10: 活动和照片', async ({ page }) => {
    // 添加活动
    await page.goto('/trips/test-trip/calendar');
    // ... add activity

    // 创建记录
    await page.goto('/trips/test-trip/logs');
    // ... create log with images

    // 查看照片库
    await page.goto('/trips/test-trip/gallery');
    // ... verify photos
  });

  test('R11-R15: 费用和团队', async ({ page }) => {
    // 创建费用
    await page.goto('/trips/test-trip/expenses');
    // ... create expense

    // 结算报告
    await page.click('text=结算报告');
    await expect(page.locator('.settlement-modal')).toBeVisible();

    // 邀请成员
    await page.goto('/trips/test-trip/members');
    // ... invite member
  });
});
```

### 3.3 兼容性测试

#### 浏览器兼容性

| 浏览器 | 版本 | 测试范围 |
|--------|------|---------|
| Chrome | 最新版 | 全部功能 |
| Firefox | 最新版 | 全部功能 |
| Safari | 最新版 | 全部功能 |
| Edge | 最新版 | 全部功能 |
| Mobile Safari | iOS 15+ | 移动端功能 |
| Chrome Mobile | Android 10+ | 移动端功能 |

#### 响应式断点

```typescript
const devices = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

test('应该在不同屏幕尺寸下正常显示', async ({ page }) => {
  await page.setViewportSize(devices.mobile);
  await page.goto('/trips/test-trip/calendar');

  // Mobile: 应该显示滚动视图
  await expect(page.locator('.calendar-scroll')).toBeVisible();

  await page.setViewportSize(devices.desktop);
  // Desktop: 应该显示网格视图
  await expect(page.locator('.calendar-grid')).toBeVisible();
});
```

---

## 4. 性能测试

### 4.1 Lighthouse CI

**配置文件**: `lighthouserc.json`

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }]
      }
    },
    "collect": {
      "startServerCommand": "npm run start",
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/trips/test-trip/calendar"
      ]
    }
  }
}
```

### 4.2 性能目标

| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| First Input Delay | < 100ms | Lighthouse |
| 图片压缩率 | > 70% | 文件大小对比 |

---

## 5. 测试执行计划

### 5.1 开发阶段

- **单元测试**: 每次代码提交时运行
- **集成测试**: 每次代码提交时运行
- **E2E测试**: 开发完成特定功能后运行

### 5.2 PR合并前

```bash
# 运行所有测试
npm test                # Playwright E2E
npm run lint           # ESLint
npm run build          # TypeScript 编译检查
npm run lhci           # Lighthouse 性能测试
```

### 5.3 发布前

1. **完整回归测试**: 运行所有E2E测试
2. **跨浏览器测试**: 在Chrome, Firefox, Safari中测试
3. **移动端测试**: 在真实移动设备上测试
4. **性能测试**: 运行Lighthouse CI
5. **安全测试**: 检查RLS策略和权限控制

---

## 6. 测试数据管理

### 6.1 测试数据准备

```bash
# 创建测试用户
npm run test:users:create

# 填充测试活动数据
npm run seed:activities

# 清理测试数据
node scripts/cleanup-test-data.js
```

### 6.2 测试数据隔离

- 使用专用的测试数据库
- 每次测试前重置数据库状态
- 使用事务回滚避免数据污染

---

## 7. 测试报告

### 7.1 测试覆盖率

目标覆盖率：
- **语句覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%

### 7.2 测试报告生成

```bash
# 生成覆盖率报告
npm run test:coverage

# 生成E2E测试报告
npm run test:report

# 生成Lighthouse报告
npm run lhci:report
```

---

## 8. 持续集成配置

### 8.1 GitHub Actions

```yaml
name: Test Suite

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run E2E tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Run Lighthouse CI
        run: npm run lhci
```

---

## 9. 故障排除

### 9.1 常见问题

**测试失败: 数据库连接**
```bash
# 检查环境变量
cat .env.local

# 重启测试数据库
npm run test:db:restart
```

**E2E测试失败: 超时**
```bash
# 增加超时时间
# playwright.config.ts
timeout: 30000,
```

**Lighthouse测试失败: 性能分数低**
```bash
# 检查是否有未优化的图片
npm run analyze:images

# 检查bundle大小
npm run analyze:bundle
```

---

## 10. 测试最佳实践

1. **保持测试简单**: 每个测试只验证一个功能点
2. **使用有意义的测试名称**: 清楚描述测试内容
3. **避免测试耦合**: 测试之间应该相互独立
4. **使用等待而非硬编码延迟**: 使用 `waitFor` 而非 `waitForTimeout`
5. **模拟外部依赖**: Mock API调用以加快测试速度
6. **清理测试数据**: 每次测试后清理创建的数据
7. **定期更新测试**: 随着功能演进更新测试用例
