---
title: CLI 概览
summary: CLI 安装和设置
---

Paperclip CLI 处理实例设置、诊断和控制平面操作。

## 用法

```sh
pnpm paperclipai --help
```

## 全局选项

所有命令支持：

| 标志 | 描述 |
|------|-------------|
| `--data-dir <path>` | 本地 Paperclip 数据根目录（与 `~/.paperclip` 隔离） |
| `--api-base <url>` | API 基础 URL |
| `--api-key <token>` | API 认证令牌 |
| `--context <path>` | 上下文文件路径 |
| `--profile <name>` | 上下文配置文件名称 |
| `--json` | 以 JSON 格式输出 |

公司级命令还接受 `--company-id <id>`。

对于干净的本地实例，在运行的命令上传递 `--data-dir`：

```sh
pnpm paperclipai run --data-dir ./tmp/paperclip-dev
```

## 上下文配置文件

存储默认值以避免重复输入标志：

```sh
# 设置默认值
pnpm paperclipai context set --api-base http://localhost:3100 --company-id <id>

# 查看当前上下文
pnpm paperclipai context show

# 列出配置文件
pnpm paperclipai context list

# 切换配置文件
pnpm paperclipai context use default
```

为避免在上下文中存储密钥，请使用环境变量：

```sh
pnpm paperclipai context set --api-key-env-var-name PAPERCLIP_API_KEY
export PAPERCLIP_API_KEY=...
```

上下文存储在 `~/.paperclip/context.json`。

## 命令类别

CLI 有两个类别：

1. **[设置命令](/cli/setup-commands)** — 实例引导、诊断、配置
2. **[控制平面命令](/cli/control-plane-commands)** — 工单、代理、审批、活动
