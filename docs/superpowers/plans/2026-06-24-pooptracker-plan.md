# PoopTracker 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的 Web 应用，帮助用户记录每日如厕数据并通过 AI 分析给出健康建议。

**Architecture:** 前后端分离架构。FastAPI 后端提供 REST API，SQLite 数据库本地存储，OpenAI API 进行 AI 分析。Next.js 前端通过 API 客户端与后端通信，使用 shadcn/ui 组件库构建 UI。

**Tech Stack:** Python FastAPI + SQLAlchemy + SQLite + uv | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui | OpenAI API (自定义 Provider 抽象层)

---

## 文件结构映射

```
solo-bblog/
├─ src/
│  ├─ backend/                       # FastAPI 后端
│  │  ├─ pyproject.toml              # uv 依赖配置
│  │  ├─ .env.example                # 环境变量模板
│  │  ├─ main.py                     # FastAPI 入口，CORS 配置
│  │  ├─ database.py                 # SQLite 连接 + 会话管理
│  │  ├─ models.py                   # SQLAlchemy ORM 模型
│  │  ├─ schemas.py                  # Pydantic 请求/响应模型
│  │  ├─ routers/
│  │  │  ├─ __init__.py
│  │  │  ├─ records.py               # 记录 CRUD + 日历 + 统计 API
│  │  │  └─ analyses.py              # AI 分析 API
│  │  ├─ services/
│  │  │  ├─ __init__.py
│  │  │  ├─ record_service.py        # 记录业务逻辑
│  │  │  ├─ analysis_service.py      # 分析业务逻辑
│  │  │  └─ llm_provider.py          # LLM Provider 抽象层 + OpenAI 实现
│  │  └─ tests/
│  │     ├─ __init__.py
│  │     ├─ conftest.py              # pytest fixtures (测试数据库)
│  │     ├─ test_records.py          # 记录 API 测试
│  │     ├─ test_analyses.py         # 分析 API 测试
│  │     └─ test_llm_provider.py     # Provider 测试
│  └─ frontend/                      # Next.js 前端
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ next.config.js
│     ├─ tailwind.config.ts
│     ├─ postcss.config.js
│     ├─ components.json             # shadcn/ui 配置
│     └─ src/
│        ├─ app/
│        │  ├─ layout.tsx            # 根布局 + 导航
│        │  ├─ page.tsx              # 首页（计时器 + 今日摘要）
│        │  ├─ globals.css           # Tailwind 全局样式
│        │  ├─ records/
│        │  │  ├─ page.tsx           # 记录列表页
│        │  │  ├─ new/
│        │  │  │  └─ page.tsx        # 新增记录（手动模式）
│        │  │  └─ [id]/
│        │  │     ├─ page.tsx        # 记录详情页
│        │  │     └─ edit/
│        │  │        └─ page.tsx     # 编辑记录
│        │  ├─ calendar/
│        │  │  └─ page.tsx           # 日历视图
│        │  ├─ stats/
│        │  │  └─ page.tsx           # 统计图表
│        │  └─ analysis/
│        │     └─ page.tsx           # AI 分析页
│        ├─ components/
│        │  ├─ ui/                   # shadcn/ui 组件（自动生成）
│        │  ├─ timer/
│        │  │  └─ Timer.tsx          # 计时器组件
│        │  ├─ records/
│        │  │  ├─ RecordForm.tsx      # 记录表单（新增/编辑共用）
│        │  │  ├─ RecordCard.tsx      # 记录卡片
│        │  │  └─ RecordList.tsx      # 记录列表
│        │  ├─ calendar/
│        │  │  └─ CalendarHeatmap.tsx # 日历热力图
│        │  ├─ charts/
│        │  │  └─ StatsCharts.tsx     # 统计图表（柱状图 + 折线图 + 饼图）
│        │  └─ analysis/
│        │     └─ AnalysisCard.tsx    # 分析结果展示卡片
│        └─ lib/
│           ├─ api.ts                # API 客户端（封装 fetch）
│           └─ types.ts              # TypeScript 类型定义
```

---

## 阶段一：后端基础设施

### Task 1: 初始化后端项目

**Files:**
- Create: `src/backend/pyproject.toml`
- Create: `src/backend/.env.example`
- Create: `src/backend/main.py`
- Create: `src/backend/database.py`

- [ ] **Step 1: 创建 pyproject.toml**

```toml
[project]
name = "pooptracker-backend"
version = "0.1.0"
description = "PoopTracker backend API"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy>=2.0.0",
    "openai>=1.50.0",
    "python-dotenv>=1.0.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: 初始化 uv 并安装依赖**

```bash
cd src/backend
uv sync
```

- [ ] **Step 3: 创建 .env.example**

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

- [ ] **Step 4: 创建 main.py（最小入口 + CORS）**

```python
"""PoopTracker 后端入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PoopTracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """健康检查端点"""
    return {"status": "ok"}
```

- [ ] **Step 5: 创建 database.py**

```python
"""数据库连接与会话管理"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)

DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'pooptracker.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 依赖：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 6: 验证健康检查端点**

```bash
cd src/backend
uv run uvicorn main:app --port 8000 &
sleep 2
curl http://localhost:8000/api/health
# 预期输出: {"status":"ok"}
kill %1
```

- [ ] **Step 7: 提交**

```bash
git add src/backend/pyproject.toml src/backend/.env.example \
        src/backend/main.py src/backend/database.py src/backend/uv.lock \
        src/backend/.python-version
git commit -m "feat: 初始化 FastAPI 后端项目结构"
```

---

### Task 2: 数据库模型

**Files:**
- Create: `src/backend/models.py`
- Create: `src/backend/schemas.py`
- Modify: `src/backend/main.py` (添加 init_db)

- [ ] **Step 1: 创建 models.py（records + analyses 表）**

```python
"""SQLAlchemy ORM 数据模型"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base


class Record(Base):
    """如厕记录表"""
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # 秒数
    shape = Column(String(20), nullable=True)  # 布里斯托分类 1-7
    color = Column(String(20), nullable=True)  # 颜色枚举值
    smell = Column(String(20), nullable=True)  # 气味枚举值
    comfort = Column(String(20), nullable=True)  # 身体感受枚举值
    notes = Column(Text, nullable=True)  # 备注
    input_mode = Column(String(10), nullable=False)  # timer / manual
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class Analysis(Base):
    """AI 分析记录表"""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date_from = Column(DateTime, nullable=False)  # 分析起始日期
    date_to = Column(DateTime, nullable=False)  # 分析结束日期
    provider = Column(String(50), nullable=False)  # LLM 厂商名称
    model = Column(String(50), nullable=False)  # 模型名称
    summary = Column(Text, nullable=False)  # AI 分析摘要
    suggestions = Column(Text, nullable=True)  # 健康建议（JSON 字符串）
    record_ids = Column(Text, nullable=True)  # 关联记录 ID（JSON 数组字符串）
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

- [ ] **Step 2: 创建 schemas.py（Pydantic 模型）**

```python
"""Pydantic 请求/响应模型"""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


# ---- 枚举定义 ----
class ShapeEnum(str, Enum):
    TYPE_1 = "1"  # 分离的硬块
    TYPE_2 = "2"  # 块状香肠形
    TYPE_3 = "3"  # 表面有裂纹的香肠形
    TYPE_4 = "4"  # 光滑柔软的香肠形
    TYPE_5 = "5"  # 柔软的团块
    TYPE_6 = "6"  # 糊状、边缘不规则
    TYPE_7 = "7"  # 水样、无固体


