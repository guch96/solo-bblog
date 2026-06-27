"""记录业务逻辑"""
import logging
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from models import Record
from schemas import RecordCreate, RecordUpdate

logger = logging.getLogger(__name__)

SERVER_TZ = datetime.now().astimezone().tzinfo
UTC_OFFSET = datetime.now().astimezone().utcoffset() or timedelta()
OFFSET_HOURS = int(UTC_OFFSET.total_seconds() // 3600)
SQLITE_LOCAL_SHIFT = f"{OFFSET_HOURS:+d} hours"


def _local_day_bounds(day_str: str) -> tuple[datetime, datetime]:
    """把 YYYY-MM-DD 转成服务器本地当天起止时间。"""
    day = datetime.fromisoformat(day_str)
    start_local = day.replace(hour=0, minute=0, second=0, microsecond=0)
    end_local = day.replace(hour=23, minute=59, second=59, microsecond=999999)
    return start_local, end_local


def _parse_local_datetime(value: str, end_of_day: bool = False) -> datetime:
    """兼容 YYYY-MM-DD / ISO datetime，统一按服务器本地时间解析。"""
    if len(value) == 10:
        start_local, end_local = _local_day_bounds(value)
        return end_local if end_of_day else start_local

    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        return parsed.astimezone(SERVER_TZ).replace(tzinfo=None)
    return parsed


def create_record(db: Session, data: RecordCreate, user_id: int) -> Record:
    """创建一条如厕记录"""
    logger.info("创建记录: user_id=%d input_mode=%s start_time=%s", user_id, data.input_mode, data.start_time)
    record = Record(
        user_id=user_id,
        start_time=data.start_time,
        end_time=data.end_time,
        duration=data.duration,
        shape=data.shape.value if data.shape else None,
        color=data.color.value if data.color else None,
        smell=data.smell.value if data.smell else None,
        comfort=data.comfort.value if data.comfort else None,
        process_feeling=data.process_feeling.value if data.process_feeling else None,
        notes=data.notes,
        input_mode=data.input_mode.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("记录创建成功: id=%d", record.id)
    return record


def get_records(db: Session, date_from: str | None, date_to: str | None, user_id: int) -> list[Record]:
    """获取记录列表，支持按日期范围筛选，按用户隔离"""
    query = db.query(Record).filter(Record.user_id == user_id).order_by(Record.start_time.desc())
    if date_from:
        query = query.filter(Record.start_time >= _parse_local_datetime(date_from))
    if date_to:
        query = query.filter(Record.start_time <= _parse_local_datetime(date_to, end_of_day=True))
    return query.all()


def get_record_by_id(db: Session, record_id: int, user_id: int) -> Record | None:
    """获取单条记录详情，按用户隔离"""
    return db.query(Record).filter(Record.id == record_id, Record.user_id == user_id).first()


def update_record(db: Session, record_id: int, data: RecordUpdate, user_id: int) -> Record | None:
    """更新记录（部分更新），按用户隔离"""
    logger.info("更新记录: id=%d user_id=%d", record_id, user_id)
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field in ["shape", "color", "smell", "comfort", "process_feeling", "input_mode"]:
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].value
    for key, value in update_data.items():
        setattr(record, key, value)
    record.updated_at = datetime.now()
    db.commit()
    db.refresh(record)
    logger.info("记录更新成功: id=%d", record.id)
    return record


def delete_record(db: Session, record_id: int, user_id: int) -> bool:
    """删除记录，按用户隔离"""
    logger.info("删除记录: id=%d user_id=%d", record_id, user_id)
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user_id).first()
    if not record:
        logger.warning("记录不存在: id=%d", record_id)
        return False
    db.delete(record)
    db.commit()
    logger.info("记录删除成功: id=%d", record_id)
    return True


def get_calendar_data(db: Session, month: str, user_id: int) -> list[dict]:
    """获取指定月份的日历热力图数据，按用户隔离"""
    logger.info("查询日历数据: month=%s user_id=%d", month, user_id)
    # 校验月份格式：必须为 YYYY-MM
    import re
    if not re.match(r"^\d{4}-\d{2}$", month):
        raise ValueError(f"月份格式无效，需为 YYYY-MM: {month}")
    year, month_num = month.split("-")
    month_int = int(month_num)
    if month_int < 1 or month_int > 12:
        raise ValueError(f"月份必须在 01-12 之间: {month_num}")
    month_start = datetime(int(year), month_int, 1)
    if month_int == 12:
        next_month = datetime(int(year) + 1, 1, 1)
    else:
        next_month = datetime(int(year), month_int + 1, 1)
    records = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(
            Record.user_id == user_id,
            Record.start_time >= month_start,
            Record.start_time < next_month,
        )
        .group_by(func.date(Record.start_time))
        .all()
    )
    return [{"date": r.date, "count": r.count} for r in records]


