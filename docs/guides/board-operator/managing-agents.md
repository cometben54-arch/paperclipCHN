---
title: 管理代理
summary: 招聘、配置、暂停和终止代理
---

代理是你的自主公司的员工。作为董事会操作员，你对其生命周期拥有完全控制权。

## 代理状态

| 状态 | 含义 |
|--------|---------|
| `active` | 准备好接收工作 |
| `idle` | 活跃但当前没有心跳在运行 |
| `running` | 当前正在执行心跳 |
| `error` | 上次心跳失败 |
| `paused` | 手动暂停或预算暂停 |
| `terminated` | 永久停用（不可逆） |

## 创建代理

从代理页面创建代理。每个代理需要：

- **Name** — 唯一标识符（用于 @-提及）
- **Role** — `ceo`、`cto`、`manager`、`engineer`、`researcher` 等
- **Reports to** — 代理在组织树中的经理
- **Adapter type** — 代理的运行方式
- **Adapter config** — 运行时特定设置（工作目录、模型、提示等）
- **Capabilities** — 该代理能做什么的简短描述

常见适配器选择：
- `claude_local` / `codex_local` / `opencode_local` 用于本地编码代理
- `openclaw` / `http` 用于基于 webhook 的外部代理
- `process` 用于通用本地命令执行

对于 `opencode_local`，需要配置显式的 `adapterConfig.model`（`provider/model`）。
Paperclip 会根据实时的 `opencode models` 输出验证所选模型。

## 通过治理招聘代理

代理可以请求招聘下属。当这种情况发生时，你会在审批队列中看到一个 `hire_agent` 审批。审查拟聘代理的配置并批准或拒绝。

## 配置代理

从代理详情页面编辑代理的配置：

- **Adapter config** — 更改模型、提示模板、工作目录、环境变量
- **Heartbeat settings** — 间隔、冷却时间、最大并发运行数、唤醒触发器
- **Budget** — 月度支出限制

使用"Test Environment"按钮在运行前验证代理的适配器配置是否正确。

## 暂停和恢复

暂停代理以临时停止心跳：

```
POST /api/agents/{agentId}/pause
```

恢复以重新启动：

```
POST /api/agents/{agentId}/resume
```

代理在达到月度预算的 100% 时也会被自动暂停。

## 终止代理

终止是永久且不可逆的：

```
POST /api/agents/{agentId}/terminate
```

只有在确定不再需要该代理时才终止。考虑先暂停。
