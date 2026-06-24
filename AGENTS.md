# AGENTS.md

## 项目概述

便便健康记录工具（PoopTracker）——记录每日如厕情况，AI 分析给出健康建议。

**技术栈：**
- 前端：Next.js + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Python FastAPI + SQLite + SQLAlchemy + uv（包管理）
- AI：OpenAI API / LangChain（支持多 LLM 厂商切换）

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
- Do not commit specs or plans to git unless the user explicitly asks for that.
- In Codex, prefer `executing-plans` by default instead of `subagent-driven-development`.
- Use `subagent-driven-development` only when the task is clearly suitable for parallel work and the platform supports subagents well.
- Any spec or plan generated through Superpowers workflows must be written in Chinese by default unless the user explicitly requests another language.
- When writing code, add concise Chinese comments around key business logic, parsing logic, chunking logic, retrieval logic, and other non-obvious control flow.
- When writing code, add debug or info logs at key execution points so parsing, ingestion, retrieval, and failure handling are easier to trace during development and troubleshooting.
- When confirmation is needed, prefer giving 2 or 3 options with a recommendation in one turn instead of splitting confirmation across many rounds.
- The following operations still require confirmation: deleting files, large-scale refactors, changing git history, pushing to remotes, changing environment configuration, changing CI, and database changes.

## 6. Git 提交规范

**重要功能完成后必须提交 git。**

- 每完成一个独立功能模块（如：记录 CRUD、计时器、AI 分析、日历视图等）后，立即提交 git
- 提交信息使用 conventional commits 格式：`feat: xxx` / `fix: xxx` / `refactor: xxx` / `docs: xxx`
- 不要等到所有功能做完再一次性提交——分步提交体现开发过程
- 提交前确保代码能正常运行（至少不报错）

## 7. 项目特定约束

- **前端开发**使用 frontend-design skill 监控 UI 质量
- **AI 分析模块**使用 OpenAI API / LangChain，做通用化抽象支持多 LLM 厂商切换
- **代码注语言**：使用中文注释关键业务逻辑
- **日志**：关键执行点添加 debug/info 日志，便于开发调试

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
