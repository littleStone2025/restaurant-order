const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, TableOfContents,
  PageBreak
} = require('docx');
const fs = require('fs');

// =========== 颜色配置 ===========
const COLOR = {
  primary: 'E8562A',
  primaryDark: 'C44220',
  accent: 'F5A623',
  darkText: '1A1A1A',
  mutedText: '888888',
  headerBg: 'E8562A',
  headerText: 'FFFFFF',
  rowBg: 'FDF0EB',
  borderColor: 'DDDDDD',
  sectionLine: 'E8562A',
};

// =========== 样式辅助 ===========
const border1 = { style: BorderStyle.SINGLE, size: 1, color: COLOR.borderColor };
const cellBorders = { top: border1, bottom: border1, left: border1, right: border1 };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.sectionLine, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 32, color: COLOR.primary, font: 'Arial' })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: COLOR.primaryDark, font: 'Arial' })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: COLOR.darkText, font: 'Arial' })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 360 },
    children: [new TextRun({ text, size: 22, color: COLOR.darkText, font: 'Arial', ...opts })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40, line: 340 },
    children: [new TextRun({ text, size: 22, color: COLOR.darkText, font: 'Arial' })]
  });
}

function numBullet(text, ref = 'numbers') {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { before: 40, after: 40, line: 340 },
    children: [new TextRun({ text, size: 22, color: COLOR.darkText, font: 'Arial' })]
  });
}

function emptyLine(size = 80) {
  return new Paragraph({ spacing: { before: size, after: size }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// =========== 表头行 ===========
function headerRow(cells) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((c, i) => new TableCell({
      borders: cellBorders,
      shading: { fill: COLOR.headerBg, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      width: { size: c.w, type: WidthType.DXA },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: c.text, bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })]
      })]
    }))
  });
}

// =========== 普通数据行 ===========
function dataRow(cells, shade = false) {
  return new TableRow({
    children: cells.map((c, i) => new TableCell({
      borders: cellBorders,
      shading: { fill: shade ? 'FDF0EB' : 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 140, right: 140 },
      width: { size: c.w, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: c.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: c.text, size: 20, color: COLOR.darkText, font: 'Arial', bold: !!c.bold })]
      })]
    }))
  });
}

// =========== 封面页 ===========
function makeCoverSection() {
  return [
    emptyLine(1200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: '味道鲜 · 网页版餐厅点单系统', bold: true, size: 56, color: COLOR.primary, font: 'Arial' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [new TextRun({ text: '产品需求文档（PRD）', size: 36, color: COLOR.mutedText, font: 'Arial' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.primary, space: 1 } },
      children: []
    }),
    emptyLine(400),
    ...[
      ['文档版本', 'V1.0'],
      ['文档状态', '草稿'],
      ['创建日期', '2026-04-26'],
      ['产品负责人', '待定'],
      ['适用范围', '餐厅前台点单系统 Web 端'],
    ].map(([k, v]) => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: `${k}：`, bold: true, size: 24, color: COLOR.mutedText, font: 'Arial' }),
        new TextRun({ text: v, size: 24, color: COLOR.darkText, font: 'Arial' }),
      ]
    })),
    pageBreak(),
  ];
}

