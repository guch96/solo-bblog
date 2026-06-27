# 前端测试基础设施设计规格

日期：2026-06-27 | 状态：已确认

---

## 1. 目标

为 PoopTracker 前端建立完整测试体系（当前零测试覆盖），确保所有功能模块质量可验证。

---

## 2. 工具链

| 包 | 用途 |
|---|---|
| `vitest` | 测试运行器，原生 ESM + Vite 转换，复用 tsconfig paths |
| `@testing-library/react` | 组件渲染（render / screen / fireEvent / waitFor） |
| `@testing-library/user-event` | 真实用户交互模拟（点击、输入、选择） |
| `@testing-library/jest-dom` | DOM 断言扩展（toBeInTheDocument 等） |
| `msw` | API Mock，Service Worker 层拦截 HTTP 请求 |
| `jsdom` | 浏览器环境模拟 |
| `@vitejs/plugin-react` | React JSX 转换支持 |

---

## 3. 目录结构

```
src/frontend/tests/
├── setup.ts                        # 全局 setup（jest-dom 注入 + MSW 生命周期）
├── helpers/
│   └── render-utils.tsx            # renderWithAuth 等测试工具
├── mocks/
│   ├── handlers.ts                 # MSW 请求处理器
│   └── server.ts                   # MSW server 实例
├── lib/
│   ├── api.test.ts
│   ├── datetime.test.ts
│   ├── utils.test.ts
│   └── records-events.test.ts
├── hooks/
│   └── useAuth.test.tsx
├── components/
│   ├── AuthGuard.test.tsx
│   ├── BottomNav.test.tsx
│   ├── DesktopNav.test.tsx
│   ├── RecordCard.test.tsx
│   ├── RecordForm.test.tsx
│   ├── RecordList.test.tsx
│   ├── Timer.test.tsx
│   ├── CalendarHeatmap.test.tsx
│   ├── StatsCharts.test.tsx
│   ├── StatsSummaryCards.test.tsx
│   ├── AnalysisCard.test.tsx
│   └── StreamingAnalysisCard.test.tsx
└── app/
    ├── page.test.tsx               # 首页
    ├── login/
    │   └── page.test.tsx
    ├── records/
    │   ├── page.test.tsx           # 记录列表
    │   ├── new/
    │   │   └── page.test.tsx       # 新建记录
    │   └── [id]/
    │       ├── page.test.tsx       # 记录详情
    │       └── edit/
    │           └── page.test.tsx   # 编辑记录
    ├── analysis/
    │   └── page.test.tsx
    ├── calendar/
    │   └── page.test.tsx
    └── stats/
        └── page.test.tsx
```

UI 基础组件（button/card/dialog/input/label/select/sonner/textarea）不单独测试——shadcn/ui 薄封装，由业务组件测试间接覆盖。

---

## 4. Mock 策略

### 4.1 Auth 上下文

- 封装 `renderWithAuth(ui, options?)` 工具，用 `AuthProvider` 包裹
- 支持传入预设 token 和用户信息
- 未登录态：MSW 拦截 `GET /api/auth/me` 返回 401

### 4.2 API Mock（MSW handlers）

| 端点 | Mock 覆盖 |
|---|---|
| `POST /api/auth/login` | 成功返回 token / 失败返回 401 |
| `GET /api/auth/me` | 返回用户信息 / 401 未认证 |
| `GET/POST /api/records` | CRUD 全套 + 分页 + 筛选 |
| `GET /api/records/calendar` | 日历月度数据 |
| `GET /api/records/stats` | 统计数据 |
| `POST /api/analyses` | 分析触发 + 流式 SSE |

MSW handler 使用闭包维护内存中的 records 数组，确保 CRUD 操作有真实的数据变化反馈。

### 4.3 路由

- `vi.mock('next/navigation')` mock `useRouter` / `usePathname` / `useSearchParams`

### 4.4 事件总线

- `records-events.ts` 基于 `window.dispatchEvent(CustomEvent)`，jsdom 天然支持，不 mock

### 4.5 计时器

- `vi.useFakeTimers()` 控制 `setInterval` 和 `Date.now()`

---

## 5. 测试覆盖清单

### 5.1 Lib 层（4 个测试文件）

