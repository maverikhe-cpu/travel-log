# 漫行记 WanderLog

漫行山水间，记录时光里

为团队旅行提供简单、直观的行程规划与记录工具。

## 功能特性

- **行程管理**: 创建旅行计划，设置日期范围
- **日历视图**: 7天网格视图（桌面）/ 滚动视图（移动）
- **活动管理**: 添加/编辑/删除活动，预置热门地点
- **团队协作**: 分享码邀请，成员权限管理
- **旅行记录**: 每日富文本笔记记录
- **照片库**: 按日期分组展示旅行照片

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

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 执行 `supabase/migrations/001_initial_schema.sql` 中的所有 SQL
3. 执行 `supabase/migrations/002_storage_bucket.sql` 创建存储桶

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
│   └── ...
├── lib/              # 工具库
│   └── supabase/     # Supabase 客户端
├── store/            # Zustand 状态管理
└── types/            # TypeScript 类型
```

## 品牌标识

**漫行记 WanderLog**
━━━━━━━━━━━━
漫行山水间，记录时光里

## License

MIT
