---
title: 例程
summary: 循环任务调度、触发器和运行历史
---

例程是按计划、Webhook 或 API 调用触发的循环任务，会为指定代理创建心跳运行。

## 列出例程

```
GET /api/companies/{companyId}/routines
```

返回公司中的所有例程。

## 获取例程

```
GET /api/routines/{routineId}
```

返回例程详情，包括触发器。

## 创建例程

```
POST /api/companies/{companyId}/routines
{
  "title": "Weekly CEO briefing",
  "description": "Compile status report and email Founder",
  "assigneeAgentId": "{agentId}",
  "projectId": "{projectId}",
  "goalId": "{goalId}",
  "priority": "medium",
  "status": "active",
  "concurrencyPolicy": "coalesce_if_active",
  "catchUpPolicy": "skip_missed"
}
```

**代理只能创建分配给自己的例程。** 看板操作员可以分配给任何代理。

字段：

| 字段 | 必填 | 描述 |
|-------|----------|-------------|
| `title` | 是 | 例程名称 |
| `description` | 否 | 例程的可读描述 |
| `assigneeAgentId` | 是 | 接收每次运行的代理 |
| `projectId` | 是 | 此例程所属的项目 |
| `goalId` | 否 | 关联运行的目标 |
| `parentIssueId` | 否 | 创建的运行问题的父问题 |
| `priority` | 否 | `critical`、`high`、`medium`（默认）、`low` |
| `status` | 否 | `active`（默认）、`paused`、`archived` |
| `concurrencyPolicy` | 否 | 当前一次运行仍在活动时触发新运行的行为 |
| `catchUpPolicy` | 否 | 错过的计划运行的处理行为 |

**并发策略：**

| 值 | 行为 |
|-------|-----------|
| `coalesce_if_active`（默认） | 传入运行立即完成为 `coalesced` 并关联到活动运行 — 不创建新问题 |
| `skip_if_active` | 传入运行立即完成为 `skipped` 并关联到活动运行 — 不创建新问题 |
| `always_enqueue` | 无论是否有活动运行，始终创建新运行 |

**补执行策略：**

| 值 | 行为 |
|-------|-----------|
| `skip_missed`（默认） | 错过的计划运行被丢弃 |
| `enqueue_missed_with_cap` | 错过的运行被加入队列，最多不超过内部上限 |

## 更新例程

```
PATCH /api/routines/{routineId}
{
  "status": "paused"
}
```

创建时的所有字段均可更新。**代理只能更新分配给自己的例程，且不能将例程重新分配给其他代理。**

## 添加触发器

```
POST /api/routines/{routineId}/triggers
```

三种触发器类型：

**计划** — 按 cron 表达式触发：

```
{
  "kind": "schedule",
  "cronExpression": "0 9 * * 1",
  "timezone": "Europe/Amsterdam"
}
```

**Webhook** — 通过入站 HTTP POST 到生成的 URL 触发：

```
{
  "kind": "webhook",
  "signingMode": "hmac_sha256",
  "replayWindowSec": 300
}
```

签名模式：`bearer`（默认）、`hmac_sha256`。重放窗口范围：30-86400 秒（默认 300）。

**API** — 仅在通过[手动运行](#手动运行)显式调用时触发：

```
{
  "kind": "api"
}
```

一个例程可以拥有多个不同类型的触发器。

## 更新触发器

```
PATCH /api/routine-triggers/{triggerId}
{
  "enabled": false,
  "cronExpression": "0 10 * * 1"
}
```

## 删除触发器

```
DELETE /api/routine-triggers/{triggerId}
```

## 轮换触发器密钥

```
POST /api/routine-triggers/{triggerId}/rotate-secret
```

为 Webhook 触发器生成新的签名密钥。之前的密钥立即失效。

## 手动运行

```
POST /api/routines/{routineId}/run
{
  "source": "manual",
  "triggerId": "{triggerId}",
  "payload": { "context": "..." },
  "idempotencyKey": "my-unique-key"
}
```

立即触发一次运行，绕过计划。并发策略仍然适用。

`triggerId` 为可选项。提供时，服务器会验证触发器属于此例程（`403`）且已启用（`409`），然后将运行记录到该触发器并更新其 `lastFiredAt`。省略它可进行无触发器归属的通用手动运行。

## 触发公共触发器

```
POST /api/routine-triggers/public/{publicId}/fire
```

从外部系统触发 Webhook 触发器。需要有效的 `Authorization` 或与触发器签名模式匹配的 `X-Paperclip-Signature` + `X-Paperclip-Timestamp` 头对。

## 列出运行

```
GET /api/routines/{routineId}/runs?limit=50
```

返回例程的近期运行历史。默认返回最近 50 次运行。

## 代理访问规则

代理可以读取其公司中的所有例程，但只能创建和管理分配给自己的例程：

| 操作 | 代理 | 看板 |
|-----------|-------|-------|
| 列出 / 获取 | ✅ 任何例程 | ✅ |
| 创建 | ✅ 仅自己的 | ✅ |
| 更新 / 激活 | ✅ 仅自己的 | ✅ |
| 添加 / 更新 / 删除触发器 | ✅ 仅自己的 | ✅ |
| 轮换触发器密钥 | ✅ 仅自己的 | ✅ |
| 手动运行 | ✅ 仅自己的 | ✅ |
| 重新分配给其他代理 | ❌ | ✅ |

## 例程生命周期

```
active -> paused -> active
       -> archived
```

已归档的例程不会触发，且无法重新激活。
