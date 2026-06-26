# 用户认证与数据隔离设计

**日期：** 2026-06-26
**状态：** 已确认

---

## 1. 需求概述

1. 接入登录页面，不提供注册页面，但后端提供注册接口。本次版本只做简单登录，生成两个测试账号。后续计划接入小程序（本次不做）。
2. 因用户登录操作引入权限控制，系统中的数据按用户进行划分。

## 2. 方案选型

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 认证机制 | JWT Token（单 Token） | 无状态、易扩展、适合后续小程序接入 |
| Token 有效期 | 7 天 | 平衡便利性与安全性，本地工具场景足够 |
| 用户模型 | username + password_hash + wechat_openid | 预留小程序扩展字段 |
| 测试账号 | user1 / user2，密码均为 123456 | 简洁通用 |
| 现有数据 | 关联到 user1 | 保留现有测试记录 |

## 3. 后端设计

### 3.1 User 模型 (`models.py`)

```python
from sqlalchemy import Column, Integer, String, DateTime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    wechat_openid = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

### 3.2 已有模型变更

`Record` 和 `Analysis` 各新增字段：

```python
user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
```

### 3.3 认证 API (`routers/auth.py`)

| 端点 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/api/auth/register` | POST | 无 | 注册用户（仅后端提供，前端不暴露） |
| `/api/auth/login` | POST | 无 | 登录，返回 JWT Token |
| `/api/auth/me` | GET | Bearer Token | 获取当前登录用户信息 |

**注册请求：**
```json
{ "username": "xxx", "password": "xxx" }
```

**登录响应：**
```json
{ "access_token": "eyJ...", "token_type": "bearer", "username": "xxx" }
```

**JWT 实现：**
- 库：`python-jose[cryptography]` + `passlib[bcrypt]`
- Token payload：`{ sub: user_id, exp: now+7d }`
- 密钥：从 `.env` 的 `JWT_SECRET` 读取，默认值用于本地开发

### 3.4 JWT 鉴权依赖 (`dependencies/auth.py`)

```python
from fastapi.security import HTTPBearer

oauth2_scheme = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    # 1. 解码 JWT，提取 user_id
    # 2. 查数据库获取 User 对象
    # 3. 不存在则 401
    # 4. 返回 User
```

### 3.5 现有路由数据隔离

所有 `records` 和 `analyses` 相关端点增加 `current_user: User = Depends(get_current_user)` 依赖，所有数据库查询追加 `.filter(Model.user_id == current_user.id)`：

- **records.py**：list/calendar/stats/get_one/update/delete/create 全部过滤 user_id
- **analyses.py**：create_analysis/list_analyses/get_analysis/create_analysis_stream 全部过滤 user_id
- **POST 创建时**：`record.user_id = current_user.id`

### 3.6 数据库迁移策略

`main.py` 的 `lifespan` 中按顺序执行：

1. `create_all()` 创建新表（含 users 表）
2. `PRAGMA table_info` 检测 Record/Analysis 是否有 user_id 列，无则 `ALTER TABLE ADD COLUMN user_id`
3. 插入两个测试账号（`INSERT OR IGNORE`）：user1/123456, user2/123456
4. 将 user_id 为 NULL 的旧记录全部关联到 user1

### 3.7 新增依赖

`pyproject.toml` 增加：

```
"python-jose[cryptography]>=3.3.0",
"passlib[bcrypt]>=1.7.4",
```

### 3.8 目录变更

```
src/backend/
├─ routers/
│  └─ auth.py          # 新增：认证路由
├─ dependencies/
│  └─ auth.py          # 新增：JWT 鉴权依赖
├─ schemas.py          # 修改：增加 LoginRequest/RegisterRequest/TokenResponse
├─ models.py           # 修改：增加 User 模型，Record/Analysis 增加 user_id
├─ main.py             # 修改：注册 auth 路由，lifespan 增加迁移逻辑
```

---

## 4. 前端设计

### 4.1 登录页 (`/login`)

- 路由：`src/app/login/page.tsx`
- 独立布局：不包含 DesktopNav/BottomNav
- 居中卡片：用户名 + 密码 + 登录按钮
- 登录成功 → token 存 localStorage → `router.push("/")`
- 登录失败 → toast 提示错误
- 无注册入口

### 4.2 Auth Context (`hooks/useAuth.tsx`)

```typescript
interface AuthContextType {
  user: { id: number; username: string } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

- 初始化：从 localStorage 读取 token，调 `/api/auth/me` 验证
- `login()`：请求 `/api/auth/login` → 存 token + 用户信息
- `logout()`：清除 localStorage → 跳转 `/login`
- 通过 React Context + Provider 全局注入

### 4.3 API 客户端适配 (`lib/api.ts`)

`request()` 函数增加：

```typescript
const token = localStorage.getItem("pooptracker_token");
if (token) {
  headers["Authorization"] = `Bearer ${token}`;
}
```

### 4.4 路由保护

根 `layout.tsx` 逻辑：
- 当前路径为 `/login` → 正常渲染（使用独立布局）
- 非登录页 + localStorage 无 token → `router.replace("/login")`
- 有 token → 正常渲染（带 DesktopNav/BottomNav）

### 4.5 导航栏用户信息

桌面导航栏底部显示当前用户名 + 退出按钮。退出时清除 token 并跳转登录页。

### 4.6 目录变更

```
src/frontend/src/
├─ app/
│  └─ login/
│     └─ page.tsx       # 新增：登录页
├─ hooks/
│  └─ useAuth.tsx       # 新增：Auth Context + Provider
├─ lib/
│  └─ api.ts            # 修改：增加 Authorization header
├─ app/
│  └─ layout.tsx        # 修改：路由保护 + AuthProvider 包裹
```

---

## 5. 数据流

```
登录流程：
  前端 /login → POST /api/auth/login {username, password}
  → 后端验证密码 → 返回 JWT Token
  → 前端存 localStorage → 跳转首页

鉴权请求流程：
  前端 → Authorization: Bearer <token> → 后端
  → get_current_user 解码 JWT → 查 User → 注入路由
  → 路由中所有查询 filter(user_id=current_user.id)

未鉴权请求：
  无 token → get_current_user 抛出 401 → 前端捕获 → 跳转登录页
```

## 6. 不在本次范围

- 小程序 OAuth 接入（微信 openid 获取逻辑）
- 注册页面（前端）
- 密码修改/找回
- 多设备同时登录管理
- Token 刷新/续期机制
