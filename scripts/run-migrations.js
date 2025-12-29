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

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

// 迁移文件列表
const migrations = [
  '012_add_cloud_companion_role.sql',
  '013_create_comments_table.sql',
  '014_create_likes_table.sql',
  '015_create_reports_table.sql',
];

async function executeSQL(sql) {
  // 分割 SQL 语句（按分号分割，但保留在字符串中的分号）
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (inString && char === stringChar && sql[i - 1] !== '\\') {
      inString = false;
      stringChar = null;
      current += char;
    } else if (!inString && char === ';' && nextChar === '\n') {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // 添加最后一个语句
  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }
  
  // 执行每个语句
  for (const statement of statements) {
    if (!statement || statement.length < 10) continue;
    
    try {
      // 使用 Supabase REST API 执行 SQL
      // 注意：Supabase 的 REST API 不直接支持执行 SQL
      // 我们需要使用 PostgREST 或者通过 Supabase Dashboard 执行
      console.log('执行语句:', statement.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (error) {
      console.error('执行失败:', error.message);
      throw error;
    }
  }
}

async function runMigrations() {
  console.log('🚀 开始执行数据库迁移...\n');
  
  for (const migrationFile of migrations) {
    const filePath = path.join(__dirname, '../supabase/migrations', migrationFile);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${migrationFile}`);
      continue;
    }
    
    console.log(`\n📄 执行迁移: ${migrationFile}`);
    console.log('─'.repeat(60));
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // 由于 Supabase REST API 不支持直接执行 SQL
    // 我们需要通过 Supabase Dashboard 的 SQL Editor 执行
    // 或者使用 Supabase CLI
    
    console.log('⚠️  注意：Supabase REST API 不支持直接执行 SQL');
    console.log('   请通过以下方式执行迁移：');
    console.log('   1. 访问 Supabase Dashboard');
    console.log('   2. 进入 SQL Editor');
    console.log('   3. 复制以下 SQL 并执行：\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('');
  }
  
  console.log('\n✅ 迁移文件已准备完成！');
  console.log('\n💡 提示：');
  console.log('   1. 访问 https://supabase.com/dashboard');
  console.log('   2. 选择你的项目');
  console.log('   3. 进入 SQL Editor');
  console.log('   4. 依次执行上述 4 个迁移文件的 SQL');
}

runMigrations().catch(console.error);

