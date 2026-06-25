"""记录业务逻辑"""
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
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
        process_feeling=data.process_feeling.value if data.process_feeling else None,
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
    for field in ["shape", "color", "smell", "comfort", "process_feeling", "input_mode"]:
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


def get_calendar_data(db: Session, month: str) -> list[dict]:
    """获取指定月份的日历热力图数据"""
    logger.info("查询日历数据: month=%s", month)
    year, month_num = month.split("-")
    records = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(
            func.strftime("%Y", Record.start_time) == year,
            func.strftime("%m", Record.start_time) == month_num,
        )
        .group_by(func.date(Record.start_time))
        .all()
    )
    return [{"date": r.date, "count": r.count} for r in records]


def get_stats(db: Session, days: int) -> dict:
    """获取统计数据：频率、时长趋势、形状分布"""
    logger.info("查询统计数据: days=%d", days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # 频率：每日记录次数
    frequency = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.count(Record.id).label("count"),
        )
        .filter(Record.start_time >= cutoff)
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    # 时长趋势：每日平均时长
    avg_duration = (
        db.query(
            func.date(Record.start_time).label("date"),
            func.avg(Record.duration).label("avg_seconds"),
        )
        .filter(Record.start_time >= cutoff, Record.duration.isnot(None))
        .group_by(func.date(Record.start_time))
        .order_by(func.date(Record.start_time))
        .all()
    )

    # 形状分布
    shape_dist = (
        db.query(Record.shape, func.count(Record.id).label("count"))
        .filter(Record.shape.isnot(None))
        .group_by(Record.shape)
        .all()
    )

    # ---- 汇总统计（9个指标） ----
    total_count = (
        db.query(func.count(Record.id))
        .filter(Record.start_time >= cutoff)
        .scalar()
    )

    # 本周次数
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    this_week_count = (
        db.query(func.count(Record.id))
        .filter(Record.start_time >= week_start)
        .scalar()
    )

    # 全局平均时长
    avg_dur_row = (
        db.query(func.avg(Record.duration))
        .filter(Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    avg_duration_seconds = round(avg_dur_row, 1) if avg_dur_row else 0

    # 最常见形状
    most_common = (
        db.query(Record.shape, func.count(Record.id).label("cnt"))
        .filter(Record.shape.isnot(None), Record.start_time >= cutoff)
        .group_by(Record.shape)
        .order_by(func.count(Record.id).desc())
        .first()
    )

    # 形状中文标签映射
    shape_labels = {"1": "硬块状", "2": "香肠状", "3": "条状裂纹", "4": "光滑条状", "5": "软团状", "6": "糊状", "7": "水样状"}

    # 异常天数（颜色非棕色 或 形状为 1/2/6/7）
    abnormal_days = (
        db.query(func.count(func.distinct(func.date(Record.start_time))))
        .filter(
            Record.start_time >= cutoff,
            (Record.color.isnot(None) & (Record.color != "brown"))
            | (Record.shape.in_(["1", "2", "6", "7"])),
        )
        .scalar()
    ) or 0

    # 有记录的天数
    record_days = len(frequency) if frequency else 0

    # 日均频率
    avg_frequency_per_day = round(total_count / days, 1) if days > 0 else 0

    # 最长单次时长
    longest_row = (
        db.query(func.max(Record.duration))
        .filter(Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    longest_duration_seconds = round(longest_row, 1) if longest_row else 0

    # 最长连续打卡天数
    record_dates = [r.date for r in frequency]
    streak_days = 0
    if record_dates:
        from datetime import date as date_type
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
