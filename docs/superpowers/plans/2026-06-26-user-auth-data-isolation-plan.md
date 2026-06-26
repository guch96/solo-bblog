# 用户认证与数据隔离实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 PoopTracker 接入 JWT 用户认证，实现登录页面、权限控制和数据按用户隔离

**Architecture:** 后端 FastAPI 新增 User 模型 + JWT 鉴权依赖 + auth 路由，Record/Analysis 增加 user_id 外键；前端新增 /login 页面 + AuthContext，API 客户端注入 Bearer Token。单 JWT Token 7 天有效期。

**Tech Stack:** Python FastAPI + python-jose + passlib, Next.js + React Context, SQLite

## Global Constraints

- JWT Token 有效期 7 天，无双 Token / 无 refresh 机制
- 前端不提供注册页面，后端提供注册接口
- 测试账号：user1/123456, user2/123456（bcrypt 哈希存入）
- 现有旧数据（user_id 为 NULL 的记录和分析）全部关联到 user1
- JWT_SECRET 从 .env 读取，默认值 `pooptracker-local-dev-secret`
- 使用中文注释关键业务逻辑

---

### Task 1: 安装后端新依赖

**Files:**
- Modify: `src/backend/pyproject.toml`

- [ ] **Step 1: 添加 python-jose 和 passlib 依赖**

```toml
# pyproject.toml dependencies 中添加:
"python-jose[cryptography]>=3.3.0",
"passlib[bcrypt]>=1.7.4",
```

- [ ] **Step 2: 安装依赖**

```bash
cd src/backend && uv sync
```

- [ ] **Step 3: 验证安装**

```bash
cd src/backend && uv run python -c "from jose import jwt; from passlib.hash import bcrypt; print('OK')"
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/pyproject.toml src/backend/uv.lock
git commit -m "chore: 添加 JWT 认证依赖 python-jose + passlib"
```

---

### Task 2: 新增 User 模型 + Record/Analysis 增加 user_id

**Files:**
- Modify: `src/backend/models.py`

**Interfaces:**
- Produces: `User` model (id, username, password_hash, wechat_openid, created_at)
- Produces: `Record.user_id` (FK→users.id, not null, indexed) and `Analysis.user_id` (FK→users.id, not null, indexed)

- [ ] **Step 1: 修改 models.py**

```python
"""SQLAlchemy ORM 数据模型"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    wechat_openid = Column(String(100), unique=True, nullable=True)  # 预留小程序绑定
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Record(Base):
    """如厕记录表"""
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # 数据归属
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # 秒数
    shape = Column(String(20), nullable=True)  # 布里斯托分类 1-7
    color = Column(String(20), nullable=True)  # 颜色枚举值
    smell = Column(String(20), nullable=True)  # 气味枚举值
    comfort = Column(String(20), nullable=True)  # 身体感受枚举值
    process_feeling = Column(String(20), nullable=True)  # 排便过程感受
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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # 数据归属
    date_from = Column(DateTime, nullable=False)
    date_to = Column(DateTime, nullable=False)
    provider = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    summary = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=True)
    record_ids = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

- [ ] **Step 2: 验证无语法错误**

```bash
cd src/backend && uv run python -c "import models; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add src/backend/models.py
git commit -m "feat: 新增 User 模型 + Record/Analysis 增加 user_id 外键"
```

---

### Task 3: 新增认证 Schema 定义

**Files:**
- Modify: `src/backend/schemas.py`

**Interfaces:**
- Produces: `LoginRequest(username, password)`, `RegisterRequest(username, password)`, `TokenResponse(access_token, token_type, username, user_id)`

- [ ] **Step 1: 在 schemas.py 末尾追加认证 Schema**

```python
# ---- 认证 Schema ----
class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    """注册请求（仅后端使用，前端不暴露）"""
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """登录响应"""
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: 验证**

```bash
cd src/backend && uv run python -c "from schemas import LoginRequest, RegisterRequest, TokenResponse; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add src/backend/schemas.py
git commit -m "feat: 新增登录/注册/Token 的 Pydantic Schema"
```

---

### Task 4: 新增 JWT 鉴权依赖

**Files:**
- Create: `src/backend/dependencies/__init__.py`
- Create: `src/backend/dependencies/auth.py`

**Interfaces:**
- Produces: `get_current_user(db, token) -> User` — FastAPI 依赖，从 Authorization header 提取 JWT、解码、查库返回 User 对象，失败抛 401
- Consumes: `get_db` from `database.py`, `User` from `models.py`

