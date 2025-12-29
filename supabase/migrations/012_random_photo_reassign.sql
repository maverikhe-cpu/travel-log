-- ============================================
-- 测试用：随机将照片分配给其他成员
-- 用于测试照片库的上传者显示功能
-- ============================================

-- 为每个行程的照片随机重新分配给该行程的成员
-- 80%的照片会被重新分配，20%保持原样

WITH trip_member_counts AS (
  -- 统计每个行程的成员数量
  SELECT trip_id, COUNT(*) as member_count
  FROM trip_members
  GROUP BY trip_id
  HAVING COUNT(*) > 1  -- 只处理有多个成员的行程
),
photos_to_update AS (
  -- 选择需要更新的照片（80%）
  SELECT ti.id, ti.trip_id, ti.user_id as original_user_id
  FROM trip_images ti
  JOIN trip_member_counts tmc ON ti.trip_id = tmc.trip_id
  WHERE RANDOM() < 0.8  -- 80%概率被选中
  LIMIT 1000  -- 限制最多1000张
),
target_members AS (
  -- 为每张照片找到目标成员（排除当前上传者）
  SELECT
    ptu.id as photo_id,
    ptu.trip_id,
    tm.user_id as new_user_id
  FROM photos_to_update ptu
  CROSS JOIN trip_members tm
  WHERE tm.trip_id = ptu.trip_id
    AND tm.user_id != ptu.original_user_id
    AND RANDOM() < 0.3  -- 从其他成员中随机选择
)
-- 执行更新
UPDATE trip_images
SET user_id = target_members.new_user_id
FROM target_members
WHERE trip_images.id = target_members.photo_id;

-- 查看更新结果
SELECT
  t.name as trip_name,
  p.username as uploader,
  COUNT(*) as photo_count
FROM trip_images ti
JOIN trips t ON ti.trip_id = t.id
JOIN profiles p ON ti.user_id = p.id
GROUP BY t.id, t.name, p.username
ORDER BY t.id, photo_count DESC;
