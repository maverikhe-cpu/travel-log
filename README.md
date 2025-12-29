# 漫行记 WanderLog

漫行山水间，记录时光里

为团队旅行提供简单、直观的行程规划与记录工具。

## 功能特性

### 核心功能
- **行程管理**: 创建旅行计划，设置日期范围，上传行程封面
- **行程编辑**: 漫游长可编辑行程信息（名称、描述、日期、封面）
- **封面上传**: 支持本地上传或从照片库选择封面

### 日历与活动
- **日历视图**: 7天网格视图（桌面）/ 滚动视图（移动）
- **活动管理**: 添加/编辑/删除活动，预置200+川渝热门地点
- **地图视图**: 高德地图集成，可视化展示活动位置

### 团队协作
- **角色权限**:
  - **漫游长**: 所有权限，可移除成员
  - **漫行客**: 可添加/编辑活动，可修改成员角色
  - **查看者**: 仅查看内容
  - **云伴游**: 可浏览行程、点赞评论，不可见费用
- **邀请方式**: 分享码邀请，可选择邀请身份（正式成员/云伴游）
- **个人资料**: 自定义头像和用户名
- **成员管理**: 角色切换、屏蔽云伴游互动

### 社交互动
- **点赞评论**: 日志、照片、活动可点赞评论
- **云伴游模式**: 朋友以云伴游身份围观行程，参与互动但不查看费用
- **内容审核**: 举报不当评论，漫游长可删除

### 旅行记录
- **多条记录**: 每个成员每天可创建多条旅行记录
- **隐私设置**: 支持设置为私密（仅自己可见）
- **富文本内容**: 记录旅行心得和见闻
- **图片上传**: 每条记录最多上传10张图片
- **照片库集成**: 旅行记录的图片自动展示在照片库
- **时间排序**: 记录按创建时间倒序排列

### 照片库
- **按日期分组**: 所有照片按旅行日期分组展示
- **成员筛选**: 按上传成员筛选照片
- **灯箱查看**: 全屏查看、旋转、缩放、下载
- **批量上传**: 支持一次上传多张照片
- **自动压缩**: 客户端自动压缩图片，优化存储
- **点赞评论**: 社交互动功能

### 费用管理
- **费用记录**: 记录团队开销，支持6种分类
- **快捷分摊**: 「仅自己」/「全选」快速选择分摊成员
- **自动分摊**: 自动计算每人应付金额
- **费用统计**: 查看总支出、个人支出、个人垫付
- **结算报告**: 智能计算最优结算方案
- **筛选排序**: 按分类、付款人、日期筛选
- **权限控制**: 云伴游无法访问费用页面

## 技术栈

- **前端**: Next.js 16 + TypeScript + Tailwind CSS
- **状态管理**: Zustand
- **后端**: Supabase (认证 + PostgreSQL + Storage)
- **部署**: Vercel

## 快速开始

### 1. 注册 Supabase

1. 访问 [supabase.com](https://supabase.com) 并注册账号
2. 创建新项目
3. 等待项目初始化完成（约2分钟）

### 2. 配置数据库

在 Supabase Dashboard 的 **SQL Editor** 中，按顺序执行以下迁移文件：

1. `supabase/migrations/001_initial_schema.sql` - 初始数据库结构
2. `supabase/migrations/002_storage_bucket.sql` - 创建存储桶
3. `supabase/migrations/003_fix_rls_policies.sql` - 修复行级安全策略
4. `supabase/migrations/004_add_log_privacy.sql` - 添加日志隐私字段
5. `supabase/migrations/005_create_avatars_bucket.sql` - 创建头像存储桶
6. `supabase/migrations/006_create_test_users.sql` - 创建测试用户（可选）
7. `supabase/migrations/007_add_location_columns.sql` - 添加位置坐标字段
8. `supabase/migrations/008_add_expenses_tables.sql` - 创建费用管理表
9. `supabase/migrations/009_fix_expenses_update_policy.sql` - 修复费用更新策略
10. `supabase/migrations/010_fix_profiles_rls.sql` - 修复用户表策略
11. `supabase/migrations/011_fix_storage_policies.sql` - 修复存储策略
12. `supabase/migrations/012_add_cloud_companion_role.sql` - 添加云伴游角色
13. `supabase/migrations/013_create_comments_table.sql` - 创建评论表
14. `supabase/migrations/014_create_likes_table.sql` - 创建点赞表
15. `supabase/migrations/015_create_reports_table.sql` - 创建举报表
16. `supabase/migrations/016_add_invite_tokens.sql` - 添加邀请令牌系统
17. `supabase/migrations/017_fix_expenses_delete_policy.sql` - 修复费用删除策略

### 3. 获取 API 密钥

1. 在 Supabase Dashboard 中，进入 **Settings** > **API**
2. 复制以下值：
   - Project URL
   - anon public key
   - service_role key（可选）

### 4. 配置环境变量

1. 复制 `.env.example` 为 `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. 填入你的 Supabase 凭证：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 5. 运行开发服务器

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 开发工具

### 填充测试活动数据

为快速测试应用功能，可以自动填充测试活动数据：

1. 在应用中创建一个名为"测试旅程"的行程（建议7天，如 2025-03-15 至 2025-03-21）
2. 运行填充脚本：
   ```bash
   npm run seed:activities
   ```
3. 脚本会自动为该行程填充7天的川渝游活动数据

### 创建测试用户

```bash
npm run test:users:create
```

创建的测试账号：
- creator@test.com / Test123456 (漫游长)
- editor@test.com / Test123456 (漫行客)
- viewer@test.com / Test123456 (查看者)
- companion1@test.com / Test123456 (云伴游)
- companion2@test.com / Test123456 (云伴游)

### 检查数据库状态

查看数据库中的旅程和活动数据：

```bash
node scripts/check-trips.js
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com) 并导入项目
3. 在 Vercel 项目设置中添加环境变量
4. 部署完成

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # 认证页面
│   ├── dashboard/    # 仪表盘
│   └── trips/        # 行程相关页面
├── components/       # React 组件
│   ├── ui/           # 基础 UI 组件
│   ├── social/       # 社交互动组件
│   └── ...
├── lib/              # 工具库
│   ├── supabase/     # Supabase 客户端
│   ├── social.ts     # 社交功能服务
│   └── companions.ts # 成员管理服务
├── store/            # Zustand 状态管理
└── types/            # TypeScript 类型
```

## 品牌标识

**漫行记 WanderLog**
━━━━━━━━━━━━
漫行山水间，记录时光里

## License

MIT
