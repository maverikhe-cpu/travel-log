# 修复费用更新失败问题

## 问题描述

更新费用时出现错误："更新失败，请重试"。错误信息显示：
- 错误代码：`PGRST116`
- 错误信息：`Cannot coerce the result to a single JSON object`
- 详细信息：`The result contains 0 rows`

## 根本原因

RLS (Row Level Security) 策略中的 UPDATE 策略缺少 `WITH CHECK` 子句，导致更新操作返回 0 行。

## 解决方案

### 方法 1：运行迁移文件（推荐）

在 Supabase Dashboard 中运行新的迁移文件：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制并执行 `supabase/migrations/009_fix_expenses_update_policy.sql` 文件中的 SQL

### 方法 2：手动执行 SQL

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 删除旧的 UPDATE 策略
DROP POLICY IF EXISTS "Creators or editors can update expenses" ON expenses;

-- 重新创建包含 WITH CHECK 的 UPDATE 策略
CREATE POLICY "Creators or editors can update expenses"
  ON expenses FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );
```

## 代码修复

代码中已经做了以下改进：

1. **使用 `.maybeSingle()` 替代 `.single()`**：避免在返回 0 行时抛出错误
2. **添加空值检查**：如果更新返回 `null`，会抛出更清晰的错误信息

## 验证修复

修复后，请测试：

1. 打开费用管理页面
2. 点击某个费用的编辑按钮
3. 修改费用信息
4. 点击保存
5. 确认更新成功，不再出现错误提示

## 技术说明

在 Supabase/PostgREST 中，UPDATE 操作的 RLS 策略需要同时满足：
- **USING**：用于选择哪些行可以被更新（WHERE 条件）
- **WITH CHECK**：用于验证更新后的值是否符合策略

如果只有 `USING` 而没有 `WITH CHECK`，PostgREST 在某些情况下可能无法正确评估策略，导致更新返回 0 行。

