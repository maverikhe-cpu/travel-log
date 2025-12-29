// 用户资料
export interface Profile {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;

  created_at: string;
}

// 行程
export interface Trip {
  id: string;
  name: string;
  description?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  created_by: string;
  share_code: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

// 行程成员角色
export type MemberRole = 'owner' | 'editor' | 'viewer' | 'companion';

// 行程成员
export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  is_blocked?: boolean; // 是否被屏蔽（仅用于云伴游）
  profile?: Profile;
  profiles?: Profile;
}

// 活动类型
export type ActivityCategory = 'attraction' | 'food' | 'transport' | 'accommodation' | 'other';

// 活动
export interface Activity {
  id: string;
  trip_id: string;
  day_date: string;  // YYYY-MM-DD
  title: string;
  description?: string;
  location?: string;
  category: ActivityCategory;
  start_time?: string;  // HH:mm
  end_time?: string;    // HH:mm
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 旅行记录
export interface TravelLog {
  id: string;
  trip_id: string;
  day_date: string;  // YYYY-MM-DD
  content: string;   // 富文本 HTML
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 图片
export interface TripImage {
  id: string;
  trip_id: string;
  day_date: string;  // YYYY-MM-DD
  user_id: string;
  storage_path: string;
  public_url: string;
  thumbnail_url?: string;
  original_filename?: string;
  file_size?: number;
  caption?: string;
  width?: number;
  height?: number;
  created_at: string;
  profile?: Profile;
}

// 预置地点
export interface PresetLocation {
  id: string;
  name: string;
  city?: string;
  category?: ActivityCategory;
  description?: string;
  longitude?: number;
  latitude?: number;
}

// 带成员信息的行程
export interface TripWithMembers extends Trip {
  members?: TripMember[];
  member_count?: number;
}

// 费用分类
export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'ticket' | 'shopping' | 'other';

// 费用
export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  payer_id: string; // 垫付款人 ID
  expense_date: string; // YYYY-MM-DD
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
}

// 费用分摊
export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string; // 分摊人 ID
  amount: number; // 分摊金额
}

// ============================================
// 社交功能相关类型
// ============================================

// 评论目标类型
export type CommentTargetType = 'log' | 'image' | 'activity';

// 评论
export interface Comment {
  id: string;
  trip_id: string;
  target_type: CommentTargetType;
  target_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  // 统计字段（非数据库字段）
  like_count?: number;
  is_liked?: boolean;
}

// 点赞目标类型
export type LikeTargetType = 'log' | 'image' | 'comment';

// 点赞
export interface Like {
  id: string;
  target_type: LikeTargetType;
  target_id: string;
  user_id: string;
  trip_id: string;
  created_at: string;
}

// 举报状态
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

// 举报
export interface Report {
  id: string;
  trip_id: string;
  reporter_id: string;
  target_type: 'comment';
  target_id: string;
  reason?: string;
  status: ReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  reporter_profile?: Profile;
  reviewer_profile?: Profile;
}
