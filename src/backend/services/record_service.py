"""记录业务逻辑"""
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Record
from schemas import RecordCreate, RecordUpdate

logger = logging.getLogger(__name__)


def create_record(db: Session, data: RecordCreate) -> Record:
    """创建一条如厕记录"""
    logger.info("创建记录: input_mode=%s start_time=%s", data.input_mode, data.start_time)
    record = Record(
        start_time=data.start_time,
        end_time=data.end_time,
        duration=data.duration,
        shape=data.shape.value if data.shape else None,
        color=data.color.value if data.color else None,
        smell=data.smell.value if data.smell else None,
        comfort=data.comfort.value if data.comfort else None,
        notes=data.notes,
        input_mode=data.input_mode.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("记录创建成功: id=%d", record.id)
    return record


def get_records(db: Session, date_from: str | None = None, date_to: str | None = None) -> list[Record]:
    """获取记录列表，支持按日期范围筛选"""
    query = db.query(Record).order_by(Record.start_time.desc())
    if date_from:
        query = query.filter(
            Record.start_time >= datetime.fromisoformat(date_from)
        )
    if date_to:
        query = query.filter(
            Record.start_time <= datetime.fromisoformat(date_to)
        )
    return query.all()


def get_record_by_id(db: Session, record_id: int) -> Record | None:
    """获取单条记录详情"""
    return db.query(Record).filter(Record.id == record_id).first()


def update_record(db: Session, record_id: int, data: RecordUpdate) -> Record | None:
    """更新记录（部分更新）"""
    logger.info("更新记录: id=%d", record_id)
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return None
    update_data = data.model_dump(exclude_unset=True)
    # 枚举字段转值
    for field in ["shape", "color", "smell", "comfort", "input_mode"]:
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].value
    for key, value in update_data.items():
        setattr(record, key, value)
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    logger.info("记录更新成功: id=%d", record.id)
    return record


def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    logger.info("删除记录: id=%d", record_id)
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return False
    db.delete(record)
    db.commit()
    logger.info("记录删除成功: id=%d", record_id)
    return True
