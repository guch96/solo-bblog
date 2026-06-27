"""AI 分析 API 路由"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Record, Analysis
from schemas import AnalysisRequest, AnalysisResponse
from services.analysis_service import run_analysis, get_analyses, get_analysis_by_id
from services.llm_provider import get_provider
from services.record_service import _parse_local_datetime
from dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analyses", tags=["analyses"])


@router.post("", response_model=AnalysisResponse, status_code=201)
def create_analysis(
    body: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """触发 AI 分析"""
    try:
        return run_analysis(db, body.date_from, body.date_to, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[AnalysisResponse])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取分析历史"""
    return get_analyses(db, current_user.id)


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
):
    """触发 AI 流式分析（SSE）"""
    date_from = body.date_from
    date_to = body.date_to

    records = (
        db.query(Record)
        .filter(
            Record.user_id == current_user.id,
            Record.start_time >= _parse_local_datetime(date_from),
            Record.start_time <= _parse_local_datetime(date_to, end_of_day=True),
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

        # 注意：db 由 FastAPI Depends(get_db) 注入，其生命周期绑定到整个请求-响应周期。
        # StreamingResponse 的 generator 在 response 完全发送后才结束迭代，
        # 此时 get_db() 的 finally: db.close() 才会执行，因此 db 在整个生成过程中有效。
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
                        elif payload["type"] == "done":
                            continue
                    except json.JSONDecodeError:
                        pass
                yield sse_event

            summary = "".join(summary_parts)

            parsed_from = _parse_local_datetime(date_from)
            parsed_to = _parse_local_datetime(date_to, end_of_day=True)
            analysis = Analysis(
                user_id=current_user.id,
                date_from=parsed_from,
                date_to=parsed_to,
                provider=provider.provider_name,
                model=provider.model,
                summary=summary,
                suggestions=json.dumps(suggestions, ensure_ascii=False),
                record_ids=json.dumps([r["id"] for r in records_data]),
            )
            db.add(analysis)
            db.commit()
            logger.info("流式分析持久化完成: id=%d user_id=%d", analysis.id, current_user.id)
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.error("流式分析异常: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': '分析过程出现错误'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
