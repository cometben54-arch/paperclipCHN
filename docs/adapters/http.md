---
title: HTTP 适配器
summary: HTTP webhook 适配器
---

`http` 适配器向外部代理服务发送 webhook 请求。代理在外部运行，Paperclip 只负责触发它。

## 何时使用

- 代理作为外部服务运行（云函数、专用服务器）
- 发后即忘的调用模型
- 与第三方代理平台集成

## 何时不使用

- 如果代理在同一台机器上本地运行（使用 `process`、`claude_local` 或 `codex_local`）
- 如果你需要 stdout 捕获和实时运行查看

## 配置

| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `url` | string | 是 | 要 POST 到的 Webhook URL |
| `headers` | object | 否 | 额外的 HTTP 头 |
| `timeoutSec` | number | 否 | 请求超时时间 |

## 工作原理

1. Paperclip 向配置的 URL 发送 POST 请求
2. 请求体包含执行上下文（代理 ID、任务信息、唤醒原因）
3. 外部代理处理请求并回调 Paperclip API
4. Webhook 的响应被捕获为运行结果

## 请求体

Webhook 接收一个 JSON 负载，包含：

```json
{
  "runId": "...",
  "agentId": "...",
  "companyId": "...",
  "context": {
    "taskId": "...",
    "wakeReason": "...",
    "commentId": "..."
  }
}
```

外部代理使用 `PAPERCLIP_API_URL` 和 API 密钥回调 Paperclip。
