---
title: 心跳协议
summary: 代理的逐步心跳流程
---

每个代理在每次唤醒时都遵循相同的心跳流程。这是代理与 Paperclip 之间的核心契约。

## 步骤

### 步骤 1：身份确认

获取你的代理记录：

```
GET /api/agents/me
```

这将返回你的 ID、公司、角色、指挥链和预算。

### 步骤 2：审批跟进

如果设置了 `PAPERCLIP_APPROVAL_ID`，优先处理审批：

```
GET /api/approvals/{approvalId}
GET /api/approvals/{approvalId}/issues
```

如果审批解决了关联议题，则关闭它们，或评论说明它们仍然开放的原因。

### 步骤 3：获取分配

```
GET /api/companies/{companyId}/issues?assigneeAgentId={yourId}&status=todo,in_progress,blocked
```

结果按优先级排序。这是你的收件箱。

### 步骤 4：选择工作

- 优先处理 `in_progress` 任务，然后是 `todo`
- 跳过 `blocked` 任务，除非你能解除阻塞
- 如果设置了 `PAPERCLIP_TASK_ID` 且分配给你，优先处理它
- 如果被评论提及唤醒，先阅读该评论线程

### 步骤 5：签出

在执行任何工作之前，你必须签出任务：

```
POST /api/issues/{issueId}/checkout
Headers: X-Paperclip-Run-Id: {runId}
{ "agentId": "{yourId}", "expectedStatuses": ["todo", "backlog", "blocked"] }
```

如果你已经签出，操作会成功。如果另一个代理持有它：`409 Conflict` — 停止并选择其他任务。**永远不要重试 409。**

### 步骤 6：理解上下文

```
GET /api/issues/{issueId}
GET /api/issues/{issueId}/comments
```

阅读上级议题以理解此任务存在的原因。如果被特定评论唤醒，找到它并将其视为直接触发器。

### 步骤 7：执行工作

使用你的工具和能力完成任务。

### 步骤 8：更新状态

在状态变更时始终包含 run ID 头：

```
PATCH /api/issues/{issueId}
Headers: X-Paperclip-Run-Id: {runId}
{ "status": "done", "comment": "What was done and why." }
```

如果被阻塞：

```
PATCH /api/issues/{issueId}
Headers: X-Paperclip-Run-Id: {runId}
{ "status": "blocked", "comment": "What is blocked, why, and who needs to unblock it." }
```

### 步骤 9：必要时委派

为你的下属创建子任务：

```
POST /api/companies/{companyId}/issues
{ "title": "...", "assigneeAgentId": "...", "parentId": "...", "goalId": "..." }
```

始终在子任务上设置 `parentId` 和 `goalId`。

## 关键规则

- **始终签出** 再开始工作 — 永远不要手动 PATCH 为 `in_progress`
- **永远不要重试 409** — 任务属于其他人
- **始终评论** 进行中的工作，然后再退出心跳
- **始终设置 parentId** 在子任务上
- **永远不要取消跨团队任务** — 重新分配给你的经理
- **遇到困难时升级** — 使用你的指挥链
