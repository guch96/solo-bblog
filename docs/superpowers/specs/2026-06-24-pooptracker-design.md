# PoopTracker 设计规格文档

## 1. 项目概述

**名称：** PoopTracker（便便健康记录工具）

**目标：** 一个 Web 应用，帮助用户记录每日如厕情况，通过 AI 分析给出肠道健康建议。

**核心价值：**
- 便捷记录如厕数据（计时 + 手动）
- 可视化展示历史数据和趋势
- AI 分析一段时间内的记录，给出专业健康建议

**技术栈：**
- 前端：Next.js + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Python FastAPI + SQLite + SQLAlchemy + uv（包管理）
- AI：OpenAI API（自定义 Provider 抽象层，支持多 LLM 厂商切换）

## 2. 功能规格

### 2.1 计时记录

**用户故事：** 作为用户，我希望在如厕时点击开始计时，结束后自动进入记录表单，以便准确记录如厕时长。

**流程：**
1. 首页显示计时器组件，有"开始"按钮
2. 点击"开始"后，按钮变为"停止"，计时器开始计时
3. 点击"停止"后，计时结束，跳转到记录表单页
4. 表单自动填充：开始时间、结束时间、如厕时长
5. 用户补充其他信息（形状、颜色、气味、感受、备注）后提交

**验收标准：**
- 计时精度到秒
- 停止后自动跳转表单，时长自动填充
- 表单可取消，取消后不保存记录

### 2.2 手动记录

**用户故事：** 作为用户，我希望点击日历上的日期手动填写记录，以便补录或在不使用计时器时记录。

**流程：**
1. 日历视图中点击某个日期
2. 弹出记录表单，日期自动填充为点击的日期
3. 用户手动填写所有字段
4. 提交保存

**验收标准：**
- 表单支持手动输入开始时间、结束时间（可选）
- 每天可记录多次，不限次数
- 表单有基本校验（开始时间必填）

### 2.3 记录表单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 开始时间 | datetime | 是 | 如厕开始时间 |
| 结束时间 | datetime | 否 | 如厕结束时间 |
| 时长 | integer | 否 | 秒数（计时模式自动填充） |
| 形状 | enum(1-7) | 否 | 布里斯托大便分类法 |
| 颜色 | enum | 否 | 棕色/深棕/黄色/绿色/黑色/红色/其他 |
| 气味 | enum | 否 | 正常/偏臭/无味/其他 |
| 身体感受 | enum | 否 | 舒适/腹胀/腹痛/排便困难/其他 |
| 备注 | text | 否 | 自由文本 |
| 输入方式 | enum | 是 | timer(计时) / manual(手动) |

**布里斯托大便分类法：**
| 类型 | 描述 | 含义 |
|------|------|------|
| 1 型 | 分离的硬块 | 严重便秘 |
| 2 型 | 块状香肠形 | 轻度便秘 |
| 3 型 | 表面有裂纹的香肠形 | 正常 |
| 4 型 | 光滑柔软的香肠形 | 理想状态 |
| 5 型 | 柔软的团块 | 缺乏纤维 |
| 6 型 | 糊状、边缘不规则 | 轻度腹泻 |
| 7 型 | 水样、无固体 | 腹泻 |

### 2.4 记录列表

**用户故事：** 作为用户，我希望查看所有记录列表，以便回顾历史数据。

**功能：**
- 按时间倒序显示所有记录
- 每条记录显示：日期、时长、形状、颜色、摘要信息
- 点击可查看详情
- 支持删除记录

### 2.5 日历视图

**用户故事：** 作为用户，我希望通过日历视图一目了然地看到记录情况。

**功能：**
- 月视图日历
- 有记录的日期显示热力颜色（记录次数越多颜色越深）
- 点击日期可查看当天记录列表
- 点击日期可新增记录（手动模式）

### 2.6 统计图表

**用户故事：** 作为用户，我希望查看统计数据，了解自己的如厕规律。

**功能：**
- 最近 7 天 / 30 天的记录频率柱状图
- 如厕时长趋势折线图
- 形状分布饼图

### 2.7 AI 健康分析

**用户故事：** 作为用户，我希望选择一段时间范围，让 AI 分析我的记录数据并给出健康建议。

**流程：**
1. 用户进入分析页面
2. 选择时间范围（默认最近 7 天，可自定义）
3. 点击"开始分析"
4. 后端读取该时间范围内的记录，构造 prompt 调用 LLM
5. 返回分析结果：摘要 + 健康建议
6. 分析结果保存到数据库，可查看历史分析

