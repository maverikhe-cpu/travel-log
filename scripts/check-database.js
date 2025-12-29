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

console.log('📡 数据库配置:');
console.log('   URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置');
console.log('   Key:', envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置');
console.log('');

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDatabase() {
  // 检查 trips 表
  console.log('🔍 查询 trips 表...');
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date, created_at')
    .order('created_at', { ascending: false });

  if (tripsError) {
    console.error('   ❌ 错误:', tripsError.message);
  } else {
    console.log(`   ✓ 找到 ${trips.length} 个旅程\n`);
    if (trips.length > 0) {
      trips.forEach((trip, index) => {
        console.log(`   ${index + 1}. "${trip.name}" (${trip.id})`);
        console.log(`      日期: ${trip.start_date} 至 ${trip.end_date}`);
        console.log(`      创建时间: ${trip.created_at}\n`);
      });
    }
  }

  // 检查 activities 表
  console.log('🔍 查询 activities 表...');
  const { count, error: countError } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('   ❌ 错误:', countError.message);
  } else {
    console.log(`   ✓ 共有 ${count || 0} 个活动\n`);
  }

  // 检查 users
  console.log('🔍 查询用户信息...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('   ❌ 错误:', userError.message);
  } else if (user) {
    console.log(`   ✓ 当前用户: ${user.email} (${user.id})\n`);
  } else {
    console.log('   ⚠️  未登录\n');
  }
}

checkDatabase();
