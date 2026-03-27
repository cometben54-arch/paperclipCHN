---
title: Claude Local
summary: Claude Code 本地适配器的设置和配置
---

`claude_local` 适配器在本地运行 Anthropic 的 Claude Code CLI。它支持会话持久化、技能注入和结构化输出解析。

## 前提条件

- 已安装 Claude Code CLI（`claude` 命令可用）
- 在环境或代理配置中设置了 `ANTHROPIC_API_KEY`

## 配置字段

| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `cwd` | string | 是 | 代理进程的工作目录（绝对路径；如果权限允许，缺失时会自动创建） |
| `model` | string | 否 | 使用的 Claude 模型（例如 `claude-opus-4-6`） |
| `promptTemplate` | string | 否 | 用于所有运行的提示词 |
| `env` | object | 否 | 环境变量（支持密钥引用） |
| `timeoutSec` | number | 否 | 进程超时时间（0 = 无超时） |
| `graceSec` | number | 否 | 强制终止前的宽限期 |
| `maxTurnsPerRun` | number | 否 | 每次心跳的最大代理对话轮次（默认为 `300`） |
| `dangerouslySkipPermissions` | boolean | 否 | 跳过权限提示（仅限开发环境） |

## 提示词模板

模板支持 `{{variable}}` 替换：

| 变量 | 值 |
|----------|-------|
| `{{agentId}}` | 代理的 ID |
| `{{companyId}}` | 公司 ID |
| `{{runId}}` | 当前运行 ID |
| `{{agent.name}}` | 代理的名称 |
| `{{company.name}}` | 公司名称 |

## 会话持久化

适配器在心跳之间持久化 Claude Code 会话 ID。下次唤醒时，它会恢复现有对话，使代理保留完整的上下文。

会话恢复是感知工作目录的：如果代理的工作目录自上次运行以来发生了变化，则会启动一个新的会话。

如果恢复因未知会话错误而失败，适配器会自动使用新会话重试。

## 技能注入

适配器创建一个临时目录，其中包含指向 Paperclip 技能的符号链接，并通过 `--add-dir` 传递。这使得技能可被发现，而不会污染代理的工作目录。

对于在心跳运行之外的手动本地 CLI 使用（例如直接作为 `claudecoder` 运行），请使用：

```sh
pnpm paperclipai agent local-cli claudecoder --company-id <company-id>
```

这会将 Paperclip 技能安装到 `~/.claude/skills`，创建代理 API 密钥，并打印 shell 导出命令以便作为该代理运行。

## 环境测试

使用 UI 中的"测试环境"按钮来验证适配器配置。它会检查：

- Claude CLI 已安装且可访问
- 工作目录是绝对路径且可用（如果缺失且有权限则自动创建）
- API 密钥/认证模式提示（`ANTHROPIC_API_KEY` vs 订阅登录）
- 实时 hello 探测（`claude --print - --output-format stream-json --verbose` 配合提示词 `Respond with hello.`）以验证 CLI 就绪状态
