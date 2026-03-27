# 代理认证与引导

## 问题

代理需要 API 密钥来向 Paperclip 进行认证。当前方法（在应用中生成密钥，手动配置为环境变量）操作繁琐且不具扩展性。不同的适配器类型有不同的信任模型，我们希望支持从"零配置本地"到"代理驱动的自注册"的完整范围。

## 设计原则

1. **认证复杂度应匹配信任边界。** 本地 CLI 适配器不应与远程基于 webhook 的代理需要同样的认证流程。
2. **代理应能自行引导。** 当代理有能力自行完成时，人类不应手动将凭据复制粘贴到代理环境中。
3. **默认需要审批门控。** 自注册必须在新代理可以在公司内操作之前获得明确的审批（由用户或授权代理）。

---

## 认证层级

### 第一层：本地适配器（claude-local、codex-local）

**信任模型：** 适配器进程与 Paperclip 服务器运行在同一台机器上（或由其直接调用）。没有实质性的网络边界。

**方法：** Paperclip 生成令牌并在调用时直接作为参数/环境变量传递给代理进程。无需手动设置。

**令牌格式：** 每次心跳调用（或每个会话）签发的短期 JWT。服务器铸造令牌，在适配器调用中传递，并在 API 请求中接受返回。

**令牌生命周期考虑：**

- 编程代理可能运行数小时，因此令牌不能过快过期。
- 即使在本地环境中，无限期令牌也不可取。
- 使用具有宽松过期时间（例如 48 小时）的 JWT，并设置重叠窗口，使在过期附近开始的心跳仍能完成。
- 服务器不需要存储这些令牌——只需验证 JWT 签名。

**状态：** 部分实现。本地适配器已经传递 `PAPERCLIP_API_URL`、`PAPERCLIP_AGENT_ID`、`PAPERCLIP_COMPANY_ID`。我们需要在注入的环境变量集合中添加 `PAPERCLIP_API_KEY`（JWT）。

### 第二层：CLI 驱动的密钥交换

**信任模型：** 开发者正在设置远程或半远程代理，并拥有其 shell 访问权限。

**方法：** 类似于 `claude setup-token`——开发者运行 Paperclip CLI 命令，打开浏览器 URL 进行确认，然后收到自动存储在代理配置中的令牌。

```
paperclip auth login
# 打开浏览器 -> 用户确认 -> 令牌存储在 ~/.paperclip/credentials
```

**令牌格式：** 长期 API 密钥（在服务器端以哈希形式存储）。

**状态：** 未来实现。在我们拥有不由 Paperclip 服务器自身管理的远程适配器之前不需要。

### 第三层：代理自注册（邀请链接）

**信任模型：** 代理是一个自主的外部系统（例如 OpenClaw 代理、SWE-agent 实例）。设置过程中没有人类参与。代理接收引导 URL 并自行协商注册。

**方法：**

1. 公司管理员（用户或代理）从 Paperclip 生成**邀请 URL**。
2. 邀请 URL 被传递给目标代理（通过消息、任务描述、webhook 负载等）。
3. 代理获取 URL，返回一个**引导文档**，包含：
   - 公司身份和上下文
   - Paperclip SKILL.md（或其链接）
   - Paperclip 需要代理提供的信息（例如 webhook URL、适配器类型、能力、首选名称/角色）
   - 用于 POST 响应的注册端点
4. 代理回复其配置（例如"这是我的 webhook URL，这是我的名称，这些是我的能力"）。
5. Paperclip 存储待审核的注册。
6. 审批者（用户或授权代理）审核并批准新员工。审批包括分配代理的管理者（指挥链）和初始角色/权限。
7. 审批通过后，Paperclip 为代理提供凭据并发送第一次心跳。

**令牌格式：** Paperclip 在审批后签发 API 密钥（或 JWT），通过代理声明的通信渠道发送。

**参考：**

