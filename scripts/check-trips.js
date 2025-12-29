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

// 优先使用 service_role key（如果有），否则使用 anon key
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function checkTrips() {
  console.log('正在查询旅程数据...\n');
  
  // 尝试查询所有旅程（使用 service_role key 可以绕过 RLS）
  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date, created_at, created_by')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 查询错误:', error.message);
    console.error('\n提示：');
    console.error('1. 如果看到 RLS 策略错误，说明需要使用 service_role key');
    console.error('2. 在 .env.local 中添加：SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.error('3. 或者通过 Supabase Dashboard 的 SQL Editor 直接查询');
    return;
  }

  console.log('📅 数据库中的旅程列表:\n');
  if (!trips || trips.length === 0) {
    console.log('   (没有旅程)');
  } else {
    console.log(`   总计: ${trips.length} 个旅程\n`);
    trips.forEach((trip, index) => {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`${index + 1}. "${trip.name}"`);
      console.log(`   ID: ${trip.id}`);
      console.log(`   日期: ${trip.start_date} 至 ${trip.end_date} (${days}天)`);
      console.log(`   创建时间: ${new Date(trip.created_at).toLocaleString('zh-CN')}`);
      console.log(`   创建者: ${trip.created_by}`);
      console.log('');
    });
  }
  
  // 如果使用 anon key，提示可能需要 service_role key
  if (!envVars.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n💡 提示：如果查询结果为空，可能是因为 RLS 策略限制。');
    console.log('   可以在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY 来绕过 RLS。');
  }
}

checkTrips();
