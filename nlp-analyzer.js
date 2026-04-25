const nlpAnalyzer = {
  analyze(text) {
    const result = {
      originalText: text,
      time: this.extractTime(text),
      location: this.extractLocation(text),
      item: this.extractItem(text),
      amount: this.extractAmount(text),
      category: this.classifyCategory(text),
      type: this.classifyType(text),
      missingFields: []
    };

    if (result.amount === null) {
      result.missingFields.push('amount');
    }
    if (result.location === '') {
      result.missingFields.push('location');
    }
    if (result.item === '') {
      result.missingFields.push('item');
    }

    return result;
  },

  extractTime(text) {
    const now = new Date();
    let date = new Date(now);

    if (text.includes('刚刚') || text.includes('刚') || text.includes('刚才')) {
      return date.toISOString();
    }

    if (text.includes('今天早上') || text.includes('今早')) {
      date.setHours(8, 0, 0, 0);
      return date.toISOString();
    }

    if (text.includes('今天下午')) {
      date.setHours(14, 0, 0, 0);
      return date.toISOString();
    }

    if (text.includes('今天晚上') || text.includes('今晚')) {
      date.setHours(20, 0, 0, 0);
      return date.toISOString();
    }

    if (text.includes('昨天')) {
      date.setDate(date.getDate() - 1);
      date.setHours(12, 0, 0, 0);
      return date.toISOString();
    }

    if (text.includes('前天')) {
      date.setDate(date.getDate() - 2);
      date.setHours(12, 0, 0, 0);
      return date.toISOString();
    }

    const timeMatch = text.match(/(\d{1,2})[点:](\d{1,2})?/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      date.setHours(hour, minute, 0, 0);
      return date.toISOString();
    }

    return date.toISOString();
  },

  extractLocation(text) {
    const locationKeywords = [
      '便利店', '超市', '商场', '商店', '市场', '菜市场', '农贸市场',
      '餐厅', '饭店', '餐馆', '食堂', '酒店', '宾馆', '旅馆',
      '银行', '邮局', '快递', '加油站', '医院', '诊所', '药店',
      '学校', '公司', '单位', '家', '家里', '办公室', '工作室',
      '公园', '广场', '车站', '机场', '火车站', '地铁站', '公交站',
      '电影院', 'KTV', '酒吧', '咖啡馆', '奶茶店', '理发店', '美容院',
      '健身房', '游泳馆', '图书馆', '博物馆', '体育馆', '体育场',
      '京东', '淘宝', '天猫', '拼多多', '亚马逊', '网购', '网上', '线上',
      '夜宵摊', '小吃摊', '路边摊', '烧烤摊', '早餐店', '快餐店',
      '水果店', '蔬菜店', '杂货店', '小卖部', '五金店', '电器店',
      '书店', '文具店', '玩具店', '花店', '宠物店', '干洗店',
      '网吧', '网咖', '游戏厅', '台球室', '棋牌室',
      '健身房', '瑜伽馆', '舞蹈室', '游泳馆', '羽毛球馆',
      '照相馆', '摄影店', '打印店', '复印店',
      '汽车店', '修车店', '洗车店', '停车场',
      '药店', '药房', '医院', '诊所', '体检中心',
      '银行', 'ATM', '证券公司', '保险公司',
      '邮局', '快递站', '菜鸟驿站', '丰巢',
      '加油站', '加气站', '充电站',
      '小区', '社区', '公寓', '别墅', '住宅区',
      '工业园', '产业园', '科技园', '开发区',
      '美食街', '步行街', '商业街', '批发市场',
      '农家乐', '度假村', '温泉', '滑雪场',
      '寺庙', '教堂', '清真寺',
      '动物园', '植物园', '水族馆',
      '大学', '中学', '小学', '幼儿园', '补习班',
      '理发店', '美发店', '美甲店', '美容院', 'SPA',
      '咖啡店', '茶馆', '甜品店', '面包店', '蛋糕店',
      '火锅店', '烧烤店', '川菜馆', '粤菜馆', '湘菜馆',
      '日本料理', '韩国料理', '西餐厅', '披萨店', '汉堡店',
      '海鲜店', '龙虾店', '烤鱼店', '火锅店',
      '水果店', '零食店', '坚果店', '进口食品店',
      '眼镜店', '手表店', '珠宝店', '首饰店',
      '服装店', '鞋店', '箱包店', '内衣店',
      '化妆品店', '护肤品店', '香水店',
      '家电店', '数码店', '手机店', '电脑店',
      '家具店', '家居店', '建材店', '装修公司',
      '花店', '绿植店', '宠物医院', '宠物店',
      '干洗店', '洗衣店', '缝纫店',
      '开锁店', '维修店', '家政服务',
      '搬家公司', '物流公司', '快递公司',
      '天台', '楼顶', '阳台', '露台', '屋顶',
      '楼下', '楼上', '路边', '街角', '路口',
      '门口', '门前', '门后', '窗边', '墙角',
      '厨房', '客厅', '卧室', '卫生间', '浴室',
      '书房', '餐厅', '阳台', '走廊', '楼梯',
      '地下室', '阁楼', '车库', '储藏室',
      '地铁站口', '公交站旁', '火车站前', '机场内',
      '地铁站里', '公交车上', '出租车里', '火车上',
      '飞机上', '轮船上', '地铁里', '公交里'
    ];

    locationKeywords.sort((a, b) => b.length - a.length);

    for (const keyword of locationKeywords) {
      if (text.includes(keyword)) {
        const prefixMatch = text.match(new RegExp(`(在|从|去|到|于)([\\u4e00-\\u9fa5]{0,10})${keyword}`));
        if (prefixMatch && prefixMatch[2]) {
          let prefix = prefixMatch[2];
          if (this.isValidLocationPrefix(prefix)) {
            const result = prefix + keyword;
            if (this.isValidLocation(result)) {
              return result;
            }
          }
        }
        
        if (this.isValidLocation(keyword)) {
          return keyword;
        }
      }
    }

    const locationPatterns = [
      /在([\u4e00-\\u9fa5]{2,10})(上|里|内|旁|边|处|前|后)/,
      /在([\u4e00-\\u9fa5]{2,10})的(上|里|内|旁|边|处|前|后)/,
      /在([\u4e00-\\u9fa5]{2,8})楼/,
      /在([\u4e00-\\u9fa5]{2,8})层/,
      /在([\u4e00-\\u9fa5]{2,10})买/,
      /在([\u4e00-\\u9fa5]{2,10})吃/,
      /在([\u4e00-\\u9fa5]{2,10})喝/
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (this.isValidLocation(candidate) && !this.isLikelyItem(candidate)) {
          if (match[2]) {
            return candidate + match[2];
          }
          return candidate;
        }
      }
    }

    const genericLocationMatch = text.match(/在([\u4e00-\\u9fa5]{2,10})(买|吃|喝|去|到)/);
    if (genericLocationMatch && genericLocationMatch[1]) {
      const candidate = genericLocationMatch[1].trim();
      if (this.isValidLocation(candidate) && !this.isLikelyItem(candidate)) {
        return candidate;
      }
    }

    return '';
  },

  isValidLocationPrefix(prefix) {
    if (!prefix) return false;
    
    const invalidPrefixes = [
      '买', '卖', '吃', '喝', '玩', '乐', '去', '到', '在', '从', '于',
      '我', '你', '他', '她', '它', '们',
      '是', '有', '没', '不', '就', '才', '刚', '已',
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '这', '那', '哪', '个', '些', '每', '各'
    ];
    
    for (const invalid of invalidPrefixes) {
      if (prefix === invalid) return false;
    }
    
    return true;
  },

  isValidLocation(location) {
    if (!location || location.length < 2) return false;
    
    const invalidWords = [
      '买了', '买的', '买个', '买来', '买些',
      '吃了', '吃的', '吃个', '吃些',
      '喝了', '喝的', '喝个', '喝些',
      '去了', '去的', '去个', '去些',
      '到了', '到的', '到个', '到些',
      '在那', '在这', '在哪',
      '从那', '从这', '从哪',
      '刚才', '刚刚', '刚去', '刚到',
      '我去', '我到', '我在',
      '你去', '你到', '你在',
      '他去', '他到', '他在',
      '们去', '们到', '们在'
    ];
    
    for (const invalid of invalidWords) {
      if (location.includes(invalid)) return false;
    }
    
    return true;
  },

  isLikelyItem(candidate) {
    if (!candidate || candidate.length < 1) return false;
    
    const itemKeywords = [
      '臭豆腐', '麻辣烫', '火锅', '烧烤', '小龙虾', '烤鱼',
      '奶茶', '咖啡', '果汁', '汽水', '可乐', '雪碧',
      '烟', '酒', '啤酒', '白酒', '红酒',
      '饭', '米饭', '面条', '饺子', '包子', '馒头',
      '早餐', '午餐', '晚餐', '夜宵', '外卖',
      '水果', '苹果', '香蕉', '橙子', '西瓜', '草莓',
      '蔬菜', '白菜', '萝卜', '土豆', '西红柿',
      '零食', '薯片', '饼干', '巧克力', '糖果',
      '甜品', '蛋糕', '面包', '冰淇淋', '酸奶',
      '衣服', '裤子', '裙子', '外套', '内衣',
      '鞋子', '袜子', '帽子', '围巾', '手套',
      '包包', '背包', '手提包', '钱包', '行李箱',
      '化妆品', '护肤品', '口红', '面膜', '洗面奶',
      '手机', '电脑', '平板', '耳机', '充电器',
      '电影票', '火车票', '机票', '门票',
      '话费', '流量', '网费', '电费', '水费', '燃气费',
      '房租', '房贷', '车贷', '保险', '医疗', '药品',
      '工资', '奖金', '红包', '报销', '兼职', '理财',
      '炒面', '炒饭', '烧烤', '烤串', '炸鸡', '汉堡',
      '披萨', '寿司', '拉面', '米线', '米粉',
      '奶茶', '奶盖', '咖啡', '拿铁', '卡布奇诺',
      '香烟', '雪茄', '啤酒', '红酒', '白酒', '洋酒',
      '零食', '坚果', '糖果', '巧克力', '饼干', '薯片',
      '水果', '苹果', '香蕉', '橙子', '葡萄', '草莓',
      '蔬菜', '青菜', '白菜', '萝卜', '土豆', '黄瓜'
    ];
    
    for (const keyword of itemKeywords) {
      if (candidate === keyword || candidate.includes(keyword)) {
        const quantifiers = ['个', '只', '瓶', '盒', '包', '袋', '件', '杯', '份', '条', '双', '张', '块', '根', '台', '辆', '套', '碗', '盘', '碟'];
        for (const q of quantifiers) {
          if (candidate === q + keyword) {
            return true;
          }
        }
        if (candidate === keyword) {
          return true;
        }
      }
    }
    
    return false;
  },

  extractItem(text) {
    const actionPatterns = [
      { pattern: /买了([^，。,、]+)/g, group: 1, priority: 1 },
      { pattern: /买的([^，。,、]+)/g, group: 1, priority: 1 },
      { pattern: /买了个([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了份([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了碗([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了瓶([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了盒([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了包([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了袋([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了杯([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了件([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了条([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了双([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了张([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了块([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了根([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了台([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了辆([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买了套([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /买([^了的买]+)/g, group: 1, priority: 3 },
      { pattern: /吃了([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /喝了([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /消费([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /支付([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /付款([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /收入([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /收到([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /赚了([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /获得([^，。,、]+)/g, group: 1, priority: 2 },
      { pattern: /工资([^，。,、]*)/g, group: 0, priority: 1 },
      { pattern: /奖金([^，。,、]*)/g, group: 0, priority: 1 },
      { pattern: /红包([^，。,、]*)/g, group: 0, priority: 1 },
      { pattern: /报销([^，。,、]*)/g, group: 0, priority: 1 }
    ];

    actionPatterns.sort((a, b) => a.priority - b.priority);

    for (const { pattern, group } of actionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[group] && match[group].trim() !== '') {
          let item = match[group].trim();
          
          item = this.cleanItemText(item);
          
          item = item.trim();
          
          if (item.length > 0 && item.length < 20) {
            if (this.isValidItem(item)) {
              return item;
            }
          }
        }
      }
    }

    const itemKeywords = [
      '臭豆腐', '麻辣烫', '火锅', '烧烤', '小龙虾', '烤鱼',
      '奶茶', '咖啡', '果汁', '汽水', '可乐', '雪碧',
      '烟', '酒', '啤酒', '白酒', '红酒',
      '饭', '米饭', '面条', '饺子', '包子', '馒头',
      '早餐', '午餐', '晚餐', '夜宵', '外卖',
      '水果', '苹果', '香蕉', '橙子', '西瓜', '草莓',
      '蔬菜', '白菜', '萝卜', '土豆', '西红柿',
      '零食', '薯片', '饼干', '巧克力', '糖果',
      '甜品', '蛋糕', '面包', '冰淇淋', '酸奶',
      '衣服', '裤子', '裙子', '外套', '内衣',
      '鞋子', '袜子', '帽子', '围巾', '手套',
      '包包', '背包', '手提包', '钱包', '行李箱',
      '化妆品', '护肤品', '口红', '面膜', '洗面奶',
      '手机', '电脑', '平板', '耳机', '充电器',
      '电影票', '火车票', '机票', '门票',
      '话费', '流量', '网费', '电费', '水费', '燃气费',
      '房租', '房贷', '车贷', '保险', '医疗', '药品',
      '工资', '奖金', '红包', '报销', '兼职', '理财'
    ];

    itemKeywords.sort((a, b) => b.length - a.length);

    for (const keyword of itemKeywords) {
      if (text.includes(keyword)) {
        if (this.isValidItemContext(text, keyword)) {
          return keyword;
        }
      }
    }

    return '';
  },

  cleanItemText(item) {
    const amountPattern = /(花费|花了|共计|总共|一共|价格|单价|售价|付款|支付|金额|价钱|钱)([0-9]+[\.0-9]*)[元块角分]/;
    item = item.replace(amountPattern, '');
    
    item = item.replace(/[0-9]+[\.0-9]*[元块角分]/g, '');
    item = item.replace(/￥[0-9]+[\.0-9]*/g, '');
    item = item.replace(/¥[0-9]+[\.0-9]*/g, '');
    
    const quantifiers = [
      '个', '只', '瓶', '盒', '包', '袋', '件', '杯', '份',
      '条', '双', '张', '块', '根', '台', '辆', '套',
      '碗', '盘', '碟', '罐', '桶', '箱', '捆', '束',
      '本', '支', '枝', '颗', '粒', '滴', '片', '层',
      '堆', '群', '队', '批', '组', '串', '团', '堆'
    ];
    
    for (const q of quantifiers) {
      const pattern1 = new RegExp(`^[零一二三四五六七八九十百千万亿0-9]+${q}`);
      item = item.replace(pattern1, '');
      
      const pattern2 = new RegExp(`^${q}`);
      item = item.replace(pattern2, '');
    }
    
    const prefixes = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '几', '数', '每', '各', '这', '那', '哪'];
    for (const p of prefixes) {
      if (item.startsWith(p) && item.length > 1) {
        const rest = item.substring(1);
        if (!quantifiers.includes(rest.charAt(0))) {
          item = rest;
        }
      }
    }
    
    return item;
  },

  isValidItem(item) {
    if (!item || item.length < 1) return false;
    
    const invalidItems = [
      '在', '从', '去', '到', '于', '刚', '刚', '才', '就',
      '我', '你', '他', '她', '它', '们',
      '是', '有', '没', '不',
      '这', '那', '哪', '个', '些', '每', '各',
      '今天', '明天', '昨天', '前天',
      '早上', '上午', '中午', '下午', '晚上', '今晚',
      '便利店', '超市', '商场', '商店', '市场', '餐厅', '饭店',
      '夜宵摊', '小吃摊', '路边摊', '烧烤摊'
    ];
    
    for (const invalid of invalidItems) {
      if (item === invalid) return false;
    }
    
    if (item.match(/^[0-9]+$/)) return false;
    if (item.match(/^[零一二三四五六七八九十百千万亿]+$/)) return false;
    
    return true;
  },

  isValidItemContext(text, keyword) {
    const locationKeywords = [
      '便利店', '超市', '商场', '商店', '市场', '餐厅', '饭店',
      '夜宵摊', '小吃摊', '路边摊', '烧烤摊'
    ];
    
    for (const loc of locationKeywords) {
      if (keyword === loc) {
        const actionPattern = new RegExp(`(买|吃|喝|去|到).{0,10}${keyword}`);
        if (!actionPattern.test(text)) {
          return false;
        }
      }
    }
    
    return true;
  },

  extractAmount(text) {
    const patterns = [
      /(花费|花了|共计|总共|一共|价格|单价|售价|付款|支付|金额|价钱|钱)([0-9]+[\.0-9]*)[元块角分]/,
      /([0-9]+[\.0-9]*)[元块角分]/,
      /￥([0-9]+[\.0-9]*)/,
      /¥([0-9]+[\.0-9]*)/,
      /([0-9]+[\.0-9]*)元/,
      /([0-9]+[\.0-9]*)块/,
      /([0-9]+[\.0-9]*)块钱/,
      /花了([0-9]+[\.0-9]*)/,
      /花费([0-9]+[\.0-9]*)/,
      /共计([0-9]+[\.0-9]*)/,
      /总共([0-9]+[\.0-9]*)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[2] || match[1];
        if (amountStr) {
          const amount = parseFloat(amountStr);
          if (!isNaN(amount) && amount > 0) {
            return amount;
          }
        }
      }
    }

    return null;
  },

  classifyCategory(text) {
    const categories = {
      '餐饮美食': ['饭', '菜', '早餐', '午餐', '晚餐', '夜宵', '外卖', '餐厅', '饭店', '餐馆', '食堂', '吃', '喝', '奶茶', '咖啡', '茶', '饮料', '水', '臭豆腐', '麻辣烫', '火锅', '烧烤', '小龙虾', '烤鱼'],
      '日用百货': ['超市', '商场', '商店', '便利店', '市场', '买', '购物', '日用品', '生活用品', '零食', '小吃', '水果', '蔬菜'],
      '交通出行': ['公交', '地铁', '出租车', '打车', '滴滴', '出行', '交通', '加油', '汽油', '停车费', '过路费', '车票', '机票', '火车票', '飞机票'],
      '休闲娱乐': ['电影', 'KTV', '酒吧', '游戏', '娱乐', '休闲', '旅游', '旅行', '度假', '门票', '游乐园', '公园'],
      '服饰美容': ['衣服', '裤子', '鞋子', '包包', '化妆品', '护肤品', '美容', '美发', '美甲', '理发店', '美容院'],
      '居住家居': ['房租', '房贷', '物业费', '水电费', '电费', '水费', '燃气费', '网费', '家具', '家电', '装修'],
      '医疗健康': ['医院', '诊所', '药店', '药品', '医疗', '看病', '体检', '保险'],
      '教育学习': ['学校', '培训', '课程', '书本', '教材', '学费', '教育', '学习', '图书馆'],
      '通讯缴费': ['话费', '流量', '网费', '通讯', '手机', '电话', '宽带'],
      '工资收入': ['工资', '奖金', '薪水', '薪资', '收入'],
      '红包礼金': ['红包', '礼金', '随礼', '压岁钱', '份子钱'],
      '投资理财': ['理财', '投资', '股票', '基金', '债券', '存款', '利息'],
      '兼职副业': ['兼职', '副业', '外快', '兼职收入'],
      '其他收入': ['收入', '收到', '获得', '赚了', '报销', '退款']
    };

    let incomePatterns = ['工资', '奖金', '红包', '收入', '收到', '赚了', '获得', '报销', '兼职', '理财'];
    let isIncome = false;
    for (const pattern of incomePatterns) {
      if (text.includes(pattern)) {
        isIncome = true;
        break;
      }
    }

    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return category;
        }
      }
    }

    return isIncome ? '其他收入' : '其他支出';
  },

  classifyType(text) {
    const incomeKeywords = [
      '工资', '奖金', '红包', '收入', '收到', '赚了', '获得', '报销',
      '兼职', '理财', '投资', '存款', '利息', '退款', '礼金', '压岁钱'
    ];

    for (const keyword of incomeKeywords) {
      if (text.includes(keyword)) {
        return '收入';
      }
    }

    return '支出';
  }
};

module.exports = nlpAnalyzer;
