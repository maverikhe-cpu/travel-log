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

// 成员信息
const MEMBERS = [
  { id: '2e2b345c-95ec-4e88-9950-ffc73202bc69', name: 'Maverik' },
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Alice' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Bob' },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Charlie' },
];

// 小红书风格的旅行记录内容（每天多条，每个成员都有）
const TRAVEL_LOGS = {
  '2025-03-15': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>✈️ 终于到成都啦！天府广场真的好大，人超级多～</p>
<p>第一次来成都，感觉这里的节奏好慢好舒服 😌</p>
<p>在人民公园看到了好多人在喝茶打麻将，这就是成都的慢生活吧！</p>
<p>晚上去魁星楼街吃了好多小吃，担担面、串串、冰粉... 太满足了！</p>
<p><strong>Tips:</strong> 建议下午去人民公园，可以体验一下成都的茶文化 ☕</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>🌸 成都的第一天！</p>
<p>天府广场的建筑好有特色，拍了好多照片 📸</p>
<p>人民公园的荷花池好美，还看到了很多可爱的小动物 🐰</p>
<p>魁星楼街的小吃真的绝了！推荐那家冰粉店，料超足！</p>
<p>明天要去大熊猫基地，好期待看到滚滚们 🐼</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>🚶‍♂️ 成都初印象</p>
<p>天府广场作为成都的中心，确实很有气势</p>
<p>人民公园里有很多老成都人在喝茶聊天，氛围特别好</p>
<p>魁星楼街的美食真的太多了，选择困难症犯了 😅</p>
<p>今天走了2万多步，累但值得！</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🎉 旅行开始啦！</p>
<p>成都的天气比想象中好，不冷不热刚刚好</p>
<p>天府广场附近有很多商场，可以顺便逛逛</p>
<p>人民公园的茶座很有特色，推荐体验一下</p>
<p>魁星楼街的夜宵文化太棒了，晚上特别热闹 🌃</p>`
    }
  ],
  '2025-03-16': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>🐼 大熊猫基地！</p>
<p>早上8点就去了，人还不多，看到了好多可爱的熊猫</p>
<p>有只熊猫在树上睡觉，姿势太萌了 😍</p>
<p>中午吃了担担面，成都的面条真的不一样，又麻又香</p>
<p>下午去了宽窄巷子，古色古香的街道，拍照超好看</p>
<p>晚上在建设路吃了各种小吃，推荐那家烤脑花，虽然重口但真的好吃！</p>
<p><strong>Tips:</strong> 大熊猫基地建议早上去，下午熊猫都在睡觉 💤</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>💕 被熊猫萌化了的一天</p>
<p>大熊猫基地真的值得！看到了刚出生的小熊猫，超级可爱</p>
<p>宽窄巷子有很多文创店，买了好多纪念品 🛍️</p>
<p>建设路的小吃街太长了，感觉可以吃一整天</p>
<p>今天拍了好多照片，朋友圈都刷屏了 📱</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>📷 摄影爱好者的天堂</p>
<p>大熊猫基地的光线很好，拍了很多满意的照片</p>
<p>宽窄巷子的建筑很有特色，适合慢慢逛</p>
<p>建设路的小吃种类太多了，建议几个人一起分享</p>
<p>今天走了3万步，破纪录了！</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🎬 完美的一天</p>
<p>大熊猫基地的体验感很好，环境也很干净</p>
<p>宽窄巷子有很多手工艺品，可以买一些送朋友</p>
<p>建设路的小吃价格很实惠，性价比超高</p>
<p>今天吃得太多了，明天要控制一下 😂</p>`
    }
  ],
  '2025-03-17': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>🏔️ 都江堰 + 青城山</p>