**AI 分析 prompt 设计：**
```
你是一位肠道健康专家。请根据以下如厕记录数据，分析用户的肠道健康状况。

记录数据：
{records_json}

请从以下维度分析：
1. 排便频率是否正常
2. 形状分布（布里斯托分类法）是否健康
3. 是否有异常情况需要关注
4. 饮食和生活习惯建议

输出格式：
- 摘要：一段话总结整体状况
- 建议：具体可执行的健康建议列表
```

**Provider 抽象层：**
```python
class LLMProvider(ABC):
    @abstractmethod
    def analyze(self, records: list[dict], date_range: tuple) -> dict:
        """返回 {summary: str, suggestions: list[str]}"""
        pass
```

配置文件 `src/backend/.env` 切换 provider：
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
```

## 3. 数据模型

### records 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| start_time | DATETIME | NOT NULL | 如厕开始时间 |
| end_time | DATETIME | | 如厕结束时间 |
| duration | INTEGER | | 时长（秒） |
| shape | VARCHAR(20) | | 布里斯托分类 1-7 |
| color | VARCHAR(20) | | 颜色 |
| smell | VARCHAR(20) | | 气味 |
| comfort | VARCHAR(20) | | 身体感受 |
| notes | TEXT | | 备注 |
| input_mode | VARCHAR(10) | NOT NULL | timer / manual |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |
| updated_at | DATETIME | DEFAULT NOW | 更新时间 |

### analyses 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| date_from | DATE | NOT NULL | 分析起始日期 |
| date_to | DATE | NOT NULL | 分析结束日期 |
| provider | VARCHAR(20) | NOT NULL | LLM 厂商 |
| model | VARCHAR(50) | NOT NULL | 模型名称 |
| summary | TEXT | NOT NULL | 分析摘要 |
| suggestions | TEXT | | 健康建议 |
| record_ids | TEXT | | 关联记录 ID（JSON） |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |

## 4. API 设计

### 记录相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/records | 获取记录列表（支持 ?from=&to= 日期筛选） |
| GET | /api/records/{id} | 获取单条记录详情 |
| POST | /api/records | 创建记录 |
| PUT | /api/records/{id} | 更新记录 |
| DELETE | /api/records/{id} | 删除记录 |
| GET | /api/records/calendar?month= | 获取日历热力图数据 |
| GET | /api/records/stats?days= | 获取统计数据 |

### 分析相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/analyses | 触发 AI 分析（body: {from, to}） |
| GET | /api/analyses | 获取历史分析记录 |
| GET | /api/analyses/{id} | 获取单条分析详情 |

### 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |

## 5. 前端页面结构

```
/                        # 首页（计时器 + 今日记录摘要）
/records                 # 记录列表页
/records/new             # 新增记录（手动模式）
/records/[id]            # 记录详情页
/records/[id]/edit       # 编辑记录
/calendar                # 日历视图
/stats                   # 统计图表
/analysis                # AI 分析页
```

## 6. 目录结构

```
solo-bblog/
├─ README.md
├─ JOURNAL.md
├─ AGENTS.md
├─ CLAUDE.md
├─ .claude/
├─ src/
│  ├─ frontend/                  # Next.js 前端
│  │  ├─ src/
│  │  │  ├─ app/                 # App Router 页面
│  │  │  ├─ components/          # 组件
│  │  │  │  ├─ timer/            # 计时器组件
│  │  │  │  ├─ records/          # 记录相关组件
│  │  │  │  ├─ calendar/         # 日历组件
│  │  │  │  ├─ charts/           # 图表组件
│  │  │  │  └─ analysis/         # 分析组件
│  │  │  └─ lib/                 # 工具函数、API 客户端
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ backend/                   # FastAPI 后端
│     ├─ main.py                 # 入口
│     ├─ database.py             # 数据库连接
│     ├─ models.py               # SQLAlchemy 模型
│     ├─ schemas.py              # Pydantic 请求/响应模型
│     ├─ routers/
│     │  ├─ records.py           # 记录 API
│     │  └─ analyses.py          # 分析 API
│     ├─ services/
│     │  ├─ record_service.py    # 记录业务逻辑
│     │  ├─ analysis_service.py  # 分析业务逻辑
│     │  └─ llm_provider.py      # LLM 抽象层
│     ├─ pyproject.toml
│     └─ uv.lock
└─ docs/
   └─ superpowers/
      └─ specs/
         └─ 2026-06-24-pooptracker-design.md  # 本文档
```

## 7. 非功能需求

- **性能：** API 响应时间 < 500ms（不含 AI 分析）
- **数据：** SQLite 文件本地存储，无需外部数据库
- **安全：** 单人工具，暂不需要认证；API Key 通过环境变量管理
- **可扩展：** LLM Provider 抽象层支持新增厂商，数据模型预留扩展空间
