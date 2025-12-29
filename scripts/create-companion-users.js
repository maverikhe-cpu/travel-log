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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置');
  console.error('   请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 云伴游用户列表
const COMPANION_USERS = [
  {
    email: 'companion1@wanderlog.com',
    password: 'Companion123!',
    username: '云伴游小云',
    avatar: null
  },
  {
    email: 'companion2@wanderlog.com',
    password: 'Companion123!',
    username: '云伴游小游',
    avatar: null
  },
  {
    email: 'companion3@wanderlog.com',
    password: 'Companion123!',
    username: '云伴游小记',
    avatar: null
  },
];

/**
 * 使用 Supabase Auth Admin API 创建用户
 */
async function createAuthUser(user) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        username: user.username,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
      console.log(`  ⚠️  ${user.email} - 用户已存在`);
      // 尝试获取现有用户
      const getResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(user.email)}`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      });
      if (getResponse.ok) {
        const users = await getResponse.json();
        if (users.users && users.users.length > 0) {
          return { exists: true, id: users.users[0].id };
        }
      }
      return { exists: true };
    }
    throw new Error(JSON.stringify(error));
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

/**
 * 更新或创建用户 profile
 */
async function upsertProfile(userId, username, avatar) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username: username,
      avatar_url: avatar,
      email: null, // 从 auth.users 自动同步
    }, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 将用户添加到测试旅程作为云伴游
 */
async function addCompanionToTrip(userId, tripId) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 检查是否已经是成员
  const { data: existing } = await supabase
    .from('trip_members')
    .select('id, role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 如果已存在，更新为 companion 角色
    const { error } = await supabase
      .from('trip_members')
      .update({
        role: 'companion',
        is_blocked: false,
      })
      .eq('id', existing.id);

    if (error) throw error;
    return { updated: true };
  }

  // 添加为新成员
  const { error } = await supabase
    .from('trip_members')
    .insert({
      trip_id: tripId,
      user_id: userId,
      role: 'companion',
      is_blocked: false,
    });

  if (error) throw error;
  return { created: true };
}

async function main() {
  console.log('🌤️  开始创建云伴游用户...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  // 测试旅程ID
  const TEST_TRIP_ID = 'df497020-51a6-4a4a-b02d-013a70d3e7fa';

  const results = [];

  for (const user of COMPANION_USERS) {
    console.log(`👤 创建用户: ${user.username} (${user.email})`);

    try {
      // 1. 创建 Auth 用户
      const authResult = await createAuthUser(user);

      if (!authResult.id) {
        console.log(`  ❌ 无法获取用户 ID，跳过\n`);
        continue;
      }

      const userId = authResult.id;
      console.log(`  ✓ Auth 用户创建成功 (ID: ${userId.substring(0, 8)}...)`);

      // 2. 创建/更新 Profile
      await upsertProfile(userId, user.username, user.avatar);
      console.log(`  ✓ Profile 创建/更新成功`);

      // 3. 添加到测试旅程
      const memberResult = await addCompanionToTrip(userId, TEST_TRIP_ID);
      if (memberResult.updated) {
        console.log(`  ✓ 已更新为云伴游角色`);
      } else {
        console.log(`  ✓ 已添加到测试旅程（云伴游角色）`);
      }

      results.push({
        email: user.email,
        username: user.username,
        userId: userId,
        status: 'success',
      });

      console.log(`  ✅ 完成\n`);
    } catch (error) {
      console.error(`  ❌ 创建失败:`, error.message);
      results.push({
        email: user.email,
        username: user.username,
        status: 'error',
        error: error.message,
      });
      console.log('');
    }
  }

  // 总结
  console.log('📊 创建结果总结:\n');
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  results.forEach((result, index) => {
    if (result.status === 'success') {
      console.log(`  ${index + 1}. ✅ ${result.username} (${result.email})`);
      console.log(`     用户ID: ${result.userId.substring(0, 8)}...`);
    } else {
      console.log(`  ${index + 1}. ❌ ${result.username} (${result.email})`);
      console.log(`     错误: ${result.error}`);
    }
  });

  console.log(`\n✨ 完成！成功: ${successCount}，失败: ${errorCount}`);
  console.log(`\n💡 登录信息:`);
  results.filter(r => r.status === 'success').forEach(result => {
    console.log(`   邮箱: ${result.email}`);
    console.log(`   密码: Companion123!`);
    console.log('');
  });
}

main().catch(console.error);

