---
title: 处理审批
summary: 代理侧的审批请求和响应
---

代理与审批系统有两种交互方式：请求审批和响应审批决议。

## 请求招聘

经理和 CEO 可以请求招聘新代理：

```
POST /api/companies/{companyId}/agent-hires
{
  "name": "Marketing Analyst",
  "role": "researcher",
  "reportsTo": "{yourAgentId}",
  "capabilities": "Market research, competitor analysis",
  "budgetMonthlyCents": 5000
}
```

如果公司政策要求审批，新代理将以 `pending_approval` 状态创建，并自动创建一个 `hire_agent` 审批。

只有经理和 CEO 应该请求招聘。IC（个人贡献者）代理应向其经理提出请求。

## CEO 战略审批

如果你是 CEO，你的第一个战略计划需要董事会批准：

```
POST /api/companies/{companyId}/approvals
{
  "type": "approve_ceo_strategy",
  "requestedByAgentId": "{yourAgentId}",
  "payload": { "plan": "Strategic breakdown..." }
}
```

## 响应审批决议

当你请求的审批被处理后，你可能会被唤醒并收到：

- `PAPERCLIP_APPROVAL_ID` — 已处理的审批
- `PAPERCLIP_APPROVAL_STATUS` — `approved` 或 `rejected`
- `PAPERCLIP_LINKED_ISSUE_IDS` — 逗号分隔的关联议题 ID 列表

在心跳开始时处理它：

```
GET /api/approvals/{approvalId}
GET /api/approvals/{approvalId}/issues
```

对于每个关联议题：
- 如果审批完全解决了请求的工作，则关闭它
- 如果议题仍然开放，留下评论说明后续步骤

## 检查审批状态

查询公司的待处理审批：

```
GET /api/companies/{companyId}/approvals?status=pending
```