| 文件 | 覆盖要点 |
|---|---|
| `api.test.ts` | `request()` JWT 注入、401 清除 token；`recordsApi` 6 方法；`analysesApi.stream()` SSE 解析（summary_chunk / suggestions / done / error）、AbortSignal 取消 |
| `datetime.test.ts` | `getLocalTodayString()` 时区正确性；`formatRecordDateTime()` 中文格式；`normalizeDateTimeLocalValue()` 秒数补全；跨日期边界 |
| `utils.test.ts` | `cn()` 类名合并、冲突覆盖（tailwind-merge 行为） |
| `records-events.test.ts` | `emitRecordsChanged()` 派发事件；常量值；多组件监听 |

### 5.2 Hooks 层（1 个测试文件）

| 文件 | 覆盖要点 |
|---|---|
| `useAuth.test.tsx` | `login()` 成功存储 token + 跳转、失败提示；`logout()` 清除 token；初始化 localStorage 恢复；token 过期 `me` 返回 401 自动登出；`isLoading` → `isAuthenticated` 状态转换 |

### 5.3 业务组件层（12 个测试文件）

| 文件 | 覆盖要点 |
|---|---|
| `AuthGuard` | 未认证→`/login`；已认证渲染子组件；加载 spinner；`/login` 路由已认证→`/` |
| `BottomNav` | 5 tab 渲染；当前路由高亮；md+ 隐藏 |
| `DesktopNav` | 5 链接 + 用户名；退出触发 `logout()` |
| `RecordCard` | 时间/时长/形状 emoji/备注渲染；编辑跳转；删除确认弹窗→删除→事件 |
| `RecordForm` | 7 组字段渲染；计时器模式字段锁定；校验；`create()`/`update()` 提交跳转+事件；loading 态禁用 |
| `RecordList` | 列表渲染；日期/形状筛选；快捷按钮；空数据提示；筛选面板折叠；监听事件刷新 |
| `Timer` | 开始→计时显示；停止→跳转 `/records/new?` 带参数；fakeTimers |
| `CalendarHeatmap` | 月份网格；密度色阶；上/下月导航；今日高亮；图例；点击日期加载记录 |
| `StatsSummaryCards` | 9 个指标卡片渲染正确数值 |
| `StatsCharts` | 7/14/30 天切换；三图表容器渲染 |
| `AnalysisCard` | 摘要/建议渲染；展开/折叠 |
| `StreamingAnalysisCard` | SSE 流式数据渲染；摘要逐字更新；建议动态新增；完成/错误状态 |

### 5.4 页面层（9 个测试文件）

| 文件 | 覆盖要点 |
|---|---|
| `app/page` | 已登录渲染 Timer + RecordList；监听事件刷新 |
| `app/login/page` | 表单→提交→成功跳转 `/`；失败显示错误；已登录跳转 |
| `app/records/page` | 列表渲染 + 筛选；分页 |
| `app/records/new/page` | RecordForm 渲染 + 创建流程 |
| `app/records/[id]/page` | 详情渲染；删除→确认→跳转 |
| `app/records/[id]/edit/page` | RecordForm 预填 + 更新流程 |
| `app/analysis/page` | 时间范围选择器；触发分析→流式卡片；历史列表 |
| `app/calendar/page` | 热力图渲染；点击日期→显示记录 |
| `app/stats/page` | 图表 + 汇总卡；范围切换 |

共计 **26 个测试文件**。

---

## 6. 实施阶段

```
Phase 1: 基础设施
├── 安装依赖（vitest + RTL + MSW + jsdom + @vitejs/plugin-react）
├── vitest.config.ts
├── tests/setup.ts
├── tests/mocks/handlers.ts + server.ts
├── tests/helpers/render-utils.tsx
└── package.json 新增 test / test:watch 脚本
    验证：pnpm test 能跑通占位测试

Phase 2: Lib + Hooks（5 文件，无 UI 依赖）
    验证：5 个文件全部通过

Phase 3: 业务组件（12 文件）
    验证：12 个组件测试通过

Phase 4: 页面（9 文件）
    验证：9 个页面测试通过
```

每个 Phase 完成后独立可验证，后一 Phase 依赖前一 Phase 的基础设施。

---

## 7. 不纳入范围

- E2E 测试（Playwright/Cypress）：后续评估需要再引入
- 视觉回归测试（Storybook + Chromatic）
- UI 基础组件单元测试（shadcn/ui 薄封装）
- CI 管道配置：先确保本地测试套件稳定
