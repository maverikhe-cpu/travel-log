import { ActivityCategory, PresetLocation } from '@/types/models';

// 川渝预置地点 - 按城市分类
export const PRESET_LOCATIONS: PresetLocation[] = [
  // ============ 成都 ============
  // 景点
  { id: 'cd-kxz', name: '宽窄巷子', city: '成都', category: 'attraction', description: '清代古街道，体验老成都生活' },
  { id: 'cd-jl', name: '锦里', city: '成都', category: 'attraction', description: '三国文化古街，小吃集中地' },
  { id: 'cd-dfm', name: '大熊猫繁育研究基地', city: '成都', category: 'attraction', description: '看大熊猫的必去之地' },
  { id: 'cd-wanj', name: '武侯祠', city: '成都', category: 'attraction', description: '三国圣地，纪念诸葛亮' },
  { id: 'cd-ddj', name: '都江堰', city: '成都', category: 'attraction', description: '古代水利工程奇迹' },
  { id: 'cd-qcs', name: '青城山', city: '成都', category: 'attraction', description: '道教名山，避暑胜地' },
  { id: 'cd-cj', name: '春熙路', city: '成都', category: 'attraction', description: '成都商业中心' },
  { id: 'cd-tf', name: '天府广场', city: '成都', category: 'attraction', description: '成都中心地标' },
  { id: 'cd-wsy', name: '文殊院', city: '成都', category: 'attraction', description: '著名佛教寺院' },
  { id: 'cd-dfm', name: '杜甫草堂', city: '成都', category: 'attraction', description: '杜甫故居，诗歌文化圣地' },
  { id: 'cd-qta', name: '青羊宫', city: '成都', category: 'attraction', description: '著名道教宫观' },
  { id: 'cd-wj', name: '望江楼', city: '成都', category: 'attraction', description: '纪念薛涛的古迹' },
  { id: 'cd-jy', name: '金沙遗址博物馆', city: '成都', category: 'attraction', description: '古蜀文明遗址' },
  { id: 'cd-sf', name: '人民公园', city: '成都', category: 'attraction', description: '体验成都慢生活' },
  { id: 'cd-hxl', name: '熊猫基地', city: '成都', category: 'attraction', description: '都江堰中华大熊猫苑' },
  { id: 'cd-jys', name: '建川博物馆', city: '成都', category: 'attraction', description: '大邑县民间博物馆聚落' },
  { id: 'cd-xlj', name: '西岭雪山', city: '成都', category: 'attraction', description: '窗含西岭千秋雪' },
  { id: 'cd-hy', name: '黄龙溪古镇', city: '成都', category: 'attraction', description: '千年水运古镇' },
  { id: 'cd-pl', name: '平乐古镇', city: '成都', category: 'attraction', description: '茶马古道第一镇' },
  { id: 'cd-an', name: '安仁古镇', city: '成都', category: 'attraction', description: '博物馆小镇' },
  { id: 'cd-lk', name: '洛带古镇', city: '成都', category: 'attraction', description: '客家古镇' },
  { id: 'cd-tt', name: '太古里', city: '成都', category: 'attraction', description: '时尚购物街区' },
  { id: 'cd-ifs', name: '成都IFS', city: '成都', category: 'attraction', description: '国际金融中心，爬墙熊猫' },
  { id: 'cd-rbh', name: '环球中心', city: '成都', category: 'attraction', description: '亚洲最大单体建筑' },
  { id: 'cd-sj', name: '339电视塔', city: '成都', category: 'attraction', description: '西部第一高塔' },

  // 美食
  { id: 'cd-jsl', name: '建设路', city: '成都', category: 'food', description: '成都小吃美食街' },
  { id: 'cd-sw', name: '耍都', city: '成都', category: 'food', description: '娱乐美食广场' },
  { id: 'cd-kx', name: '魁星楼街', city: '成都', category: 'food', description: '网红美食街' },

  // ============ 重庆 ============
  // 景点
  { id: 'cq-hyd', name: '洪崖洞', city: '重庆', category: 'attraction', description: '吊脚楼群，夜景绝佳' },
  { id: 'cq-jfb', name: '解放碑', city: '重庆', category: 'attraction', description: '重庆中心地标' },
  { id: 'cq-cjsd', name: '长江索道', city: '重庆', category: 'attraction', description: '空中观长江' },
  { id: 'cq-qlq', name: '千厮门大桥', city: '重庆', category: 'attraction', description: '观洪崖洞夜景最佳位置' },
  { id: 'cq-cqk', name: '磁器口古镇', city: '重庆', category: 'attraction', description: '千年古镇，陈麻花发源地' },
  { id: 'cq-lfs', name: '重庆来福士', city: '重庆', category: 'attraction', description: '朝天门来福士' },
  { id: 'cq-ns', name: '南山一棵树', city: '重庆', category: 'attraction', description: '重庆夜景最佳观赏点' },
  { id: 'cq-gyq', name: '观音桥', city: '重庆', category: 'attraction', description: '重庆第二大商圈' },
  { id: 'cq-zrm', name: '朝天门', city: '重庆', category: 'attraction', description: '长江和嘉陵江汇合处' },
  { id: 'cq-hb', name: '湖广会馆', city: '重庆', category: 'attraction', description: '明清建筑群' },
  { id: 'cq-zy', name: '罗汉寺', city: '重庆', category: 'attraction', description: '千年古刹' },
  { id: 'cq-cbb', name: '重庆中国三峡博物馆', city: '重庆', category: 'attraction', description: '三峡文化展示' },
  { id: 'cq-zmt', name: '中山四路', city: '重庆', category: 'attraction', description: '抗战文化一条街' },
  { id: 'cq-efd', name: '鹅岭二厂', city: '重庆', category: 'attraction', description: '文创公园' },
  { id: 'cq-lzz', name: '李子坝', city: '重庆', category: 'attraction', description: '轻轨穿楼' },
  { id: 'cq-fm', name: '弹子石老街', city: '重庆', category: 'attraction', description: '百年老街' },
  { id: 'cq-hyt', name: '华岩旅游风景区', city: '重庆', category: 'attraction', description: '佛教名胜区' },
  { id: 'cq-nh', name: '南滨路', city: '重庆', category: 'attraction', description: '欣赏夜景' },
  { id: 'cq-bh', name: '北滨路', city: '重庆', category: 'attraction', description: '江景休闲' },
  { id: 'cq-cy', name: '歌乐山', city: '重庆', category: 'attraction', description: '红岩精神发源地' },
  { id: 'cy-b', name: '白公馆', city: '重庆', category: 'attraction', description: '红色教育基地' },
  { id: 'cy-zg', name: '渣滓洞', city: '重庆', category: 'attraction', description: '红色教育基地' },
  { id: 'cq-wfm', name: '万盛石林', city: '重庆', category: 'attraction', description: '自然石林景观' },
  { id: 'cq-wls', name: '黑山谷', city: '重庆', category: 'attraction', description: '峡谷景观' },
  { id: 'cq-wz', name: '武隆天生三桥', city: '重庆', category: 'attraction', description: '电影取景地' },
  { id: 'cq-xns', name: '仙女山', city: '重庆', category: 'attraction', description: '高山草原' },
  { id: 'cq-fy', name: '芙蓉洞', city: '重庆', category: 'attraction', description: '大型溶洞' },
  { id: 'cq-ss', name: '四面山', city: '重庆', category: 'attraction', description: '瀑布景区' },
  { id: 'cq-zj', name: '大足石刻', city: '重庆', category: 'attraction', description: '世界文化遗产' },
  { id: 'cq-wzh', name: '巫山小三峡', city: '重庆', category: 'attraction', description: '长江三峡支流' },

  // ============ 乐山 ============
  { id: 'ls-lfs', name: '乐山大佛', city: '乐山', category: 'attraction', description: '世界最大石刻坐佛' },
  { id: 'ls-ems', name: '峨眉山', city: '乐山', category: 'attraction', description: '中国四大佛教名山之一' },
  { id: 'ls-lg', name: '凌云寺', city: '乐山', category: 'attraction', description: '大佛所在地寺庙' },
  { id: 'ls-mh', name: '麻浩崖墓', city: '乐山', category: 'attraction', description: '汉代崖墓群' },
  { id: 'ls-gb', name: '郭沫若故居', city: '乐山', category: 'attraction', description: '文化名人故居' },
  { id: 'ls-ox', name: '东方佛都', city: '乐山', category: 'attraction', description: '佛像雕刻艺术' },
  { id: 'ls-hk', name: '黑竹沟', city: '乐山', category: 'attraction', description: '中国百慕大' },
  { id: 'ls-dk', name: '东风堰', city: '乐山', category: 'attraction', description: '世界灌溉工程遗产' },

  // ============ 眉山 ============
  { id: 'ms-dmy', name: '东坡印象水街', city: '眉山', category: 'attraction', description: '网红打卡地' },
  { id: 'ms-sf', name: '三苏祠', city: '眉山', category: 'attraction', description: '苏洵苏轼苏辙故居' },
  { id: 'ms-wm', name: '瓦屋山', city: '眉山', category: 'attraction', description: '国家森林公园' },
  { id: 'ms-qp', name: '七里坪', city: '眉山', category: 'attraction', description: '康养度假区' },

  // ============ 阿坝 ============
  { id: 'ab-jzg', name: '九寨沟', city: '阿坝', category: 'attraction', description: '童话世界' },
  { id: 'ab-hl', name: '黄龙', city: '阿坝', category: 'attraction', description: '人间瑶池' },
  { id: 'ab-jsw', name: '四姑娘山', city: '阿坝', category: 'attraction', description: '蜀山之后' },
  { id: 'ab-djs', name: '达古冰川', city: '阿坝', category: 'attraction', description: '现代冰川' },
  { id: 'ab-tg', name: '桃坪羌寨', city: '阿坝', category: 'attraction', description: '羌族古寨' },
  { id: 'ab-mw', name: '茂县', city: '阿坝', category: 'attraction', description: '羌族文化' },
  { id: 'ab-rh', name: '若尔盖草原', city: '阿坝', category: 'attraction', description: '高原湿地' },
  { id: 'ab-hy', name: '花湖', city: '阿坝', category: 'attraction', description: '高原湖泊' },

  // ============ 绵阳 ============
  { id: 'my-fcs', name: '佛爷洞', city: '绵阳', category: 'attraction', description: '溶洞景观' },
  { id: 'my-ql', name: '七曲山大庙', city: '绵阳', category: 'attraction', description: '文昌祖庭' },
  { id: 'my-lys', name: '李白故里', city: '绵阳', category: 'attraction', description: '青莲镇' },
  { id: 'my-sy', name: '窦圌山', city: '绵阳', category: 'attraction', description: '道教名山' },
  { id: 'my-zy', name: '越王楼', city: '绵阳', category: 'attraction', description: '天下诗文第一楼' },
  { id: 'my-st', name: '科学城', city: '绵阳', category: 'attraction', description: '中国科技城' },

  // ============ 德阳 ============
  { id: 'dy-sx', name: '三星堆', city: '德阳', category: 'attraction', description: '古蜀文明遗址' },
  { id: 'dy-pj', name: '庞统祠', city: '德阳', category: 'attraction', description: '三国遗迹' },
  { id: 'dy-kj', name: '德阳孔庙', city: '德阳', category: 'attraction', description: '中国西部孔庙' },

  // ============ 自贡 ============
  { id: 'zg-dh', name: '恐龙博物馆', city: '自贡', category: 'attraction', description: '恐龙化石群' },
  { id: 'zg-ys', name: '燊海井', city: '自贡', category: 'attraction', description: '古盐井' },
  { id: 'zg-cl', name: '自贡彩灯博物馆', city: '自贡', category: 'attraction', description: '彩灯文化' },
  { id: 'zg-sc', name: '仙市古镇', city: '自贡', category: 'attraction', description: '千年古镇' },
  { id: 'zg-rh', name: '荣县大佛', city: '自贡', category: 'attraction', description: '石刻大佛' },

  // ============ 宜宾 ============
  { id: 'yb-sl', name: '蜀南竹海', city: '宜宾', category: 'attraction', description: '竹海风光' },
  { id: 'yb-xs', name: '兴文石海', city: '宜宾', category: 'attraction', description: '石林溶洞' },
  { id: 'yb-lj', name: '李庄古镇', city: '宜宾', category: 'attraction', description: '抗战文化名镇' },
  { id: 'yb-xf', name: '五粮液景区', city: '宜宾', category: 'attraction', description: '酒文化' },

  // ============ 泸州 ============
  { id: 'lz-gj', name: '古蔺红军四渡赤水', city: '泸州', category: 'attraction', description: '红色旅游' },
  { id: 'lz-hj', name: '黄荆老林', city: '泸州', category: 'attraction', description: '原始森林' },
  { id: 'lz-fj', name: '佛宝风景区', city: '泸州', category: 'attraction', description: '森林生态' },

  // ============ 雅安 ============
  { id: 'ya-bd', name: '碧峰峡', city: '雅安', category: 'attraction', description: '大熊猫基地' },
  { id: 'ya-ml', name: '蒙顶山', city: '雅安', category: 'attraction', description: '茶文化圣地' },
  { id: 'ya-sx', name: '上里古镇', city: '雅安', category: 'attraction', description: '古镇风情' },

  // ============ 广安 ============
  { id: 'ga-dx', name: '邓小平故里', city: '广安', category: 'attraction', description: '伟人故居' },
  { id: 'ga-hl', name: '华蓥山', city: '广安', category: 'attraction', description: '红岩精神' },

  // ============ 南充 ============
  { id: 'nc-ll', name: '阆中古城', city: '南充', category: 'attraction', description: '四大古城之一' },
  { id: 'nc-lm', name: '凌云山', city: '南充', category: 'attraction', description: '道教圣地' },

  // ============ 遂宁 ============
  { id: 'sn-gl', name: '广德寺', city: '遂宁', category: 'attraction', description: '著名佛寺' },
  { id: 'sn-sl', name: '死海', city: '遂宁', category: 'attraction', description: '中国死海' },

  // ============ 达州 ============
  { id: 'dz-ba', name: '巴山大峡谷', city: '达州', category: 'attraction', description: '峡谷风光' },

  // ============ 广元 ============
  { id: 'gy-js', name: '剑门关', city: '广元', category: 'attraction', description: '蜀道咽喉' },
  { id: 'gy-ql', name: '青木川古镇', city: '广元', category: 'attraction', description: '古镇风貌' },
  { id: 'gy-zt', name: '昭化古城', city: '广元', category: 'attraction', description: '三国重镇' },
  { id: 'gy-tm', name: '唐家河', city: '广元', category: 'attraction', description: '自然保护区' },

  // ============ 美食（通用） ============
  { id: 'food-hg', name: '火锅', category: 'food', description: '川渝标志性美食' },
  { id: 'food-cc', name: '串串香', category: 'food', description: '一手一串的火锅' },
  { id: 'food-ddm', name: '担担面', category: 'food', description: '成都名小吃' },
  { id: 'food-mtd', name: '麻婆豆腐', category: 'food', description: '川菜代表' },
  { id: 'food-szy', name: '水煮鱼', category: 'food', description: '重庆名菜' },
  { id: 'food-cs', name: '抄手', category: 'food', description: '类似馄饨的小吃' },
  { id: 'food-hcc', name: '红油抄手', category: 'food', description: '成都特色抄手' },
  { id: 'food-slt', name: '酸辣粉', category: 'food', description: '重庆街头小吃' },
  { id: 'food-bbj', name: '钵钵鸡', category: 'food', description: '乐山特色' },
  { id: 'food-tt', name: '兔头', category: 'food', description: '四川特色小吃' },
  { id: 'food-ml', name: '毛血旺', category: 'food', description: '重庆特色' },
  { id: 'food-zzm', name: '芝麻汤圆', category: 'food', description: '赖汤圆' },
  { id: 'food-ll', name: '凉糕', category: 'food', description: '宜宾特色' },
  { id: 'food-lb', name: '赖汤圆', category: 'food', description: '成都名小吃' },
  { id: 'food-zs', name: '钟水饺', category: 'food', description: '成都名小吃' },
  { id: 'food-hjj', name: '火锅粉', category: 'food', description: '涮火锅必备' },
  { id: 'food-xm', name: '冒菜', category: 'food', description: '一个人的火锅' },
  { id: 'food-pp', name: '爬爬虾', category: 'food', description: '特色小吃' },
  { id: 'food-kb', name: '烤脑花', category: 'food', description: '重口味小吃' },
  { id: 'food-sbt', name: '三大炮', category: 'food', description: '锦里名小吃' },
  { id: 'food-ht', name: '红糖糍粑', category: 'food', description: '传统甜食' },
  { id: 'food-bbf', name: '冰粉', category: 'food', description: '夏日解暑' },
  { id: 'food-dm', name: '豆花', category: 'food', description: '咸甜皆宜' },
  { id: 'food-rr', name: '燃面', category: 'food', description: '宜宾特色' },
  { id: 'food-ym', name: '鱼丸', category: 'food', description: '火锅常备' },
  { id: 'food-xx', name: '虾滑', category: 'food', description: '火锅常备' },

  // ============ 交通（通用） ============
  { id: 'trans-flight', name: '飞机/机场', category: 'transport', description: '航空出行' },
  { id: 'trans-train', name: '火车/高铁', category: 'transport', description: '铁路出行' },
  { id: 'trans-bus', name: '大巴/客运', category: 'transport', description: '公路出行' },
  { id: 'trans-subway', name: '地铁/轻轨', category: 'transport', description: '市内交通' },
  { id: 'trans-taxi', name: '出租车/网约车', category: 'transport', description: '便捷出行' },
  { id: 'trans-ship', name: '轮船/游船', category: 'transport', description: '水上交通' },

  // ============ 住宿（通用） ============
  { id: 'stay-hotel', name: '酒店', category: 'accommodation', description: '住宿' },
  { id: 'stay-bb', name: '民宿/客栈', category: 'accommodation', description: '特色住宿' },
  { id: 'stay-resort', name: '度假村', category: 'accommodation', description: '休闲度假' },
  { id: 'stay-hostel', name: '青旅', category: 'accommodation', description: '经济住宿' },
];