def get_stats(db: Session, days: int, user_id: int) -> dict:
    """获取统计数据：频率、时长趋势、形状分布，按用户隔离"""
    logger.info("查询统计数据: days=%d user_id=%d", days, user_id)
    cutoff = datetime.now() - timedelta(days=days)

    frequency = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(Record.user_id == user_id, Record.start_time >= cutoff)
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    avg_duration = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.avg(Record.duration).label("avg_seconds"),
        )
        .filter(Record.user_id == user_id, Record.start_time >= cutoff, Record.duration.isnot(None))
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    shape_dist = (
        db.query(Record.shape, func.count(Record.id).label("count"))
        .filter(Record.user_id == user_id, Record.shape.isnot(None))
        .group_by(Record.shape)
        .all()
    )

    total_count = (
        db.query(func.count(Record.id))
        .filter(Record.user_id == user_id, Record.start_time >= cutoff)
        .scalar()
    )

    now = datetime.now()
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    this_week_count = (
        db.query(func.count(Record.id))
        .filter(Record.user_id == user_id, Record.start_time >= week_start)
        .scalar()
    )

    avg_dur_row = (
        db.query(func.avg(Record.duration))
        .filter(Record.user_id == user_id, Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    avg_duration_seconds = round(avg_dur_row, 1) if avg_dur_row else 0

    most_common = (
        db.query(Record.shape, func.count(Record.id).label("cnt"))
        .filter(Record.user_id == user_id, Record.shape.isnot(None), Record.start_time >= cutoff)
        .group_by(Record.shape)
        .order_by(func.count(Record.id).desc())
        .first()
    )

    shape_labels = {"1": "硬块状", "2": "香肠状", "3": "条状裂纹", "4": "光滑条状", "5": "软团状", "6": "糊状", "7": "水样状"}

    abnormal_days = (
        db.query(func.count(func.distinct(func.date(Record.start_time))))
        .filter(
            Record.user_id == user_id,
            Record.start_time >= cutoff,
            (Record.color.isnot(None) & (Record.color != "brown"))
            | (Record.shape.in_(["1", "2", "6", "7"])),
        )
        .scalar()
    ) or 0

    record_days = len(frequency) if frequency else 0
    avg_frequency_per_day = round(total_count / days, 1) if days > 0 else 0

    longest_row = (
        db.query(func.max(Record.duration))
        .filter(Record.user_id == user_id, Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    longest_duration_seconds = round(longest_row, 1) if longest_row else 0

    record_dates = [r.date for r in frequency]
    streak_days = 0
    if record_dates:
        streak_days = 1
        max_streak = 1
        sorted_dates = sorted(record_dates)
        for i in range(1, len(sorted_dates)):
            prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d").date()
            curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d").date()
            if (curr - prev).days == 1:
                streak_days += 1
                max_streak = max(max_streak, streak_days)
            else:
                streak_days = 1
        streak_days = max_streak

    summary = {
        "total_count": total_count or 0,
        "this_week_count": this_week_count or 0,
        "avg_duration_seconds": avg_duration_seconds,
        "most_common_shape": most_common.shape if most_common else None,
        "most_common_shape_label": shape_labels.get(most_common.shape, "未知") if most_common else None,
        "abnormal_days": abnormal_days,
        "avg_frequency_per_day": avg_frequency_per_day,
        "longest_duration_seconds": longest_duration_seconds,
        "record_days": record_days,
        "streak_days": streak_days,
    }

    return {
        "frequency": [{"date": r.date, "count": r.count} for r in frequency],
        "avg_duration": [{"date": r.date, "avg_seconds": round(r.avg_seconds, 1)} for r in avg_duration],
        "shape_distribution": [{"shape": r.shape, "count": r.count} for r in shape_dist],
        "summary": summary,
    }

