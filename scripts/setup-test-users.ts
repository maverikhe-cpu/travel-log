/**
 * 创建测试用户脚本
 *
 * 运行方式：
 * npx tsx scripts/setup-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 需要从 Dashboard 获取

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n请先设置环境变量：');
  console.log('export NEXT_PUBLIC_SUPABASE_URL=你的URL');
  console.log('export SUPABASE_SERVICE_ROLE_KEY=你的ServiceRoleKey');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  { email: 'test1@example.com', password: 'Test123456', name: '测试用户1' },
  { email: 'test2@example.com', password: 'Test123456', name: '测试用户2' },
  { email: 'creator@example.com', password: 'Test123456', name: '创建者' },
];

async function createTestUsers() {
  console.log('开始创建测试用户...\n');

  for (const user of testUsers) {
    try {
      // 创建用户
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // 自动确认邮箱
        user_metadata: {
          full_name: user.name,
        },
      });

      if (error) {
        if (error.message.includes('already been registered')) {
          console.log(`✓ ${user.email} - 已存在`);
        } else {
          console.error(`✗ ${user.email} - ${error.message}`);
        }
      } else {
        console.log(`✓ ${user.email} - 创建成功 (ID: ${data.user?.id?.slice(0, 8)}...)`);
      }
    } catch (err: any) {
      console.error(`✗ ${user.email} - ${err.message}`);
    }
  }

  console.log('\n测试用户创建完成！');
  console.log('\n测试账号：');
  testUsers.forEach(user => {
    console.log(`  ${user.email} / ${user.password}`);
  });
}

createTestUsers().catch(console.error);
