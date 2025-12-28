// 用户资料
export interface Profile {
  id: string;
  email?: string;
  username?: string;
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
export type MemberRole = 'owner' | 'editor' | 'viewer';

// 行程成员
export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
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
