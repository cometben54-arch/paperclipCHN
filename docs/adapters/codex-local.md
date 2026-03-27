---
title: Codex Local
summary: OpenAI Codex 本地适配器的设置和配置
---

`codex_local` 适配器在本地运行 OpenAI 的 Codex CLI。它通过 `previous_response_id` 链接支持会话持久化，并通过全局 Codex 技能目录支持技能注入。

## 前提条件

- 已安装 Codex CLI（`codex` 命令可用）
- 在环境或代理配置中设置了 `OPENAI_API_KEY`

## 配置字段

| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `cwd` | string | 是 | 代理进程的工作目录（绝对路径；如果权限允许，缺失时会自动创建） |
| `model` | string | 否 | 使用的模型 |
| `promptTemplate` | string | 否 | 用于所有运行的提示词 |
| `env` | object | 否 | 环境变量（支持密钥引用） |
| `timeoutSec` | number | 否 | 进程超时时间（0 = 无超时） |
| `graceSec` | number | 否 | 强制终止前的宽限期 |
| `dangerouslyBypassApprovalsAndSandbox` | boolean | 否 | 跳过安全检查（仅限开发环境） |

## 会话持久化

Codex 使用 `previous_response_id` 来实现会话连续性。适配器在心跳之间序列化和恢复此值，使代理能够维持对话上下文。

## 技能注入

适配器将 Paperclip 技能符号链接到全局 Codex 技能目录（`~/.codex/skills`）。现有的用户技能不会被覆盖。

当 Paperclip 在托管工作树实例中运行时（`PAPERCLIP_IN_WORKTREE=true`），适配器会使用 Paperclip 实例下的工作树隔离 `CODEX_HOME`，这样 Codex 技能、会话、日志和其他运行时状态就不会在不同检出之间泄漏。它会从用户的主 Codex 主目录中初始化该隔离主目录，以保持共享的认证/配置连续性。

对于在心跳运行之外的手动本地 CLI 使用（例如直接作为 `codexcoder` 运行），请使用：

```sh
pnpm paperclipai agent local-cli codexcoder --company-id <company-id>
```

这会安装任何缺失的技能，创建代理 API 密钥，并打印 shell 导出命令以便作为该代理运行。

## 指令解析

如果配置了 `instructionsFilePath`，Paperclip 会读取该文件并在每次运行时将其内容前置到发送给 `codex exec` 的 stdin 提示词中。

这与 Codex 自身在运行 `cwd` 中执行的工作区级别指令发现是分开的。Paperclip 不会禁用 Codex 原生的仓库指令文件，因此仓库本地的 `AGENTS.md` 可能仍会被 Codex 加载，作为 Paperclip 托管代理指令的补充。

## 环境测试

环境测试会检查：

- Codex CLI 已安装且可访问
- 工作目录是绝对路径且可用（如果缺失且有权限则自动创建）
- 认证信号（`OPENAI_API_KEY` 是否存在）
- 实时 hello 探测（`codex exec --json -` 配合提示词 `Respond with hello.`）以验证 CLI 是否能实际运行
