[根目录](../../CLAUDE.md) > [src](../) > **frontend**

## 模块职责

PoopTracker 前端 Web UI -- Next.js 16 App Router + TypeScript + Tailwind CSS 4 + shadcn/ui。
提供用户界面（登录/首页/记录CRUD/日历热力图/统计图表/AI流式分析），通过 REST API + SSE 与后端通信。

## 入口与启动

- **入口文件：** `src/app/layout.tsx`
- **开发命令：** `npm run dev`（Next.js dev server，默认 localhost:3000）
- **构建命令：** `npm run build`
- **测试命令：** `npm test`（vitest run）/ `npm run test:watch`（vitest 监听模式）
- **代码检查：** `npm run lint`（eslint）

## 对外接口

本模块不对外暴露 API，而是消费后端 API：

- **后端基地址：** `NEXT_PUBLIC_API_URL` 或 `http://localhost:8000`
- **API 调用：** 通过 `src/lib/api.ts` 中的 `recordsApi` / `analysesApi` 统一请求
- **Token 注入：** 自动从 localStorage 读取 `pooptracker_token` 并附加 Bearer 头
- **SSE 消费：** `analysesApi.stream()` 通过 ReadableStream 逐行解析 SSE 事件

## 关键依赖与配置

| 依赖 | 用途 |
|------|------|
| next 16.2.9 | React 全栈框架（App Router） |
| react 19.2.4 | UI 渲染 |
| tailwindcss ^4 | 原子化 CSS |
| shadcn ^4.11.0 | UI 组件库 |
| recharts ^3.9.0 | 统计图表 |
| sonner ^2.0.7 | Toast 通知 |
| lucide-react ^1.21.0 | 图标库 |
| vitest ^4.1.9 | 测试运行器 (dev) |
| @testing-library/react ^16.3.2 | 组件测试 (dev) |
| msw ^2.14.6 | API Mock (dev) |

**配置文件：** `package.json`, `tsconfig.json`, `vitest.config.ts`, `next.config.ts`, `components.json`, `eslint.config.mjs`, `postcss.config.mjs`

## 数据模型

TypeScript 类型定义位于 `src/lib/types.ts`：

- `RecordData` / `RecordCreate` / `RecordUpdate` -- 如厕记录
- `AnalysisData` / `AnalysisRequest` -- AI 分析
- `CalendarDay` -- 日历热力图
- `StatsData` / `StatsSummary` -- 统计数据
- 枚举类型：`ShapeType`, `ColorType`, `SmellType`, `ComfortType`, `ProcessFeelingType`, `InputMode`
- 显示映射：`SHAPE_LABELS`, `SHAPE_DISPLAY`（含 emoji）, `COLOR_LABELS`, `SMELL_LABELS` 等

## 测试与质量

- **框架：** Vitest + @testing-library/react + MSW + jsdom
- **测试文件数：** 29（lib: 4, hooks: 1, components: 11, pages: 9）
- **辅助工具：** `tests/helpers/render-utils.tsx`（renderWithAuth, createMockRouter, mockNextNavigation）
- **MSW Handlers：** 完整的 auth + records CRUD + analyses mock
- **运行：** `npm test`（单次）/ `npm run test:watch`（监听）

详见架构扫描报告 `docs/architecture-scan.md` 第 5.2.7 节。

## 常见问题 (FAQ)

**Q: 前端启动后页面空白？**
A: 检查后端是否已启动（localhost:8000），确认 `NEXT_PUBLIC_API_URL` 配置正确。

**Q: 页面样式错乱？**
A: 检查 `globals.css` 是否包含 Tailwind 指令，确认 `tailwindcss` 版本为 v4。

**Q: 测试报 "Cannot find module '@/lib/types'"？**
A: vitest.config.ts 中的 resolve.alias 已配置 `@` 指向 `./src`，确认配置正确。

## 相关文件清单

```
src/frontend/
├── src/
│   ├── app/                     # App Router 页面（8 个页面路由）
│   │   ├── layout.tsx           # 根布局（AuthGuard + Google Fonts）
│   │   ├── page.tsx             # 首页（计时器 + 记录总览）
│   │   ├── login/page.tsx       # 登录页
│   │   ├── analysis/page.tsx    # AI 分析页
│   │   ├── calendar/page.tsx    # 日历视图
│   │   ├── records/             # 记录 CRUD（列表/新增/详情/编辑）
│   │   └── stats/page.tsx       # 统计图表
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 基础组件（8 个）
│   │   ├── AuthGuard.tsx        # 路由鉴权守卫
│   │   ├── nav/                 # DesktopNav + BottomNav
│   │   ├── timer/Timer.tsx      # 计时器
│   │   ├── records/             # RecordForm + RecordCard + RecordList
│   │   ├── calendar/            # CalendarHeatmap
│   │   ├── charts/              # StatsSummaryCards + StatsCharts
│   │   └── analysis/            # AnalysisCard + StreamingAnalysisCard
│   ├── hooks/useAuth.tsx        # 认证 Hook（AuthProvider Context）
│   └── lib/
│       ├── api.ts               # API 客户端（Token 注入 + SSE 流式）
│       ├── types.ts             # TypeScript 类型定义 + 显示映射
│       ├── datetime.ts          # 时间工具函数
│       ├── records-events.ts    # 跨组件事件系统
│       └── utils.ts             # cn() 类名合并
├── tests/
│   ├── setup.ts                 # 全局测试配置
│   ├── helpers/render-utils.tsx # 测试辅助工具
│   ├── mocks/                   # MSW handlers + server
│   ├── lib/                     # 4 测试文件
│   ├── hooks/                   # 1 测试文件
│   ├── components/              # 12 测试文件
│   └── app/                     # 9 测试文件
├── public/                      # 静态资源
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

## 变更记录 (Changelog)

| 日期 | 变更 |
|------|------|
| 2026-06-27 | 新增前端测试体系（Vitest + Testing Library + MSW，29 测试文件） |
| 2026-06-25 | 暖色调设计系统重构、双导航模式、LLM Provider 配置化 |
| 2026-06-24 | 初始前端搭建：Next.js + Tailwind + shadcn/ui，基础页面和组件 |