// 城市列表
export const CITIES = ['成都', '重庆', '乐山', '眉山', '阿坝', '绵阳', '德阳', '自贡', '宜宾', '泸州', '雅安', '广安', '南充', '遂宁', '达州', '广元'] as const;

// 获取指定城市的预置地点
export function getLocationsByCity(city: string): PresetLocation[] {
  return PRESET_LOCATIONS.filter(loc => loc.city === city || (loc.category === 'food' && !loc.city) || (loc.category === 'transport' && !loc.city) || (loc.category === 'accommodation' && !loc.city));
}

// 获取指定类型的预置地点
export function getLocationsByCategory(category: ActivityCategory): PresetLocation[] {
  return PRESET_LOCATIONS.filter(loc => loc.category === category);
}

// 活动分类配置
export const ACTIVITY_CATEGORIES: Record<
  ActivityCategory,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  attraction: {
    label: '景点',
    icon: 'MapPin',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  food: {
    label: '餐饮',
    icon: 'Utensils',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  transport: {
    label: '交通',
    icon: 'Car',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  accommodation: {
    label: '住宿',
    icon: 'Home',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  other: {
    label: '其他',
    icon: 'Circle',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

// 成员角色配置
export const MEMBER_ROLES = {
  owner: { label: '创建者', description: '所有权限' },
  editor: { label: '编辑者', description: '可添加/编辑活动' },
  viewer: { label: '查看者', description: '仅查看' },
} as const;

// 图片上传限制
export const IMAGE_UPLOAD_LIMITS = {
  MAX_COUNT: 10,
  MAX_SIZE_MB: 5,
  MAX_WIDTH: 2000,
  COMPRESS_QUALITY: 0.8,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// 日期格式
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'yyyy-MM-dd HH:mm',
  DISPLAY_DATE: 'M月d日',
  DISPLAY_DATE_SHORT: 'M/d',
  DISPLAY_WEEKDAY: 'EEE',
} as const;