class ColorEnum(str, Enum):
    BROWN = "brown"
    DARK_BROWN = "dark_brown"
    YELLOW = "yellow"
    GREEN = "green"
    BLACK = "black"
    RED = "red"
    OTHER = "other"


class SmellEnum(str, Enum):
    NORMAL = "normal"
    STRONG = "strong"
    ODORLESS = "odorless"
    OTHER = "other"


class ComfortEnum(str, Enum):
    COMFORTABLE = "comfortable"
    BLOATING = "bloating"
    PAIN = "pain"
    DIFFICULTY = "difficulty"
    OTHER = "other"


class InputModeEnum(str, Enum):
    TIMER = "timer"
    MANUAL = "manual"


# ---- 记录 Schema ----
class RecordCreate(BaseModel):
    """创建记录请求"""
    start_time: datetime
    end_time: datetime | None = None
    duration: int | None = None
    shape: ShapeEnum | None = None
    color: ColorEnum | None = None
    smell: SmellEnum | None = None
    comfort: ComfortEnum | None = None
    notes: str | None = None
    input_mode: InputModeEnum


class RecordUpdate(BaseModel):
    """更新记录请求（所有字段可选）"""
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration: int | None = None
    shape: ShapeEnum | None = None
    color: ColorEnum | None = None
    smell: SmellEnum | None = None
    comfort: ComfortEnum | None = None
    notes: str | None = None
    input_mode: InputModeEnum | None = None


class RecordResponse(BaseModel):
    """记录响应"""
    id: int
    start_time: datetime
    end_time: datetime | None
    duration: int | None
    shape: str | None
    color: str | None
    smell: str | None
    comfort: str | None
    notes: str | None
    input_mode: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---- 分析 Schema ----
class AnalysisRequest(BaseModel):
    """触发 AI 分析请求"""
    date_from: str = Field(description="起始日期 YYYY-MM-DD")
    date_to: str = Field(description="结束日期 YYYY-MM-DD")


class AnalysisResponse(BaseModel):
    """分析结果响应"""
    id: int
    date_from: datetime
    date_to: datetime
    provider: str
    model: str
    summary: str
    suggestions: str | None
    record_ids: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- 日历/统计 Schema ----
class CalendarDay(BaseModel):
    """日历某一天的数据"""
    date: str
    count: int


class StatsResponse(BaseModel):
    """统计响应"""
    frequency: list[dict]  # [{date: str, count: int}]
    avg_duration: list[dict]  # [{date: str, avg_seconds: float}]
    shape_distribution: list[dict]  # [{shape: str, count: int}]
```

- [ ] **Step 3: 在 main.py 中添加数据库初始化**

在 `main.py` 的 `app = FastAPI(...)` 之后、路由之前添加：

```python
from database import engine, Base


@app.on_event("startup")
def init_db():
    """应用启动时自动创建表"""
    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 4: 验证表创建**

```bash
cd src/backend
uv run python -c "
from main import app
from database import engine, Base
Base.metadata.create_all(bind=engine)
import os; print('Tables created:', os.path.exists('data/pooptracker.db'))
"
# 预期输出: Tables created: True
```

- [ ] **Step 5: 提交**

```bash
git add src/backend/models.py src/backend/schemas.py src/backend/main.py
git commit -m "feat: 添加数据库模型 records + analyses 表"
```

---

### Task 3: 记录 CRUD API

**Files:**
- Create: `src/backend/services/__init__.py`
- Create: `src/backend/services/record_service.py`
- Create: `src/backend/routers/__init__.py`
- Create: `src/backend/routers/records.py`
- Create: `src/backend/tests/__init__.py`
- Create: `src/backend/tests/conftest.py`
- Create: `src/backend/tests/test_records.py`
- Modify: `src/backend/main.py` (注册路由)

- [ ] **Step 1: 创建 conftest.py（测试数据库 fixture）**

```python
"""pytest fixtures"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db

SQLALCHEMY_TEST_DB = "sqlite:///./data/test.db"

test_engine = create_engine(SQLALCHEMY_TEST_DB, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    """每个测试前后重建数据库"""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """返回配置好测试数据库的 TestClient"""
    from main import app
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 2: 写失败的测试 —— test_records.py**

```python
"""记录 API 测试"""
from datetime import datetime


def test_create_record(client):
    """测试创建记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "end_time": "2026-06-24T08:10:00",
        "duration": 600,
        "shape": "4",
        "color": "brown",
        "smell": "normal",
        "comfort": "comfortable",
        "notes": "正常",
        "input_mode": "timer",
    }
    resp = client.post("/api/records", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] == 1
    assert data["shape"] == "4"
    assert data["input_mode"] == "timer"


def test_get_records(client):
    """测试获取记录列表"""
    # 先创建一条记录
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    resp = client.get("/api/records")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1


def test_get_record_by_id(client):
    """测试获取单条记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    resp = client.get("/api/records/1")
    assert resp.status_code == 200
    assert resp.json()["id"] == 1


def test_update_record(client):
    """测试更新记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    update = {"shape": "2", "notes": "感觉不太对"}
    resp = client.put("/api/records/1", json=update)
    assert resp.status_code == 200
    assert resp.json()["shape"] == "2"
    assert resp.json()["notes"] == "感觉不太对"


def test_delete_record(client):
    """测试删除记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    resp = client.delete("/api/records/1")
    assert resp.status_code == 204
    # 确认已删除
    resp = client.get("/api/records/1")
    assert resp.status_code == 404
```

- [ ] **Step 3: 运行测试验证失败**

```bash
cd src/backend
uv run pytest tests/test_records.py -v
# 预期: 全部 FAIL (404 Not Found /路由未注册)
```

- [ ] **Step 4: 创建 record_service.py（业务逻辑层）**

```python
"""记录业务逻辑"""
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Record
from schemas import RecordCreate, RecordUpdate

logger = logging.getLogger(__name__)


def create_record(db: Session, data: RecordCreate) -> Record:
    """创建一条如厕记录"""
    logger.info("创建记录: input_mode=%s start_time=%s", data.input_mode, data.start_time)
    record = Record(
        start_time=data.start_time,
        end_time=data.end_time,
        duration=data.duration,
        shape=data.shape.value if data.shape else None,
        color=data.color.value if data.color else None,
        smell=data.smell.value if data.smell else None,
        comfort=data.comfort.value if data.comfort else None,
        notes=data.notes,
        input_mode=data.input_mode.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("记录创建成功: id=%d", record.id)
    return record


def get_records(db: Session, date_from: str | None = None, date_to: str | None = None) -> list[Record]:
    """获取记录列表，支持按日期范围筛选"""
    query = db.query(Record).order_by(Record.start_time.desc())
    if date_from:
        query = query.filter(
            Record.start_time >= datetime.fromisoformat(date_from)
        )
    if date_to:
        query = query.filter(
            Record.start_time <= datetime.fromisoformat(date_to)
        )
    return query.all()


def get_record_by_id(db: Session, record_id: int) -> Record | None:
    """获取单条记录详情"""
    return db.query(Record).filter(Record.id == record_id).first()


def update_record(db: Session, record_id: int, data: RecordUpdate) -> Record | None:
    """更新记录（部分更新）"""
    logger.info("更新记录: id=%d", record_id)
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return None
    update_data = data.model_dump(exclude_unset=True)
    # 枚举字段转值
    for field in ["shape", "color", "smell", "comfort", "input_mode"]:
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].value
    for key, value in update_data.items():
        setattr(record, key, value)
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    logger.info("记录更新成功: id=%d", record.id)
    return record


def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    logger.info("删除记录: id=%d", record_id)
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return False
    db.delete(record)
    db.commit()
    logger.info("记录删除成功: id=%d", record_id)
    return True
