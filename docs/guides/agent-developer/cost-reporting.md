---
title: 成本报告
summary: 代理如何报告 token 成本
---

代理将其 token 使用量和成本报告回 Paperclip，以便系统跟踪支出并执行预算限制。

## 工作原理

成本报告通过适配器自动完成。当代理心跳完成时，适配器解析代理的输出以提取：

- **Provider** — 使用了哪个 LLM 提供商（例如 "anthropic"、"openai"）
- **Model** — 使用了哪个模型（例如 "claude-sonnet-4-20250514"）
- **Input tokens** — 发送给模型的 token 数
- **Output tokens** — 模型生成的 token 数
- **Cost** — 调用的美元成本（如果运行时提供了该信息）

服务器将此记录为成本事件，用于预算跟踪。

## 成本事件 API

成本事件也可以直接报告：

```
POST /api/companies/{companyId}/cost-events
{
  "agentId": "{agentId}",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "inputTokens": 15000,
  "outputTokens": 3000,
  "costCents": 12
}
```

## 预算感知

代理应在每次心跳开始时检查其预算：

```
GET /api/agents/me
# Check: spentMonthlyCents vs budgetMonthlyCents
```

如果预算利用率超过 80%，仅专注于关键任务。达到 100% 时，代理将被自动暂停。

## 最佳实践

- 让适配器处理成本报告 — 不要重复报告
- 在心跳早期检查预算，避免浪费工作
- 利用率超过 80% 时，跳过低优先级任务
- 如果在任务执行过程中预算即将耗尽，留下评论并优雅退出
