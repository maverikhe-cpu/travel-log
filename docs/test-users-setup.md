# 测试用户创建指南

本指南说明如何创建测试用户，用于功能测试和开发。

## 前置条件

1. 已配置 Supabase 项目
2. 已设置 `.env.local` 文件中的基本环境变量

## 步骤

### 1. 获取 Service Role Key

**重要**：创建测试用户需要使用 Service Role Key，而不是 Anon Key。

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 在 **Project API keys** 部分，找到 **service_role** key
5. 复制这个 key（⚠️ **注意**：这是敏感密钥，拥有完整数据库访问权限，不要提交到代码库）

### 2. 配置环境变量

在 `.env.local` 文件中添加以下环境变量：

```env
# 已有的环境变量
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 新增：Service Role Key（用于创建测试用户）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**注意**：
- `SUPABASE_SERVICE_ROLE_KEY` 应该添加到 `.env.local` 文件中
- 确保 `.env.local` 已在 `.gitignore` 中，不会被提交到代码库

### 3. 运行创建脚本

```bash
npm run test:users:create
```

或者：

```bash
npx tsx scripts/setup-test-users.ts
```

### 4. 验证用户创建

脚本会输出创建结果。如果用户已存在，会显示 "已存在"；如果创建成功，会显示用户 ID。

## 测试用户列表

脚本会创建以下测试用户：

| 邮箱 | 密码 | 名称 | 用途 |
|------|------|------|------|
| test1@example.com | Test123456 | 测试用户1 | 基础测试 |
| test2@example.com | Test123456 | 测试用户2 | 基础测试 |
| creator@example.com | Test123456 | 创建者 | 行程创建者测试 |
| alice@example.com | Test123456 | Alice | 多人协作测试 |
| bob@example.com | Test123456 | Bob | 多人协作测试 |
| charlie@example.com | Test123456 | Charlie | 多人协作测试 |
| diana@example.com | Test123456 | Diana | 多人协作测试 |
| eve@example.com | Test123456 | Eve | 多人协作测试 |

## 常见问题

### Q: 提示 "Invalid API key"

**A**: 确保使用的是 **Service Role Key**，而不是 Anon Key。

- Service Role Key 在 Supabase Dashboard > Settings > API > service_role
- Anon Key 在同一个页面，但标记为 "anon" 或 "public"

### Q: 提示 "缺少环境变量"

**A**: 确保 `.env.local` 文件中包含以下变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Q: 用户已存在

**A**: 这是正常的。如果用户已存在，脚本会跳过创建，显示 "已存在"。你可以直接使用这些账号登录。

### Q: 如何删除测试用户？

**A**: 可以通过以下方式删除：

1. **Supabase Dashboard**：
   - 进入 Authentication > Users
   - 找到要删除的用户
   - 点击删除按钮

2. **Supabase CLI**（如果已安装）：
   ```bash
   supabase auth delete-user <user-id>
   ```

## 安全提示

⚠️ **重要安全提示**：

1. **不要提交 Service Role Key 到代码库**
   - 确保 `.env.local` 在 `.gitignore` 中
   - 不要在代码中硬编码密钥

2. **仅用于开发/测试环境**
   - Service Role Key 拥有完整数据库访问权限
   - 生产环境应使用更严格的权限控制

3. **定期轮换密钥**
   - 如果密钥泄露，立即在 Supabase Dashboard 中重置

## 使用测试用户

创建完成后，你可以使用这些账号登录应用进行测试：

1. 访问登录页面：`http://localhost:3000/login`
2. 使用上述邮箱和密码登录
3. 开始测试各种功能

## 脚本功能

脚本会自动：
- ✅ 创建用户账号
- ✅ 自动确认邮箱（无需邮件验证）
- ✅ 设置用户元数据（姓名）
- ✅ 跳过已存在的用户
- ✅ 显示创建结果和错误信息

