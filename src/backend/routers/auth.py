"""认证相关 API 路由：登录、注册、获取当前用户信息"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from database import get_db
from models import User
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from dependencies.auth import create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """注册新用户（仅后端暴露，前端不提供注册页面）"""
    # 检查用户名是否已存在
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="用户名已存在")

    # 创建用户，密码 bcrypt 哈希存储
    user = User(
        username=body.username,
        password_hash=bcrypt.hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("新用户注册: username=%s id=%d", user.username, user.id)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, username=user.username, user_id=user.id)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """用户登录：验证用户名密码，返回 JWT Token"""
    user = db.query(User).filter(User.username == body.username).first()
    if not user:
        logger.warning("登录失败: 用户不存在 username=%s", body.username)
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not bcrypt.verify(body.password, user.password_hash):
        logger.warning("登录失败: 密码错误 username=%s", body.username)
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    logger.info("登录成功: username=%s id=%d", user.username, user.id)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, username=user.username, user_id=user.id)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """获取当前登录用户信息（需携带 Bearer Token）"""
    return current_user
