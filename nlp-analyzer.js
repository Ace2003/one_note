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
      '京东', '淘宝', '天猫', '拼多多', '亚马逊', '网购', '网上', '线上'
    ];

    for (const keyword of locationKeywords) {
      if (text.includes(keyword)) {
        const prefixMatch = text.match(new RegExp(`(在|从|去|到|于)([\\u4e00-\\u9fa5]{0,5})${keyword}`));
        if (prefixMatch) {
          return prefixMatch[2] + keyword;
        }
        return keyword;
      }
    }

    return '';
  },

  extractItem(text) {
    const actionPatterns = [
      { pattern: /买了([^，。,、]+)/g, group: 1 },
      { pattern: /买的([^，。,、]+)/g, group: 1 },
      { pattern: /买([^了的买]+)/g, group: 1 },
      { pattern: /吃了([^，。,、]+)/g, group: 1 },
      { pattern: /喝了([^，。,、]+)/g, group: 1 },
      { pattern: /买了([^，。,、]+)/g, group: 1 },
      { pattern: /消费([^，。,、]+)/g, group: 1 },
      { pattern: /支付([^，。,、]+)/g, group: 1 },
      { pattern: /付款([^，。,、]+)/g, group: 1 },
      { pattern: /收入([^，。,、]+)/g, group: 1 },
      { pattern: /收到([^，。,、]+)/g, group: 1 },
      { pattern: /赚了([^，。,、]+)/g, group: 1 },
      { pattern: /获得([^，。,、]+)/g, group: 1 },
      { pattern: /工资([^，。,、]*)/g, group: 0 },
      { pattern: /奖金([^，。,、]*)/g, group: 0 },
      { pattern: /红包([^，。,、]*)/g, group: 0 },
      { pattern: /报销([^，。,、]*)/g, group: 0 }
    ];

    for (const { pattern, group } of actionPatterns) {
      const match = pattern.exec(text);
      if (match && match[group] && match[group].trim() !== '') {
        let item = match[group].trim();
        
        item = item.replace(/^(一|二|三|四|五|六|七|八|九|十|几|数)[个只瓶盒包袋件杯份条双张块根台辆套]/, '');
        item = item.replace(/^[0-9]+[个只瓶盒包袋件杯份条双张块根台辆套]/, '');
        
        const amountPattern = /(花费|花了|共计|总共|一共|价格|单价|售价|付款|支付|金额|价钱|钱)([0-9]+[\.0-9]*)[元块角分]/;
        item = item.replace(amountPattern, '');
        
        item = item.replace(/[0-9]+[\.0-9]*[元块角分]/g, '');
        item = item.replace(/￥[0-9]+[\.0-9]*/g, '');
        item = item.replace(/¥[0-9]+[\.0-9]*/g, '');
        
        item = item.trim();
        
        if (item.length > 0 && item.length < 20) {
          return item;
        }
      }
    }

    const keywords = [
      '烟', '酒', '水', '饮料', '奶茶', '咖啡', '茶',
      '饭', '菜', '早餐', '午餐', '晚餐', '夜宵', '外卖',
      '水果', '蔬菜', '零食', '小吃', '甜品', '蛋糕',
      '衣服', '裤子', '鞋子', '包包', '化妆品', '护肤品',
      '电影', '电影票', '电影票', 'KTV', '酒吧', '游戏',
      '公交', '地铁', '出租车', '打车', '滴滴', '加油',
      '话费', '流量', '网费', '电费', '水费', '燃气费',
      '房租', '房贷', '车贷', '保险', '医疗', '药品',
      '工资', '奖金', '红包', '报销', '兼职', '理财'
    ];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }

    return '';
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
      '餐饮美食': ['饭', '菜', '早餐', '午餐', '晚餐', '夜宵', '外卖', '餐厅', '饭店', '餐馆', '食堂', '吃', '喝', '奶茶', '咖啡', '茶', '饮料', '水'],
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
