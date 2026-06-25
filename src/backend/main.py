"""PoopTracker 后端入口"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models  # noqa: F401 确保 SQLAlchemy 模型注册
from database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表，并兼容已有数据库的新增字段迁移"""
    Base.metadata.create_all(bind=engine)
    # 兼容已有数据库：手动迁移 create_all() 不会添加的新列
    with engine.connect() as conn:
        cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(records)")]
        if "process_feeling" not in cols:
            conn.exec_driver_sql(
                "ALTER TABLE records ADD COLUMN process_feeling VARCHAR(20)"
            )
            conn.commit()
    yield


app = FastAPI(title="PoopTracker API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import records, analyses  # noqa: E402

app.include_router(records.router)
app.include_router(analyses.router)


@app.get("/api/health")
def health_check():
    """健康检查端点"""
    return {"status": "ok"}
