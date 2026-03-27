---
title: 数据库
summary: 内嵌 PGlite vs Docker Postgres vs 托管方案
---

Paperclip 通过 Drizzle ORM 使用 PostgreSQL。有三种方式运行数据库。

## 1. 内嵌 PostgreSQL（默认）

零配置。如果未设置 `DATABASE_URL`，服务器会自动启动内嵌的 PostgreSQL 实例。

```sh
pnpm dev
```

首次启动时，服务器会：

1. 创建 `~/.paperclip/instances/default/db/` 用于存储
2. 确保 `paperclip` 数据库存在
3. 自动运行迁移
4. 开始处理请求

数据在重启后持久保存。要重置：`rm -rf ~/.paperclip/instances/default/db`。

Docker 快速启动默认也使用内嵌 PostgreSQL。

## 2. 本地 PostgreSQL（Docker）

如需在本地运行完整的 PostgreSQL 服务器：

```sh
docker compose up -d
```

这将在 `localhost:5432` 上启动 PostgreSQL 17。设置连接字符串：

```sh
cp .env.example .env
# DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
```

推送模式：

```sh
DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip \
  npx drizzle-kit push
```

## 3. 托管 PostgreSQL（Supabase）

对于生产环境，使用托管提供商如 [Supabase](https://supabase.com/)。

1. 在 [database.new](https://database.new) 创建项目
2. 从项目设置 > 数据库中复制连接字符串
3. 在 `.env` 中设置 `DATABASE_URL`

使用**直连**（端口 5432）进行迁移，使用**连接池**（端口 6543）运行应用程序。

如果使用连接池，请禁用预处理语句：

```ts
// packages/db/src/client.ts
export function createDb(url: string) {
  const sql = postgres(url, { prepare: false });
  return drizzlePg(sql, { schema });
}
```

## 模式切换

| `DATABASE_URL` | 模式 |
|----------------|------|
| 未设置 | 内嵌 PostgreSQL |
| `postgres://...localhost...` | 本地 Docker PostgreSQL |
| `postgres://...supabase.com...` | 托管 Supabase |

Drizzle 模式（`packages/db/src/schema/`）不受运行模式影响。
