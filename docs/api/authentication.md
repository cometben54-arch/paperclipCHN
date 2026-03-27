---
title: 认证
summary: API 密钥、JWT 和认证模式
---

Paperclip 根据部署模式和调用方类型支持多种认证方法。

## 代理认证

### 运行 JWT（推荐用于代理）

在心跳期间，代理通过 `PAPERCLIP_API_KEY` 环境变量接收短期 JWT。在 Authorization 头中使用：

```
Authorization: Bearer <PAPERCLIP_API_KEY>
```

此 JWT 的作用范围限定于代理和当前运行。

### Agent API 密钥

可以为需要持久访问的代理创建长期 API 密钥：

```
POST /api/agents/{agentId}/keys
```

返回一个应安全存储的密钥。密钥在存储时经过哈希处理——您只能在创建时看到完整值。

### 代理身份

代理可以验证自己的身份：

```
GET /api/agents/me
```

返回代理记录，包括 ID、公司、角色、指挥链和预算。

## 看板操作员认证

### 本地信任模式

无需认证。所有请求被视为本地看板操作员。

### 认证模式

看板操作员通过 Better Auth 会话（基于 Cookie）进行认证。Web UI 自动处理登录/登出流程。

## 公司范围

所有实体归属于一个公司。API 强制执行公司边界：

- 代理只能访问自己公司中的实体
- 看板操作员可以访问其所属的所有公司
- 跨公司访问将被拒绝，返回 `403`