<p>都江堰的水利工程真的太震撼了，古人的智慧太厉害了</p>
<p>站在都江堰上，看着江水奔腾，心情特别舒畅</p>
<p>中午吃了火锅，成都的火锅真的不一样，又麻又辣但很香</p>
<p>下午爬青城山，虽然累但风景太美了，空气也特别清新</p>
<p>山顶的风景绝了，感觉所有的疲惫都值得了 ⛰️</p>
<p><strong>Tips:</strong> 青城山建议穿运动鞋，山路有点陡 👟</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>💪 挑战青城山</p>
<p>都江堰的历史感很强，感受到了古代工程的伟大</p>
<p>青城山的台阶真的很多，但每爬一段都有不同的风景</p>
<p>山顶的云海太美了，像仙境一样 ☁️</p>
<p>今天运动量超标了，但很开心！</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>📚 文化之旅</p>
<p>都江堰的讲解很详细，学到了很多历史知识</p>
<p>青城山的道教文化很浓厚，有很多古建筑</p>
<p>今天的行程比较累，但收获满满</p>
<p>晚上回酒店好好休息一下 💤</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🌿 自然风光</p>
<p>都江堰的江水很清澈，环境保持得很好</p>
<p>青城山的植被很丰富，空气特别新鲜</p>
<p>今天拍了很多风景照，每一张都很美</p>
<p>推荐大家一定要来这两个地方！</p>`
    }
  ],
  '2025-03-18': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>🏛️ 武侯祠 + 锦里</p>
<p>武侯祠是三国文化的圣地，对历史感兴趣的朋友一定要来</p>
<p>锦里古街太有感觉了，各种小吃和手工艺品</p>
<p>在锦里吃了好多东西：三大炮、糖油果子、龙须酥... 都很好吃</p>
<p>下午去了春熙路，成都的商业中心，购物天堂 🛒</p>
<p>晚上在太古里逛了逛，现代和传统的完美结合</p>
<p><strong>Tips:</strong> 锦里建议晚上去，灯笼亮起来特别美 🏮</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>🛍️ 购物日</p>
<p>武侯祠的建筑很精美，拍照很好看</p>
<p>锦里的小吃真的太多了，每样都想尝一下</p>
<p>春熙路的人流量好大，但购物体验很好</p>
<p>太古里的设计很现代，有很多网红店</p>
<p>今天买了好多东西，行李箱要装不下了 😅</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>📖 文化探索</p>
<p>武侯祠的三国历史很丰富，值得慢慢看</p>
<p>锦里的传统手工艺很有意思，买了一些纪念品</p>
<p>春熙路的商业氛围很浓厚，适合购物</p>
<p>今天了解了很多成都的历史文化</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🎨 艺术之旅</p>
<p>武侯祠的园林设计很精致</p>
<p>锦里的传统建筑很有特色</p>
<p>太古里的现代艺术装置很吸引人</p>
<p>今天感受到了成都传统与现代的完美融合</p>`
    }
  ],
  '2025-03-19': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>🚄 前往重庆！</p>