- [ ] **Step 1: 创建 dependencies/__init__.py**

```bash
touch src/backend/dependencies/__init__.py
```

- [ ] **Step 2: 创建 dependencies/auth.py**

```python
"""JWT 鉴权依赖：从请求头提取 Bearer Token 并解析出当前用户"""
import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import User

logger = logging.getLogger(__name__)

# JWT 签名密钥：优先读环境变量，本地开发用默认值
JWT_SECRET = os.getenv("JWT_SECRET", "pooptracker-local-dev-secret")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7 天

oauth2_scheme = HTTPBearer()


def create_access_token(user_id: int) -> str:
    """生成 JWT access token，payload 包含 sub(user_id) 和 exp(过期时间)"""
    from datetime import datetime, timezone, timedelta
    expire = datetime.now(timezone.utc) + timedelta(seconds=TOKEN_EXPIRE_SECONDS)
    payload = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    logger.info("生成 JWT: user_id=%d expire=%s", user_id, expire.isoformat())
    return token


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
) -> User:
    """
    从 Authorization: Bearer <token> 提取并验证 JWT，
    返回对应的 User 对象，失败返回 401
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效: 缺少用户标识")
    except JWTError as e:
        logger.warning("JWT 解码失败: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效或已过期")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        logger.warning("Token 对应的用户不存在: user_id=%s", user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")

    return user
```

- [ ] **Step 3: 验证**

```bash
cd src/backend && uv run python -c "from dependencies.auth import get_current_user, create_access_token; print('OK')"
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/dependencies/__init__.py src/backend/dependencies/auth.py
git commit -m "feat: 新增 JWT 鉴权依赖 get_current_user + create_access_token"
```

---

### Task 5: 新增认证路由 (register/login/me)

**Files:**
- Create: `src/backend/routers/auth.py`

**Interfaces:**
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Consumes: `get_db`, `LoginRequest`, `RegisterRequest`, `TokenResponse`, `UserResponse`, `User`, `create_access_token`, `get_current_user`

- [ ] **Step 1: 创建 routers/auth.py**

```python
"""认证相关 API 路由：登录、注册、获取当前用户信息"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from database import get_db
from models import User
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from dependencies.auth import create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """注册新用户（仅后端暴露，前端不提供注册页面）"""
    # 检查用户名是否已存在
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="用户名已存在")

    # 创建用户，密码 bcrypt 哈希存储
    user = User(
        username=body.username,
        password_hash=bcrypt.hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("新用户注册: username=%s id=%d", user.username, user.id)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, username=user.username, user_id=user.id)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """用户登录：验证用户名密码，返回 JWT Token"""
    user = db.query(User).filter(User.username == body.username).first()
    if not user:
        logger.warning("登录失败: 用户不存在 username=%s", body.username)
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not bcrypt.verify(body.password, user.password_hash):
        logger.warning("登录失败: 密码错误 username=%s", body.username)
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    logger.info("登录成功: username=%s id=%d", user.username, user.id)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, username=user.username, user_id=user.id)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """获取当前登录用户信息（需携带 Bearer Token）"""
    return current_user
```

- [ ] **Step 2: 验证无语法错误**

```bash
cd src/backend && uv run python -c "from routers.auth import router; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add src/backend/routers/auth.py
git commit -m "feat: 新增认证路由 /api/auth (register/login/me)"
```

---

### Task 6: 注册 auth 路由 + 添加数据库迁移逻辑到 lifespan

**Files:**
- Modify: `src/backend/main.py`

**Interfaces:**
- Consumes: `User` model from models, `auth.router` from routers.auth, bcrypt from passlib.hash

- [ ] **Step 1: 修改 main.py**

