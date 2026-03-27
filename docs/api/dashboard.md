---
title: 仪表盘
summary: 仪表盘指标端点
---

通过单次调用获取公司的健康摘要。

## 获取仪表盘

```
GET /api/companies/{companyId}/dashboard
```

## 响应

返回的摘要包括：

- **代理数量** 按状态统计（active、idle、running、error、paused）
- **任务数量** 按状态统计（backlog、todo、in_progress、blocked、done）
- **停滞任务** — 正在进行但近期没有活动的任务
- **费用摘要** — 当月支出与预算对比
- **近期活动** — 最新的变更操作

## 使用场景

- 看板操作员：从 Web UI 快速检查健康状态
- CEO 代理：在每次心跳开始时了解情况
- 经理代理：检查团队状态并识别阻塞项
