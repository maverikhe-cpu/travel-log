/**
 * 创建测试用户脚本
 *
 * 运行方式：
 * npx tsx scripts/setup-test-users.ts
 * 
 * 或者：
 * npm run test:users:create
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// 尝试从 .env.local 文件读取环境变量
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (err) {
    // .env.local 文件不存在或无法读取，忽略
  }
}

// 加载 .env.local 文件
loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 需要从 Dashboard 获取

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n请先设置环境变量：');
  console.log('方法1: 在 .env.local 文件中添加：');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=你的URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=你的ServiceRoleKey');
  console.log('\n方法2: 使用命令行：');
  console.log('  export NEXT_PUBLIC_SUPABASE_URL=你的URL');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY=你的ServiceRoleKey');
  console.log('\n获取 Service Role Key:');
  console.log('  1. 访问 Supabase Dashboard');
  console.log('  2. 进入 Settings > API');
  console.log('  3. 复制 "service_role" key (注意：这是敏感密钥，不要提交到代码库)');
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
  { email: 'alice@example.com', password: 'Test123456', name: 'Alice' },
  { email: 'bob@example.com', password: 'Test123456', name: 'Bob' },
  { email: 'charlie@example.com', password: 'Test123456', name: 'Charlie' },
  { email: 'diana@example.com', password: 'Test123456', name: 'Diana' },
  { email: 'eve@example.com', password: 'Test123456', name: 'Eve' },
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
        if (error.message.includes('already been registered') || error.message.includes('already exists')) {
          console.log(`✓ ${user.email} - 已存在`);
        } else if (error.message.includes('Invalid API key')) {
          console.error(`✗ ${user.email} - API Key 无效`);
          if (user === testUsers[0]) {
            console.error('\n⚠️  错误：SUPABASE_SERVICE_ROLE_KEY 无效');
            console.error('请确保使用的是 Service Role Key，而不是 Anon Key');
            console.error('获取方式：Supabase Dashboard > Settings > API > service_role key');
            process.exit(1);
          }
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