```python
"""PoopTracker 后端入口"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models  # noqa: F401 确保 SQLAlchemy 模型注册
from database import engine, Base, SessionLocal
from passlib.hash import bcrypt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表、数据库迁移、生成测试账号、迁移旧数据"""
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        # ---- 兼容已有数据库：Record 新增字段 ----
        cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(records)")]
        if "process_feeling" not in cols:
            conn.exec_driver_sql("ALTER TABLE records ADD COLUMN process_feeling VARCHAR(20)")
            conn.commit()
            logger.info("迁移: records 表新增 process_feeling 列")

        if "user_id" not in cols:
            conn.exec_driver_sql("ALTER TABLE records ADD COLUMN user_id INTEGER REFERENCES users(id)")
            conn.commit()
            logger.info("迁移: records 表新增 user_id 列")

        # ---- 兼容已有数据库：Analysis 新增字段 ----
        a_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(analyses)")]
        if "user_id" not in a_cols:
            conn.exec_driver_sql("ALTER TABLE analyses ADD COLUMN user_id INTEGER REFERENCES users(id)")
            conn.commit()
            logger.info("迁移: analyses 表新增 user_id 列")

    # ---- 插入测试账号 ----
    db = SessionLocal()
    try:
        for username, password in [("user1", "123456"), ("user2", "123456")]:
            existing = db.query(models.User).filter(models.User.username == username).first()
            if not existing:
                user = models.User(
                    username=username,
                    password_hash=bcrypt.hash(password),
                )
                db.add(user)
                db.flush()  # 获取 user.id
                logger.info("测试账号创建: username=%s password=%s id=%d", username, password, user.id)
        db.commit()

        # ---- 迁移旧数据：将 user_id 为 NULL 的记录关联到 user1 ----
        user1 = db.query(models.User).filter(models.User.username == "user1").first()
        if user1:
            updated_records = (
                db.query(models.Record)
                .filter(models.Record.user_id.is_(None))
                .update({"user_id": user1.id})
            )
            updated_analyses = (
                db.query(models.Analysis)
                .filter(models.Analysis.user_id.is_(None))
                .update({"user_id": user1.id})
            )
            db.commit()
            if updated_records or updated_analyses:
                logger.info("旧数据迁移: %d 条记录 → user1, %d 条分析 → user1", updated_records, updated_analyses)
    finally:
        db.close()

    yield


app = FastAPI(title="PoopTracker API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import records, analyses, auth  # noqa: E402

app.include_router(records.router)
app.include_router(analyses.router)
app.include_router(auth.router)


@app.get("/api/health")
def health_check():
    """健康检查端点"""
    return {"status": "ok"}
```

- [ ] **Step 2: 验证服务能启动**

```bash
cd src/backend && timeout 5 uv run uvicorn main:app --port 8000 || true
```

- [ ] **Step 3: 验证测试账号已创建**

```bash
cd src/backend && uv run python -c "
from database import SessionLocal
from models import User
db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f'  id={u.id} username={u.username}')
db.close()
"
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/main.py
git commit -m "feat: 注册 auth 路由 + lifespan 增加用户迁移与测试账号初始化"
```

---

### Task 7: 记录路由和数据服务增加用户隔离

**Files:**
- Modify: `src/backend/routers/records.py`
- Modify: `src/backend/services/record_service.py`

**Interfaces:**
- Consumes: `get_current_user` from `dependencies.auth`
- All CRUD + calendar + stats now filter by `current_user.id`

- [ ] **Step 1: 修改 routers/records.py**

```python
"""记录相关 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User  # 新增
from schemas import RecordCreate, RecordUpdate, RecordResponse
from services.record_service import (
    create_record, get_records, get_record_by_id, update_record, delete_record,
    get_calendar_data, get_stats,
)
from dependencies.auth import get_current_user  # 新增

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("", response_model=RecordResponse, status_code=201)
def create(
    data: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """创建一条如厕记录"""
    return create_record(db, data, current_user.id)


@router.get("", response_model=list[RecordResponse])
def list_records(
    date_from: str | None = Query(None, description="起始日期 YYYY-MM-DD"),
    date_to: str | None = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取记录列表，支持日期范围筛选"""
    return get_records(db, date_from, date_to, current_user.id)


@router.get("/calendar", response_model=list[dict])
def calendar_data(
    month: str = Query(..., description="月份 YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取日历热力图数据"""
    return get_calendar_data(db, month, current_user.id)


@router.get("/stats", response_model=dict)
def stats_data(
    days: int = Query(7, description="统计天数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取统计数据"""
    return get_stats(db, days, current_user.id)


@router.get("/{record_id}", response_model=RecordResponse)
def get_one(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取单条记录详情"""
    record = get_record_by_id(db, record_id, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put("/{record_id}", response_model=RecordResponse)
def update(
    record_id: int,
    data: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """更新一条记录"""
    record = update_record(db, record_id, data, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/{record_id}", status_code=204)
def delete(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """删除一条记录"""
    if not delete_record(db, record_id, current_user.id):
        raise HTTPException(status_code=404, detail="记录不存在")
```

- [ ] **Step 2: 修改 services/record_service.py — 所有函数增加 user_id 参数和过滤**

