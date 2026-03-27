---
title: 快速开始
summary: 几分钟内启动并运行 Paperclip
---

在 5 分钟内在本地启动并运行 Paperclip。

## 快速开始（推荐）

```sh
npx paperclipai onboard --yes
```

这将引导你完成设置、配置你的环境并启动 Paperclip。

稍后再次启动 Paperclip：

```sh
npx paperclipai run
```

> **注意：** 如果你使用 `npx` 进行设置，请始终使用 `npx paperclipai` 来运行命令。`pnpm paperclipai` 形式仅在克隆的 Paperclip 仓库副本中有效（请参阅下方的本地开发部分）。

## 本地开发

适用于参与 Paperclip 本身开发的贡献者。前提条件：Node.js 20+ 和 pnpm 9+。

克隆仓库，然后：

```sh
pnpm install
pnpm dev
```

这将在 [http://localhost:3100](http://localhost:3100) 启动 API 服务器和 UI。

无需外部数据库 — Paperclip 默认使用内嵌的 PostgreSQL 实例。

在克隆的仓库中工作时，你也可以使用：

```sh
pnpm paperclipai run
```

如果缺少配置，这将自动进行初始化设置，运行带有自动修复功能的健康检查，然后启动服务器。

## 下一步

一旦 Paperclip 运行起来：

1. 在 Web UI 中创建你的第一家公司
2. 定义公司目标
3. 创建 CEO 代理并配置其适配器
4. 通过添加更多代理来构建组织架构图
5. 设置预算并分配初始任务
6. 点击启动 — 代理开始其心跳，公司开始运转

<Card title="核心概念" href="/start/core-concepts">
  了解 Paperclip 背后的关键概念
</Card>
