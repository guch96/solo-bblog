"""pytest fixtures"""
import os

# 测试环境启用注册接口（auth 模块在导入时读取此变量）
os.environ["ALLOW_REGISTRATION"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from passlib.hash import bcrypt
from models import User

SQLALCHEMY_TEST_DB = "sqlite:///./data/test.db"

test_engine = create_engine(SQLALCHEMY_TEST_DB, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    """每个测试前后重建数据库"""
    import models  # noqa: F401
    Base.metadata.create_all(bind=test_engine)

    # 创建测试用户
    db = TestSessionLocal()
    user = User(username="testuser", password_hash=bcrypt.hash("123456"))
    db.add(user)
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """返回配置好测试数据库的 TestClient"""
    from main import app
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """返回带 Bearer Token 的请求头字典"""
    resp = client.post("/api/auth/login", json={"username": "testuser", "password": "123456"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
