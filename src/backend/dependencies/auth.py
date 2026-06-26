"""JWT 鉴权依赖：从请求头提取 Bearer Token 并解析出当前用户"""
import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import User

logger = logging.getLogger(__name__)

# JWT 签名密钥：优先读环境变量，本地开发用默认值
JWT_SECRET = os.getenv("JWT_SECRET", "pooptracker-local-dev-secret")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7 天

oauth2_scheme = HTTPBearer()


def create_access_token(user_id: int) -> str:
    """生成 JWT access token，payload 包含 sub(user_id) 和 exp(过期时间)"""
    from datetime import datetime, timezone, timedelta
    expire = datetime.now(timezone.utc) + timedelta(seconds=TOKEN_EXPIRE_SECONDS)
    payload = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    logger.info("生成 JWT: user_id=%d expire=%s", user_id, expire.isoformat())
    return token


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
) -> User:
    """
    从 Authorization: Bearer <token> 提取并验证 JWT，
    返回对应的 User 对象，失败返回 401
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效: 缺少用户标识")
    except JWTError as e:
        logger.warning("JWT 解码失败: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效或已过期")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        logger.warning("Token 对应的用户不存在: user_id=%s", user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")

    return user
