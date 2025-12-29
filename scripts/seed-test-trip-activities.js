const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

// 测试旅程ID
const TEST_TRIP_ID = 'df497020-51a6-4a4a-b02d-013a70d3e7fa';

// 预置地点数据（从 constants.ts 中提取）
const PRESET_LOCATIONS = {
  // 成都景点
  'cd-kxz': { name: '宽窄巷子', city: '成都', category: 'attraction', longitude: 104.061, latitude: 30.674, description: '清代古街道，体验老成都生活' },
  'cd-jl': { name: '锦里', city: '成都', category: 'attraction', longitude: 104.045, latitude: 30.647, description: '三国文化古街，小吃集中地' },
  'cd-dfm': { name: '大熊猫繁育研究基地', city: '成都', category: 'attraction', longitude: 104.147, latitude: 30.735, description: '看大熊猫的必去之地' },
  'cd-wanj': { name: '武侯祠', city: '成都', category: 'attraction', longitude: 104.044, latitude: 30.646, description: '三国圣地，纪念诸葛亮' },
  'cd-ddj': { name: '都江堰', city: '成都', category: 'attraction', longitude: 103.607, latitude: 31.004, description: '古代水利工程奇迹' },
  'cd-qcs': { name: '青城山', city: '成都', category: 'attraction', longitude: 103.567, latitude: 30.901, description: '道教名山，避暑胜地' },
  'cd-cj': { name: '春熙路', city: '成都', category: 'attraction', longitude: 104.082, latitude: 30.652, description: '成都商业中心' },
  'cd-tf': { name: '天府广场', city: '成都', category: 'attraction', longitude: 104.066, latitude: 30.657, description: '成都中心地标' },
  'cd-sf': { name: '人民公园', city: '成都', category: 'attraction', longitude: 104.064, latitude: 30.671, description: '体验成都慢生活' },
  'cd-tt': { name: '太古里', city: '成都', category: 'attraction', longitude: 104.084, latitude: 30.650, description: '时尚购物街区' },
  
  // 成都美食
  'cd-jsl': { name: '建设路', city: '成都', category: 'food', longitude: 104.089, latitude: 30.658, description: '成都小吃美食街' },
  'cd-kx': { name: '魁星楼街', city: '成都', category: 'food', longitude: 104.062, latitude: 30.675, description: '网红美食街' },
  
  // 重庆景点
  'cq-hyd': { name: '洪崖洞', city: '重庆', category: 'attraction', longitude: 106.574, latitude: 29.563, description: '吊脚楼群，夜景绝佳' },
  'cq-jfb': { name: '解放碑', city: '重庆', category: 'attraction', longitude: 106.580, latitude: 29.555, description: '重庆中心地标' },
  'cq-cjsd': { name: '长江索道', city: '重庆', category: 'attraction', longitude: 106.585, latitude: 29.558, description: '空中观长江' },
  'cq-cqk': { name: '磁器口古镇', city: '重庆', category: 'attraction', longitude: 106.454, latitude: 29.582, description: '千年古镇，陈麻花发源地' },
  'cq-ns': { name: '南山一棵树', city: '重庆', category: 'attraction', longitude: 106.613, latitude: 29.545, description: '重庆夜景最佳观赏点' },
  'cq-lfs': { name: '重庆来福士', city: '重庆', category: 'attraction', longitude: 106.583, latitude: 29.562, description: '朝天门来福士' },
  
  // 通用美食
  'food-hg': { name: '火锅', category: 'food', description: '川渝标志性美食' },
  'food-cc': { name: '串串香', category: 'food', description: '一手一串的火锅' },
  'food-ddm': { name: '担担面', category: 'food', description: '成都名小吃' },
  'food-slt': { name: '酸辣粉', category: 'food', description: '重庆街头小吃' },
};

