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

    # 构造记录数据（转纯 dict）
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
