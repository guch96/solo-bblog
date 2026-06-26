"""Pydantic 请求/响应模型"""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


# ---- 枚举定义 ----
class ShapeEnum(str, Enum):
    TYPE_1 = "1"
    TYPE_2 = "2"
    TYPE_3 = "3"
    TYPE_4 = "4"
    TYPE_5 = "5"
    TYPE_6 = "6"
    TYPE_7 = "7"


class ColorEnum(str, Enum):
    BROWN = "brown"
    DARK_BROWN = "dark_brown"
    YELLOW = "yellow"
    GREEN = "green"
    BLACK = "black"
    RED = "red"
    OTHER = "other"


class SmellEnum(str, Enum):
    NORMAL = "normal"
    STRONG = "strong"
    ODORLESS = "odorless"
    OTHER = "other"


class ComfortEnum(str, Enum):
    COMFORTABLE = "comfortable"
    BLOATING = "bloating"
    PAIN = "pain"
    DIFFICULTY = "difficulty"
    OTHER = "other"


class ProcessFeelingEnum(str, Enum):
    SMOOTH = "smooth"
    URGENT = "urgent"
    STRAINING = "straining"
    INCOMPLETE = "incomplete"
    INTERMITTENT = "intermittent"
    NORMAL = "normal"
    OTHER = "other"


class InputModeEnum(str, Enum):
    TIMER = "timer"
    MANUAL = "manual"


# ---- 记录 Schema ----
class RecordCreate(BaseModel):
    """创建记录请求"""
    start_time: datetime
    end_time: datetime | None = None
    duration: int | None = None
    shape: ShapeEnum | None = None
    color: ColorEnum | None = None
    smell: SmellEnum | None = None
    comfort: ComfortEnum | None = None
    process_feeling: ProcessFeelingEnum | None = None
    notes: str | None = None
    input_mode: InputModeEnum


class RecordUpdate(BaseModel):
    """更新记录请求（所有字段可选）"""
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration: int | None = None
    shape: ShapeEnum | None = None
    color: ColorEnum | None = None
    smell: SmellEnum | None = None
    comfort: ComfortEnum | None = None
    process_feeling: ProcessFeelingEnum | None = None
    notes: str | None = None
    input_mode: InputModeEnum | None = None


class RecordResponse(BaseModel):
    """记录响应"""
    id: int
    start_time: datetime
    end_time: datetime | None
    duration: int | None
    shape: str | None
    color: str | None
    smell: str | None
    comfort: str | None
    process_feeling: str | None
    notes: str | None
    input_mode: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---- 分析 Schema ----
class AnalysisRequest(BaseModel):
    """触发 AI 分析请求"""
    date_from: str = Field(description="起始日期 YYYY-MM-DD")
    date_to: str = Field(description="结束日期 YYYY-MM-DD")


class AnalysisResponse(BaseModel):
    """分析结果响应"""
    id: int
    date_from: datetime
    date_to: datetime
    provider: str
    model: str
    summary: str
    suggestions: str | None
    record_ids: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- 日历/统计 Schema ----
class CalendarDay(BaseModel):
    """日历某一天的数据"""
    date: str
    count: int


class StatsResponse(BaseModel):
    """统计响应"""
    frequency: list[dict]
    avg_duration: list[dict]
    shape_distribution: list[dict]
    summary: dict | None = None


# ---- 认证 Schema ----
class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    """注册请求（仅后端使用，前端不暴露）"""
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """登录响应"""
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}
