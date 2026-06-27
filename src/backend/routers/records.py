"""记录相关 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User  # 新增
from schemas import RecordCreate, RecordUpdate, RecordResponse
from services.record_service import (
    create_record, get_records, get_record_by_id, update_record, delete_record,
    get_calendar_data, get_stats,
)
from dependencies.auth import get_current_user  # 新增

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("", response_model=RecordResponse, status_code=201)
def create(
    data: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """创建一条如厕记录"""
    return create_record(db, data, current_user.id)


@router.get("", response_model=list[RecordResponse])
def list_records(
    date_from: str | None = Query(None, description="起始日期 YYYY-MM-DD"),
    date_to: str | None = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取记录列表，支持日期范围筛选"""
    return get_records(db, date_from, date_to, current_user.id)


@router.get("/calendar", response_model=list[dict])
def calendar_data(
    month: str = Query(..., description="月份 YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取日历热力图数据"""
    try:
        return get_calendar_data(db, month, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stats", response_model=dict)
def stats_data(
    days: int = Query(7, description="统计天数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取统计数据"""
    return get_stats(db, days, current_user.id)


@router.get("/{record_id}", response_model=RecordResponse)
def get_one(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """获取单条记录详情"""
    record = get_record_by_id(db, record_id, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put("/{record_id}", response_model=RecordResponse)
def update(
    record_id: int,
    data: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """更新一条记录"""
    record = update_record(db, record_id, data, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/{record_id}", status_code=204)
def delete(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 新增鉴权
):
    """删除一条记录"""
    if not delete_record(db, record_id, current_user.id):
        raise HTTPException(status_code=404, detail="记录不存在")
