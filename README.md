# 🏠 颐活 - 养老院活动管理系统

基于 React + TypeScript 构建的养老院活动管理 Web 应用，所有数据仅存储在本地浏览器中。

## 技术栈

- **前端框架**：React 19 + TypeScript
- **UI 框架**：Tailwind CSS 4
- **状态管理**：Zustand
- **本地存储**：IndexedDB（idb 库）
- **拖拽排序**：@dnd-kit
- **Excel 处理**：SheetJS (xlsx)
- **图标**：Lucide React
- **路由**：React Router v7

## 功能模块

### A. 周活动计划表
- 按时间段 × 星期展示活动计划
- 双击/点击单元格编辑活动
- 从活动库选择、自定义文本、上传图片、添加备注
- 外出活动自动红色提醒
- 主题风格切换（春节红金、清明青绿、冬至蓝白等）
- A4/A3 一键打印

### B. 活动库
- 标签分类筛选
- 模糊搜索
- 活动卡片展示（名称、图片、描述、安全提示）
- 一键购买素材链接（淘宝搜索）
- 新增自定义活动

### C. 老人管理
- Excel 导入（自动识别姓名/房间号列）
- 老人卡片网格展示
- 拖拽排序
- 批量标记参加/未参加活动
- 周/日/月活动记录查看
- 超过1年数据清理提醒
- 导出 Excel 备份

## 运行说明

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 目录结构

```
yihuo-activity-manager/
├── src/
│   ├── components/           # 组件
│   │   ├── layout/           # 布局组件
│   │   ├── common/           # 通用组件
│   │   ├── weeklyPlan/       # 周计划组件
│   │   ├── activityLibrary/  # 活动库组件
│   │   └── elderly/          # 老人管理组件
│   ├── pages/                # 页面
│   ├── store/                # Zustand 状态管理
│   ├── db/                   # IndexedDB 数据库层
│   ├── types/                # TypeScript 类型定义
│   └── utils/                # 工具函数
├── .github/workflows/        # GitHub Actions
└── ...
```

## 部署

推送 main 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。