// 7天行程安排（2025-03-15 至 2025-03-21）
const ITINERARY = [
  // Day 1: 2025-03-15 - 成都到达，市区游览
  {
    date: '2025-03-15',
    activities: [
      { presetId: 'cd-tf', title: '天府广场', time: '10:00', endTime: '11:30', order: 1 },
      { presetId: 'cd-sf', title: '人民公园', time: '14:00', endTime: '16:00', order: 2 },
      { presetId: 'cd-kx', title: '魁星楼街', time: '18:00', endTime: '20:00', order: 3, description: '晚餐：品尝成都特色小吃' },
    ]
  },
  // Day 2: 2025-03-16 - 大熊猫基地，宽窄巷子
  {
    date: '2025-03-16',
    activities: [
      { presetId: 'cd-dfm', title: '大熊猫繁育研究基地', time: '08:00', endTime: '12:00', order: 1 },
      { presetId: 'food-ddm', title: '担担面', time: '12:30', endTime: '13:30', order: 2, description: '午餐' },
      { presetId: 'cd-kxz', title: '宽窄巷子', time: '14:30', endTime: '17:00', order: 3 },
      { presetId: 'cd-jsl', title: '建设路', time: '18:30', endTime: '20:30', order: 4, description: '晚餐：成都小吃美食街' },
    ]
  },
  // Day 3: 2025-03-17 - 都江堰，青城山
  {
    date: '2025-03-17',
    activities: [
      { presetId: 'cd-ddj', title: '都江堰', time: '09:00', endTime: '12:00', order: 1 },
      { presetId: 'food-hg', title: '火锅', time: '12:30', endTime: '14:00', order: 2, description: '午餐' },
      { presetId: 'cd-qcs', title: '青城山', time: '14:30', endTime: '18:00', order: 3 },
    ]
  },
  // Day 4: 2025-03-18 - 锦里，武侯祠，春熙路
  {
    date: '2025-03-18',
    activities: [
      { presetId: 'cd-wanj', title: '武侯祠', time: '09:00', endTime: '11:00', order: 1 },
      { presetId: 'cd-jl', title: '锦里', time: '11:30', endTime: '14:00', order: 2, description: '午餐：在锦里品尝各种小吃' },
      { presetId: 'cd-cj', title: '春熙路', time: '15:00', endTime: '17:30', order: 3 },
      { presetId: 'cd-tt', title: '太古里', time: '18:00', endTime: '20:00', order: 4, description: '晚餐：时尚购物街区' },
    ]
  },
  // Day 5: 2025-03-19 - 前往重庆，解放碑，洪崖洞
  {
    date: '2025-03-19',
    activities: [
      { title: '前往重庆', category: 'transport', time: '08:00', endTime: '12:00', order: 1, description: '高铁/动车前往重庆' },
      { presetId: 'cq-jfb', title: '解放碑', time: '14:00', endTime: '15:30', order: 2 },
      { presetId: 'food-slt', title: '酸辣粉', time: '16:00', endTime: '17:00', order: 3, description: '品尝重庆特色小吃' },
      { presetId: 'cq-hyd', title: '洪崖洞', time: '18:00', endTime: '21:00', order: 4, description: '欣赏夜景，晚餐' },
    ]
  },
  // Day 6: 2025-03-20 - 磁器口，长江索道
  {
    date: '2025-03-20',
    activities: [
      { presetId: 'cq-cqk', title: '磁器口古镇', time: '09:00', endTime: '12:30', order: 1, description: '游览千年古镇，品尝陈麻花' },
      { presetId: 'food-cc', title: '串串香', time: '13:00', endTime: '14:30', order: 2, description: '午餐' },
      { presetId: 'cq-cjsd', title: '长江索道', time: '15:30', endTime: '17:00', order: 3 },
      { presetId: 'cq-lfs', title: '重庆来福士', time: '18:00', endTime: '20:00', order: 4, description: '晚餐：朝天门来福士' },
    ]
  },
  // Day 7: 2025-03-21 - 南山一棵树，返程
  {
    date: '2025-03-21',
    activities: [
      { presetId: 'cq-ns', title: '南山一棵树', time: '09:00', endTime: '11:30', order: 1, description: '白天观景' },
      { presetId: 'food-hg', title: '火锅', time: '12:00', endTime: '14:00', order: 2, description: '最后一顿重庆火锅' },
      { title: '返程', category: 'transport', time: '16:00', endTime: '20:00', order: 3, description: '返程' },
    ]
  },
];

async function seedActivities() {
  console.log('🌱 开始为"测试旅程"填充活动数据...\n');
  
  // 先获取旅程信息
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, name, created_by')
    .eq('id', TEST_TRIP_ID)
    .single();
  
  if (tripError || !trip) {
    console.error('❌ 未找到测试旅程:', tripError?.message || '旅程不存在');
    return;
  }
  
  console.log(`📅 旅程: ${trip.name}`);
  console.log(`👤 创建者: ${trip.created_by}\n`);
  
  // 先删除现有活动（如果有）
  const { error: deleteError } = await supabase
    .from('activities')
    .delete()
    .eq('trip_id', TEST_TRIP_ID);
  
  if (deleteError) {
    console.warn('⚠️  删除现有活动时出错:', deleteError.message);
  } else {
    console.log('✅ 已清理现有活动\n');
  }
  
  // 插入新活动
  const allActivities = [];
  
  for (const day of ITINERARY) {
    for (const activity of day.activities) {
      const preset = activity.presetId ? PRESET_LOCATIONS[activity.presetId] : null;
      
      const activityData = {
        trip_id: TEST_TRIP_ID,
        day_date: day.date,
        title: activity.title || preset?.name || '活动',
        description: activity.description || preset?.description || null,
        location: preset?.city ? `${preset.city} - ${preset.name || activity.title}` : activity.title,
        category: activity.category || preset?.category || 'other',
        start_time: activity.time || null,
        end_time: activity.endTime || null,
        order_index: activity.order || 0,
        created_by: trip.created_by,
        // 如果有预置地点，添加位置信息
        longitude: preset?.longitude || null,
        latitude: preset?.latitude || null,
        poi_id: activity.presetId || null,
        city: preset?.city || null,
        address: preset?.city ? `${preset.city} - ${preset.name || activity.title}` : null,
      };
      
      allActivities.push(activityData);
    }
  }
  
  console.log(`📝 准备插入 ${allActivities.length} 个活动...\n`);
  
  // 批量插入
  const { data, error } = await supabase
    .from('activities')
    .insert(allActivities)
    .select();
  
  if (error) {
    console.error('❌ 插入活动失败:', error.message);
    console.error('错误详情:', error);
    return;
  }
  
  console.log('✅ 成功插入活动数据！\n');
  console.log('📊 活动统计:');
  
  // 按日期统计
  const byDate = {};
  allActivities.forEach(act => {
    if (!byDate[act.day_date]) {
      byDate[act.day_date] = [];
    }
    byDate[act.day_date].push(act);
  });
  
  Object.keys(byDate).sort().forEach(date => {
    const activities = byDate[date];
    console.log(`\n  ${date} (${activities.length}个活动):`);
    activities.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).forEach(act => {
      const timeStr = act.start_time ? `[${act.start_time}${act.end_time ? ` - ${act.end_time}` : ''}]` : '';
      const categoryStr = act.category === 'attraction' ? '🏛️' : act.category === 'food' ? '🍜' : act.category === 'transport' ? '🚗' : '📍';
      console.log(`    ${categoryStr} ${act.title} ${timeStr}`);
    });
  });
  
  console.log(`\n✨ 完成！共插入 ${allActivities.length} 个活动到"${trip.name}"`);
}

seedActivities().catch(console.error);

