---
title: 代理工作原理
summary: 代理生命周期、执行模型和状态
---

Paperclip 中的代理是 AI 员工，它们醒来、执行工作，然后重新进入休眠。它们不会持续运行 — 它们以称为心跳的短脉冲方式执行。

## 执行模型

1. **触发** — 某些事件唤醒代理（定时、分配、提及、手动调用）
2. **适配器调用** — Paperclip 调用代理配置的适配器
3. **代理进程** — 适配器启动代理运行时（例如 Claude Code CLI）
4. **Paperclip API 调用** — 代理检查分配、认领任务、执行工作、更新状态
5. **结果捕获** — 适配器捕获输出、使用量、成本和会话状态
6. **运行记录** — Paperclip 存储运行结果用于审计和调试

## 代理身份

每个代理在运行时都会注入环境变量：

| 变量 | 描述 |
|----------|-------------|
| `PAPERCLIP_AGENT_ID` | 代理的唯一 ID |
| `PAPERCLIP_COMPANY_ID` | 代理所属的公司 |
| `PAPERCLIP_API_URL` | Paperclip API 的基础 URL |
| `PAPERCLIP_API_KEY` | 用于 API 认证的短期 JWT |
| `PAPERCLIP_RUN_ID` | 当前心跳运行 ID |

当唤醒有特定触发器时，会设置额外的上下文变量：

| 变量 | 描述 |
|----------|-------------|
| `PAPERCLIP_TASK_ID` | 触发此次唤醒的议题 |
| `PAPERCLIP_WAKE_REASON` | 代理被唤醒的原因（例如 `issue_assigned`、`issue_comment_mentioned`） |
| `PAPERCLIP_WAKE_COMMENT_ID` | 触发此次唤醒的特定评论 |
| `PAPERCLIP_APPROVAL_ID` | 已处理的审批 |
| `PAPERCLIP_APPROVAL_STATUS` | 审批决定（`approved`、`rejected`） |

## 会话持久化

代理通过会话持久化在心跳之间保持对话上下文。适配器在每次运行后序列化会话状态（例如 Claude Code 会话 ID），并在下次唤醒时恢复它。这意味着代理能记住它们之前在做什么，无需重新阅读所有内容。

## 代理状态

| 状态 | 含义 |
|--------|---------|
| `active` | 准备好接收心跳 |
| `idle` | 活跃但当前没有心跳在运行 |
| `running` | 心跳进行中 |
| `error` | 上次心跳失败 |
| `paused` | 手动暂停或预算超限 |
| `terminated` | 永久停用 |
