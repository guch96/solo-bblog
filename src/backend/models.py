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
    date_from = Column(DateTime, nullable=False)  # 分析起始日期
    date_to = Column(DateTime, nullable=False)  # 分析结束日期
    provider = Column(String(50), nullable=False)  # LLM 厂商名称
    model = Column(String(50), nullable=False)  # 模型名称
    summary = Column(Text, nullable=False)  # AI 分析摘要
    suggestions = Column(Text, nullable=True)  # 健康建议（JSON 字符串）
    record_ids = Column(Text, nullable=True)  # 关联记录 ID（JSON 数组字符串）
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