<p>早上坐高铁从成都到重庆，2小时就到了，很方便</p>
<p>到了重庆第一站就是解放碑，重庆的中心地标</p>
<p>在解放碑附近吃了酸辣粉，重庆的酸辣粉真的绝了，又酸又辣又香</p>
<p>晚上去了洪崖洞，夜景真的太美了！像千与千寻的场景一样 🏮</p>
<p>在洪崖洞吃了火锅，重庆的火锅比成都的更辣，但很过瘾</p>
<p><strong>Tips:</strong> 洪崖洞建议晚上去，灯光效果特别震撼 🌃</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>🌉 重庆初体验</p>
<p>重庆的山城特色很明显，到处都是坡</p>
<p>解放碑的商圈很大，可以逛很久</p>
<p>酸辣粉的调料很丰富，可以根据自己的口味调整</p>
<p>洪崖洞的夜景真的像童话世界，太美了</p>
<p>今天拍了好多夜景照片，朋友圈又要刷屏了 📸</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>📸 摄影日</p>
<p>解放碑的建筑很有特色，适合拍照</p>
<p>洪崖洞的夜景是必拍的，太震撼了</p>
<p>重庆的夜景真的很美，和成都完全不同的风格</p>
<p>今天拍了很多满意的照片</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🍜 美食探索</p>
<p>重庆的酸辣粉真的名不虚传，太好吃了</p>
<p>洪崖洞附近有很多小吃，可以慢慢品尝</p>
<p>重庆的火锅和成都的确实不一样，更重口味</p>
<p>今天吃得太多了，明天要控制一下 😂</p>`
    }
  ],
  '2025-03-20': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>🏮 磁器口古镇</p>
<p>磁器口古镇很有历史感，古色古香的建筑</p>
<p>在古镇里买了陈麻花，重庆的特产，很香很脆</p>
<p>中午吃了串串香，重庆的串串和成都的也不太一样</p>
<p>下午坐了长江索道，从空中看长江的感觉太棒了 🚠</p>
<p>晚上在来福士吃了晚餐，朝天门的夜景也很美</p>
<p><strong>Tips:</strong> 长江索道建议提前买票，人比较多 🎫</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>🎁 购物日</p>
<p>磁器口古镇有很多特产，可以买一些带回去</p>
<p>陈麻花是必买的，有很多口味可以选择</p>
<p>长江索道的体验很特别，推荐大家一定要坐</p>
<p>来福士的购物环境很好，可以慢慢逛</p>
<p>今天买了好多特产，行李箱真的装不下了 🧳</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>📷 古镇摄影</p>
<p>磁器口古镇的建筑很有特色，适合拍照</p>
<p>长江索道上的视野很好，可以拍很多照片</p>
<p>来福士的建筑很现代，和古镇形成对比</p>
<p>今天拍了很多不同风格的照片</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🎯 体验日</p>
<p>磁器口古镇的传统手工艺很有意思</p>
<p>长江索道的体验很刺激，有点恐高但很值得</p>
<p>来福士的餐饮选择很多，可以尝试不同的美食</p>
<p>今天体验了很多重庆的特色</p>`
    }
  ],
  '2025-03-21': [
    {
      userId: '2e2b345c-95ec-4e88-9950-ffc73202bc69',
      content: `<p>🌄 最后一天</p>
<p>早上去了南山一棵树，重庆的观景台，视野超级好</p>
<p>从山上俯瞰整个重庆，城市的美景尽收眼底</p>
<p>中午吃了最后一顿重庆火锅，真的舍不得离开</p>
<p>下午准备返程了，这次旅行真的太完美了 ✈️</p>
<p>成都和重庆都太棒了，下次还要再来！</p>
<p><strong>总结:</strong> 这次旅行体验了川渝两地的美食、文化和风景，收获满满！推荐大家一定要来 🎉</p>`
    },
    {
      userId: 'a0000000-0000-0000-0000-000000000001',
      content: `<p>💝 完美收官</p>
<p>南山一棵树的风景太美了，拍了很多照片</p>
<p>最后一顿火锅吃得很满足，重庆的火锅真的太好吃了</p>
<p>这次旅行认识了很多新朋友，也体验了很多新事物</p>
<p>虽然要回去了，但这段回忆会一直珍藏 💕</p>`
    },
    {
      userId: 'b0000000-0000-0000-0000-000000000002',
      content: `<p>📸 最后的拍摄</p>
<p>南山一棵树是拍摄重庆全景的最佳位置</p>
<p>今天拍了很多满意的照片，可以做成相册了</p>
<p>这次旅行拍了很多照片，记录了很多美好的瞬间</p>
<p>期待下次再来！</p>`
    },
    {
      userId: 'c0000000-0000-0000-0000-000000000003',
      content: `<p>🎊 旅行结束</p>
<p>南山一棵树的视野真的很棒，值得一去</p>
<p>最后一顿火锅吃得很开心，和朋友们一起分享</p>
<p>这次旅行太完美了，感谢大家的陪伴</p>
<p>期待下次再一起旅行！</p>`
    }
  ]
};

