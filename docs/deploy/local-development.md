---
title: 本地开发
summary: 设置 Paperclip 本地开发环境
---

在本地运行 Paperclip，无需任何外部依赖。

## 前置条件

- Node.js 20+
- pnpm 9+

## 启动开发服务器

```sh
pnpm install
pnpm dev
```

这将启动：

- **API 服务器**：位于 `http://localhost:3100`
- **UI**：由 API 服务器以开发中间件模式提供服务（同源）

无需 Docker 或外部数据库。Paperclip 自动使用内嵌 PostgreSQL。

## 一键引导

首次安装时：

```sh
pnpm paperclipai run
```

此命令会：

1. 如果缺少配置，自动引导
2. 运行启用修复的 `paperclipai doctor`
3. 检查通过后启动服务器

## Tailscale/私有认证开发模式

要以 `authenticated/private` 模式运行以实现网络访问：

```sh
pnpm dev --tailscale-auth
```

这将把服务器绑定到 `0.0.0.0` 以实现私有网络访问。

别名：

```sh
pnpm dev --authenticated-private
```

允许额外的私有主机名：

```sh
pnpm paperclipai allowed-hostname dotta-macbook-pro
```

完整设置和故障排除，请参阅 [Tailscale 私有访问](/deploy/tailscale-private-access)。

## 健康检查

```sh
curl http://localhost:3100/api/health
# -> {"status":"ok"}

curl http://localhost:3100/api/companies
# -> []
```

## 重置开发数据

要清除本地数据并重新开始：

```sh
rm -rf ~/.paperclip/instances/default/db
pnpm dev
```

## 数据位置

| 数据 | 路径 |
|------|------|
| 配置 | `~/.paperclip/instances/default/config.json` |
| 数据库 | `~/.paperclip/instances/default/db` |
| 存储 | `~/.paperclip/instances/default/data/storage` |
| 密钥文件 | `~/.paperclip/instances/default/secrets/master.key` |
| 日志 | `~/.paperclip/instances/default/logs` |

通过环境变量覆盖：

```sh
PAPERCLIP_HOME=/custom/path PAPERCLIP_INSTANCE_ID=dev pnpm paperclipai run
```