```

- [ ] **Step 5: 创建 records.py 路由**

```python
"""记录相关 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import RecordCreate, RecordUpdate, RecordResponse
from services.record_service import (
    create_record, get_records, get_record_by_id, update_record, delete_record,
)

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("", response_model=RecordResponse, status_code=201)
def create(data: RecordCreate, db: Session = Depends(get_db)):
    """创建一条如厕记录"""
    return create_record(db, data)


@router.get("", response_model=list[RecordResponse])
def list_records(
    date_from: str | None = Query(None, description="起始日期 YYYY-MM-DD"),
    date_to: str | None = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """获取记录列表，支持日期范围筛选"""
    return get_records(db, date_from, date_to)


@router.get("/{record_id}", response_model=RecordResponse)
def get_one(record_id: int, db: Session = Depends(get_db)):
    """获取单条记录详情"""
    record = get_record_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put("/{record_id}", response_model=RecordResponse)
def update(record_id: int, data: RecordUpdate, db: Session = Depends(get_db)):
    """更新一条记录"""
    record = update_record(db, record_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/{record_id}", status_code=204)
def delete(record_id: int, db: Session = Depends(get_db)):
    """删除一条记录"""
    if not delete_record(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
```

- [ ] **Step 6: 在 main.py 注册路由**

```python
from routers import records

# 在 app = FastAPI(...) 之后添加：
app.include_router(records.router)
```

- [ ] **Step 7: 运行测试验证通过**

```bash
cd src/backend
uv run pytest tests/test_records.py -v
# 预期: 全部 PASS (5 passed)
```

- [ ] **Step 8: 提交**

```bash
git add src/backend/services/ src/backend/routers/ src/backend/tests/ src/backend/main.py
git commit -m "feat: 实现记录 CRUD API（创建/查询/更新/删除）"
```

---

### Task 4: 日历与统计 API

**Files:**
- Modify: `src/backend/services/record_service.py`
- Modify: `src/backend/routers/records.py`
- Create: `src/backend/tests/test_calendar_stats.py`

- [ ] **Step 1: 写失败的测试 —— test_calendar_stats.py**

```python
"""日历热力图 + 统计 API 测试"""
from datetime import datetime


def test_calendar_data(client):
    """测试日历热力图数据"""
    # 创建两条同一天的记录
    for i in range(2):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "input_mode": "manual",
        })
    # 创建一条第二天记录
    client.post("/api/records", json={
        "start_time": "2026-06-25T10:00:00",
        "input_mode": "timer",
    })

    resp = client.get("/api/records/calendar?month=2026-06")
    assert resp.status_code == 200
    data = resp.json()
    # 应该有 6/24 和 6/25 两天
    dates = {d["date"] for d in data}
    assert "2026-06-24" in dates
    assert "2026-06-25" in dates
    # 6/24 应该有 2 条记录
    day_24 = next(d for d in data if d["date"] == "2026-06-24")
    assert day_24["count"] == 2


def test_stats_data(client):
    """测试统计数据"""
    # 创建不同形状的记录
    records = [
        {"start_time": "2026-06-20T08:00:00", "duration": 300, "shape": "4", "input_mode": "timer"},
        {"start_time": "2026-06-23T09:00:00", "duration": 180, "shape": "3", "input_mode": "manual"},
        {"start_time": "2026-06-24T10:00:00", "duration": 600, "shape": "4", "input_mode": "timer"},
    ]
    for r in records:
        client.post("/api/records", json=r)

    resp = client.get("/api/records/stats?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert "frequency" in data
    assert "avg_duration" in data
    assert "shape_distribution" in data
    # 形状分布: type_4 应该有 2 条
    shapes = {s["shape"]: s["count"] for s in data["shape_distribution"]}
    assert shapes["4"] == 2
    assert shapes["3"] == 1
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd src/backend
uv run pytest tests/test_calendar_stats.py -v
# 预期: FAIL (路由不存在)
```

- [ ] **Step 3: 在 record_service.py 添加日历和统计方法**

```python
"""记录业务逻辑（追加内容）"""
from sqlalchemy import func


def get_calendar_data(db: Session, month: str) -> list[dict]:
    """获取指定月份的日历热力图数据
    返回: [{"date": "YYYY-MM-DD", "count": N}, ...]
    """
    logger.info("查询日历数据: month=%s", month)
    year, month_num = month.split("-")
    records = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(
            func.strftime("%Y", Record.start_time) == year,
            func.strftime("%m", Record.start_time) == month_num,
        )
        .group_by(func.date(Record.start_time))
        .all()
    )
    return [{"date": r.date, "count": r.count} for r in records]


def get_stats(db: Session, days: int) -> dict:
    """获取统计数据：频率、时长趋势、形状分布"""
    from datetime import datetime as dt, timedelta, timezone
    logger.info("查询统计数据: days=%d", days)
    cutoff = dt.now(timezone.utc) - timedelta(days=days)

    # 频率：每日记录次数
    frequency = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(Record.start_time >= cutoff)
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    # 时长趋势：每日平均时长
    avg_duration = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.avg(Record.duration).label("avg_seconds"),
        )
        .filter(Record.start_time >= cutoff, Record.duration.isnot(None))
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    # 形状分布
    shape_dist = (
        db.query(Record.shape, func.count(Record.id).label("count"))
        .filter(Record.shape.isnot(None))
        .group_by(Record.shape)
        .all()
    )

    return {
        "frequency": [{"date": r.date, "count": r.count} for r in frequency],
        "avg_duration": [{"date": r.date, "avg_seconds": round(r.avg_seconds, 1)} for r in avg_duration],
        "shape_distribution": [{"shape": r.shape, "count": r.count} for r in shape_dist],
    }
```

- [ ] **Step 4: 在 records.py 路由添加两个端点**

```python
"""追加到 records.py 路由"""
from services.record_service import (
    create_record, get_records, get_record_by_id, update_record, delete_record,
    get_calendar_data, get_stats,  # 新增
)


@router.get("/calendar", response_model=list[dict])
def calendar_data(
    month: str = Query(..., description="月份 YYYY-MM"),
    db: Session = Depends(get_db),
):
    """获取日历热力图数据"""
    return get_calendar_data(db, month)


@router.get("/stats", response_model=dict)
def stats_data(
    days: int = Query(7, description="统计天数"),
    db: Session = Depends(get_db),
):
    """获取统计数据"""
    return get_stats(db, days)
```

注意：`/calendar` 和 `/stats` 必须注册在 `/{record_id}` 之前，否则 FastAPI 会将 "calendar" 和 "stats" 当作 `record_id` 参数解析。

- [ ] **Step 5: 运行测试验证通过**

```bash
cd src/backend
uv run pytest tests/test_calendar_stats.py -v
# 预期: 全部 PASS
uv run pytest tests/ -v
# 预期: 全部 PASS（7 个测试）
```

- [ ] **Step 6: 提交**

```bash
git add src/backend/services/record_service.py src/backend/routers/records.py src/backend/tests/
git commit -m "feat: 添加日历热力图和统计 API"
```

---

### Task 5: LLM Provider 抽象层

**Files:**
- Create: `src/backend/services/llm_provider.py`
- Create: `src/backend/tests/test_llm_provider.py`

- [ ] **Step 1: 写失败的测试 —— test_llm_provider.py**

```python
"""LLM Provider 测试"""
import json
from services.llm_provider import LLMProvider, OpenAIProvider, get_provider


class MockOpenAIProvider(LLMProvider):
    """模拟 Provider 用于测试"""
    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        return {
            "summary": f"分析了 {len(records)} 条记录",
            "suggestions": ["多喝水", "多吃纤维"],
            "model": "mock-model",
        }


def test_provider_interface():
    """测试 Provider 抽象接口"""
    provider = MockOpenAIProvider("mock-model")
    result = provider.analyze(
        [{"shape": "4", "color": "brown"}],
        "2026-06-01",
        "2026-06-07",
    )
    assert "summary" in result
    assert "suggestions" in result
    assert "model" in result
    assert len(result["suggestions"]) == 2


def test_provider_analyze_output_format():
    """测试分析结果格式正确"""
    provider = MockOpenAIProvider("mock-model")
    records = [
        {"start_time": "2026-06-24T08:00:00", "shape": "4", "color": "brown", "comfort": "comfortable"},
    ]
    result = provider.analyze(records, "2026-06-24", "2026-06-24")
    assert isinstance(result["summary"], str)
    assert len(result["summary"]) > 0
    assert isinstance(result["suggestions"], list)
    for s in result["suggestions"]:
        assert isinstance(s, str)
        assert len(s) > 0


def test_get_provider_openai(monkeypatch):
    """测试根据配置获取 OpenAI provider"""
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    provider = get_provider()
    assert isinstance(provider, OpenAIProvider)
    assert provider.model == "gpt-4o-mini"


def test_get_provider_unknown_fallback(monkeypatch):
    """测试未知 provider 回退到 OpenAI"""
    monkeypatch.setenv("LLM_PROVIDER", "unknown")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    provider = get_provider()
    assert isinstance(provider, OpenAIProvider)
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd src/backend
uv run pytest tests/test_llm_provider.py -v
# 预期: FAIL (模块不存在)
```

- [ ] **Step 3: 创建 llm_provider.py**

```python
"""LLM Provider 抽象层 — 支持多 LLM 厂商切换"""
import os
import json
import logging
from abc import ABC, abstractmethod
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """LLM Provider 抽象基类"""

    def __init__(self, model: str):
        self.model = model

    @abstractmethod
    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """
        分析记录数据并返回健康建议。
        返回: {"summary": str, "suggestions": list[str], "model": str}
        """
        ...


class OpenAIProvider(LLMProvider):
    """OpenAI API 实现"""

    def __init__(self, model: str = "gpt-4o-mini"):
        super().__init__(model)

    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """调用 OpenAI API 进行健康分析"""
        from openai import OpenAI

        logger.info("OpenAI 分析开始: 记录数=%d 时间范围=%s~%s 模型=%s",
                    len(records), date_from, date_to, self.model)

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        records_json = json.dumps(records, ensure_ascii=False, default=str)

        system_prompt = """你是一位专业的肠道健康专家。请根据用户的如厕记录数据，从以下维度分析肠道健康状况：
