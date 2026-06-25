"""AI 分析 API 路由"""
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Record, Analysis
from schemas import AnalysisRequest, AnalysisResponse
from services.analysis_service import run_analysis, get_analyses, get_analysis_by_id
from services.llm_provider import get_provider

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


@router.post("/stream")
def create_analysis_stream(body: AnalysisRequest, db: Session = Depends(get_db)):
    """触发 AI 流式分析（SSE）"""
    date_from = body.date_from
    date_to = body.date_to

    # 查询时间范围内的记录（与 analysis_service.run_analysis 保持查询逻辑一致）
    records = (
        db.query(Record)
        .filter(
            Record.start_time >= datetime.fromisoformat(date_from),
            Record.start_time <= datetime.fromisoformat(date_to + "T23:59:59"),
        )
        .all()
    )

    if not records:
        raise HTTPException(status_code=400, detail="该时间范围内没有记录，无法分析")

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

    provider = get_provider()

    def generate():
        """SSE 生成器 —— 逐事件推送流式分析结果，流结束后持久化到 DB"""
        summary_parts: list[str] = []
        suggestions: list[str] = []

        try:
            for sse_event in provider.analyze_stream(records_data, date_from, date_to):
                # 解析 SSE 事件，收集 summary 和 suggestions 用于最终持久化
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

            # 流结束后保存分析结果到数据库
            summary = "".join(summary_parts)
            analysis = Analysis(
                date_from=datetime.fromisoformat(date_from),
                date_to=datetime.fromisoformat(date_to),
                provider="openai",
                model=provider.model,
                summary=summary,
                suggestions=json.dumps(suggestions, ensure_ascii=False),
                record_ids=json.dumps([r["id"] for r in records_data]),
            )
            db.add(analysis)
            db.commit()
            logger.info("流式分析持久化完成: id=%d", analysis.id)
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
