---
title: Tailscale 私有访问
summary: 使用 Tailscale 友好的主机绑定运行 Paperclip 并从其他设备连接
---

当您希望通过 Tailscale（或私有 LAN/VPN）访问 Paperclip 而非仅限 `localhost` 时，请使用此方式。

## 1. 以私有认证模式启动 Paperclip

```sh
pnpm dev --tailscale-auth
```

此命令配置：

- `PAPERCLIP_DEPLOYMENT_MODE=authenticated`
- `PAPERCLIP_DEPLOYMENT_EXPOSURE=private`
- `PAPERCLIP_AUTH_BASE_URL_MODE=auto`
- `HOST=0.0.0.0`（绑定所有接口）

等效标志：

```sh
pnpm dev --authenticated-private
```

## 2. 查找您可达的 Tailscale 地址

在运行 Paperclip 的机器上：

```sh
tailscale ip -4
```

您也可以使用 Tailscale MagicDNS 主机名（例如 `my-macbook.tailnet.ts.net`）。

## 3. 从另一台设备打开 Paperclip

使用 Tailscale IP 或 MagicDNS 主机名加上 Paperclip 端口：

```txt
http://<tailscale-host-or-ip>:3100
```

示例：

```txt
http://my-macbook.tailnet.ts.net:3100
```

## 4. 需要时允许自定义私有主机名

如果您使用自定义私有主机名访问 Paperclip，请将其添加到允许列表：

```sh
pnpm paperclipai allowed-hostname my-macbook.tailnet.ts.net
```

## 5. 验证服务器是否可达

从远程 Tailscale 连接的设备上：

```sh
curl http://<tailscale-host-or-ip>:3100/api/health
```

预期结果：

```json
{"status":"ok"}
```

## 故障排除

- 在私有主机名上出现登录或重定向错误：使用 `paperclipai allowed-hostname` 添加该主机名。
- 应用仅在 `localhost` 上工作：确保您使用了 `--tailscale-auth` 启动（或在私有模式下设置了 `HOST=0.0.0.0`）。
- 本地可以连接但远程无法连接：确认两台设备在同一个 Tailscale 网络上，且端口 `3100` 可达。
