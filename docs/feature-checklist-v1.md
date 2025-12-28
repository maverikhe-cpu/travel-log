# 漫行记 WanderLog v1.0 功能清单

## 项目信息

**项目名称**: 漫行记 WanderLog
**Slogan**: 漫行山水间，记录时光里
**版本**: 1.0
**技术栈**: Next.js 16.1.1 + TypeScript + Tailwind CSS + Supabase
**部署目标**: Vercel

---

## 一、数据库结构

### 1.1 数据表
| 表名 | 说明 | 字段 |
|------|------|------|
| `profiles` | 用户资料 | id, email, username, avatar_url, created_at |
| `trips` | 行程 | id, name, description, start_date, end_date, created_by, share_code, cover_image_url |
| `trip_members` | 行程成员 | id, trip_id, user_id, role, joined_at |
| `activities` | 活动安排 | id, trip_id, day_date, title, description, location, category, start_time, end_time, order_index |
| `travel_logs` | 旅行记录 | id, trip_id, day_date, content, is_private, created_by |
| `trip_images` | 图片元数据 | id, trip_id, day_date, user_id, storage_path, public_url, thumbnail_url, caption |
| `preset_locations` | 预置地点 | id, name, city, category, description |

### 1.2 Storage Buckets
| Bucket | 公开 | 用途 |
|--------|------|------|
| `trip-images` | ✓ | 行程照片 |
| `avatars` | ✓ | 用户头像 |

### 1.3 RLS 策略
- profiles: 用户只能查看/更新自己的资料
- trips: 成员可查看，创建者可更新/删除
- trip_members: 成员可查看，创建者可邀请
- activities: 成员可查看，编辑者可增删改
- travel_logs: 公开可查看，私密仅创建者可见
- trip_images: 成员可查看，上传者可删除

---

## 二、页面路由

### 2.1 公开页面
| 路由 | 组件 | 功能 |
|------|------|------|
| `/` | page.tsx | 首页 |
| `/login` | login/page.tsx | 登录 |
| `/register` | register/page.tsx | 注册 |
| `/join/[code]` | join/[code]/page.tsx | 加入行程 |

### 2.2 受保护页面
| 路由 | 组件 | 功能 |
|------|------|------|
| `/dashboard` | dashboard/page.tsx | 仪表盘（行程列表） |
| `/profile` | profile/page.tsx | 个人中心 |
| `/trips/new` | trips/new/page.tsx | 创建行程 |
| `/trips/[id]` | trips/[id]/page.tsx | 行程详情 |
| `/trips/[id]/calendar` | trips/[id]/calendar/page.tsx | 日历视图 |
| `/trips/[id]/activities/new` | trips/[id]/activities/new/page.tsx | 创建活动 |
| `/trips/[id]/activities/[activityId]` | trips/[id]/activities/[activityId]/page.tsx | 编辑活动 |
| `/trips/[id]/logs` | trips/[id]/logs/page.tsx | 旅行记录 |
| `/trips/[id]/logs/edit` | trips/[id]/logs/edit/page.tsx | 编辑记录 |
| `/trips/[id]/gallery` | trips/[id]/gallery/page.tsx | 照片库 |
| `/trips/[id]/gallery/upload` | trips/[id]/gallery/upload/page.tsx | 上传照片 |
| `/trips/[id]/members` | trips/[id]/members/page.tsx | 成员管理 |

### 2.3 API 路由
| 路由 | 方法 | 功能 |
|------|------|------|
| `/auth/signout` | POST | 登出 |

---

## 三、组件库

### 3.1 UI 组件
| 组件 | 路径 | 用途 |
|------|------|------|
| Button | components/ui/button.tsx | 统一按钮样式 |

