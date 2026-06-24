# CLAUDE.md

@AGENTS.md

## Claude Code 专属
- 前端开发使用 frontend-design skill 监控 UI 质量。

## 技术栈

- 前端：Next.js + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Python FastAPI + SQLite + SQLAlchemy + uv（包管理）
- AI：OpenAI API / LangChain（支持多 LLM 厂商切换）

## 目录结构

```
solo-bblog/
├─ README.md          # 项目说明
├─ JOURNAL.md         # 开发日志
├─ AGENTS.md          # 行为约束
├─ CLAUDE.md          # Claude Code 配置
├─ .claude/           # CC skills/hooks/commands
├─ src/
│  ├─ frontend/       # Next.js 前端
│  └─ backend/        # FastAPI 后端
└─ docs/              # 设计文档
```
