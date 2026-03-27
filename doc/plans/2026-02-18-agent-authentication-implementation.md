# 代理认证 — P0 本地适配器 JWT 实现

## 范围

- 适用范围内的适配器：`claude_local`、`codex_local`。
- 目标：为本地适配器实现零配置认证，同时为所有其他调用路径保留静态密钥。
- P0 范围外：轮换 UX、按设备的吊销列表和 CLI 引导。

## 1) 令牌格式和配置

- 使用 HS256 JWT，包含以下声明：
  - `sub`（代理 ID）
  - `company_id`
  - `adapter_type`
  - `run_id`
  - `iat`
  - `exp`
  - 可选的 `jti`（运行令牌 ID）
- 新增配置/环境设置：
  - `PAPERCLIP_AGENT_JWT_SECRET`
  - `PAPERCLIP_AGENT_JWT_TTL_SECONDS`（默认值：`172800`）
  - `PAPERCLIP_AGENT_JWT_ISSUER`（默认值：`paperclip`）
  - `PAPERCLIP_AGENT_JWT_AUDIENCE`（默认值：`paperclip-api`）

## 2) `actorMiddleware` 中的双重认证路径

1. 保持现有的数据库密钥查找路径不变（`agent_api_keys` 哈希查找）。
2. 如果没有数据库密钥匹配，在 `server/src/middleware/auth.ts` 中添加 JWT 验证。
3. JWT 验证成功时：
   - 设置 `req.actor = { type: "agent", agentId, companyId }`。
   - 可选择性地拒绝已终止的代理。
4. 对于没有有效认证的请求，继续回退到 board 身份。

## 3) 可选的适配器能力

1. 扩展 `ServerAdapterModule`（可能在 `packages/adapter-utils/src/types.ts` 中）添加能力标志：
   - `supportsLocalAgentJwt?: true`。
2. 在以下位置启用：
   - `server/src/adapters/registry.ts` 中的 `claude_local` 和 `codex_local`。
3. P0 阶段 `process`/`http` 适配器不设置此标志。
4. 在 `server/src/services/heartbeat.ts` 中，当适配器支持 JWT 时：
   - 在执行前为每次心跳运行铸造 JWT。
   - 在适配器执行上下文中包含令牌。

## 4) 本地环境变量注入行为

1. 在：
   - `packages/adapters/claude-local/src/server/execute.ts`
   - `packages/adapters/codex-local/src/server/execute.ts`

   从上下文令牌注入 `PAPERCLIP_API_KEY`。

- 保留用户在 `adapterConfig.env` 中定义的显式环境变量的现有行为：
  - 如果用户已设置 `PAPERCLIP_API_KEY`，则不覆盖。
- 继续注入：
  - `PAPERCLIP_AGENT_ID`
  - `PAPERCLIP_COMPANY_ID`
  - `PAPERCLIP_API_URL`

## 5) 文档更新

- 更新面向操作员的文档，移除本地适配器的手动密钥设置期望：
  - `skills/paperclip/SKILL.md`
  - `cli/src/commands/heartbeat-run.ts` 中提到手动 API 密钥设置的输出/帮助示例。

## 6) P0 验收标准

- 本地适配器无需手动配置 `PAPERCLIP_API_KEY` 即可认证。
- 现有静态密钥（`agent_api_keys`）仍然正常工作。
- 认证保持公司范围限定（现有检查使用 `req.actor.companyId`）。
- JWT 生成和验证错误以不泄露信息的结构化事件方式记录。
- 范围仅限本地（`claude_local`、`codex_local`），但适配器能力模型是通用的。
