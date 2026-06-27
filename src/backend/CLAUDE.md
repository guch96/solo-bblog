[根目录](../../CLAUDE.md) > [src](../) > **backend**

## 模块职责

PoopTracker 后端 REST API 服务 -- Python FastAPI + SQLite + SQLAlchemy 2.0。
提供记录 CRUD、AI 分析（流式/非流式）、用户认证（JWT）、数据统计与日历接口。

## 入口与启动

- **入口文件：** `main.py`
- **应用工厂：** `FastAPI(title="PoopTracker API", version="0.1.0", lifespan=lifespan)`
- **启动命令：** `uv run uvicorn main:app --reload`（localhost:8000）
- **API 文档：** `http://localhost:8000/docs`（Swagger UI）
- **测试命令：** `uv run pytest tests/ -v`

## 对外接口

### 认证 (`routers/auth.py`) -- `/api/auth`

| 端点 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/register` | POST | 无 | 注册新用户 |
| `/login` | POST | 无 | 登录，返回 JWT |
| `/me` | GET | Bearer | 当前用户信息 |

### 记录 (`routers/records.py`) -- `/api/records`

| 端点 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `` | POST | Bearer | 创建记录 |
| `` | GET | Bearer | 列表查询（date_from/date_to） |
| `/calendar` | GET | Bearer | 日历热力图（month） |
| `/stats` | GET | Bearer | 统计数据（days） |
| `/{id}` | GET/PUT/DELETE | Bearer | 单条 CRUD |

### 分析 (`routers/analyses.py`) -- `/api/analyses`

| 端点 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `` | POST | Bearer | 触发 AI 分析（非流式） |
| `` | GET | Bearer | 分析历史 |
| `/{id}` | GET | Bearer | 分析详情 |
| `/stream` | POST | Bearer | 流式 AI 分析（SSE） |

## 关键依赖与配置

| 依赖 | 用途 |
|------|------|
| fastapi >=0.115.0 | Web 框架 |
| uvicorn[standard] >=0.30.0 | ASGI 服务器 |
| sqlalchemy >=2.0.0 | ORM |
| openai >=1.50.0 | LLM SDK |
| python-jose[cryptography] >=3.3.0 | JWT |
| passlib[bcrypt] >=1.7.4 | 密码哈希 |
| pytest >=8.0.0 | 测试 (dev) |
| httpx >=0.27.0 | 测试 HTTP 客户端 (dev) |

**配置文件：** `pyproject.toml`, `.env`

**环境变量（`.env`）：**
- `LLM_MODEL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS`, `LLM_PROVIDER_NAME`
- `JWT_SECRET`（默认 `pooptracker-local-dev-secret`）

## 数据模型

三张表，位于 `models.py`：

- **users** -- id, username (UNIQUE), password_hash, wechat_openid, created_at
- **records** -- id, user_id (FK->users), start_time, end_time, duration, shape, color, smell, comfort, process_feeling, notes, input_mode, created_at, updated_at
- **analyses** -- id, user_id (FK->users), date_from, date_to, provider, model, summary, suggestions (JSON), record_ids (JSON), created_at

**Schema 定义：** `schemas.py` -- RecordCreate/Update/Response, AnalysisRequest/Response, LoginRequest, TokenResponse, StatsResponse, 6 个枚举类型

**数据隔离：** 所有 Record/Analysis 查询按 `user_id` 过滤

## 测试与质量

- **框架：** pytest + httpx + TestClient
- **测试文件数：** 4（conftest + test_records + test_analyses + test_llm_provider + test_calendar_stats）
- **用例数：** ~33
- **测试数据库：** 独立 `data/test.db`，每个测试前后自动重建
- **测试账号：** testuser:123456（conftest 自动创建）

详见架构扫描报告 `docs/architecture-scan.md` 第 5.1.8 节。

## 常见问题 (FAQ)

**Q: 启动报 "ModuleNotFoundError"？**
A: 运行 `uv sync` 安装依赖，确保在 `src/backend/` 目录下执行。

**Q: 数据库表不存在？**
A: lifespan 会在启动时自动建表，无需手动初始化。

**Q: AI 分析返回空或错误？**
A: 检查 `.env` 中的 `LLM_API_KEY` 和 `LLM_BASE_URL` 配置是否正确。

**Q: 如何添加新字段？**
A: 在 `models.py` 添加列定义，在 `schemas.py` 添加对应字段，在 `main.py` 的 lifespan 中添加 `PRAGMA table_info` + `ALTER TABLE` 迁移逻辑。

## 相关文件清单

```
src/backend/
├── main.py                    # 应用入口（FastAPI + lifespan + CORS）
├── database.py                # 数据库连接与会话管理
├── models.py                  # SQLAlchemy ORM 模型（3 表）
├── schemas.py                 # Pydantic 请求/响应模型 + 6 枚举
├── routers/
│   ├── auth.py                # 认证路由（login/register/me）
│   ├── records.py             # 记录路由（CRUD + calendar + stats）
│   └── analyses.py            # 分析路由（create/list/get/stream SSE）
├── dependencies/
│   └── auth.py                # JWT 鉴权依赖（HS256, 7天）
├── services/
│   ├── record_service.py      # 记录业务逻辑（CRUD + 统计 + 日历）
│   ├── analysis_service.py    # AI 分析业务逻辑
│   └── llm_provider.py        # LLM Provider 抽象层（ABC + OpenAI兼容实现）
├── utils/                     # 工具函数（当前为空）
├── tests/
│   ├── conftest.py            # pytest fixtures（test.db + testuser）
│   ├── test_records.py        # 记录 API 测试（14 用例）
│   ├── test_analyses.py       # 分析 API 测试（9 用例）
│   ├── test_llm_provider.py   # LLM Provider 测试（5 用例）
│   └── test_calendar_stats.py # 日历统计测试（5 用例）
├── data/                      # SQLite 数据文件（已忽略）
├── pyproject.toml
└── uv.lock
```

## 变更记录 (Changelog)

| 日期 | 变更 |
|------|------|
| 2026-06-27 | 架构全量扫描：确认当前状态，无后端代码变更 |
| 2026-06-26 | 新增用户认证与数据隔离（JWT + bcrypt + user_id 过滤） |
| 2026-06-25 | 新增 LLM Provider 配置化、process_feeling 字段、统计增强 |
| 2026-06-24 | 初始后端搭建：FastAPI + SQLite + records/analyses API |