```python
"""记录业务逻辑"""
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from models import Record
from schemas import RecordCreate, RecordUpdate

logger = logging.getLogger(__name__)


def create_record(db: Session, data: RecordCreate, user_id: int) -> Record:
    """创建一条如厕记录"""
    logger.info("创建记录: user_id=%d input_mode=%s start_time=%s", user_id, data.input_mode, data.start_time)
    record = Record(
        user_id=user_id,
        start_time=data.start_time,
        end_time=data.end_time,
        duration=data.duration,
        shape=data.shape.value if data.shape else None,
        color=data.color.value if data.color else None,
        smell=data.smell.value if data.smell else None,
        comfort=data.comfort.value if data.comfort else None,
        process_feeling=data.process_feeling.value if data.process_feeling else None,
        notes=data.notes,
        input_mode=data.input_mode.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("记录创建成功: id=%d", record.id)
    return record


def get_records(db: Session, date_from: str | None, date_to: str | None, user_id: int) -> list[Record]:
    """获取记录列表，支持按日期范围筛选，按用户隔离"""
    query = db.query(Record).filter(Record.user_id == user_id).order_by(Record.start_time.desc())
    if date_from:
        query = query.filter(Record.start_time >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Record.start_time <= datetime.fromisoformat(date_to))
    return query.all()


def get_record_by_id(db: Session, record_id: int, user_id: int) -> Record | None:
    """获取单条记录详情，按用户隔离"""
    return db.query(Record).filter(Record.id == record_id, Record.user_id == user_id).first()


def update_record(db: Session, record_id: int, data: RecordUpdate, user_id: int) -> Record | None:
    """更新记录（部分更新），按用户隔离"""
    logger.info("更新记录: id=%d user_id=%d", record_id, user_id)
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field in ["shape", "color", "smell", "comfort", "process_feeling", "input_mode"]:
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].value
    for key, value in update_data.items():
        setattr(record, key, value)
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    logger.info("记录更新成功: id=%d", record.id)
    return record


def delete_record(db: Session, record_id: int, user_id: int) -> bool:
    """删除记录，按用户隔离"""
    logger.info("删除记录: id=%d user_id=%d", record_id, user_id)
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return False
    db.delete(record)
    db.commit()
    logger.info("记录删除成功: id=%d", record_id)
    return True


def get_calendar_data(db: Session, month: str, user_id: int) -> list[dict]:
    """获取指定月份的日历热力图数据，按用户隔离"""
    logger.info("查询日历数据: month=%s user_id=%d", month, user_id)
    year, month_num = month.split("-")
    records = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(
            Record.user_id == user_id,
            func.strftime("%Y", Record.start_time) == year,
            func.strftime("%m", Record.start_time) == month_num,
        )
        .group_by(func.date(Record.start_time))
        .all()
    )
    return [{"date": r.date, "count": r.count} for r in records]


def get_stats(db: Session, days: int, user_id: int) -> dict:
    """获取统计数据：频率、时长趋势、形状分布，按用户隔离"""
    logger.info("查询统计数据: days=%d user_id=%d", days, user_id)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    frequency = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(Record.user_id == user_id, Record.start_time >= cutoff)
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    avg_duration = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.avg(Record.duration).label("avg_seconds"),
        )
        .filter(Record.user_id == user_id, Record.start_time >= cutoff, Record.duration.isnot(None))
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    shape_dist = (
        db.query(Record.shape, func.count(Record.id).label("count"))
        .filter(Record.user_id == user_id, Record.shape.isnot(None))
        .group_by(Record.shape)
        .all()
    )

    total_count = (
        db.query(func.count(Record.id))
        .filter(Record.user_id == user_id, Record.start_time >= cutoff)
        .scalar()
    )

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    this_week_count = (
        db.query(func.count(Record.id))
        .filter(Record.user_id == user_id, Record.start_time >= week_start)
        .scalar()
    )

    avg_dur_row = (
        db.query(func.avg(Record.duration))
        .filter(Record.user_id == user_id, Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    avg_duration_seconds = round(avg_dur_row, 1) if avg_dur_row else 0

    most_common = (
        db.query(Record.shape, func.count(Record.id).label("cnt"))
        .filter(Record.user_id == user_id, Record.shape.isnot(None), Record.start_time >= cutoff)
        .group_by(Record.shape)
        .order_by(func.count(Record.id).desc())
        .first()
    )

    shape_labels = {"1": "硬块状", "2": "香肠状", "3": "条状裂纹", "4": "光滑条状", "5": "软团状", "6": "糊状", "7": "水样状"}

    abnormal_days = (
        db.query(func.count(func.distinct(func.date(Record.start_time))))
        .filter(
            Record.user_id == user_id,
            Record.start_time >= cutoff,
            (Record.color.isnot(None) & (Record.color != "brown"))
            | (Record.shape.in_(["1", "2", "6", "7"])),
        )
        .scalar()
    ) or 0

    record_days = len(frequency) if frequency else 0
    avg_frequency_per_day = round(total_count / days, 1) if days > 0 else 0

    longest_row = (
        db.query(func.max(Record.duration))
        .filter(Record.user_id == user_id, Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    longest_duration_seconds = round(longest_row, 1) if longest_row else 0

    record_dates = [r.date for r in frequency]
    streak_days = 0
    if record_dates:
        from datetime import date as date_type
        streak_days = 1
        max_streak = 1
        sorted_dates = sorted(record_dates)
        for i in range(1, len(sorted_dates)):
            prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d").date()
            curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d").date()
            if (curr - prev).days == 1:
                streak_days += 1
                max_streak = max(max_streak, streak_days)
            else:
                streak_days = 1
        streak_days = max_streak

    summary = {
        "total_count": total_count or 0,
        "this_week_count": this_week_count or 0,
        "avg_duration_seconds": avg_duration_seconds,
        "most_common_shape": most_common.shape if most_common else None,
        "most_common_shape_label": shape_labels.get(most_common.shape, "未知") if most_common else None,
        "abnormal_days": abnormal_days,
        "avg_frequency_per_day": avg_frequency_per_day,
        "longest_duration_seconds": longest_duration_seconds,
        "record_days": record_days,
        "streak_days": streak_days,
    }

    return {
        "frequency": [{"date": r.date, "count": r.count} for r in frequency],
        "avg_duration": [{"date": r.date, "avg_seconds": round(r.avg_seconds, 1)} for r in avg_duration],
        "shape_distribution": [{"shape": r.shape, "count": r.count} for r in shape_dist],
        "summary": summary,
    }
```

