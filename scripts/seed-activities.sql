-- ============================================
-- 填充测试旅程活动数据
-- ============================================
-- 说明：此脚本会为第一个找到的旅程填充7天的活动
-- 每天活动安排合理，有吃有玩，不会太满
-- ============================================

-- 首先获取一个旅程ID（用于后续插入）
-- 注意：请先手动查询一个你想填充的旅程ID，替换下面的 @trip_id

DO $$
DECLARE
  trip_id UUID;
  user_id UUID;
  start_date DATE;
  day_counter INT := 0;
BEGIN
  -- 获取第一个旅程（你可以修改这里的条件）
  SELECT id, created_by, start_date INTO trip_id, user_id, start_date
  FROM trips
  ORDER BY created_at DESC
  LIMIT 1;

  IF trip_id IS NULL THEN
    RAISE NOTICE '没有找到旅程，请先创建一个旅程';
    RETURN;
  END IF;

  RAISE NOTICE '正在为旅程 % 填充活动...', trip_id;

  -- 第1天：成都抵达 + 市区游玩
  day_counter := 0;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '抵达成都', '入住酒店，休整', '成都', 'transport', '14:00', '15:00', 1, user_id),
    (trip_id, start_date + day_counter, '春熙路步行', '成都商业中心，感受城市氛围', '春熙路', 'attraction', '15:30', '17:30', 2, user_id),
    (trip_id, start_date + day_counter, '火锅晚餐', '品尝正宗四川火锅', '建设路', 'food', '18:30', '20:00', 3, user_id);

  -- 第2天：成都经典景点
  day_counter := 1;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '大熊猫繁育基地', '看可爱的大熊猫，建议早上去', '大熊猫繁育基地', 'attraction', '08:30', '12:00', 1, user_id),
    (trip_id, start_date + day_counter, '宽窄巷子午餐', '清代古街道，品尝成都小吃', '宽窄巷子', 'food', '12:30', '14:30', 2, user_id),
    (trip_id, start_date + day_counter, '武侯祠·锦里', '三国文化圣地，晚上夜景更美', '锦里', 'attraction', '15:00', '18:00', 3, user_id),
    (trip_id, start_date + day_counter, '串串香', '一手一串的火锅体验', '锦里', 'food', '18:30', '20:00', 4, user_id);

  -- 第3天：成都周边一日游
  day_counter := 2;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '都江堰', '古代水利工程奇迹', '都江堰', 'attraction', '09:00', '12:00', 1, user_id),
    (trip_id, start_date + day_counter, '都江堰午餐', '品尝当地特色菜', '都江堰', 'food', '12:00', '13:30', 2, user_id),
    (trip_id, start_date + day_counter, '青城山', '道教名山，清幽避暑', '青城山', 'attraction', '14:00', '17:30', 3, user_id),
    (trip_id, start_date + day_counter, '返回成都', '乘车返回市区', '成都', 'transport', '17:30', '19:00', 4, user_id),
    (trip_id, start_date + day_counter, '麻婆豆腐晚餐', '经典川菜', '春熙路', 'food', '19:30', '21:00', 5, user_id);

  -- 第4天：成都到重庆
  day_counter := 3;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '成都东站出发', '乘坐高铁前往重庆（约1.5小时）', '成都东站', 'transport', '09:00', '10:30', 1, user_id),
    (trip_id, start_date + day_counter, '抵达重庆', '入住酒店，放下行李', '重庆北站', 'transport', '10:30', '12:00', 2, user_id),
    (trip_id, start_date + day_counter, '解放碑', '重庆中心地标，周边商圈繁华', '解放碑', 'attraction', '14:00', '16:00', 3, user_id),
    (trip_id, start_date + day_counter, '洪崖洞', '吊脚楼群，晚上夜景绝美', '洪崖洞', 'attraction', '16:30', '19:00', 4, user_id),
    (trip_id, start_date + day_counter, '重庆火锅', '正宗重庆老火锅', '解放碑', 'food', '19:30', '21:00', 5, user_id);

  -- 第5天：重庆市区
  day_counter := 4;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '长江索道', '空中俯瞰长江和山城', '长江索道', 'attraction', '09:30', '11:00', 1, user_id),
    (trip_id, start_date + day_counter, '磁器口古镇', '千年古镇，品尝陈麻花', '磁器口古镇', 'attraction', '11:30', '14:00', 2, user_id),
    (trip_id, start_date + day_counter, '酸辣粉', '重庆街头特色小吃', '磁器口古镇', 'food', '14:00', '14:30', 3, user_id),
    (trip_id, start_date + day_counter, '观音桥', '重庆第二大商圈，购物天堂', '观音桥', 'attraction', '15:30', '18:00', 4, user_id),
    (trip_id, start_date + day_counter, '水煮鱼', '重庆经典菜品', '观音桥', 'food', '18:30', '20:00', 5, user_id);

  -- 第6天：重庆到乐山
  day_counter := 5;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '重庆前往乐山', '乘坐高铁（约2小时）', '重庆北站', 'transport', '08:30', '10:30', 1, user_id),
    (trip_id, start_date + day_counter, '乐山大佛', '世界最大石刻坐佛，必游景点', '乐山大佛', 'attraction', '11:00', '15:00', 2, user_id),
    (trip_id, start_date + day_counter, '钵钵鸡', '乐山特色美食', '乐山市区', 'food', '15:30', '16:30', 3, user_id),
    (trip_id, start_date + day_counter, '东坡印象水街', '网红打卡地，夜景很美', '东坡印象水街', 'attraction', '17:00', '19:00', 4, user_id),
    (trip_id, start_date + day_counter, '兔头', '四川特色小吃，值得一试', '乐山市区', 'food', '19:30', '20:30', 5, user_id);

  -- 第7天：返程
  day_counter := 6;
  INSERT INTO activities (trip_id, day_date, title, description, location, category, start_time, end_time, order_index, created_by)
  VALUES
    (trip_id, start_date + day_counter, '文殊院', '著名佛教寺院，感受宁静', '文殊院', 'attraction', '09:00', '11:00', 1, user_id),
    (trip_id, start_date + day_counter, '担担面', '成都名小吃', '文殊院周边', 'food', '11:30', '12:30', 2, user_id),
    (trip_id, start_date + day_counter, '天府广场', '成都中心地标', '天府广场', 'attraction', '13:00', '14:00', 3, user_id),
    (trip_id, start_date + day_counter, '前往机场', '返程回家', '成都双流机场', 'transport', '15:00', '17:00', 4, user_id);

  RAISE NOTICE '活动填充完成！共7天行程，每天2-5个活动';
END $$;

-- 查看填充结果
SELECT
  day_date,
  COUNT(*) as activity_count,
  STRING_AGG(title, ', ' ORDER BY order_index) as activities
FROM activities
WHERE trip_id = (SELECT id FROM trips ORDER BY created_at DESC LIMIT 1)
GROUP BY day_date
ORDER BY day_date;
