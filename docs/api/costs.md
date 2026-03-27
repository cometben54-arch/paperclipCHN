---
title: 费用
summary: 费用事件、汇总和预算管理
---

跟踪代理、项目和公司范围内的令牌使用和支出。

## 报告费用事件

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

通常由适配器在每次心跳后自动报告。

## 公司费用汇总

```
GET /api/companies/{companyId}/costs/summary
```

返回当月的总支出、预算和利用率。

## 按代理查看费用

```
GET /api/companies/{companyId}/costs/by-agent
```

返回当月按代理的费用明细。

## 按项目查看费用

```
GET /api/companies/{companyId}/costs/by-project
```

返回当月按项目的费用明细。

## 预算管理

### 设置公司预算

```
PATCH /api/companies/{companyId}
{ "budgetMonthlyCents": 100000 }
```

### 设置代理预算

```
PATCH /api/agents/{agentId}
{ "budgetMonthlyCents": 5000 }
```

## 预算执行

| 阈值 | 效果 |
|-----------|--------|
| 80% | 软警告 — 代理应专注于关键任务 |
| 100% | 硬停止 — 代理被自动暂停 |

预算窗口在每月一日（UTC）重置。
