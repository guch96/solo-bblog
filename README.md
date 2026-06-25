# PoopTracker - 便便健康记录工具

一个帮助你记录和分析每日如厕情况的 Web 应用，通过 AI 分析给出肠道健康建议。

## 功能特性

- **计时记录**：如厕时点击开始计时，停止后自动进入记录表单
- **手动记录**：点击日历日期手动填写记录
- **多维度记录**：形状（布里斯托分类法）、颜色、气味、身体感受、备注
- **每日多次**：支持一天记录多次
- **数据可视化**：日历热力图、趋势统计图表
- **AI 健康分析**：选择时间范围，AI 分析记录数据并给出健康建议
- **多 LLM 支持**：自定义 Provider 抽象层，支持切换不同 LLM 厂商

## 技术栈

- **前端**：Next.js + TypeScript + Tailwind CSS + shadcn/ui
- **后端**：Python FastAPI + SQLite + SQLAlchemy + uv（包管理）
- **AI**：OpenAI API（自定义 Provider 抽象层，支持多 LLM 厂商切换）

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.10
- uv（Python 包管理器）
- npm 或 pnpm

### 安装与运行

```bash
# 克隆仓库
git clone <repo-url>
cd solo-bblog

# 后端（使用 uv 管理依赖）
cd src/backend
uv sync
uv run uvicorn main:app --reload

# 前端（新终端）
cd src/frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
OPENAI_API_KEY=your_key_here
LLM_PROVIDER=openai           # 默认 LLM 厂商（openai / claude）
```

## 项目结构

```
solo-bblog/
├─ README.md              # 本文件
├─ JOURNAL.md             # 开发日志
├─ AGENTS.md              # 项目概述 + 行为约束
├─ CLAUDE.md              # Claude Code 专属配置
├─ .claude/               # CC skills/hooks/commands
├─ src/
│  ├─ frontend/           # Next.js 前端
│  │  ├─ src/
│  │  │  ├─ app/          # App Router 页面（首页/记录/日历/统计/AI分析）
│  │  │  ├─ components/   # React 组件
│  │  │  │  ├─ ui/        # shadcn/ui 基础组件
│  │  │  │  ├─ nav/       # 导航组件
│  │  │  │  ├─ timer/     # 计时器
│  │  │  │  ├─ records/   # 记录表单/卡片/列表
│  │  │  │  ├─ calendar/  # 日历热力图
│  │  │  │  ├─ charts/    # 统计图表
│  │  │  │  └─ analysis/  # AI 分析卡片
│  │  │  ├─ hooks/        # 自定义 Hooks
│  │  │  └─ lib/          # API 客户端、类型定义、工具函数
│  │  ├─ public/          # 静态资源
│  │  └─ package.json
│  └─ backend/            # FastAPI 后端
│     ├─ main.py          # 应用入口
│     ├─ database.py      # 数据库连接
│     ├─ models.py        # SQLAlchemy 数据模型
│     ├─ schemas.py       # Pydantic 请求/响应模型
│     ├─ routers/         # API 路由（records、analyses）
│     ├─ services/        # 业务逻辑 + LLM Provider 抽象层
│     ├─ tests/           # 后端测试
│     ├─ utils/           # 工具函数
│     ├─ data/            # SQLite 数据文件
│     ├─ pyproject.toml   # uv 依赖配置
│     └─ uv.lock          # 锁定依赖版本
└─ docs/
   ├─ frontend-design/    # 前端设计系统文档
   └─ superpowers/
      ├─ plans/           # 实施计划
      └─ specs/           # 设计规格文档
```

## 解决的问题

现代人普遍关注肠道健康，但缺乏便捷的记录和分析工具。PoopTracker 让你：

1. **轻松记录**：计时器 + 表单，30 秒完成一次记录
2. **发现规律**：通过日历和图表发现如厕规律
3. **AI 洞察**：AI 分析一段时间的数据，给出专业健康建议
4. **及时预警**：异常情况（如颜色异常、形状持续异常）及时提醒
