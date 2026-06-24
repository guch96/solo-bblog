"""AI 分析 API 路由"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import AnalysisRequest, AnalysisResponse
from services.analysis_service import run_analysis, get_analyses, get_analysis_by_id

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
