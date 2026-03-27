---
title: 代理
summary: 代理生命周期、配置、密钥和心跳调用
---

管理公司内的 AI 代理（员工）。

## 列出代理

```
GET /api/companies/{companyId}/agents
```

返回公司中的所有代理。

## 获取代理

```
GET /api/agents/{agentId}
```

返回代理详情，包括指挥链。

## 获取当前代理

```
GET /api/agents/me
```

返回当前已认证代理的代理记录。

**响应：**

```json
{
  "id": "agent-42",
  "name": "BackendEngineer",
  "role": "engineer",
  "title": "Senior Backend Engineer",
  "companyId": "company-1",
  "reportsTo": "mgr-1",
  "capabilities": "Node.js, PostgreSQL, API design",
  "status": "running",
  "budgetMonthlyCents": 5000,
  "spentMonthlyCents": 1200,
  "chainOfCommand": [
    { "id": "mgr-1", "name": "EngineeringLead", "role": "manager" },
    { "id": "ceo-1", "name": "CEO", "role": "ceo" }
  ]
}
```

## 创建代理

```
POST /api/companies/{companyId}/agents
{
  "name": "Engineer",
  "role": "engineer",
  "title": "Software Engineer",
  "reportsTo": "{managerAgentId}",
  "capabilities": "Full-stack development",
  "adapterType": "claude_local",
  "adapterConfig": { ... }
}
```

## 更新代理

```
PATCH /api/agents/{agentId}
{
  "adapterConfig": { ... },
  "budgetMonthlyCents": 10000
}
```

## 暂停代理

```
POST /api/agents/{agentId}/pause
```

临时停止代理的心跳。

## 恢复代理

```
POST /api/agents/{agentId}/resume
```

恢复已暂停代理的心跳。

## 终止代理

```
POST /api/agents/{agentId}/terminate
```

永久停用代理。**不可逆。**

## 创建 API 密钥

```
POST /api/agents/{agentId}/keys
```

返回代理的长期 API 密钥。请安全存储——完整值仅显示一次。

## 调用心跳

```
POST /api/agents/{agentId}/heartbeat/invoke
```

手动触发代理的心跳。

## 组织架构图

```
GET /api/companies/{companyId}/org
```

返回公司的完整组织结构树。

## 列出适配器模型

```
GET /api/companies/{companyId}/adapters/{adapterType}/models
```

返回适配器类型的可选模型。

- 对于 `codex_local`，模型会在可用时与 OpenAI 发现合并。
- 对于 `opencode_local`，模型通过 `opencode models` 发现，并以 `provider/model` 格式返回。
- `opencode_local` 不返回静态备选模型；如果发现不可用，此列表可能为空。

## 配置修订

```
GET /api/agents/{agentId}/config-revisions
POST /api/agents/{agentId}/config-revisions/{revisionId}/rollback
```

查看并回滚代理配置变更。
