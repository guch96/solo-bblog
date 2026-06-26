"""AI 分析业务逻辑"""
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from models import Analysis, Record
from services.llm_provider import get_provider

logger = logging.getLogger(__name__)


def run_analysis(db: Session, date_from: str, date_to: str, user_id: int) -> Analysis:
    """执行 AI 分析并保存结果，按用户隔离"""
    logger.info("开始 AI 分析: %s ~ %s user_id=%d", date_from, date_to, user_id)

    # 查询时间范围内的记录（按用户隔离）
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

    # 构造记录数据（纯 dict，供 LLM Provider 消费）
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

    # 调用 LLM Provider
    provider = get_provider()
    result = provider.analyze(records_data, date_from, date_to)

    # 保存分析结果（关联当前用户）
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
