# OpenClaw Gateway 适配器

本文档描述了 `@paperclipai/adapter-openclaw-gateway` 如何通过 Gateway 协议调用 OpenClaw。

## 传输方式

此适配器始终使用 WebSocket gateway 传输。

- URL 必须为 `ws://` 或 `wss://`
- 连接流程遵循 gateway 协议：
1. 接收 `connect.challenge`
2. 发送 `req connect`（protocol/client/auth/device 载荷）
3. 发送 `req agent`
4. 通过 `req agent.wait` 等待完成
5. 将 `event agent` 帧流式传输到 Paperclip 日志/转录解析中

## 认证模式

Gateway 凭据可以通过以下任一方式提供：

- 适配器配置中的 `authToken` / `token`
- `headers.x-openclaw-token`
- `headers.x-openclaw-auth`（旧版）
- `password`（共享密码模式）

当存在 token 且缺少 `authorization` 头时，适配器会自动生成 `Authorization: Bearer <token>`。

## 设备认证

默认情况下，适配器在 `connect` 参数中发送签名的 `device` 载荷。

- 设置 `disableDeviceAuth=true` 可跳过设备签名
- 设置 `devicePrivateKeyPem` 可固定使用稳定的签名密钥
- 如果未设置 `devicePrivateKeyPem`，适配器会在每次运行时生成临时的 Ed25519 密钥对
- 当启用 `autoPairOnFirstConnect`（默认启用）时，适配器会处理首次 `pairing required`，通过共享认证调用 `device.pair.list` + `device.pair.approve`，然后重试一次。

## 会话策略

适配器支持与 HTTP OpenClaw 模式相同的会话路由模型：

- `sessionKeyStrategy=issue|fixed|run`
- 当策略为 `fixed` 时使用 `sessionKey`

解析后的会话密钥作为 `agent.sessionKey` 发送。

## 载荷映射

代理请求构建方式如下：

- 必填字段：
  - `message`（唤醒文本加上可选的 `payloadTemplate.message`/`payloadTemplate.text` 前缀）
  - `idempotencyKey`（Paperclip `runId`）
  - `sessionKey`（解析后的策略）
- 可选附加字段：
  - 所有 `payloadTemplate` 字段合并
  - 如果配置中设置了 `agentId` 且模板中不存在，则添加该字段

## 超时

- `timeoutSec` 控制适配器级别的请求时间预算
- `waitTimeoutMs` 控制 `agent.wait.timeoutMs`

如果 `agent.wait` 返回 `timeout`，适配器返回 `openclaw_gateway_wait_timeout`。

## 日志格式

结构化 gateway 事件日志使用：

- `[openclaw-gateway] ...` 用于生命周期/系统日志
- `[openclaw-gateway:event] run=<id> stream=<stream> data=<json>` 用于 `event agent` 帧

UI/CLI 解析器消费这些行以渲染转录更新。
