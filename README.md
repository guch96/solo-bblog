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
├─ AGENTS.md              # 项目概述 + 行为约束（通用）
├─ CLAUDE.md              # Claude Code 专属配置
├─ .claude/               # CC skills/hooks/commands
├─ src/
│  ├─ frontend/           # Next.js 前端
│  │  ├─ src/
│  │  │  ├─ app/          # Next.js App Router
│  │  │  ├─ components/   # React 组件
│  │  │  └─ lib/          # 工具函数
│  │  └─ package.json
│  └─ backend/            # FastAPI 后端
│     ├─ main.py          # 入口
│     ├─ models.py        # 数据模型
│     ├─ routers/         # API 路由
│     ├─ services/        # 业务逻辑
│     ├─ pyproject.toml   # uv 依赖配置
│     └─ uv.lock          # 锁定依赖版本
└─ docs/                  # 设计文档
```

## 解决的问题

现代人普遍关注肠道健康，但缺乏便捷的记录和分析工具。PoopTracker 让你：

1. **轻松记录**：计时器 + 表单，30 秒完成一次记录
2. **发现规律**：通过日历和图表发现如厕规律
3. **AI 洞察**：AI 分析一段时间的数据，给出专业健康建议
4. **及时预警**：异常情况（如颜色异常、形状持续异常）及时提醒
