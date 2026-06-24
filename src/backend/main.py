"""PoopTracker 后端入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models  # noqa: F401 确保 SQLAlchemy 模型注册
from database import engine, Base

app = FastAPI(title="PoopTracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init_db():
    """应用启动时自动创建数据库表"""
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    """健康检查端点"""
    return {"status": "ok"}
