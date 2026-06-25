---
name: sync-project-docs
description: Use when completing a Superpowers-planned task, finishing a development branch, or detecting project structure changes — check if project structure, tech stack, architecture, or core feature modules changed, and if so, sync AGENTS.md and README.md
---

# Sync Project Docs

## Overview

当项目发生结构性变动时，检查并同步更新 `AGENTS.md` 和 `README.md`。触发场景包括 Superpowers 工作流完成、开发分支完结、以及检测到项目目录/结构变动。

## When to Use

在以下时机触发：

- `executing-plans` 全部任务完成后
- `finishing-a-development-branch` 执行完毕后
- **检测到项目目录结构变动时**（对比 git 记录，如 `git diff --stat HEAD~N` 或 `git diff --name-status main...dev`）
  - 新增/删除/重命名目录或文件
  - `package.json`、`pyproject.toml` 等配置文件变更
  - 路由/模块结构调整
- 用户明确要求同步文档时

## What to Check

逐项比对 git diff（与 base branch 或上一个稳定提交对比）：

### 1. 目录结构变更
- 新增/删除/重命名目录（如 `src/frontend/src/app/xxx/`、`src/backend/routers/`）
- 新增/删除关键文件（如 `Dockerfile`、`docker-compose.yml`、配置文件）

### 2. 技术栈变动
- 新增/替换/升级核心依赖（`package.json`、`pyproject.toml` 中的 deps 变化）
- 新增工具链（linter、bundler、CI 配置）
- 框架版本升级

### 3. 架构重构
- 模块拆合（如单文件拆为 package、多个 service 合并）
- 路由结构调整（API 路径变更、页面路由变更）
- 数据模型变更（表结构、字段增删）

### 4. 核心功能模块
- 新增功能页面/模块
- 删除已有功能模块

## How to Sync

### AGENTS.md 更新要点

- **项目概述**区域：技术栈列表、目录结构树
- **项目特定约束**区域：新增的模块约束、命名规范

### README.md 更新要点

- **功能特性**列表：新增/删除的功能点
- **技术栈**：框架和工具版本
- **快速开始**：安装步骤如有变化
- **项目结构**：目录树（确保与实际一致）
- **环境变量**：新增的环境变量

## Quick Reference

| 变动类型 | AGENTS.md | README.md |
|---------|-----------|-----------|
| 目录结构 | 更新目录树 | 更新目录树 |
| 技术栈 | 更新技术栈列表 | 更新技术栈 + 环境要求 |
| 架构重构 | 更新项目特定约束 | 更新项目结构 |
| 功能模块 | 通常不需要 | 更新功能特性列表 |

## Process

1. 运行 `git diff --stat <base>` 获取变更文件概览
2. 按上述四类逐项检查
3. 读取当前 AGENTS.md 和 README.md
4. 仅修改受影响的区域（Surgical Changes 原则）
5. 提交时使用 `docs: sync project docs after <变动描述>` 格式