### 3.2 功能组件
| 组件 | 路径 | 功能 |
|------|------|------|
| RichTextEditor | components/editor/rich-text-editor.tsx | 富文本编辑（加粗/列表/链接） |
| AvatarUploader | components/profile/avatar-uploader.tsx | 头像上传 |
| ShareButton | components/trip/share-button.tsx | 分享按钮 |
| ShareDialog | components/trip/share-dialog.tsx | 分享对话框 |

---

## 四、核心功能

### 4.1 用户认证 ✓
- [x] 邮箱密码注册
- [x] 登录
- [x] 登出
- [x] 邀请链接注册/登录
- [x] 个人资料编辑
- [x] 头像上传

### 4.2 行程管理 ✓
- [x] 创建行程
- [x] 行程列表
- [x] 行程详情
- [x] 封面图片
- [x] 分享码生成

### 4.3 活动管理 ✓
- [x] 日历视图
- [x] 创建活动
- [x] 编辑活动
- [x] 删除活动
- [x] 活动排序（上移/下移）
- [x] 100+ 预置地点
- [x] 时间设置

### 4.4 旅行记录 ✓
- [x] 富文本编辑
- [x] 按日期查看
- [x] 公开/私密设置
- [x] 中文输入支持
- [x] 自动保存

### 4.5 照片库 ✓
- [x] 照片上传（支持多张）
- [x] 拖拽上传
- [x] 客户端压缩
- [x] 按日期分组
- [x] 缩略图展示
- [x] 图片说明

### 4.6 团队协作 ✓
- [x] 分享码邀请
- [x] 一键复制（邀请码+链接+话术）
- [x] 自动加入行程
- [x] 成员列表
- [x] 角色管理（owner/editor/viewer）
- [x] 移除成员

### 4.7 移动端 ✓
- [x] 响应式布局
- [x] 底部导航
- [x] 触摸友好按钮
- [x] 川渝主题配色

---

## 五、预置地点数据（100+）

### 成都景点
宽窄巷子、锦里、大熊猫繁育基地、青城山、都江堰、春熙路、天府广场、文殊院、建设路、人民公园、武侯祠、杜甫草堂、四川博物院、成都动物园、海昌极地海洋世界...

### 重庆景点
洪崖洞、解放碑、长江索道、千厮门大桥、磁器口古镇、重庆来福士、南山一棵树、观音桥、李子坝轻轨穿楼、鹅岭公园、重庆动物园、洋人街、皇冠大扶梯...

### 乐山景点
乐山大佛、峨眉山、东坡印象水街...

### 美食分类
火锅、串串香、担担面、麻婆豆腐、水煮鱼、抄手、红油抄手、酸辣粉、钵钵鸡、兔头、夫妻肺片、赖汤圆、三大炮、钟水饺、龙抄手、宜宾燃面、泡椒凤爪...

---

## 六、主题配置

### 颜色方案
```css
辣椒红: #DC2626 (primary-500)
竹青:   #059669 (success)
蜀锦金: #D97706 (warning)
```

### 字体
- 中文: 系统默认无衬线字体
- 数字/英文: Inter/系统字体

---

## 七、已知限制

1. **暂不支持**
   - 密码修改（使用 Supabase Email 链接重置）
   - 通知设置
   - 账号删除
   - 拖拽排序活动
   - 实时协作

2. **技术限制**
   - 富文本功能简化（仅加粗/列表/链接）
   - 图片上传单张最大 5MB
   - 头像上传最大 2MB

---

## 八、部署清单

### 8.1 环境变量
```bash
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 8.2 Supabase 配置
- [x] Database migrations 执行
- [x] Storage buckets 创建
- [x] RLS policies 启用
- [x] Auth email templates 配置

### 8.3 Vercel 配置
- [x] 环境变量设置
- [x] 域名配置（如需要）
- [x] 构建命令: `npm run build`

---

## 九、下一步计划（v1.1）

- [ ] 密码修改功能
- [ ] 行程模板复制
- [ ] 导出行程为PDF
- [ ] 统计图表
- [ ] 消息通知
- [ ] 深色模式