- [Allium 自注册](https://agents.allium.so/skills/skill.md)——代理收集凭据，轮询确认，自动存储密钥。
- [Allium x402](https://agents.allium.so/skills/x402-skill.md)——完全由代理驱动的多步骤凭据设置。
- [OpenClaw webhooks](https://docs.openclaw.ai/automation/webhook)——外部系统通过经过认证的 webhook 端点触发代理操作。

---

## 自注册：引导协商协议

邀请 URL 响应应该是一个结构化文档（JSON 或 markdown），既可人类阅读又可机器解析：

```
GET /api/invite/{inviteToken}
```

响应：

```json
{
  "company": {
    "id": "...",
    "name": "Acme Corp"
  },
  "onboarding": {
    "instructions": "You are being invited to join Acme Corp as an employee agent...",
    "skillUrl": "https://app.paperclip.ing/skills/paperclip/SKILL.md",
    "requiredFields": {
      "name": "Your display name",
      "adapterType": "How Paperclip should send you heartbeats",
      "webhookUrl": "If adapter is webhook-based, your endpoint URL",
      "capabilities": "What you can do (free text or structured)"
    },
    "registrationEndpoint": "POST /api/invite/{inviteToken}/register"
  }
}
```

代理回复 POST：

```json
{
  "name": "CodingBot",
  "adapterType": "webhook",
  "webhookUrl": "https://my-agent.example.com/hooks/agent",
  "webhookAuthToken": "Bearer ...",
  "capabilities": ["code-review", "implementation", "testing"]
}
```

这将进入 `pending_approval` 状态，直到有人批准。

---

## OpenClaw 作为首个外部集成

OpenClaw 是第三层的理想首选目标，因为：

- 它已经支持 webhook（`POST /hooks/agent`）来接收任务。
- webhook 配置（URL、认证令牌、会话密钥）正是我们需要代理在引导过程中告诉我们的内容。
- OpenClaw 代理可以读取 URL、解析指令并发起 HTTP 调用。

**工作流：**

1. 为公司生成 Paperclip 邀请链接。
2. 将邀请链接发送给 OpenClaw 代理（通过其现有的消息通道）。
3. OpenClaw 代理获取邀请，阅读引导文档，并回复其 webhook 配置。
4. Paperclip 公司成员批准新代理。
5. Paperclip 开始向 OpenClaw webhook 端点发送心跳。

---

## 审批模型

所有自注册都需要审批。这对安全性来说是不可协商的。

- **默认：** 公司内的人类用户必须批准。
- **委托：** 拥有 `approve_agents` 权限的管理级代理可以批准（适用于扩展）。
- **自动批准（可选加入）：** 公司可以为使用特定信任级别生成的邀请链接配置自动批准（例如"我信任任何持有此链接的人"）。即便如此，邀请链接本身也是机密信息。

审批时，审批者设置：

- `reportsTo`——新代理在指挥链中向谁报告
- `role`——代理在公司中的角色
- `budget`——初始预算分配

---

## 实施优先级

| 优先级 | 项目 | 备注 |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **P0** | 本地适配器 JWT 注入 | 解锁零配置本地认证。每次心跳铸造 JWT，作为 `PAPERCLIP_API_KEY` 传递。 |
| **P1** | 邀请链接 + 引导端点 | `POST /api/companies/:id/invites`、`GET /api/invite/:token`、`POST /api/invite/:token/register`。 |
| **P1** | 审批流程 | 用于审核和批准待处理代理注册的 UI + API。 |
| **P2** | OpenClaw 集成 | 通过邀请链接实现首个真正的外部代理引导。 |
| **P3** | CLI 认证流程 | 用于开发者管理的远程代理的 `paperclipai auth login`。 |

## P0 实施计划

有关 P0 本地 JWT 执行计划，请参阅 [`doc/plans/agent-authentication-implementation.md`](./agent-authentication-implementation.md)。

---

## 待定问题

- **JWT 签名密钥轮换：** 如何在不使进行中的心跳失效的情况下轮换签名密钥？
- **邀请链接过期：** 邀请链接应该是一次性使用还是多次使用？是否有时间限制？
- **适配器协商：** 引导文档是否应支持任意适配器类型，还是应该枚举支持的适配器让代理选择？
- **凭据更新：** 对于长期运行的外部代理，如何在不停机的情况下处理 API 密钥轮换？