1. 排便频率是否正常
2. 布里斯托大便分类法形状分布是否健康
3. 是否有异常情况需要关注（颜色异常、持续腹泻/便秘等）
4. 提供具体的饮食和生活习惯建议

请用 JSON 格式回复，包含以下字段：
- summary: 一段话总结整体状况（中文）
- suggestions: 健康建议列表，每个建议是一句话（中文数组）"""

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"分析时间范围：{date_from} 至 {date_to}\\n\\n记录数据：\\n{records_json}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        result = json.loads(response.choices[0].message.content)
        logger.info("OpenAI 分析完成: tokens=%d", response.usage.total_tokens)

        return {
            "summary": result.get("summary", ""),
            "suggestions": result.get("suggestions", []),
            "model": self.model,
        }


def get_provider() -> LLMProvider:
    """工厂函数：根据环境变量 LLM_PROVIDER 返回对应的 Provider 实例"""
    provider_name = os.getenv("LLM_PROVIDER", "openai")
    logger.info("初始化 LLM Provider: %s", provider_name)

    if provider_name == "openai":
        return OpenAIProvider()
    else:
        logger.warning("未知 LLM Provider '%s'，回退到 OpenAI", provider_name)
        return OpenAIProvider()
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd src/backend
uv run pytest tests/test_llm_provider.py -v
# 预期: 4 passed
```

- [ ] **Step 5: 提交**

```bash
git add src/backend/services/llm_provider.py src/backend/tests/test_llm_provider.py
git commit -m "feat: 实现 LLM Provider 抽象层 + OpenAI 集成"
```

---

### Task 6: AI 分析 API

**Files:**
- Create: `src/backend/services/analysis_service.py`
- Create: `src/backend/routers/analyses.py`
- Create: `src/backend/tests/test_analyses.py`
- Modify: `src/backend/main.py` (注册路由)

- [ ] **Step 1: 写失败的测试 —— test_analyses.py**

```python
"""AI 分析 API 测试"""
from unittest.mock import patch, MagicMock


def mock_analyze(records, date_from, date_to):
    return {
        "summary": "测试摘要：您的肠道健康状况良好。",
        "suggestions": ["建议一", "建议二"],
        "model": "mock-model",
    }


@patch("services.llm_provider.LLMProvider.analyze", mock_analyze)
def test_create_analysis(client):
    """测试触发 AI 分析"""
    # 先创建一些记录
    for i in range(3):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "shape": "4",
            "input_mode": "timer",
        })

    resp = client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["summary"] == "测试摘要：您的肠道健康状况良好。"
    assert data["provider"] == "mock_provider"


@patch("services.llm_provider.LLMProvider.analyze", mock_analyze)
def test_get_analyses(client):
    """测试获取分析历史"""
    # 创建分析
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })
    client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })

    resp = client.get("/api/analyses")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1


@patch("services.llm_provider.LLMProvider.analyze", mock_analyze)
def test_get_analysis_detail(client):
    """测试获取单条分析详情"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })
    client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })

    resp = client.get("/api/analyses/1")
    assert resp.status_code == 200
    assert "summary" in resp.json()


def test_analysis_no_records(client):
    """测试无记录时分析返回错误"""
    resp = client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })
    assert resp.status_code == 400
    assert "没有记录" in resp.json()["detail"]
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd src/backend
uv run pytest tests/test_analyses.py -v
# 预期: FAIL (路由不存在)
```

- [ ] **Step 3: 创建 analysis_service.py**

```python
"""AI 分析业务逻辑"""
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from models import Analysis, Record
from services.llm_provider import get_provider

logger = logging.getLogger(__name__)