- [ ] **Step 3: 验证**

```bash
cd src/backend && uv run python -c "
from routers.records import router
from services.record_service import create_record, get_records, get_record_by_id, update_record, delete_record, get_calendar_data, get_stats
print('OK')
"
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/routers/records.py src/backend/services/record_service.py
git commit -m "feat: 记录 API 增加用户鉴权隔离，所有查询按 user_id 过滤"
```

---

### Task 8: 分析路由和服务增加用户隔离

**Files:**
- Modify: `src/backend/routers/analyses.py`
- Modify: `src/backend/services/analysis_service.py`

**Interfaces:**
- Consumes: `get_current_user` from `dependencies.auth`

- [ ] **Step 1: 修改 routers/analyses.py**

```python
"""AI 分析 API 路由"""
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Record, Analysis  # 新增 User
from schemas import AnalysisRequest, AnalysisResponse
from services.analysis_service import run_analysis, get_analyses, get_analysis_by_id
from services.llm_provider import get_provider
from dependencies.auth import get_current_user  # 新增

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analyses", tags=["analyses"])


@router.post("", response_model=AnalysisResponse, status_code=201)
def create_analysis(
    body: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """触发 AI 分析"""
    try:
        return run_analysis(db, body.date_from, body.date_to, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[AnalysisResponse])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取分析历史"""
    return get_analyses(db, current_user.id)


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取单条分析详情"""
    analysis = get_analysis_by_id(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="分析不存在")
    return analysis


@router.post("/stream")
def create_analysis_stream(
    body: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """触发 AI 流式分析（SSE）"""
    date_from = body.date_from
    date_to = body.date_to

    records = (
        db.query(Record)
        .filter(
            Record.user_id == current_user.id,  # 用户隔离
            Record.start_time >= datetime.fromisoformat(date_from),
            Record.start_time <= datetime.fromisoformat(date_to + "T23:59:59"),
        )
        .all()
    )

    if not records:
        raise HTTPException(status_code=400, detail="该时间范围内没有记录，无法分析")

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
            "process_feeling": r.process_feeling,
            "notes": r.notes,
            "input_mode": r.input_mode,
        }
        for r in records
    ]

    provider = get_provider()

    def generate():
        summary_parts: list[str] = []
        suggestions: list[str] = []

        try:
            for sse_event in provider.analyze_stream(records_data, date_from, date_to):
                if sse_event.startswith("data: "):
                    payload_str = sse_event[len("data: "):].strip()
                    try:
                        payload = json.loads(payload_str)
                        if payload["type"] == "summary_chunk":
                            summary_parts.append(payload["content"])
                        elif payload["type"] == "suggestions":
                            suggestions = payload["content"]
                    except json.JSONDecodeError:
                        pass
                yield sse_event

            summary = "".join(summary_parts)
            analysis = Analysis(
                user_id=current_user.id,  # 关联当前用户
                date_from=datetime.fromisoformat(date_from),
                date_to=datetime.fromisoformat(date_to),
                provider=provider.provider_name,
                model=provider.model,
                summary=summary,
                suggestions=json.dumps(suggestions, ensure_ascii=False),
                record_ids=json.dumps([r["id"] for r in records_data]),
            )
            db.add(analysis)
            db.commit()
            logger.info("流式分析持久化完成: id=%d user_id=%d", analysis.id, current_user.id)
        except Exception as e:
            logger.error("流式分析异常: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

- [ ] **Step 2: 修改 services/analysis_service.py — 增加 user_id 参数**

所有 `run_analysis`、`get_analyses`、`get_analysis_by_id` 增加 `user_id: int` 参数，并在查询中添加 `Record.user_id == user_id` 或 `Analysis.user_id == user_id` 过滤。创建 Analysis 时设置 `user_id=user_id`。

```python
def run_analysis(db: Session, date_from: str, date_to: str, user_id: int) -> Analysis:
    """执行 AI 分析并保存结果，按用户隔离"""
    logger.info("开始 AI 分析: %s ~ %s user_id=%d", date_from, date_to, user_id)

    records = (
        db.query(Record)
        .filter(
            Record.user_id == user_id,
            Record.start_time >= datetime.fromisoformat(date_from),
            Record.start_time <= datetime.fromisoformat(date_to + "T23:59:59"),
        )
        .all()
    )

    if not records:
        raise ValueError("该时间范围内没有记录，无法分析")

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
            "process_feeling": r.process_feeling,
            "notes": r.notes,
            "input_mode": r.input_mode,
        }
        for r in records
    ]

    provider = get_provider()
    result = provider.analyze(records_data, date_from, date_to)

    analysis = Analysis(
        user_id=user_id,
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
    logger.info("AI 分析完成: analysis_id=%d user_id=%d", analysis.id, user_id)
    return analysis


def get_analyses(db: Session, user_id: int) -> list[Analysis]:
    """获取所有分析历史，按用户隔离"""
    return (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )


def get_analysis_by_id(db: Session, analysis_id: int, user_id: int) -> Analysis | None:
    """获取单条分析详情，按用户隔离"""
    return (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == user_id)
        .first()
    )