async function seedLogs() {
  console.log('🌱 开始为"测试旅程"填充旅行记录数据...\n');
  
  // 先获取旅程信息
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date')
    .eq('id', TEST_TRIP_ID)
    .single();
  
  if (tripError || !trip) {
    console.error('❌ 未找到测试旅程:', tripError?.message || '旅程不存在');
    return;
  }
  
  console.log(`📅 旅程: ${trip.name}`);
  console.log(`📆 日期: ${trip.start_date} 至 ${trip.end_date}\n`);
  
  // 先删除现有记录（如果有）- 使用更可靠的方式
  console.log('🗑️  清理现有记录...');
  const { data: existingLogs } = await supabase
    .from('travel_logs')
    .select('id')
    .eq('trip_id', TEST_TRIP_ID);
  
  if (existingLogs && existingLogs.length > 0) {
    const { error: deleteError } = await supabase
      .from('travel_logs')
      .delete()
      .eq('trip_id', TEST_TRIP_ID);
    
    if (deleteError) {
      console.warn('⚠️  删除现有记录时出错:', deleteError.message);
    } else {
      console.log(`✅ 已删除 ${existingLogs.length} 条现有记录\n`);
    }
  } else {
    console.log('✅ 没有现有记录需要清理\n');
  }
  
  // 等待一下确保删除完成
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 准备插入的数据
  const allLogs = [];
  
  Object.keys(TRAVEL_LOGS).sort().forEach(date => {
    const dayLogs = TRAVEL_LOGS[date];
    dayLogs.forEach(log => {
      allLogs.push({
        trip_id: TEST_TRIP_ID,
        day_date: date,
        content: log.content,
        created_by: log.userId,
        // 注意：如果表有 is_private 字段，取消下面的注释
        // is_private: false,
      });
    });
  });
  
  console.log(`📝 由于表结构限制（UNIQUE约束），将合并为每天一条记录...\n`);
  
  // 由于 travel_logs 表有 UNIQUE(trip_id, day_date) 约束，每天只能有一条记录
  // 我们将所有成员的内容合并到每天一条记录中
  const mergedLogs = [];
  Object.keys(TRAVEL_LOGS).sort().forEach(date => {
    const dayLogs = TRAVEL_LOGS[date];
    // 合并所有用户的内容，使用更美观的格式
    const mergedContent = dayLogs.map((log, idx) => {
      const member = MEMBERS.find(m => m.id === log.userId);
      const memberName = member?.name || '成员';
      return `<div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: ${idx < dayLogs.length - 1 ? '1px solid #e5e7eb' : 'none'};">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #111827;">👤 ${memberName}</h3>
        ${log.content}
      </div>`;
    }).join('');
    
    // 使用第一个用户作为创建者
    mergedLogs.push({
      trip_id: TEST_TRIP_ID,
      day_date: date,
      content: mergedContent,
      created_by: dayLogs[0].userId,
    });
  });
  
  const { data: mergedData, error: mergedError } = await supabase
    .from('travel_logs')
    .insert(mergedLogs)
    .select();
  
  if (mergedError) {
    console.error('❌ 插入记录失败:', mergedError.message);
    console.error('错误详情:', mergedError);
    return;
  }
  
  console.log('✅ 成功插入合并后的记录！\n');
  console.log('📊 记录统计:');
  mergedLogs.forEach(log => {
    const memberCount = TRAVEL_LOGS[log.day_date].length;
    console.log(`  ${log.day_date}: 1条记录（包含${memberCount}个成员的内容）`);
  });
  
  console.log(`\n✨ 完成！共插入 ${mergedLogs.length} 条记录到"${trip.name}"`);
  console.log(`   每条记录包含所有成员（${MEMBERS.length}人）的旅行日记`);
}

seedLogs().catch(console.error);

