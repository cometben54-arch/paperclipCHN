---
title: 部署模式
summary: local_trusted vs authenticated（私有/公开）
---

Paperclip 支持两种具有不同安全配置的运行模式。

## `local_trusted`

默认模式。针对单操作员本地使用进行了优化。

- **主机绑定**：仅回环地址（localhost）
- **认证**：无需登录
- **使用场景**：本地开发、独立实验
- **看板身份**：自动创建的本地看板用户

```sh
# 在引导过程中设置
pnpm paperclipai onboard
# 选择 "local_trusted"
```

## `authenticated`

需要登录。支持两种暴露策略。

### `authenticated` + `private`

用于私有网络访问（Tailscale、VPN、LAN）。

- **认证**：需要通过 Better Auth 登录
- **URL 处理**：自动基础 URL 模式（低摩擦）
- **主机信任**：需要私有主机信任策略

```sh
pnpm paperclipai onboard
# 选择 "authenticated" -> "private"
```

允许自定义 Tailscale 主机名：

```sh
pnpm paperclipai allowed-hostname my-machine
```

### `authenticated` + `public`

用于面向互联网的部署。

- **认证**：需要登录
- **URL**：需要显式的公开 URL
- **安全性**：doctor 中更严格的部署检查

```sh
pnpm paperclipai onboard
# 选择 "authenticated" -> "public"
```

## 看板认领流程

从 `local_trusted` 迁移到 `authenticated` 时，Paperclip 在启动时发出一次性认领 URL：

```
/board-claim/<token>?code=<code>
```

已登录用户访问此 URL 来认领看板所有权。此操作会：

- 将当前用户提升为实例管理员
- 降级自动创建的本地看板管理员
- 确保认领用户具有活跃的公司成员身份

## 更改模式

更新部署模式：

```sh
pnpm paperclipai configure --section server
```

通过环境变量进行运行时覆盖：

```sh
PAPERCLIP_DEPLOYMENT_MODE=authenticated pnpm paperclipai run
```