// =========== 文档主体 ===========
function makeBody() {
  const W = 9026; // A4 正文宽度 DXA（1英寸margin）

  const sections = [];

  // --- 目录 ---
  sections.push(
    heading1('目录'),
    new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3' }),
    pageBreak(),
  );

  // === 1. 文档概述 ===
  sections.push(heading1('1. 文档概述'));

  sections.push(heading2('1.1 编写目的'));
  sections.push(body('本文档旨在描述味道鲜餐厅网页版点单系统的产品需求，明确系统功能边界、交互逻辑、非功能性需求及验收标准，供产品、设计、研发、测试团队使用，作为项目开发的权威依据。'));

  sections.push(heading2('1.2 产品背景'));
  sections.push(body('随着餐饮行业数字化转型加速，传统纸质菜单及人工点单方式存在效率低、出错率高、人力成本大等痛点。味道鲜餐厅希望通过搭建一套轻量级网页点单系统，让顾客扫码即可完成自助点单，减少等待时间，提升用餐体验，同时降低前厅人力成本。'));

  sections.push(heading2('1.3 术语说明'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2200, 6826],
    rows: [
      headerRow([{ text: '术语 / 缩写', w: 2200 }, { text: '说明', w: 6826 }]),
      dataRow([{ text: 'PRD', w: 2200 }, { text: 'Product Requirements Document，产品需求文档', w: 6826 }]),
      dataRow([{ text: 'SKU', w: 2200 }, { text: 'Stock Keeping Unit，最小库存管理单元，此处指单道菜品', w: 6826 }], true),
      dataRow([{ text: '购物车', w: 2200 }, { text: '用户在当前会话中已选菜品的临时存储集合', w: 6826 }]),
      dataRow([{ text: '会话', w: 2200 }, { text: '用户从扫码打开页面到关闭页面的一次完整使用过程', w: 6826 }], true),
      dataRow([{ text: 'OTA', w: 2200 }, { text: 'Over The Air，指后台实时更新菜品/价格，无需发版', w: 6826 }]),
    ]
  }));
  sections.push(emptyLine());

  sections.push(heading2('1.4 参考资料'));
  sections.push(bullet('味道鲜餐厅运营手册 v2.3'));
  sections.push(bullet('竞品分析报告：美团、口碑、翻台率优化点单系统调研'));
  sections.push(bullet('微信扫码点单 UX 白皮书 2025'));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 2. 产品概述 ===
  sections.push(heading1('2. 产品概述'));

  sections.push(heading2('2.1 产品定位'));
  sections.push(body('面向堂食顾客的轻量级 Web 自助点单工具，顾客扫桌贴二维码，无需下载 App，即刻打开网页完成点菜、提交订单，后厨同步接收打印订单。'));

  sections.push(heading2('2.2 目标用户'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2000, 3500, 3526],
    rows: [
      headerRow([{ text: '用户类型', w: 2000 }, { text: '特征描述', w: 3500 }, { text: '核心诉求', w: 3526 }]),
      dataRow([{ text: '堂食顾客', w: 2000 }, { text: '18-55岁，具备基本智能手机操作能力', w: 3500 }, { text: '快速浏览菜单、便捷下单、无等待', w: 3526 }]),
      dataRow([{ text: '餐厅服务员', w: 2000 }, { text: '负责引导扫码、处理特殊诉求', w: 3500 }, { text: '减少口头传递，降低出错率', w: 3526 }], true),
      dataRow([{ text: '后厨人员', w: 2000 }, { text: '接收并处理厨打订单', w: 3500 }, { text: '订单清晰准确，减少反复确认', w: 3526 }]),
      dataRow([{ text: '餐厅管理员', w: 2000 }, { text: '负责菜品维护、数据查看', w: 3500 }, { text: '方便更新菜品、查看实时营业数据', w: 3526 }], true),
    ]
  }));
  sections.push(emptyLine());

  sections.push(heading2('2.3 核心价值主张'));
  sections.push(bullet('扫码即用，无需安装，打开速度 ≤ 3 秒'));
  sections.push(bullet('菜品图文并茂，支持分类浏览 + 全文搜索'));
  sections.push(bullet('购物车实时更新，下单后后厨同步接单'));
  sections.push(bullet('支持备注特殊要求（口味/过敏原等）'));
  sections.push(bullet('餐厅后台可 OTA 更新菜品信息、沽清标记'));
  sections.push(emptyLine());

  sections.push(heading2('2.4 系统架构概览'));
  sections.push(body('系统采用前后端分离架构：'));
  sections.push(bullet('前端：纯 HTML5/CSS3/JavaScript SPA，无框架依赖，极致轻量'));
  sections.push(bullet('后端：RESTful API（Node.js / Python FastAPI 均可），提供菜品、订单、用户接口'));
  sections.push(bullet('数据库：关系型（MySQL/PostgreSQL）存储菜品、订单；Redis 缓存实时库存'));
  sections.push(bullet('部署：CDN 加速静态资源，API 服务容器化部署（Docker + Nginx）'));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 3. 功能需求 ===
  sections.push(heading1('3. 功能需求'));

  sections.push(heading2('3.1 功能模块总览'));

  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [1500, 2500, 2500, 2526],
    rows: [
      headerRow([{ text: '模块编号', w: 1500 }, { text: '模块名称', w: 2500 }, { text: '功能概述', w: 2500 }, { text: '优先级', w: 2526 }]),
      dataRow([{ text: 'M01', w: 1500 }, { text: '首页 / 菜单浏览', w: 2500 }, { text: '分类导航、菜品卡片展示', w: 2500 }, { text: 'P0', w: 2526, center: true }]),
      dataRow([{ text: 'M02', w: 1500 }, { text: '菜品搜索', w: 2500 }, { text: '关键词实时过滤', w: 2500 }, { text: 'P0', w: 2526, center: true }], true),
      dataRow([{ text: 'M03', w: 1500 }, { text: '菜品详情', w: 2500 }, { text: '图片/描述/标签/规格展示', w: 2500 }, { text: 'P0', w: 2526, center: true }]),
      dataRow([{ text: 'M04', w: 1500 }, { text: '购物车管理', w: 2500 }, { text: '增减/清空/实时计价', w: 2500 }, { text: 'P0', w: 2526, center: true }], true),
      dataRow([{ text: 'M05', w: 1500 }, { text: '下单结算', w: 2500 }, { text: '备注/服务费/提交订单', w: 2500 }, { text: 'P0', w: 2526, center: true }]),
      dataRow([{ text: 'M06', w: 1500 }, { text: '订单状态追踪', w: 2500 }, { text: '进度展示/预计出餐时间', w: 2500 }, { text: 'P1', w: 2526, center: true }], true),
      dataRow([{ text: 'M07', w: 1500 }, { text: '后台菜品管理', w: 2500 }, { text: '上下架/价格/沽清', w: 2500 }, { text: 'P1', w: 2526, center: true }]),
      dataRow([{ text: 'M08', w: 1500 }, { text: '数据统计报表', w: 2500 }, { text: '销量/翻台率/热门菜', w: 2500 }, { text: 'P2', w: 2526, center: true }], true),
    ]
  }));
  sections.push(emptyLine());

  // M01
  sections.push(heading2('3.2 M01 首页 / 菜单浏览'));
  sections.push(heading3('3.2.1 功能描述'));
  sections.push(body('顾客打开点单页面后，看到完整菜品列表，按分类组织展示，左侧导航栏可快速跳转，滚动时导航自动高亮同步。'));
  sections.push(heading3('3.2.2 功能要点'));
  sections.push(bullet('左侧固定分类导航栏，展示分类名称、图标及菜品数量'));
  sections.push(bullet('中间菜品卡片网格布局，每列自适应宽度（min 200px）'));
  sections.push(bullet('菜品卡片包含：封面图/emoji、菜名、简介（2行截断）、价格、加购按钮'));
  sections.push(bullet('角标支持：🔥热销、🆕新品、👍推荐，后台可配置'));
  sections.push(bullet('Intersection Observer 实现滚动时左侧分类同步高亮'));
  sections.push(bullet('点击分类项平滑滚动至对应菜品区域'));
  sections.push(heading3('3.2.3 验收标准'));
  sections.push(bullet('菜品列表加载时间 ≤ 1.5s（4G 网络）'));
  sections.push(bullet('分类数量 ≥ 5 个时，侧栏可独立滚动'));
  sections.push(bullet('菜品图片懒加载，首屏展示占位符'));
  sections.push(emptyLine());

  // M02
  sections.push(heading2('3.3 M02 菜品搜索'));
  sections.push(heading3('3.3.1 功能描述'));
  sections.push(body('顾客在搜索框输入关键词，系统实时过滤菜品，搜索范围覆盖菜品名称、描述、标签。'));
  sections.push(heading3('3.3.2 功能要点'));
  sections.push(bullet('搜索框位于菜单区顶部，placeholder 为"搜索菜品名称..."'));
  sections.push(bullet('防抖 200ms，减少频繁渲染'));
  sections.push(bullet('无结果时展示空状态插图及提示文案'));
  sections.push(bullet('搜索结果显示匹配数量'));
  sections.push(bullet('清空搜索词恢复全量菜单'));
  sections.push(emptyLine());

  // M03
  sections.push(heading2('3.4 M03 菜品详情'));
  sections.push(heading3('3.4.1 功能描述'));
  sections.push(body('点击菜品卡片（非加购按钮区域）弹出详情浮层，展示菜品完整信息及操作入口。'));
  sections.push(heading3('3.4.2 功能要点'));
  sections.push(bullet('弹窗顶部大图（比例 55%）+ 关闭按钮'));
  sections.push(bullet('展示：菜名、完整描述、标签组、价格'));
  sections.push(bullet('"加入购物车"按钮，点击后关闭弹窗并写入购物车'));
  sections.push(bullet('后续迭代：支持规格选择（大/小份、辣度）'));
  sections.push(bullet('点击弹窗背景层可关闭'));
  sections.push(emptyLine());

  // M04
  sections.push(heading2('3.5 M04 购物车管理'));
  sections.push(heading3('3.5.1 功能描述'));
  sections.push(body('右侧固定购物车面板实时展示当前已选菜品，支持增减数量、清空、备注填写及费用汇总。'));
  sections.push(heading3('3.5.2 功能要点'));
  sections.push(bullet('购物车顶部气泡数字实时展示当前菜品总量'));
  sections.push(bullet('每条菜品记录展示：emoji、菜名、小计、加减按钮'));
  sections.push(bullet('减至 0 时自动从购物车删除'));
  sections.push(bullet('"清空"按钮需二次确认（Toast 操作，不弹窗）'));
  sections.push(bullet('备注文本框：placeholder "如：不要辣、少盐..."'));
  sections.push(bullet('费用汇总：菜品合计、服务费（5%）、实付金额'));
  sections.push(bullet('购物车为空时"确认下单"按钮置灰不可点'));
  sections.push(heading3('3.5.3 数据持久化'));
  sections.push(bullet('购物车数据存储于浏览器 sessionStorage，关闭标签页后清空'));
  sections.push(bullet('页面刷新时恢复购物车状态'));
  sections.push(emptyLine());

  // M05
  sections.push(heading2('3.6 M05 下单结算'));
  sections.push(heading3('3.6.1 功能描述'));
  sections.push(body('顾客确认菜品、备注后点击"确认下单"，系统提交订单至后端，弹出成功反馈并展示订单摘要及进度状态。'));
  sections.push(heading3('3.6.2 下单流程'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [800, 2800, 5426],
    rows: [
      headerRow([{ text: '步骤', w: 800 }, { text: '操作', w: 2800 }, { text: '系统响应', w: 5426 }]),
      dataRow([{ text: '1', w: 800, center: true }, { text: '点击"确认下单"', w: 2800 }, { text: '校验购物车非空，展示加载态', w: 5426 }]),
      dataRow([{ text: '2', w: 800, center: true }, { text: '系统提交订单', w: 2800 }, { text: 'POST /api/orders，携带桌号、菜品列表、备注', w: 5426 }], true),
      dataRow([{ text: '3', w: 800, center: true }, { text: '后端处理', w: 2800 }, { text: '生成订单号、写库、推送后厨打印机', w: 5426 }]),
      dataRow([{ text: '4', w: 800, center: true }, { text: '返回成功响应', w: 2800 }, { text: '弹出下单成功弹窗，展示订单摘要', w: 5426 }], true),
      dataRow([{ text: '5', w: 800, center: true }, { text: '清空购物车', w: 2800 }, { text: '重置购物车状态，可继续点单', w: 5426 }]),
    ]
  }));
  sections.push(emptyLine());
  sections.push(heading3('3.6.3 订单成功弹窗信息'));
  sections.push(bullet('订单编号（WD + 8位时间戳）'));
  sections.push(bullet('桌号、菜品列表、备注、实付金额'));
  sections.push(bullet('进度条动画：已接单 → 烹饪中 → 即将出餐'));
  sections.push(bullet('操作按钮：继续点菜 / 查看订单详情'));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 4. 非功能性需求 ===
  sections.push(heading1('4. 非功能性需求'));

  sections.push(heading2('4.1 性能需求'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [3000, 3000, 3026],
    rows: [
      headerRow([{ text: '指标', w: 3000 }, { text: '目标值', w: 3000 }, { text: '备注', w: 3026 }]),
      dataRow([{ text: '首屏加载时间', w: 3000 }, { text: '≤ 3s（4G网络）', w: 3000 }, { text: '静态资源 CDN 加速', w: 3026 }]),
      dataRow([{ text: '搜索响应时间', w: 3000 }, { text: '≤ 200ms（前端过滤）', w: 3000 }, { text: '本地防抖处理', w: 3026 }], true),
      dataRow([{ text: '下单接口响应', w: 3000 }, { text: '≤ 1s（P90）', w: 3000 }, { text: '接口超时 5s 报错', w: 3026 }]),
      dataRow([{ text: '页面包体大小', w: 3000 }, { text: '≤ 150KB（gzip）', w: 3000 }, { text: '无重型框架依赖', w: 3026 }], true),
      dataRow([{ text: '并发用户', w: 3000 }, { text: '≥ 500 QPS', w: 3000 }, { text: '单餐厅场景', w: 3026 }]),
    ]
  }));
  sections.push(emptyLine());

  sections.push(heading2('4.2 兼容性需求'));
  sections.push(bullet('浏览器：微信内置浏览器（iOS/Android）、Safari iOS ≥ 14、Chrome Android ≥ 90'));
  sections.push(bullet('屏幕分辨率：320px ~ 1920px 自适应响应式布局'));
  sections.push(bullet('网络：支持 4G / Wi-Fi，弱网（2G/3G）下降级展示菊花加载'));
  sections.push(emptyLine());

  sections.push(heading2('4.3 安全性需求'));
  sections.push(bullet('桌号 Token 鉴权：扫码 URL 携带一次性 Token，防止伪造桌号'));
  sections.push(bullet('API 接口限流：单 IP 60次/分钟，防刷单'));
  sections.push(bullet('XSS 防护：所有用户输入（备注字段）进行 HTML 转义'));
  sections.push(bullet('支付安全：金额计算在后端完成，前端仅展示'));
  sections.push(emptyLine());

  sections.push(heading2('4.4 可用性需求'));
  sections.push(bullet('系统可用性 SLA ≥ 99.9%（月）'));
  sections.push(bullet('下单失败需给出明确错误提示（网络异常/菜品沽清/系统繁忙）'));
  sections.push(bullet('无障碍：按钮尺寸 ≥ 44×44pt，关键元素 aria-label 标注'));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 5. 交互设计规范 ===
  sections.push(heading1('5. 交互设计规范'));

  sections.push(heading2('5.1 视觉风格'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2400, 2800, 3826],
    rows: [
      headerRow([{ text: '设计要素', w: 2400 }, { text: '规范值', w: 2800 }, { text: '用途说明', w: 3826 }]),
      dataRow([{ text: '主色', w: 2400 }, { text: '#E8562A', w: 2800 }, { text: 'CTA 按钮、价格、分类高亮', w: 3826 }]),
      dataRow([{ text: '辅助色', w: 2400 }, { text: '#F5A623', w: 2800 }, { text: '角标推荐、进度条装饰', w: 3826 }], true),
      dataRow([{ text: '背景色', w: 2400 }, { text: '#F8F7F5', w: 2800 }, { text: '页面底色', w: 3826 }]),
      dataRow([{ text: '卡片背景', w: 2400 }, { text: '#FFFFFF', w: 2800 }, { text: '菜品卡片、购物车', w: 3826 }], true),
      dataRow([{ text: '主字体', w: 2400 }, { text: 'PingFang SC / 系统无衬线', w: 2800 }, { text: '全站文本', w: 3826 }]),
      dataRow([{ text: '圆角', w: 2400 }, { text: '16px（卡片）/ 8px（小组件）', w: 2800 }, { text: '统一视觉圆润感', w: 3826 }], true),
      dataRow([{ text: '阴影', w: 2400 }, { text: '0 2px 16px rgba(0,0,0,0.08)', w: 2800 }, { text: '卡片层次感', w: 3826 }]),
    ]
  }));
  sections.push(emptyLine());

  sections.push(heading2('5.2 关键交互动效'));
  sections.push(bullet('加购飞入动画：菜品 emoji 飞向购物车角标（600ms 贝塞尔曲线）'));
  sections.push(bullet('购物车商品列表：新增项 slideIn 动画（translateX 从右侧滑入 200ms）'));
  sections.push(bullet('弹窗：scale(0.92)+translateY(20px) → scale(1) 入场（250ms ease）'));
  sections.push(bullet('按钮按压：:active scale(0.9)，100ms 反弹'));
  sections.push(bullet('Toast 通知：底部滑出，2.2s 后自动消失'));
  sections.push(emptyLine());

  sections.push(heading2('5.3 页面布局'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2000, 2500, 4526],
    rows: [
      headerRow([{ text: '区域', w: 2000 }, { text: '宽度（桌面）', w: 2500 }, { text: '说明', w: 4526 }]),
      dataRow([{ text: '顶部导航', w: 2000 }, { text: '100% / 高 64px', w: 2500 }, { text: '固定吸顶，z-index:100', w: 4526 }]),
      dataRow([{ text: '左侧分类栏', w: 2000 }, { text: '220px', w: 2500 }, { text: '固定定位，可独立滚动', w: 4526 }], true),
      dataRow([{ text: '中间菜单区', w: 2000 }, { text: '自适应（1fr）', w: 2500 }, { text: '主内容区，网格卡片布局', w: 4526 }]),
      dataRow([{ text: '右侧购物车', w: 2000 }, { text: '360px', w: 2500 }, { text: '固定定位，弹性布局', w: 4526 }], true),
    ]
  }));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 6. 数据结构 ===
  sections.push(heading1('6. 数据结构设计'));

  sections.push(heading2('6.1 菜品（Dish）'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2000, 1800, 2000, 3226],
    rows: [
      headerRow([{ text: '字段名', w: 2000 }, { text: '类型', w: 1800 }, { text: '是否必填', w: 2000 }, { text: '说明', w: 3226 }]),
      dataRow([{ text: 'id', w: 2000 }, { text: 'INT', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '菜品唯一标识', w: 3226 }]),
      dataRow([{ text: 'category_id', w: 2000 }, { text: 'INT', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '所属分类', w: 3226 }], true),
      dataRow([{ text: 'name', w: 2000 }, { text: 'VARCHAR(50)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '菜品名称', w: 3226 }]),
      dataRow([{ text: 'description', w: 2000 }, { text: 'TEXT', w: 1800 }, { text: '否', w: 2000, center: true }, { text: '菜品描述', w: 3226 }], true),
      dataRow([{ text: 'price', w: 2000 }, { text: 'DECIMAL(8,2)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '售价（元）', w: 3226 }]),
      dataRow([{ text: 'image_url', w: 2000 }, { text: 'VARCHAR(255)', w: 1800 }, { text: '否', w: 2000, center: true }, { text: '封面图 URL', w: 3226 }], true),
      dataRow([{ text: 'tags', w: 2000 }, { text: 'JSON Array', w: 1800 }, { text: '否', w: 2000, center: true }, { text: '标签列表', w: 3226 }]),
      dataRow([{ text: 'badge', w: 2000 }, { text: 'ENUM', w: 1800 }, { text: '否', w: 2000, center: true }, { text: 'hot/new/rec/null', w: 3226 }], true),
      dataRow([{ text: 'is_available', w: 2000 }, { text: 'BOOLEAN', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '是否上架（沽清控制）', w: 3226 }]),
      dataRow([{ text: 'sort_order', w: 2000 }, { text: 'INT', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '展示排序权重', w: 3226 }], true),
    ]
  }));
  sections.push(emptyLine());

  sections.push(heading2('6.2 订单（Order）'));
  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2000, 1800, 2000, 3226],
    rows: [
      headerRow([{ text: '字段名', w: 2000 }, { text: '类型', w: 1800 }, { text: '是否必填', w: 2000 }, { text: '说明', w: 3226 }]),
      dataRow([{ text: 'order_id', w: 2000 }, { text: 'VARCHAR(20)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '订单号（WD+时间戳）', w: 3226 }]),
      dataRow([{ text: 'table_no', w: 2000 }, { text: 'VARCHAR(10)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '桌号', w: 3226 }], true),
      dataRow([{ text: 'items', w: 2000 }, { text: 'JSON Array', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '菜品列表[{id,qty}]', w: 3226 }]),
      dataRow([{ text: 'note', w: 2000 }, { text: 'TEXT', w: 1800 }, { text: '否', w: 2000, center: true }, { text: '备注信息', w: 3226 }], true),
      dataRow([{ text: 'sub_total', w: 2000 }, { text: 'DECIMAL(10,2)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '菜品合计金额', w: 3226 }]),
      dataRow([{ text: 'service_fee', w: 2000 }, { text: 'DECIMAL(10,2)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '服务费（5%）', w: 3226 }], true),
      dataRow([{ text: 'total', w: 2000 }, { text: 'DECIMAL(10,2)', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '实付总金额', w: 3226 }]),
      dataRow([{ text: 'status', w: 2000 }, { text: 'ENUM', w: 1800 }, { text: '是', w: 2000, center: true }, { text: 'pending/cooking/done', w: 3226 }], true),
      dataRow([{ text: 'created_at', w: 2000 }, { text: 'DATETIME', w: 1800 }, { text: '是', w: 2000, center: true }, { text: '下单时间', w: 3226 }]),
    ]
  }));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 7. 接口设计 ===
  sections.push(heading1('7. API 接口规范（概要）'));

  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [1600, 2000, 1600, 3826],
    rows: [
      headerRow([{ text: '接口名称', w: 1600 }, { text: 'Path', w: 2000 }, { text: 'Method', w: 1600 }, { text: '说明', w: 3826 }]),
      dataRow([{ text: '获取菜品列表', w: 1600 }, { text: '/api/dishes', w: 2000 }, { text: 'GET', w: 1600, center: true }, { text: '支持 category_id 过滤、available=1 过滤', w: 3826 }]),
      dataRow([{ text: '获取菜品详情', w: 1600 }, { text: '/api/dishes/:id', w: 2000 }, { text: 'GET', w: 1600, center: true }, { text: '返回完整菜品信息', w: 3826 }], true),
      dataRow([{ text: '获取分类列表', w: 1600 }, { text: '/api/categories', w: 2000 }, { text: 'GET', w: 1600, center: true }, { text: '返回所有分类+菜品数', w: 3826 }]),
      dataRow([{ text: '提交订单', w: 1600 }, { text: '/api/orders', w: 2000 }, { text: 'POST', w: 1600, center: true }, { text: 'Body: {table_no, items, note}', w: 3826 }], true),
      dataRow([{ text: '查询订单状态', w: 1600 }, { text: '/api/orders/:id', w: 2000 }, { text: 'GET', w: 1600, center: true }, { text: '返回订单状态、进度', w: 3826 }]),
      dataRow([{ text: '沽清菜品', w: 1600 }, { text: '/api/admin/dishes/:id', w: 2000 }, { text: 'PATCH', w: 1600, center: true }, { text: 'Body: {is_available: false}（需鉴权）', w: 3826 }], true),
    ]
  }));
  sections.push(emptyLine());
  sections.push(body('接口统一响应格式：'));
  sections.push(new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
    children: [new TextRun({ text: '{ "code": 0, "msg": "success", "data": {...} }', size: 20, font: 'Courier New', color: COLOR.darkText })]
  }));
  sections.push(body('code 非 0 时为错误，msg 描述错误原因，data 为 null。'));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 8. 迭代规划 ===
  sections.push(heading1('8. 版本迭代规划'));

  sections.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [1400, 2000, 5626],
    rows: [
      headerRow([{ text: '版本', w: 1400 }, { text: '计划时间', w: 2000 }, { text: '主要功能', w: 5626 }]),
      dataRow([{ text: 'V1.0 MVP', w: 1400 }, { text: '2026-Q2', w: 2000 }, { text: '菜单浏览、搜索、购物车、下单、订单成功弹窗', w: 5626 }]),
      dataRow([{ text: 'V1.1', w: 1400 }, { text: '2026-Q3', w: 2000 }, { text: '订单实时状态追踪（WebSocket）、沽清提示', w: 5626 }], true),
      dataRow([{ text: 'V1.2', w: 1400 }, { text: '2026-Q3', w: 2000 }, { text: '在线支付（微信/支付宝）、电子发票', w: 5626 }]),
      dataRow([{ text: 'V2.0', w: 1400 }, { text: '2026-Q4', w: 2000 }, { text: '会员积分、历史订单、个性化推荐、评价系统', w: 5626 }], true),
      dataRow([{ text: 'V2.1', w: 1400 }, { text: '2027-Q1', w: 2000 }, { text: '后台管理 SaaS 化、多门店支持、营业数据大屏', w: 5626 }]),
    ]
  }));
  sections.push(emptyLine());
  sections.push(pageBreak());

  // === 9. 验收标准 ===
  sections.push(heading1('9. 整体验收标准'));

  sections.push(heading2('9.1 功能验收'));
  sections.push(bullet('所有 P0 功能 100% 实现，测试用例通过率 ≥ 95%'));
  sections.push(bullet('核心流程（浏览→加购→结算→下单）端对端无阻塞'));
  sections.push(bullet('后厨打印机在 30s 内收到订单（局域网环境）'));
  sections.push(emptyLine());

  sections.push(heading2('9.2 性能验收'));
  sections.push(bullet('Lighthouse 性能分 ≥ 85（移动端）'));
  sections.push(bullet('首屏可见内容渲染（FCP）≤ 2s'));
  sections.push(bullet('LCP ≤ 2.5s，CLS ≤ 0.1'));
  sections.push(emptyLine());

  sections.push(heading2('9.3 用户体验验收'));
  sections.push(bullet('5位典型用户测试，完成完整点单流程平均用时 ≤ 3 分钟'));
  sections.push(bullet('无需培训，首次使用错误率 ≤ 10%'));
  sections.push(bullet('NPS 满意度问卷得分 ≥ 7/10'));
  sections.push(emptyLine());

  return sections;
}

// =========== 组装文档 ===========
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } }
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: COLOR.primary },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: COLOR.primaryDark },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: COLOR.darkText },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.primary, space: 4 } },
            children: [
              new TextRun({ text: '味道鲜 · 网页版餐厅点单系统 PRD', size: 18, color: COLOR.mutedText, font: 'Arial' }),
              new TextRun({ text: '\t', size: 18 }),
              new TextRun({ text: 'V1.0  |  2026-04-26', size: 18, color: COLOR.mutedText, font: 'Arial' }),
            ],
            tabStops: [{ type: 'right', position: 8686 }]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR.borderColor, space: 4 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '第 ', size: 18, color: COLOR.mutedText, font: 'Arial' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR.mutedText, font: 'Arial' }),
              new TextRun({ text: ' 页    |    内部文件，请勿外传', size: 18, color: COLOR.mutedText, font: 'Arial' }),
            ]
          })]
        })
      },
      children: [
        ...makeCoverSection(),
        ...makeBody(),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('restaurant_prd.docx', buf);
  console.log('PRD generated: restaurant_prd.docx');
});
