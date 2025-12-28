# 高德地图配置指南

## 常见错误

### 1. INVALID_USER_SCODE 错误

如果遇到 `INVALID_USER_SCODE` 错误，表示**安全密钥配置不正确**。

**可能原因：**
- 安全密钥与 API Key 不匹配（不是同一个应用下的）
- 安全密钥格式错误
- 环境变量配置错误

**解决方法：**
1. 登录 [高德控制台](https://console.amap.com/)
2. 进入你的应用 → 找到「安全密钥」设置
3. 确认安全密钥与 API Key 属于同一个应用
4. 如果安全密钥配置错误，可以：
   - **方案 A**：重新生成安全密钥，并更新环境变量
   - **方案 B**：暂时不设置安全密钥（删除 `NEXT_PUBLIC_AMAP_SECURITY_JS_CODE` 环境变量）

### 2. USERKEY_PLAT_NOMATCH 错误

如果遇到 `USERKEY_PLAT_NOMATCH` 错误，通常是因为以下原因：

1. **API Key 平台类型不匹配**：使用了非 Web 端的 Key
2. **缺少安全密钥**：未配置 Security JS Code
3. **域名白名单未配置**：未在控制台添加允许的域名

## 解决步骤

### 1. 获取正确的 API Key

1. 访问 [高德开放平台](https://console.amap.com/)
2. 登录后进入「应用管理」→「我的应用」
3. 创建新应用或选择现有应用
4. **重要**：添加「Web 端（JS API）」类型的 Key
   - 不要使用「Web 服务」或其他类型的 Key
   - 必须选择「Web 端（JS API）」

### 2. 配置安全密钥（Security JS Code）

**重要提示：** 如果遇到 `INVALID_USER_SCODE` 错误，请仔细检查此步骤。

1. 在应用详情页面，找到「安全密钥」设置
2. 点击「添加」或「设置」
3. 输入安全密钥（可以是一个随机字符串，建议使用 UUID）
4. **确保安全密钥与 API Key 属于同一个应用**
5. 保存后，复制安全密钥

**注意：**
- 安全密钥必须与 API Key 在同一个应用下
- 如果配置错误，可以暂时不设置安全密钥（删除环境变量中的 `NEXT_PUBLIC_AMAP_SECURITY_JS_CODE`）
- 但推荐配置安全密钥以提高安全性

### 3. 配置域名白名单

1. 在应用详情页面，找到「服务平台」或「Web 服务」设置
2. 添加允许的域名：
   - `localhost:3000`（开发环境）
   - `127.0.0.1:3000`（开发环境）
   - 你的生产域名（如：`yourdomain.com`）

### 4. 配置环境变量

在 `.env.local` 文件中添加：

```env
# 高德地图 Web 端（JS API）Key
NEXT_PUBLIC_AMAP_KEY=your-amap-web-api-key

# 高德地图安全密钥（Security JS Code）
# 注意：如果遇到 INVALID_USER_SCODE 错误，请检查此值是否正确
# 或者暂时删除此行，不设置安全密钥
NEXT_PUBLIC_AMAP_SECURITY_JS_CODE=your-amap-security-js-code
```

### 5. 重启开发服务器

```bash
npm run dev
```

## 验证配置

1. 打开浏览器控制台
2. 查看是否有 "AMap 加载成功" 的日志
3. 尝试搜索地点，应该不再出现错误
4. 如果出现 `INVALID_USER_SCODE` 错误，请检查安全密钥配置

## 常见问题

### Q: 我已经有 API Key 了，为什么还是报错？

A: 请确认：
- Key 的类型是「Web 端（JS API）」，不是「Web 服务」
- 已配置安全密钥（Security JS Code）
- 已添加域名白名单

### Q: 安全密钥是必须的吗？

A: 虽然不是必须的，但强烈推荐配置。配置安全密钥可以：
- 避免 `USERKEY_PLAT_NOMATCH` 错误
- 提高 API 安全性
- 防止 Key 被滥用

**如果遇到 `INVALID_USER_SCODE` 错误：**
- 可以暂时删除 `NEXT_PUBLIC_AMAP_SECURITY_JS_CODE` 环境变量
- 或者重新在高德控制台生成安全密钥并更新环境变量
- 确保安全密钥与 API Key 属于同一个应用

### Q: 本地开发需要配置域名白名单吗？

A: 是的，需要添加 `localhost:3000` 到白名单。如果不配置，可能会被高德地图拒绝请求。

## 参考链接

- [高德地图 JS API 文档](https://lbs.amap.com/api/javascript-api/summary)
- [高德地图控制台](https://console.amap.com/)

