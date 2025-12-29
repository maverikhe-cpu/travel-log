/**
 * 填充测试旅程活动数据
 *
 * 使用方法：
 * 1. 确保 .env.local 文件配置了 SUPABASE_URL 和 SUPABASE_ANON_KEY
 * 2. 运行：node scripts/seed-activities.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ 找不到 .env.local 文件');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置，请检查 .env.local 文件');
  console.error('   需要: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 活动数据 - 7天川渝游
const activitiesByDay = [
  // 第1天：成都抵达
  [
    { title: '抵达成都', description: '入住酒店，休整', location: '成都', category: 'transport', startTime: '14:00', endTime: '15:00' },
    { title: '春熙路步行', description: '成都商业中心，感受城市氛围', location: '春熙路', category: 'attraction', startTime: '15:30', endTime: '17:30' },
    { title: '火锅晚餐', description: '品尝正宗四川火锅', location: '建设路', category: 'food', startTime: '18:30', endTime: '20:00' },
  ],
  // 第2天：成都经典
  [
    { title: '大熊猫繁育基地', description: '看可爱的大熊猫，建议早上去', location: '大熊猫繁育基地', category: 'attraction', startTime: '08:30', endTime: '12:00' },
    { title: '宽窄巷子午餐', description: '清代古街道，品尝成都小吃', location: '宽窄巷子', category: 'food', startTime: '12:30', endTime: '14:30' },
    { title: '武侯祠·锦里', description: '三国文化圣地，晚上夜景更美', location: '锦里', category: 'attraction', startTime: '15:00', endTime: '18:00' },
    { title: '串串香', description: '一手一串的火锅体验', location: '锦里', category: 'food', startTime: '18:30', endTime: '20:00' },
  ],
  // 第3天：成都周边
  [
    { title: '都江堰', description: '古代水利工程奇迹', location: '都江堰', category: 'attraction', startTime: '09:00', endTime: '12:00' },
    { title: '都江堰午餐', description: '品尝当地特色菜', location: '都江堰', category: 'food', startTime: '12:00', endTime: '13:30' },
    { title: '青城山', description: '道教名山，清幽避暑', location: '青城山', category: 'attraction', startTime: '14:00', endTime: '17:30' },
    { title: '返回成都', description: '乘车返回市区', location: '成都', category: 'transport', startTime: '17:30', endTime: '19:00' },
    { title: '麻婆豆腐晚餐', description: '经典川菜', location: '春熙路', category: 'food', startTime: '19:30', endTime: '21:00' },
  ],
  // 第4天：成都到重庆
  [
    { title: '成都东站出发', description: '乘坐高铁前往重庆（约1.5小时）', location: '成都东站', category: 'transport', startTime: '09:00', endTime: '10:30' },
    { title: '抵达重庆', description: '入住酒店，放下行李', location: '重庆北站', category: 'transport', startTime: '10:30', endTime: '12:00' },
    { title: '解放碑', description: '重庆中心地标，周边商圈繁华', location: '解放碑', category: 'attraction', startTime: '14:00', endTime: '16:00' },
    { title: '洪崖洞', description: '吊脚楼群，晚上夜景绝美', location: '洪崖洞', category: 'attraction', startTime: '16:30', endTime: '19:00' },
    { title: '重庆火锅', description: '正宗重庆老火锅', location: '解放碑', category: 'food', startTime: '19:30', endTime: '21:00' },
  ],
  // 第5天：重庆市区
  [
    { title: '长江索道', description: '空中俯瞰长江和山城', location: '长江索道', category: 'attraction', startTime: '09:30', endTime: '11:00' },
    { title: '磁器口古镇', description: '千年古镇，品尝陈麻花', location: '磁器口古镇', category: 'attraction', startTime: '11:30', endTime: '14:00' },
    { title: '酸辣粉', description: '重庆街头特色小吃', location: '磁器口古镇', category: 'food', startTime: '14:00', endTime: '14:30' },
    { title: '观音桥', description: '重庆第二大商圈，购物天堂', location: '观音桥', category: 'attraction', startTime: '15:30', endTime: '18:00' },
    { title: '水煮鱼', description: '重庆经典菜品', location: '观音桥', category: 'food', startTime: '18:30', endTime: '20:00' },
  ],
  // 第6天：重庆到乐山
  [
    { title: '重庆前往乐山', description: '乘坐高铁（约2小时）', location: '重庆北站', category: 'transport', startTime: '08:30', endTime: '10:30' },
    { title: '乐山大佛', description: '世界最大石刻坐佛，必游景点', location: '乐山大佛', category: 'attraction', startTime: '11:00', endTime: '15:00' },
    { title: '钵钵鸡', description: '乐山特色美食', location: '乐山市区', category: 'food', startTime: '15:30', endTime: '16:30' },
    { title: '东坡印象水街', description: '网红打卡地，夜景很美', location: '东坡印象水街', category: 'attraction', startTime: '17:00', endTime: '19:00' },
    { title: '兔头', description: '四川特色小吃，值得一试', location: '乐山市区', category: 'food', startTime: '19:30', endTime: '20:30' },
  ],
  // 第7天：返程
  [
    { title: '文殊院', description: '著名佛教寺院，感受宁静', location: '文殊院', category: 'attraction', startTime: '09:00', endTime: '11:00' },
    { title: '担担面', description: '成都名小吃', location: '文殊院周边', category: 'food', startTime: '11:30', endTime: '12:30' },
    { title: '天府广场', description: '成都中心地标', location: '天府广场', category: 'attraction', startTime: '13:00', endTime: '14:00' },
    { title: '前往机场', description: '返程回家', location: '成都双流机场', category: 'transport', startTime: '15:00', endTime: '17:00' },
  ],
];

async function seedActivities() {
  try {
    console.log('🚀 开始为"测试旅程"填充活动数据...\n');

    // 查找名为"测试旅程"的旅程
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('id, created_by, start_date, name, end_date')
      .eq('name', '测试旅程')
      .limit(1);

    if (tripError) throw tripError;

    if (!trips || trips.length === 0) {
      console.error('❌ 没有找到名为"测试旅程"的旅程');
      console.error('   请先在网站上创建一个名为"测试旅程"的旅程\n');
      return;
    }

    const trip = trips[0];
    console.log(`📅 找到旅程: ${trip.name}`);
    console.log(`   ID: ${trip.id}`);
    console.log(`   开始日期: ${trip.start_date}`);
    console.log(`   结束日期: ${trip.end_date}\n`);

    // 检查是否已有活动
    const { data: existingActivities, error: checkError } = await supabase
      .from('activities')
      .select('id')
      .eq('trip_id', trip.id);

    if (checkError) throw checkError;

    if (existingActivities && existingActivities.length > 0) {
      console.log(`⚠️  该旅程已有 ${existingActivities.length} 个活动`);
      console.log('如需重新填充，请先删除现有活动\n');
      return;
    }

    // 插入活动
    let totalActivities = 0;
    const startDate = new Date(trip.start_date);

    for (let day = 0; day < activitiesByDay.length; day++) {
      const activities = activitiesByDay[day];
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + day);
      const dateStr = dayDate.toISOString().split('T')[0];

      console.log(`📝 第 ${day + 1} 天 (${dateStr}):`);

      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];

        const { data, error } = await supabase
          .from('activities')
          .insert({
            trip_id: trip.id,
            day_date: dateStr,
            title: activity.title,
            description: activity.description,
            location: activity.location,
            category: activity.category,
            start_time: activity.startTime,
            end_time: activity.endTime,
            order_index: i + 1,
            created_by: trip.created_by,
          })
          .select();

        if (error) {
          console.error(`   ❌ 插入失败: ${activity.title} - ${error.message}`);
        } else {
          console.log(`   ✅ ${activity.startTime} - ${activity.title}`);
          totalActivities++;
        }
      }
      console.log('');
    }

    console.log(`\n✨ 成功填充 ${totalActivities} 个活动！`);
    console.log(`\n💡 提示：`);
    console.log(`   - 每天安排 ${Math.min(...activitiesByDay.map(d => d.length))}-${Math.max(...activitiesByDay.map(d => d.length))} 个活动`);
    console.log(`   - 涵盖景点、美食、交通等多种类型`);
    console.log(`   - 行程轻松，不会太满`);
    console.log(`   - 景点间距离合理，交通便利`);

  } catch (error) {
    console.error('❌ 填充失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
seedActivities();
