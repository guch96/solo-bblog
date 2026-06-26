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
