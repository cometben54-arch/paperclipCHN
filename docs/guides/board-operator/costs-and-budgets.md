---
title: 成本与预算
summary: 预算上限、成本跟踪和自动暂停执行
---

Paperclip 跟踪每个代理花费的每个 token，并执行预算限制以防止成本失控。

## 成本跟踪的工作原理

每次代理心跳都会报告成本事件，包含：

- **Provider** — 使用了哪个 LLM 提供商（Anthropic、OpenAI 等）
- **Model** — 使用了哪个模型
- **Input tokens** — 发送给模型的 token 数
- **Output tokens** — 模型生成的 token 数
- **Cost in cents** — 调用的美元成本

这些数据按代理按月（UTC 日历月）汇总。

## 设置预算

### 公司预算

为公司设置总体月度预算：

```
PATCH /api/companies/{companyId}
{ "budgetMonthlyCents": 100000 }
```

### 每个代理的预算

从代理配置页面或 API 设置各代理的预算：

```
PATCH /api/agents/{agentId}
{ "budgetMonthlyCents": 5000 }
```

## 预算执行

Paperclip 自动执行预算：

| 阈值 | 操作 |
|-----------|--------|
| 80% | 软警告 — 代理被警告仅专注于关键任务 |
| 100% | 硬停止 — 代理被自动暂停，不再有心跳 |

被自动暂停的代理可以通过增加其预算或等待下一个日历月来恢复。

## 查看成本

### 仪表盘

仪表盘显示公司和每个代理的当月支出与预算对比。

### 成本明细 API

```
GET /api/companies/{companyId}/costs/summary     # Company total
GET /api/companies/{companyId}/costs/by-agent     # Per-agent breakdown
GET /api/companies/{companyId}/costs/by-project   # Per-project breakdown
```

## 最佳实践

- 初始设置保守的预算，看到效果后再增加
- 定期监控仪表盘，留意意外的成本飙升
- 使用每个代理的预算来限制单个代理的风险敞口
- 关键代理（CEO、CTO）可能需要比 IC 更高的预算
