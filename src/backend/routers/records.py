"""记录相关 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import RecordCreate, RecordUpdate, RecordResponse
from services.record_service import (
    create_record, get_records, get_record_by_id, update_record, delete_record,
)

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("", response_model=RecordResponse, status_code=201)
def create(data: RecordCreate, db: Session = Depends(get_db)):
    """创建一条如厕记录"""
    return create_record(db, data)


@router.get("", response_model=list[RecordResponse])
def list_records(
    date_from: str | None = Query(None, description="起始日期 YYYY-MM-DD"),
    date_to: str | None = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """获取记录列表，支持日期范围筛选"""
    return get_records(db, date_from, date_to)


@router.get("/{record_id}", response_model=RecordResponse)
def get_one(record_id: int, db: Session = Depends(get_db)):
    """获取单条记录详情"""
    record = get_record_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put("/{record_id}", response_model=RecordResponse)
def update(record_id: int, data: RecordUpdate, db: Session = Depends(get_db)):
    """更新一条记录"""
    record = update_record(db, record_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/{record_id}", status_code=204)
def delete(record_id: int, db: Session = Depends(get_db)):
    """删除一条记录"""
    if not delete_record(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
