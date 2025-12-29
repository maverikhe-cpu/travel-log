/**
 * 创建测试用户脚本
 * 使用 Supabase Auth API 创建测试用户
 *
 * 使用方法:
 * node scripts/create-test-users.js
 */

// 测试用户列表
const TEST_USERS = [
  { email: 'creator@test.com', password: 'Test123456', username: '漫游长', email_confirm: true },
  { email: 'editor@test.com', password: 'Test123456', username: '漫行客', email_confirm: true },
  { email: 'viewer@test.com', password: 'Test123456', username: '查看者', email_confirm: true },
  { email: 'companion1@test.com', password: 'Test123456', username: '云伴游1', email_confirm: true },
  { email: 'companion2@test.com', password: 'Test123456', username: '云伴游2', email_confirm: true },
];

async function createTestUser(supabaseUrl, supabaseKey, user) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: user.email_confirm,
      user_metadata: {
        username: user.username,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.message?.includes('already been registered')) {
      console.log(`  ✓ ${user.email} - 已存在`);
      return { exists: true };
    }
    throw new Error(JSON.stringify(error));
  }

  const data = await response.json();
  console.log(`  ✓ ${user.email} - 创建成功 (ID: ${data.id})`);
  return { success: true, id: data.id };
}

async function main() {
  // 从环境变量读取 Supabase 配置
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 错误: 缺少 Supabase 配置');
    console.log('请确保设置了以下环境变量:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY (推荐) 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('🚀 开始创建测试用户...\n');

  const results = [];
  for (const user of TEST_USERS) {
    try {
      const result = await createTestUser(supabaseUrl, supabaseKey, user);
      results.push({ email: user.email, ...result });
    } catch (error) {
      console.error(`  ✗ ${user.email} - 失败: ${error.message}`);
      results.push({ email: user.email, error: error.message });
    }
    // 添加延迟避免速率限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 创建结果:');
  console.log('='.repeat(50));
  results.forEach(r => {
    if (r.exists) {
      console.log(`  ${r.email} - 已存在`);
    } else if (r.success) {
      console.log(`  ${r.email} - 创建成功`);
    } else {
      console.log(`  ${r.email} - 失败: ${r.error}`);
    }
  });

  console.log('\n📝 测试账号列表:');
  console.log('='.repeat(50));
  TEST_USERS.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email}`);
    console.log(`     密码: ${u.password}`);
    console.log(`     昵称: ${u.username}`);
    console.log('');
  });

  console.log('✨ 完成！现在可以使用这些账号登录测试了。');
}

main().catch(console.error);
