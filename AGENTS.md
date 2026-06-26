# AGENTS.md
---

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them instead of picking silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it instead of deleting it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Superpowers Local Overrides

These local instructions override default Superpowers workflows when they conflict.

- Lightweight tasks must not enter the full `brainstorming` / `writing-plans` / `using-git-worktrees` / `subagent-driven-development` chain.
- Lightweight tasks include single-file or small-scope changes, clear bug fixes, configuration adjustments, copy changes, and small test additions.
- For lightweight tasks, analyze the code and implement directly by default. Ask only when there is a key uncertainty, and ask at most one question first.
- Do not repeat questions when the project context, this `AGENTS.md`, or existing code already provides the answer.
- Do not create a worktree unless the user explicitly asks for one.
- Specs and plans may be committed to git as part of normal development workflow.
- In Codex, prefer `executing-plans` by default instead of `subagent-driven-development`.
- Use `subagent-driven-development` only when the task is clearly suitable for parallel work and the platform supports subagents well.
- Any spec or plan generated through Superpowers workflows must be written in Chinese by default unless the user explicitly requests another language.
- When writing code, add concise Chinese comments around key business logic, parsing logic, chunking logic, retrieval logic, and other non-obvious control flow.
- When writing code, add debug or info logs at key execution points so parsing, ingestion, retrieval, and failure handling are easier to trace during development and troubleshooting.
- When confirmation is needed, prefer giving 2 or 3 options with a recommendation in one turn instead of splitting confirmation across many rounds.
- The following operations still require confirmation: deleting files, large-scale refactors, changing git history, pushing to remotes, changing environment configuration, changing CI, and database changes.

## 6. Git 提交规范

**重要功能完成后应准备 git 提交，但提交前必须先征得用户同意。**

- 每完成一个独立功能模块（如：记录 CRUD、计时器、AI 分析、日历视图等）后，应主动提出提交建议，但不能直接提交
- 每次提交前必须进行澄清式确认，说明准备提交的范围、验证情况、拟使用的 commit message，并等待用户明确同意后才能提交
- 如果用户未明确同意，即使功能已完成、测试已通过，也只能停留在已修改未提交状态
- 提交信息使用 conventional commits 格式：`feat: xxx` / `fix: xxx` / `refactor: xxx` / `docs: xxx`
- 不要等到所有功能做完再一次性提交——分步提交体现开发过程
- 提交前确保代码能正常运行（至少不报错）

## 7. 项目特定约束

- **AI 分析模块**使用 OpenAI 兼容协议（`OpenAICompatibleProvider`），通过 `.env` 配置 model/api_key/base_url/temperature/max_tokens/provider_name，支持 DeepSeek/Qwen/GLM 等任意厂商切换。流式输出使用 SSE（Server-Sent Events）
- **代码注语言**：使用中文注释关键业务逻辑
- **日志**：关键执行点添加 debug/info 日志，便于开发调试
- **数据库迁移**：新增字段需在 `main.py` 的 `lifespan` 中添加 `PRAGMA table_info` + `ALTER TABLE` 兼容逻辑（SQLite 不支持生产级迁移工具）
- **用户认证**：JWT Token 鉴权（python-jose + passlib[bcrypt]），`get_current_user` 依赖注入所有受保护路由。Record/Analysis 按 `user_id` 数据隔离。测试账号 user1/user2:123456 在 lifespan 中自动创建

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.



## 项目概述

便便健康记录工具（PoopTracker）——记录每日如厕情况，AI 分析给出健康建议。

**技术栈：**
- 前端：Next.js + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Python FastAPI + SQLite + SQLAlchemy + uv（包管理）
- AI：OpenAI API（自定义 Provider 抽象层，支持多 LLM 厂商切换）

**目录结构：**
```
solo-bblog/
├─ README.md
├─ JOURNAL.md
├─ AGENTS.md
├─ CLAUDE.md
├─ .claude/
├─ src/
│  ├─ frontend/                  # Next.js 前端
│  │  ├─ src/
│  │  │  ├─ app/                 # App Router 页面
│  │  │  │  ├─ login/              # 登录页
│  │  │  │  ├─ analysis/         # AI 分析页
│  │  │  │  ├─ calendar/         # 日历视图页
│  │  │  │  ├─ records/          # 记录 CRUD 页
│  │  │  │  │  ├─ [id]/          # 记录详情
│  │  │  │  │  │  └─ edit/       # 编辑记录
│  │  │  │  │  └─ new/           # 新增记录
│  │  │  │  └─ stats/            # 统计图表页
│  │  │  ├─ components/          # 组件
│  │  │  │  ├─ ui/               # shadcn/ui 基础组件
│  │  │  │  ├─ nav/              # 导航组件（桌面/移动端）
│  │  │  │  ├─ timer/            # 计时器组件
│  │  │  │  ├─ records/          # 记录相关组件
│  │  │  │  ├─ calendar/         # 日历热力图组件
│  │  │  │  ├─ charts/           # 统计图表组件
│  │  │  │  ├─ analysis/         # AI 分析卡片组件
│  │  │  │  └─ AuthGuard.tsx     # 路由鉴权守卫
│  │  │  ├─ hooks/               # 自定义 Hooks
│  │  │  └─ lib/                 # 工具函数、API 客户端、类型定义
│  │  ├─ public/                 # 静态资源
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ backend/                   # FastAPI 后端
│     ├─ main.py                 # 入口
│     ├─ database.py             # 数据库连接
│     ├─ models.py               # SQLAlchemy 模型
│     ├─ schemas.py              # Pydantic 请求/响应模型
│     ├─ routers/
│     │  ├─ records.py           # 记录 API
│     │  ├─ analyses.py          # 分析 API
│     │  └─ auth.py              # 认证 API（登录/注册/me）
│     ├─ dependencies/
│     │  └─ auth.py              # JWT 鉴权依赖
│     ├─ services/
│     │  ├─ record_service.py    # 记录业务逻辑
│     │  ├─ analysis_service.py  # 分析业务逻辑
│     │  └─ llm_provider.py      # LLM Provider 抽象层
│     ├─ tests/                  # 后端测试
│     ├─ utils/                  # 后端工具
│     ├─ data/                   # SQLite 数据文件
│     ├─ pyproject.toml
│     └─ uv.lock
└─ docs/
   ├─ frontend-design/           # 前端设计系统文档
   └─ superpowers/
      ├─ plans/                  # 实施计划
      └─ specs/                  # 设计规格文档
```