```

- [ ] **Step 3: 验证**

```bash
cd src/backend && uv run python -c "
from routers.analyses import router
from services.analysis_service import run_analysis, get_analyses, get_analysis_by_id
print('OK')
"
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/routers/analyses.py src/backend/services/analysis_service.py
git commit -m "feat: 分析 API 增加用户鉴权隔离，所有查询按 user_id 过滤"
```

---

### Task 9: 更新后端测试 — 适配用户鉴权

**Files:**
- Modify: `src/backend/tests/conftest.py`
- Modify: `src/backend/tests/test_records.py`
- Modify: `src/backend/tests/test_analyses.py`
- Modify: `src/backend/tests/test_calendar_stats.py`

**Interfaces:**
- Consumes: `auth_headers` fixture from conftest, auth routes

- [ ] **Step 1: 修改 conftest.py — 添加 auth_headers fixture 和测试用户**

```python
"""pytest fixtures"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from passlib.hash import bcrypt
from models import User

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
    import models  # noqa: F401
    Base.metadata.create_all(bind=test_engine)

    # 创建测试用户
    db = TestSessionLocal()
    user = User(username="testuser", password_hash=bcrypt.hash("123456"))
    db.add(user)
    db.commit()
    db.close()

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


@pytest.fixture
def auth_headers(client):
    """返回带 Bearer Token 的请求头字典"""
    resp = client.post("/api/auth/login", json={"username": "testuser", "password": "123456"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 2: 修改 test_records.py — 所有请求添加 auth_headers**

```python
"""记录 API 测试"""


def test_create_record(client, auth_headers):
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
    resp = client.post("/api/records", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] == 1
    assert data["shape"] == "4"
    assert data["input_mode"] == "timer"


def test_get_records(client, auth_headers):
    """测试获取记录列表"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    resp = client.get("/api/records", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_record_by_id(client, auth_headers):
    """测试获取单条记录"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    resp = client.get("/api/records/1", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == 1


def test_update_record(client, auth_headers):
    """测试更新记录"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    update = {"shape": "2", "notes": "感觉不太对"}
    resp = client.put("/api/records/1", json=update, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["shape"] == "2"


def test_delete_record(client, auth_headers):
    """测试删除记录"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    resp = client.delete("/api/records/1", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get("/api/records/1", headers=auth_headers)
    assert resp.status_code == 404


def test_create_record_with_process_feeling(client, auth_headers):
    """测试创建包含排便过程感受的记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00", "input_mode": "timer",
        "process_feeling": "smooth",
    }
    resp = client.post("/api/records", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["process_feeling"] == "smooth"


def test_update_record_process_feeling(client, auth_headers):
    """测试更新排便过程感受"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00", "input_mode": "manual",
    }, headers=auth_headers)
    resp = client.put("/api/records/1", json={"process_feeling": "urgent"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["process_feeling"] == "urgent"


def test_record_has_all_process_feeling_values(client, auth_headers):
    """测试所有过程感受枚举值都能正确存储"""
    values = ["smooth", "urgent", "straining", "incomplete", "intermittent", "normal", "other"]
    for v in values:
        payload = {"start_time": "2026-06-24T08:00:00", "process_feeling": v, "input_mode": "manual"}
        resp = client.post("/api/records", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["process_feeling"] == v


def test_record_unauthorized(client):
    """测试未登录时访问需要鉴权的端点返回 401"""
    resp = client.get("/api/records")
    assert resp.status_code == 401 or resp.status_code == 403


def test_record_user_isolation(client, auth_headers):
    """测试用户数据隔离：用户 A 的记录不被用户 B 访问"""
    # 用户 testuser 创建一条记录
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00", "input_mode": "manual",
    }, headers=auth_headers)

    # 注册另一个用户并创建记录
    client.post("/api/auth/register", json={"username": "other", "password": "123456"})
    resp2 = client.post("/api/auth/login", json={"username": "other", "password": "123456"})
    other_token = resp2.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # other 用户看不到 testuser 的记录
    resp = client.get("/api/records", headers=other_headers)
    assert len(resp.json()) == 0

    # testuser 仍然能看到自己的记录
    resp = client.get("/api/records", headers=auth_headers)
    assert len(resp.json()) == 1
```

- [ ] **Step 3: 修改 test_analyses.py 和 test_calendar_stats.py 添加 auth_headers**

类似地给所有测试函数增加 `auth_headers` 参数，在请求中传入 `headers=auth_headers`。

- [ ] **Step 4: 运行测试验证全部通过**

```bash
cd src/backend && uv run pytest -v
```

- [ ] **Step 5: Commit**

```bash
git add src/backend/tests/
git commit -m "test: 更新后端测试适配用户鉴权，新增 401 和数据隔离测试"
```

---

### Task 10: 前端 — 创建 Auth Context

**Files:**
- Create: `src/frontend/src/hooks/useAuth.tsx`

**Interfaces:**
- Produces: `AuthProvider` (React Context Provider), `useAuth()` hook
- Consumes: `/api/auth/login`, `/api/auth/me`

- [ ] **Step 1: 创建 useAuth.tsx**

```typescript
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "pooptracker_token";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：从 localStorage 读取 token 并验证
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("token invalid");
        })
        .then((data) => {
          setToken(savedToken);
          setUser({ id: data.id, username: data.username });
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "登录失败" }));
      throw new Error(err.detail || "登录失败");
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser({ id: data.user_id, username: data.username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token && !!user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd src/frontend && npx tsc --noEmit src/hooks/useAuth.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/hooks/useAuth.tsx
git commit -m "feat: 新增 AuthContext + useAuth hook（登录/登出/token管理）"
```

---

### Task 11: 前端 — 创建登录页面

**Files:**
- Create: `src/frontend/src/app/login/page.tsx`

**Interfaces:**
- Consumes: `useAuth()` hook

- [ ] **Step 1: 创建 login/page.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("请输入用户名和密码");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("登录成功");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <span className="text-4xl mb-2 block">💩</span>
          <CardTitle className="text-xl font-extrabold">
            PoopTracker
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            登录以继续记录
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">用户名</label>
              <Input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">密码</label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登 录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd src/frontend && npx tsc --noEmit src/app/login/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/app/login/page.tsx
git commit -m "feat: 新增登录页面 /login（用户名+密码+JWT自动存储）"
```

---

### Task 12: 前端 — 修改 API 客户端注入 Token

**Files:**
- Modify: `src/frontend/src/lib/api.ts`

- [ ] **Step 1: 修改 request() 函数，自动注入 Authorization header**

在 `request<T>()` 函数体中，`headers` 初始化后增加：

```typescript
const token = typeof window !== "undefined" ? localStorage.getItem("pooptracker_token") : null;
if (token) {
  (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
}
```

具体修改：将原来的：

```typescript
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
```

改为：

```typescript
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // 自动注入 JWT Token（浏览器端）
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pooptracker_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    headers,
    ...options,
  });
```

- [ ] **Step 2: 验证 TypeScript**

```bash
cd src/frontend && npx tsc --noEmit src/lib/api.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/lib/api.ts
git commit -m "feat: API 客户端自动注入 JWT Bearer Token"
```

---

### Task 13: 前端 — 修改根布局增加路由保护和用户信息展示

**Files:**
- Modify: `src/frontend/src/app/layout.tsx`
- Modify: `src/frontend/src/components/nav/DesktopNav.tsx`

**Interfaces:**
- Consumes: `AuthProvider`, `useAuth`

- [ ] **Step 1: 创建 ClientLayout 组件包裹鉴权逻辑，修改 layout.tsx**

因为根 layout 是 Server Component，需要抽一个 Client Component 处理路由保护：

```typescript
"use client";
// 保存为 src/frontend/src/components/AuthGuard.tsx

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/nav/DesktopNav";
import BottomNav from "@/components/nav/BottomNav";
import { Toaster } from "@/components/ui/sonner";

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
    if (!isLoading && isAuthenticated && isLoginPage) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">加载中...</span>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <body className="min-h-screen bg-background text-foreground antialiased pb-20 md:pb-0">
      <DesktopNav />
      <main className="container max-w-2xl mx-auto px-5 py-6 md:py-8">
        {children}
      </main>
      <BottomNav />
      <Toaster />
    </body>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuardInner>{children}</AuthGuardInner>
    </AuthProvider>
  );
}
```

**修改 layout.tsx**：

```typescript
import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopTracker - 便便健康记录",
  description: "记录每日如厕情况，AI 分析健康建议",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <AuthGuard>{children}</AuthGuard>
    </html>
  );
}
```

- [ ] **Step 2: 修改 DesktopNav — 显示用户名和退出按钮**

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/calendar", label: "日历" },
  { href: "/records", label: "记录" },
  { href: "/stats", label: "统计" },
  { href: "/analysis", label: "AI 分析" },
];

export default function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="hidden md:block border-b sticky top-0 bg-background/80 backdrop-blur-xl z-50">
      <nav className="container max-w-2xl mx-auto flex items-center h-14 px-5">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg mr-8 shrink-0">
          <span className="text-xl">💩</span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PoopTracker
          </span>
        </Link>
        <div className="flex gap-1 flex-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* 用户信息 + 退出 */}
        {user && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">{user.username}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录">
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: 验证前端构建**

```bash
cd src/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/app/layout.tsx src/frontend/src/components/AuthGuard.tsx src/frontend/src/components/nav/DesktopNav.tsx
git commit -m "feat: 根布局增加路由保护 + DesktopNav 显示用户名和退出"
```

---

### Task 14: 添加 JWT_SECRET 到 .env

**Files:**
- Modify: `src/backend/.env`

- [ ] **Step 1: 在 .env 末尾追加 JWT_SECRET**

```
JWT_SECRET=pooptracker-local-dev-secret
```

- [ ] **Step 2: Commit**

```bash
git add src/backend/.env
git commit -m "chore: .env 增加 JWT_SECRET 配置"
```

---

### Task 15: 端到端验证

- [ ] **Step 1: 启动后端**

```bash
cd src/backend && uv run uvicorn main:app --port 8000 --reload
```

- [ ] **Step 2: 在新终端中测试登录接口**

```bash
# 测试 user1 登录
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123456"}'
# 预期返回: {"access_token":"eyJ...","token_type":"bearer","username":"user1"}
```

- [ ] **Step 3: 测试带 Token 访问受保护接口**

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"123456"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl http://localhost:8000/api/records -H "Authorization: Bearer $TOKEN"
# 预期返回: [] 或现有记录列表
```

- [ ] **Step 4: 测试无 Token 访问被拒绝**

```bash
curl -v http://localhost:8000/api/records
# 预期返回: 401 或 403
```

- [ ] **Step 5: 启动前端验证登录页面**

```bash
cd src/frontend && npm run dev
# 打开 http://localhost:3000 应自动跳转到 /login
# 使用 user1/123456 登录成功应跳转到首页
# 刷新页面应保持登录状态
```

- [ ] **Step 6: 最终 Commit（如有调整）**

```bash
git add -A
git commit -m "chore: 端到端验证通过后的最终调整"
```
