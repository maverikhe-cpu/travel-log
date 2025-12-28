-- ============================================
-- 川渝行迹 - 数据库初始结构
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用户资料表 (关联 auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 行程表
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 生成唯一分享码的函数
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 自动生成分享码的触发器
CREATE OR REPLACE FUNCTION set_trip_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
    NEW.share_code := generate_share_code();
    -- 确保唯一性，如果冲突则重新生成
    WHILE EXISTS (SELECT 1 FROM trips WHERE share_code = NEW.share_code AND id != NEW.id) LOOP
      NEW.share_code := generate_share_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_share_code_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION set_trip_share_code();

-- ============================================
-- 行程成员表
-- ============================================
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- ============================================
-- 活动表
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('attraction', 'food', 'transport', 'accommodation', 'other')),
  start_time TIME,
  end_time TIME,
  order_index INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 旅行记录表 (每日笔记)
-- ============================================
CREATE TABLE IF NOT EXISTS travel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  content TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_date)
);

-- ============================================
-- 图片表
-- ============================================
CREATE TABLE IF NOT EXISTS trip_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  file_size INT,
  caption TEXT,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 预置地点表
-- ============================================
CREATE TABLE IF NOT EXISTS preset_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  category TEXT CHECK (category IN ('attraction', 'food', 'transport', 'accommodation')),
  description TEXT
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_images ENABLE ROW LEVEL SECURITY;
-- preset_locations 不需要 RLS，是公开数据

-- ============================================
-- RLS 策略: profiles
-- ============================================
CREATE POLICY "用户可以查看自己的资料"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- RLS 策略: trips
-- ============================================
CREATE POLICY "成员可以查看参与的行程"
  ON trips FOR SELECT
  USING (
    id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "所有人可以创建行程"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "创建者可以更新行程"
  ON trips FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "创建者可以删除行程"
  ON trips FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- RLS 策略: trip_members
-- ============================================
CREATE POLICY "成员可以查看行程成员"
  ON trip_members FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "创建者可以邀请成员"
  ON trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.created_by = auth.uid()
    )
  );

-- ============================================
-- RLS 策略: activities
-- ============================================
CREATE POLICY "成员可以查看活动"
  ON activities FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "编辑者可以创建活动"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = activities.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "编辑者可以更新活动"
  ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = activities.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "编辑者可以删除活动"
  ON activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = activities.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- ============================================
-- RLS 策略: travel_logs
-- ============================================
CREATE POLICY "成员可以查看记录"
  ON travel_logs FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "成员可以创建记录"
  ON travel_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "成员可以更新记录"
  ON travel_logs FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = travel_logs.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- ============================================
-- RLS 策略: trip_images
-- ============================================
CREATE POLICY "成员可以查看图片"
  ON trip_images FOR SELECT
  USING (
    trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "成员可以上传图片"
  ON trip_images FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_images.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "上传者可以删除图片"
  ON trip_images FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_images.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'owner'
    )
  );

-- ============================================
-- 预置地点数据
-- ============================================
INSERT INTO preset_locations (id, name, city, category, description) VALUES
  -- 成都
  ('cd-kszl', '宽窄巷子', '成都', 'attraction', '清代古街道，体验老成都生活'),
  ('cd-jc', '锦里', '成都', 'attraction', '三国文化古街，小吃集中地'),
  ('cd-dxf', '大熊猫繁育基地', '成都', 'attraction', '看大熊猫的必去之地'),
  ('cd-qcs', '青城山', '成都', 'attraction', '道教名山，避暑胜地'),
  ('cd-dj', '都江堰', '成都', 'attraction', '古代水利工程奇迹'),
  ('cd-cdjm', '春熙路', '成都', 'attraction', '成都商业中心'),
  ('cd-tf', '天府广场', '成都', 'attraction', '成都中心地标'),
  ('cd-ws', '文殊院', '成都', 'attraction', '著名佛教寺院'),
  ('cd-jx', '建设路', '成都', 'food', '成都小吃美食街'),

  -- 重庆
  ('cq-hgdd', '洪崖洞', '重庆', 'attraction', '吊脚楼群，夜景绝佳'),
  ('cq-jfb', '解放碑', '重庆', 'attraction', '重庆中心地标'),
  ('cq-cjsd', '长江索道', '重庆', 'attraction', '空中观长江'),
  ('cq-qlgb', '千厮门大桥', '重庆', 'attraction', '观洪崖洞夜景最佳位置'),
  ('cq-cqk', '磁器口古镇', '重庆', 'attraction', '千年古镇，陈麻花发源地'),
  ('cq-cqb', '重庆来福士', '重庆', 'attraction', '现代化商业综合体'),
  ('cq-nb', '南山一棵树', '重庆', 'attraction', '重庆夜景最佳观赏点'),
  ('cq-gyc', '观音桥', '重庆', 'attraction', '重庆第二大商圈'),

  -- 乐山
  ('sc-lds', '乐山大佛', '乐山', 'attraction', '世界最大石刻坐佛'),
  ('sc-ems', '峨眉山', '乐山', 'attraction', '中国四大佛教名山之一'),
  ('sc-dk', '东坡印象水街', '眉山', 'attraction', '网红打卡地'),

  -- 美食
  ('food-hg', '火锅', NULL, 'food', '川渝标志性美食'),
  ('food-cc', '串串香', NULL, 'food', '一手一串的火锅'),
  ('food-ddm', '担担面', NULL, 'food', '成都名小吃'),
  ('food-mxt', '麻婆豆腐', NULL, 'food', '川菜代表'),
  ('food-sdz', '水煮鱼', NULL, 'food', '重庆名菜'),
  ('food-cj', '抄手', NULL, 'food', '类似馄饨的小吃'),
  ('food-rrc', '红油抄手', NULL, 'food', '成都特色抄手'),
  ('food-snt', '酸辣粉', NULL, 'food', '重庆街头小吃'),
  ('food-bb', '钵钵鸡', NULL, 'food', '乐山特色'),
  ('food-tf', '兔头', NULL, 'food', '四川特色小吃')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 辅助函数
-- ============================================

-- 获取行程的所有日期
CREATE OR REPLACE FUNCTION get_trip_dates(trip_uuid UUID)
RETURNS TABLE (day_date DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT generate_series(
    (SELECT start_date FROM trips WHERE id = trip_uuid),
    (SELECT end_date FROM trips WHERE id = trip_uuid),
    INTERVAL '1 day'
  )::DATE;
END;
$$ LANGUAGE plpgsql;

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加 updated_at 触发器
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_logs_updated_at BEFORE UPDATE ON travel_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
