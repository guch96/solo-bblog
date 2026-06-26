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
