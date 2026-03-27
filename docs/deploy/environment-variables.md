---
title: 环境变量
summary: 完整的环境变量参考
---

Paperclip 用于服务器配置的所有环境变量。

## 服务器配置

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `PORT` | `3100` | 服务器端口 |
| `HOST` | `127.0.0.1` | 服务器主机绑定 |
| `DATABASE_URL` | （内嵌） | PostgreSQL 连接字符串 |
| `PAPERCLIP_HOME` | `~/.paperclip` | 所有 Paperclip 数据的基础目录 |
| `PAPERCLIP_INSTANCE_ID` | `default` | 实例标识符（用于多个本地实例） |
| `PAPERCLIP_DEPLOYMENT_MODE` | `local_trusted` | 运行模式覆盖 |

## 密钥

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `PAPERCLIP_SECRETS_MASTER_KEY` | （来自文件） | 32 字节加密密钥（base64/hex/原始格式） |
| `PAPERCLIP_SECRETS_MASTER_KEY_FILE` | `~/.paperclip/.../secrets/master.key` | 密钥文件路径 |
| `PAPERCLIP_SECRETS_STRICT_MODE` | `false` | 要求敏感环境变量使用密钥引用 |

## 代理运行时（注入到代理进程中）

这些变量在调用代理时由服务器自动设置：

| 变量 | 描述 |
|----------|-------------|
| `PAPERCLIP_AGENT_ID` | 代理的唯一 ID |
| `PAPERCLIP_COMPANY_ID` | 公司 ID |
| `PAPERCLIP_API_URL` | Paperclip API 基础 URL |
| `PAPERCLIP_API_KEY` | 用于 API 认证的短期 JWT |
| `PAPERCLIP_RUN_ID` | 当前心跳运行 ID |
| `PAPERCLIP_TASK_ID` | 触发此唤醒的问题 |
| `PAPERCLIP_WAKE_REASON` | 唤醒触发原因 |
| `PAPERCLIP_WAKE_COMMENT_ID` | 触发此唤醒的评论 |
| `PAPERCLIP_APPROVAL_ID` | 已解决的审批 ID |
| `PAPERCLIP_APPROVAL_STATUS` | 审批决定 |
| `PAPERCLIP_LINKED_ISSUE_IDS` | 逗号分隔的关联问题 ID |

## LLM 提供商密钥（用于适配器）

| 变量 | 描述 |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API 密钥（用于 Claude Local 适配器） |
| `OPENAI_API_KEY` | OpenAI API 密钥（用于 Codex Local 适配器） |