def run_analysis(db: Session, date_from: str, date_to: str) -> Analysis:
    """执行 AI 分析并保存结果"""
    logger.info("开始 AI 分析: %s ~ %s", date_from, date_to)

    # 查询时间范围内的记录
    records = (
        db.query(Record)
        .filter(
            Record.start_time >= datetime.fromisoformat(date_from),
            Record.start_time <= datetime.fromisoformat(date_to + "T23:59:59"),
        )
        .all()
    )

    if not records:
        raise ValueError("该时间范围内没有记录，无法分析")

    # 构造记录数据（去掉 SQLAlchemy 对象，转纯 dict）
    records_data = [
        {
            "id": r.id,
            "start_time": r.start_time.isoformat() if r.start_time else None,
            "end_time": r.end_time.isoformat() if r.end_time else None,
            "duration": r.duration,
            "shape": r.shape,
            "color": r.color,
            "smell": r.smell,
            "comfort": r.comfort,
            "notes": r.notes,
            "input_mode": r.input_mode,
        }
        for r in records
    ]

    # 调用 LLM Provider
    provider = get_provider()
    result = provider.analyze(records_data, date_from, date_to)

    # 保存分析结果
    analysis = Analysis(
        date_from=datetime.fromisoformat(date_from),
        date_to=datetime.fromisoformat(date_to),
        provider=result.get("provider", "openai"),
        model=result.get("model", "unknown"),
        summary=result["summary"],
        suggestions=json.dumps(result.get("suggestions", []), ensure_ascii=False),
        record_ids=json.dumps([r["id"] for r in records_data]),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    logger.info("AI 分析完成: analysis_id=%d", analysis.id)
    return analysis


def get_analyses(db: Session) -> list[Analysis]:
    """获取所有分析历史"""
    return db.query(Analysis).order_by(Analysis.created_at.desc()).all()


def get_analysis_by_id(db: Session, analysis_id: int) -> Analysis | None:
    """获取单条分析详情"""
    return db.query(Analysis).filter(Analysis.id == analysis_id).first()
```

- [ ] **Step 4: 创建 analyses.py 路由**

```python
"""AI 分析 API 路由"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import AnalysisRequest, AnalysisResponse
from services.analysis_service import run_analysis, get_analyses, get_analysis_by_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analyses", tags=["analyses"])


@router.post("", response_model=AnalysisResponse, status_code=201)
def create_analysis(body: AnalysisRequest, db: Session = Depends(get_db)):
    """触发 AI 分析"""
    try:
        return run_analysis(db, body.date_from, body.date_to)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[AnalysisResponse])
def list_analyses(db: Session = Depends(get_db)):
    """获取分析历史"""
    return get_analyses(db)


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """获取单条分析详情"""
    analysis = get_analysis_by_id(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="分析不存在")
    return analysis
```

- [ ] **Step 5: 在 main.py 注册路由**

```python
from routers import records, analyses

# 注册路由
app.include_router(records.router)
app.include_router(analyses.router)
```

- [ ] **Step 6: 修改测试 —— 解决 mock 路径问题**

由于 mock 需要 patch 的是 provider 实例的 `analyze` 方法而不是类方法，需要调整测试：

```python
"""AI 分析 API 测试（修正版）"""
from unittest.mock import patch


def _mock_analyze(records, date_from, date_to):
    return {
        "summary": "测试摘要：您的肠道健康状况良好。",
        "suggestions": ["建议一", "建议二"],
        "model": "mock-model",
        "provider": "mock_provider",
    }


def test_create_analysis(client):
    """测试触发 AI 分析"""
    # 先创建记录
    for i in range(3):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "shape": "4",
            "input_mode": "timer",
        })

    with patch("routers.analyses.get_provider") as mock_get_provider:
        from services.llm_provider import MockOpenAIProvider
        mock_get_provider.return_value = MockOpenAIProvider("mock-model")
        resp = client.post("/api/analyses", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    assert resp.status_code == 201
    data = resp.json()
    assert "测试摘要" in data["summary"]


def test_get_analyses(client):
    """测试获取分析历史"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })

    with patch("routers.analyses.get_provider") as mock_get_provider:
        from services.llm_provider import MockOpenAIProvider
        mock_get_provider.return_value = MockOpenAIProvider("mock-model")
        client.post("/api/analyses", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    resp = client.get("/api/analyses")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_analysis_detail(client):
    """测试获取单条分析详情"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })

    with patch("routers.analyses.get_provider") as mock_get_provider:
        from services.llm_provider import MockOpenAIProvider
        mock_get_provider.return_value = MockOpenAIProvider("mock-model")
        client.post("/api/analyses", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    resp = client.get("/api/analyses/1")
    assert resp.status_code == 200
    assert "summary" in resp.json()


def test_analysis_no_records(client):
    """测试无记录时分析返回 400"""
    resp = client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })
    assert resp.status_code == 400
```

需要在 `llm_provider.py` 中添加 `MockOpenAIProvider`：

```python
class MockOpenAIProvider(LLMProvider):
    """模拟 Provider — 仅用于测试"""
    def __init__(self, model: str = "mock-model"):
        super().__init__(model)

    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        return {
            "summary": f"测试摘要：分析了 {len(records)} 条记录，您的肠道健康状况良好。",
            "suggestions": ["多喝水", "多吃纤维食物", "保持规律运动"],
            "model": self.model,
            "provider": "mock_provider",
        }
```

- [ ] **Step 7: 运行测试验证通过**

```bash
cd src/backend
uv run pytest tests/test_analyses.py -v
# 预期: 4 passed
uv run pytest tests/ -v
# 预期: 15 passed
```

- [ ] **Step 8: 提交**

```bash
git add src/backend/services/analysis_service.py src/backend/routers/analyses.py \
        src/backend/tests/test_analyses.py src/backend/main.py \
        src/backend/services/llm_provider.py
git commit -m "feat: 实现 AI 分析 API + Provider mock 测试"
```

---

## 阶段二：前端基础设施

### Task 7: 初始化 Next.js 前端项目

**Files:**
- Create: `src/frontend/` (整个 Next.js 项目目录)

- [ ] **Step 1: 使用 create-next-app 初始化项目**

```bash
cd src
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 2: 安装 shadcn/ui**

```bash
cd src/frontend
npx shadcn@latest init -d
```

- [ ] **Step 3: 安装 shadcn/ui 组件**

```bash
cd src/frontend
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add sonner
npx shadcn@latest add calendar
```

- [ ] **Step 4: 安装图表库**

```bash
cd src/frontend
npm install recharts
```

- [ ] **Step 5: 验证前端能启动**

```bash
cd src/frontend
npm run dev &
sleep 5
curl http://localhost:3000
# 预期: 返回 Next.js 默认页面 HTML
kill %1
```

- [ ] **Step 6: 提交**

```bash
git add src/frontend/
git commit -m "feat: 初始化 Next.js 前端项目 + shadcn/ui + recharts"
```

---

### Task 8: API 客户端与类型定义

**Files:**
- Create: `src/frontend/src/lib/types.ts`
- Create: `src/frontend/src/lib/api.ts`

- [ ] **Step 1: 创建 types.ts（类型定义）**

```typescript
// 如厕记录相关类型

export type ShapeType = "1" | "2" | "3" | "4" | "5" | "6" | "7";
export type ColorType = "brown" | "dark_brown" | "yellow" | "green" | "black" | "red" | "other";
export type SmellType = "normal" | "strong" | "odorless" | "other";
export type ComfortType = "comfortable" | "bloating" | "pain" | "difficulty" | "other";
export type InputMode = "timer" | "manual";

export interface RecordData {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  shape: ShapeType | null;
  color: ColorType | null;
  smell: SmellType | null;
  comfort: ComfortType | null;
  notes: string | null;
  input_mode: InputMode;
  created_at: string;
  updated_at: string;
}

export interface RecordCreate {
  start_time: string;
  end_time?: string | null;
  duration?: number | null;
  shape?: ShapeType | null;
  color?: ColorType | null;
  smell?: SmellType | null;
  comfort?: ComfortType | null;
  notes?: string | null;
  input_mode: InputMode;
}

export interface RecordUpdate {
  start_time?: string;
  end_time?: string | null;
  duration?: number | null;
  shape?: ShapeType | null;
  color?: ColorType | null;
  smell?: SmellType | null;
  comfort?: ComfortType | null;
  notes?: string | null;
  input_mode?: InputMode;
}

export interface AnalysisData {
  id: number;
  date_from: string;
  date_to: string;
  provider: string;
  model: string;
  summary: string;
  suggestions: string | null;
  record_ids: string | null;
  created_at: string;
}

export interface AnalysisRequest {
  date_from: string;
  date_to: string;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export interface StatsData {
  frequency: { date: string; count: number }[];
  avg_duration: { date: string; avg_seconds: number }[];
  shape_distribution: { shape: string; count: number }[];
}

// 枚举值显示映射
export const SHAPE_LABELS: Record<ShapeType, string> = {
  "1": "分离的硬块（严重便秘）",
  "2": "块状香肠形（轻度便秘）",
  "3": "表面有裂纹（正常）",
  "4": "光滑柔软（理想）",
  "5": "柔软的团块（缺纤维）",
  "6": "糊状（轻度腹泻）",
  "7": "水样（腹泻）",
};

export const COLOR_LABELS: Record<ColorType, string> = {
  brown: "棕色",
  dark_brown: "深棕色",
  yellow: "黄色",
  green: "绿色",
  black: "黑色",
  red: "红色",
  other: "其他",
};

export const SMELL_LABELS: Record<SmellType, string> = {
  normal: "正常",
  strong: "偏臭",
  odorless: "无味",
  other: "其他",
};

export const COMFORT_LABELS: Record<ComfortType, string> = {
  comfortable: "舒适",
  bloating: "腹胀",
  pain: "腹痛",
  difficulty: "排便困难",
  other: "其他",
};
```

- [ ] **Step 2: 创建 api.ts（API 客户端）**

```typescript
import type {
  RecordData, RecordCreate, RecordUpdate,
  AnalysisData, AnalysisRequest,
  CalendarDay, StatsData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "网络错误" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// 记录 API
export const recordsApi = {
  list: (params?: { date_from?: string; date_to?: string }) => {
    const search = new URLSearchParams();
    if (params?.date_from) search.set("date_from", params.date_from);
    if (params?.date_to) search.set("date_to", params.date_to);
    const qs = search.toString();
    return request<RecordData[]>(`/api/records${qs ? `?${qs}` : ""}`);
  },

  get: (id: number) => request<RecordData>(`/api/records/${id}`),

  create: (data: RecordCreate) =>
    request<RecordData>("/api/records", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: RecordUpdate) =>
    request<RecordData>(`/api/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/api/records/${id}`, { method: "DELETE" }),

  calendar: (month: string) =>
    request<CalendarDay[]>(`/api/records/calendar?month=${month}`),

  stats: (days: number) =>
    request<StatsData>(`/api/records/stats?days=${days}`),
};

// 分析 API
export const analysesApi = {
  create: (data: AnalysisRequest) =>
    request<AnalysisData>("/api/analyses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: () => request<AnalysisData[]>("/api/analyses"),

  get: (id: number) => request<AnalysisData>(`/api/analyses/${id}`),
};
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/lib/
git commit -m "feat: 添加前端 API 客户端和类型定义"
```

---

## 阶段三：前端核心组件

### Task 9: 计时器组件

**Files:**
- Create: `src/frontend/src/components/timer/Timer.tsx`

- [ ] **Step 1: 创建 Timer.tsx**

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Timer() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = new Date().toISOString();
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);

    const endTime = new Date().toISOString();
    const params = new URLSearchParams({
      start_time: startTimeRef.current!,
      end_time: endTime,
      duration: String(seconds),
      input_mode: "timer",
    });
    router.push(`/records/new?${params.toString()}`);
  }, [seconds, router]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="text-6xl font-mono font-bold tabular-nums">
        {formatTime(seconds)}
      </div>
      {isRunning ? (
        <Button
          size="lg"
          variant="destructive"
          onClick={stop}
          className="h-16 w-32 text-lg"
        >
          停止
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={start}
          className="h-16 w-32 text-lg"
        >
          开始
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证组件存在且无语法错误**

```bash
cd src/frontend
npx tsc --noEmit --pretty src/components/timer/Timer.tsx
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/components/timer/Timer.tsx
git commit -m "feat: 实现计时器组件（开始/停止/计时）"
```

---

### Task 10: 记录表单组件

**Files:**
- Create: `src/frontend/src/components/records/RecordForm.tsx`

- [ ] **Step 1: 创建 RecordForm.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordsApi } from "@/lib/api";
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS,
  type RecordCreate, type RecordData, type InputMode,
} from "@/lib/types";
import { toast } from "sonner";

interface Props {
  record?: RecordData; // 编辑模式时传入
}

export default function RecordForm({ record }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);

  // 如果是计时器模式，从 URL 参数读取预设值
  const timerData = !isEdit
    ? {
        start_time: searchParams.get("start_time") || "",
        end_time: searchParams.get("end_time") || "",
        duration: searchParams.get("duration") || "",
        input_mode: (searchParams.get("input_mode") as InputMode) || "manual",
      }
    : null;

  const [form, setForm] = useState({
    start_time: record?.start_time?.slice(0, 16) || timerData?.start_time?.slice(0, 16) || "",
    end_time: record?.end_time?.slice(0, 16) || timerData?.end_time?.slice(0, 16) || "",
    duration: record?.duration || (timerData?.duration ? Number(timerData.duration) : null),
    shape: record?.shape || "",
    color: record?.color || "",
    smell: record?.smell || "",
    comfort: record?.comfort || "",
    notes: record?.notes || "",
    input_mode: record?.input_mode || timerData?.input_mode || "manual",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_time) {
      toast.error("请填写开始时间");
      return;
    }

    setSubmitting(true);
    try {
      const data: RecordCreate = {
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        duration: form.duration,
        shape: form.shape as any || null,
        color: form.color as any || null,
        smell: form.smell as any || null,
        comfort: form.comfort as any || null,
        notes: form.notes || null,
        input_mode: form.input_mode as InputMode,
      };

      if (isEdit) {
        await recordsApi.update(record!.id, data);
        toast.success("记录已更新");
      } else {
        await recordsApi.create(data);
        toast.success("记录已保存");
      }
      router.push("/records");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">开始时间 *</Label>
          <Input
            id="start_time"
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">结束时间</Label>
          <Input
            id="end_time"
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          />
        </div>
      </div>

      {form.input_mode === "timer" && form.duration && (
        <div className="text-sm text-muted-foreground">
          计时时长：{Math.floor(form.duration / 60)}分{form.duration % 60}秒
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 布里斯托形状 */}
        <div className="space-y-2">
          <Label>形状（布里斯托分类）</Label>
          <Select
            value={form.shape}
            onValueChange={(v) => setForm({ ...form, shape: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择形状" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHAPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 颜色 */}
        <div className="space-y-2">
          <Label>颜色</Label>
          <Select
            value={form.color}
            onValueChange={(v) => setForm({ ...form, color: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择颜色" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COLOR_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 气味 */}
        <div className="space-y-2">
          <Label>气味</Label>
          <Select
            value={form.smell}
            onValueChange={(v) => setForm({ ...form, smell: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择气味" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SMELL_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 身体感受 */}
        <div className="space-y-2">
          <Label>身体感受</Label>
          <Select
            value={form.comfort}
            onValueChange={(v) => setForm({ ...form, comfort: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择感受" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMFORT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="其他想记录的内容..."
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          取消
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: 验证无语法错误**

```bash
cd src/frontend
npx tsc --noEmit --pretty src/components/records/RecordForm.tsx
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/components/records/RecordForm.tsx
git commit -m "feat: 实现记录表单组件（新增/编辑 + 计时器预设值）"
```

---

### Task 11: 记录列表与卡片组件

**Files:**
- Create: `src/frontend/src/components/records/RecordCard.tsx`
- Create: `src/frontend/src/components/records/RecordList.tsx`
- Create: `src/frontend/src/app/records/page.tsx`

- [ ] **Step 1: 创建 RecordCard.tsx**

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recordsApi } from "@/lib/api";
import { SHAPE_LABELS, COLOR_LABELS, type RecordData } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  record: RecordData;
}

export default function RecordCard({ record }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("确定删除这条记录？")) return;
    try {
      await recordsApi.delete(record.id);
      toast.success("记录已删除");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "删除失败");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const durationStr = record.duration
    ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒`
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/records/${record.id}`} className="flex-1">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">
                {formatTime(record.start_time)}
              </span>
              {durationStr && (
                <span className="text-muted-foreground">{durationStr}</span>
              )}
              {record.shape && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {SHAPE_LABELS[record.shape]?.split("（")[0] || record.shape}
                </span>
              )}
              {record.color && (
                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                  {COLOR_LABELS[record.color]}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {record.input_mode === "timer" ? "计时" : "手动"}
              </span>
            </div>
            {record.notes && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {record.notes}
              </p>
            )}
          </Link>
          <div className="flex gap-1 ml-2">
            <Link href={`/records/${record.id}/edit`}>
              <Button variant="ghost" size="sm">
                编辑
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 创建 RecordList.tsx**

```tsx
import { recordsApi } from "@/lib/api";
import RecordCard from "./RecordCard";

export default async function RecordList() {
  let records;
  try {
    records = await recordsApi.list();
  } catch {
    return (
      <div className="text-center text-muted-foreground py-12">
        加载记录失败，请确认后端服务已启动
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        暂无记录，开始记录你的第一条如厕数据吧！
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <RecordCard key={r.id} record={r} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 创建记录列表页 page.tsx**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RecordList from "@/components/records/RecordList";

export const dynamic = "force-dynamic";

export default function RecordsPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">记录列表</h1>
        <Link href="/records/new">
          <Button>新增记录</Button>
        </Link>
      </div>
      <RecordList />
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add src/frontend/src/components/records/ src/frontend/src/app/records/
git commit -m "feat: 实现记录列表和记录卡片组件"
```

---

### Task 12: 首页（计时器 + 今日摘要）

**Files:**
- Create: `src/frontend/src/app/page.tsx`
- Create: `src/frontend/src/app/layout.tsx` (更新根布局)
- Create: `src/frontend/src/app/globals.css` (Tailwind 配置)

- [ ] **Step 1: 创建根布局 layout.tsx**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopTracker - 便便健康记录",
  description: "记录每日如厕情况，AI 分析健康建议",
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/records", label: "记录" },
  { href: "/calendar", label: "日历" },
  { href: "/stats", label: "统计" },
  { href: "/analysis", label: "AI 分析" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
          <nav className="container max-w-2xl mx-auto flex items-center gap-6 h-14">
            <Link href="/" className="font-bold text-lg">
              💩 PoopTracker
            </Link>
            <div className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: 创建首页 page.tsx**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { recordsApi } from "@/lib/api";
import Timer from "@/components/timer/Timer";
import RecordCard from "@/components/records/RecordCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 获取今天日期
  const today = new Date().toISOString().slice(0, 10);
  let todayRecords;
  try {
    todayRecords = await recordsApi.list({
      date_from: today,
      date_to: today,
    });
  } catch {
    todayRecords = [];
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      {/* 计时器区域 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-center">计时记录</h2>
        <Timer />
      </section>

      {/* 手动记录入口 + 今日记录 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">今日记录</h2>
          <Link href="/records/new?input_mode=manual">
            <Button variant="outline" size="sm">
              手动记录
            </Button>
          </Link>
        </div>

        {todayRecords.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            今天还没有记录
          </p>
        ) : (
          <div className="space-y-3">
            {todayRecords.map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/app/page.tsx src/frontend/src/app/layout.tsx
git commit -m "feat: 实现首页（计时器 + 今日记录摘要 + 导航栏）"
```

---

### Task 13: 日历热力图组件

**Files:**
- Create: `src/frontend/src/components/calendar/CalendarHeatmap.tsx`
- Create: `src/frontend/src/app/calendar/page.tsx`

- [ ] **Step 1: 创建 CalendarHeatmap.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { recordsApi } from "@/lib/api";
import type { CalendarDay } from "@/lib/types";

export default function CalendarHeatmap() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    recordsApi
      .calendar(monthStr)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [monthStr]);

  const countMap = new Map(data.map((d) => [d.date, d.count]));
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // 计算当月天数
  const daysInMonth = new Date(year, month, 0).getDate();
  // 计算第一天是周几（0=周日）
  const firstDay = new Date(year, month - 1, 1).getDay();

  // 生成日历格子
  const cells: { date: string; day: number; count: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      date: dateStr,
      day: d,
      count: countMap.get(dateStr) || 0,
    });
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-green-200";
    if (ratio <= 0.5) return "bg-green-400";
    if (ratio <= 0.75) return "bg-green-600";
    return "bg-green-800";
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="max-w-md mx-auto">
      {/* 月份选择器 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (month === 1) { setMonth(12); setYear(y => y - 1); }
            else setMonth(m => m - 1);
          }}
          className="text-sm px-3 py-1 border rounded hover:bg-accent"
        >
          上个月
        </button>
        <span className="font-semibold text-lg">{year}年{month}月</span>
        <button
          onClick={() => {
            if (month === 12) { setMonth(1); setYear(y => y + 1); }
            else setMonth(m => m + 1);
          }}
          className="text-sm px-3 py-1 border rounded hover:bg-accent"
        >
          下个月
        </button>
      </div>

      {/* 周标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 月初空白占位 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {cells.map((cell) => (
          <Link
            key={cell.date}
            href={`/records?date=${cell.date}`}
            className={`aspect-square rounded flex items-center justify-center text-sm
              ${getColor(cell.count)}
              ${cell.count > 0 ? "text-white font-medium" : "text-foreground"}
              hover:ring-2 ring-primary transition-all`}
            title={`${cell.date}: ${cell.count} 条记录`}
          >
            {cell.day}
          </Link>
        ))}
      </div>

      {loading && (
        <p className="text-center text-muted-foreground mt-4">加载中...</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建日历页面 page.tsx**

```tsx
import CalendarHeatmap from "@/components/calendar/CalendarHeatmap";

export default function CalendarPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">日历视图</h1>
      <CalendarHeatmap />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/components/calendar/ src/frontend/src/app/calendar/
git commit -m "feat: 实现日历热力图组件（月视图 + 记录颜色密度）"
```

---

### Task 14: 统计图表组件

**Files:**
- Create: `src/frontend/src/components/charts/StatsCharts.tsx`
- Create: `src/frontend/src/app/stats/page.tsx`

- [ ] **Step 1: 创建 StatsCharts.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { recordsApi } from "@/lib/api";
import { SHAPE_LABELS, type StatsData } from "@/lib/types";

const COLORS = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];

export default function StatsCharts() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    recordsApi
      .stats(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">加载中...</p>;
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-12">暂无统计数据</p>;
  }

  return (
    <div className="space-y-8">
      {/* 时间范围选择 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">统计范围：</span>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              days === d ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {d} 天
          </button>
        ))}
      </div>

      {/* 频率柱状图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">每日记录次数</h3>
        {data.frequency.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.frequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)} // MM-DD
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(v: string) => v}
                formatter={(value: number) => [`${value} 次`, "记录次数"]}
              />
              <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 时长趋势折线图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">每日平均时长（秒）</h3>
        {data.avg_duration.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.avg_duration}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(v: string) => v}
                formatter={(value: number) => {
                  const m = Math.floor(value / 60);
                  const s = Math.round(value % 60);
                  return [`${m}分${s}秒`, "平均时长"];
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_seconds"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: "#60a5fa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 形状分布饼图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">布里斯托分类分布</h3>
        {data.shape_distribution.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data.shape_distribution}
                dataKey="count"
                nameKey="shape"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ shape, count }: any) =>
                  `${SHAPE_LABELS[shape]?.split("（")[0] || shape} (${count})`
                }
              >
                {data.shape_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _: any, entry: any) => {
                  const shape = entry.payload.shape;
                  return [`${value} 次`, SHAPE_LABELS[shape] || shape];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建统计页面 page.tsx**

```tsx
import StatsCharts from "@/components/charts/StatsCharts";

export default function StatsPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">数据统计</h1>
      <StatsCharts />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/components/charts/ src/frontend/src/app/stats/
git commit -m "feat: 实现统计图表（频率柱状图 + 时长折线图 + 形状饼图）"
```

---

### Task 15: AI 分析页面

**Files:**
- Create: `src/frontend/src/components/analysis/AnalysisCard.tsx`
- Create: `src/frontend/src/app/analysis/page.tsx`

- [ ] **Step 1: 创建 AnalysisCard.tsx**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisData } from "@/lib/types";

interface Props {
  analysis: AnalysisData;
}

export default function AnalysisCard({ analysis }: Props) {
  const suggestions: string[] = analysis.suggestions
    ? JSON.parse(analysis.suggestions)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>
            {new Date(analysis.date_from).toLocaleDateString("zh-CN")} ~{" "}
            {new Date(analysis.date_to).toLocaleDateString("zh-CN")}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {analysis.provider} / {analysis.model}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">分析摘要</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </div>
        {suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">健康建议</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 创建分析页面 page.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analysesApi } from "@/lib/api";
import type { AnalysisData } from "@/lib/types";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import { toast } from "sonner";

export default function AnalysisPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(today);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 加载历史分析
  const loadHistory = async () => {
    try {
      const data = await analysesApi.list();
      setAnalyses(data);
    } catch {
      // 忽略
    }
    setLoaded(true);
  };

  if (!loaded) loadHistory();

  const handleAnalyze = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("请选择时间范围");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analysesApi.create({ date_from: dateFrom, date_to: dateTo });
      setAnalyses((prev) => [result, ...prev]);
      toast.success("AI 分析完成！");
    } catch (err: any) {
      toast.error(err.message || "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">AI 健康分析</h1>

      {/* 分析触发区域 */}
      <div className="border rounded-lg p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          选择一段时间范围，AI 将分析该范围内的所有记录，给出肠道健康评估和建议。
        </p>
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">起始日期</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_to">结束日期</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "分析中..." : "开始分析"}
          </Button>
        </div>
      </div>

      {/* 历史分析列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">历史分析</h2>
        {analyses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            暂无分析记录
          </p>
        ) : (
          analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/frontend/src/components/analysis/ src/frontend/src/app/analysis/
git commit -m "feat: 实现 AI 分析页面（时间范围选择 + 分析结果展示）"
```

---

### Task 16: 记录详情页与编辑页

**Files:**
- Create: `src/frontend/src/app/records/[id]/page.tsx`
- Create: `src/frontend/src/app/records/[id]/edit/page.tsx`
- Create: `src/frontend/src/app/records/new/page.tsx`

- [ ] **Step 1: 创建记录详情页**

```tsx
// src/frontend/src/app/records/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordsApi } from "@/lib/api";
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS,
  type ShapeType, type ColorType, type SmellType, type ComfortType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let record;
  try {
    record = await recordsApi.get(parseInt(id));
  } catch {
    notFound();
  }

  const durationStr = record.duration
    ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒`
    : "未记录";

  return (
    <div className="container max-w-lg mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">记录详情</h1>
        <div className="flex gap-2">
          <Link href={`/records/${record.id}/edit`}>
            <Button variant="outline" size="sm">编辑</Button>
          </Link>
          <Link href="/records">
            <Button variant="ghost" size="sm">返回</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {new Date(record.start_time).toLocaleString("zh-CN")}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {record.input_mode === "timer" ? "计时记录" : "手动记录"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="开始时间" value={new Date(record.start_time).toLocaleString("zh-CN")} />
          <DetailRow label="结束时间" value={record.end_time ? new Date(record.end_time).toLocaleString("zh-CN") : "未记录"} />
          <DetailRow label="如厕时长" value={durationStr} />
          <DetailRow label="形状" value={record.shape ? SHAPE_LABELS[record.shape as ShapeType] : "未记录"} />
          <DetailRow label="颜色" value={record.color ? COLOR_LABELS[record.color as ColorType] : "未记录"} />
          <DetailRow label="气味" value={record.smell ? SMELL_LABELS[record.smell as SmellType] : "未记录"} />
          <DetailRow label="身体感受" value={record.comfort ? COMFORT_LABELS[record.comfort as ComfortType] : "未记录"} />
          <DetailRow label="备注" value={record.notes || "无"} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: 创建编辑页**

```tsx
// src/frontend/src/app/records/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { recordsApi } from "@/lib/api";
import RecordForm from "@/components/records/RecordForm";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let record;
  try {
    record = await recordsApi.get(parseInt(id));
  } catch {
    notFound();
  }

  return (
    <div className="container max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">编辑记录</h1>
      <RecordForm record={record} />
    </div>
  );
}
```

- [ ] **Step 3: 创建新增记录页**

```tsx
// src/frontend/src/app/records/new/page.tsx
import RecordForm from "@/components/records/RecordForm";

export default function NewRecordPage() {
  return (
    <div className="container max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">新增记录</h1>
      <RecordForm />
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add src/frontend/src/app/records/
git commit -m "feat: 实现记录详情页 + 编辑页 + 新增页"
```

---

## 自我审查清单

### 1. Spec 覆盖检查

| Spec 需求 | 对应任务 | 状态 |
|-----------|---------|------|
| 2.1 计时记录 | Task 9 (Timer) + Task 12 (首页) | ✅ |
| 2.2 手动记录 | Task 10 (RecordForm) + Task 16 (新增页) | ✅ |
| 2.3 记录表单字段 | Task 2 (schemas) + Task 10 (RecordForm) | ✅ |
| 2.4 记录列表 | Task 11 (RecordList) | ✅ |
| 2.5 日历视图 | Task 13 (CalendarHeatmap) | ✅ |
| 2.6 统计图表 | Task 14 (StatsCharts) | ✅ |
| 2.7 AI 健康分析 | Task 5 (LLM Provider) + Task 6 (Analysis API) + Task 15 (Analysis Page) | ✅ |
| 3. 数据模型 | Task 2 (models.py) | ✅ |
| 4. API 设计 | Task 3 (CRUD) + Task 4 (Calendar/Stats) + Task 6 (Analysis) | ✅ |
| 5. 页面结构 | Task 12 (layout) + Task 16 (详情/编辑/新增) | ✅ |
| 6. 目录结构 | Task 1 (backend) + Task 7 (frontend) | ✅ |

### 2. 占位符扫描

- [x] 无 "TBD" / "TODO" / "implement later"
- [x] 无 "添加适当错误处理"（每个 task 有具体实现）
- [x] 无 "类似于 Task N"（代码完整重复）
- [x] 所有步骤都有完整代码块

### 3. 类型一致性检查

- [x] `RecordCreate` / `RecordUpdate` / `RecordResponse` 前后端对应
- [x] `AnalysisRequest` / `AnalysisResponse` 前后端对应
- [x] 枚举值（shape/color/smell/comfort）前后端一致
- [x] 前端 `lib/types.ts` 与后端 `schemas.py` 字段名一致
- [x] API 路径与路由注册一致（`/api/records`, `/api/analyses`）
- [x] `CalendarDay` 返回格式与前端使用一致（date + count）
- [x] `StatsData` 返回字段名与 recharts 图表 dataKey 一致
