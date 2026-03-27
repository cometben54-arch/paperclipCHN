# CLI 参考

Paperclip CLI 现在支持以下两类功能：

- 实例设置/诊断（`onboard`、`doctor`、`configure`、`env`、`allowed-hostname`）
- 控制平面客户端操作（issues、approvals、agents、activity、dashboard）

## 基本用法

在开发中使用仓库脚本：

```sh
pnpm paperclipai --help
```

首次本地引导 + 运行：

```sh
pnpm paperclipai run
```

选择本地实例：

```sh
pnpm paperclipai run --instance dev
```

## 部署模式

模式分类和设计意图记录在 `doc/DEPLOYMENT-MODES.md` 中。

当前 CLI 行为：

- `paperclipai onboard` 和 `paperclipai configure --section server` 在配置中设置部署模式
- 运行时可以通过 `PAPERCLIP_DEPLOYMENT_MODE` 覆盖模式
- `paperclipai run` 和 `paperclipai doctor` 尚未提供直接的 `--mode` 标志

目标行为（计划中）记录在 `doc/DEPLOYMENT-MODES.md` 第 5 节中。

允许经过身份验证的/私有主机名（例如自定义 Tailscale DNS）：

```sh
pnpm paperclipai allowed-hostname dotta-macbook-pro
```

所有客户端命令支持：

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

公司范围的命令还支持 `--company-id <id>`。

使用 `--data-dir` 可在任何 CLI 命令中将所有默认本地状态（配置/上下文/数据库/日志/存储/密钥）隔离到 `~/.paperclip` 以外的位置：

```sh
pnpm paperclipai run --data-dir ./tmp/paperclip-dev
pnpm paperclipai issue list --data-dir ./tmp/paperclip-dev
```

## 上下文配置文件

将本地默认设置存储在 `~/.paperclip/context.json` 中：

```sh
pnpm paperclipai context set --api-base http://localhost:3100 --company-id <company-id>
pnpm paperclipai context show
pnpm paperclipai context list
pnpm paperclipai context use default
```

为避免在上下文中存储密钥，可设置 `apiKeyEnvVarName` 并将密钥保存在环境变量中：

```sh
pnpm paperclipai context set --api-key-env-var-name PAPERCLIP_API_KEY
export PAPERCLIP_API_KEY=...
```

## 公司命令

```sh
pnpm paperclipai company list
pnpm paperclipai company get <company-id>
pnpm paperclipai company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

示例：

```sh
pnpm paperclipai company delete PAP --yes --confirm PAP
pnpm paperclipai company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

注意事项：

- 删除操作受服务器端 `PAPERCLIP_ENABLE_COMPANY_DELETION` 控制。
- 使用 Agent 身份验证时，公司删除限定在公司范围内。请使用当前公司 ID/前缀（例如通过 `--company-id` 或 `PAPERCLIP_COMPANY_ID`），不能操作其他公司。

## Issue 命令

```sh
pnpm paperclipai issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm paperclipai issue get <issue-id-or-identifier>
pnpm paperclipai issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm paperclipai issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm paperclipai issue comment <issue-id> --body "..." [--reopen]
pnpm paperclipai issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm paperclipai issue release <issue-id>
```

## Agent 命令

```sh
pnpm paperclipai agent list --company-id <company-id>
pnpm paperclipai agent get <agent-id>
pnpm paperclipai agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` 是以 Paperclip Agent 身份手动运行本地 Claude/Codex 的最快方式：

- 创建一个新的长期 Agent API 密钥
- 将缺失的 Paperclip 技能安装到 `~/.codex/skills` 和 `~/.claude/skills`
- 打印 `export ...` 行，包含 `PAPERCLIP_API_URL`、`PAPERCLIP_COMPANY_ID`、`PAPERCLIP_AGENT_ID` 和 `PAPERCLIP_API_KEY`

基于短名称的本地设置示例：

```sh
pnpm paperclipai agent local-cli codexcoder --company-id <company-id>
pnpm paperclipai agent local-cli claudecoder --company-id <company-id>
```

## 审批命令

```sh
pnpm paperclipai approval list --company-id <company-id> [--status pending]
pnpm paperclipai approval get <approval-id>
pnpm paperclipai approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm paperclipai approval approve <approval-id> [--decision-note "..."]
pnpm paperclipai approval reject <approval-id> [--decision-note "..."]
pnpm paperclipai approval request-revision <approval-id> [--decision-note "..."]
pnpm paperclipai approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm paperclipai approval comment <approval-id> --body "..."
```

## 活动命令

```sh
pnpm paperclipai activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## 仪表盘命令

```sh
pnpm paperclipai dashboard get --company-id <company-id>
```

## 心跳命令

`heartbeat run` 现在也支持上下文/api-key 选项，并使用共享的客户端栈：

```sh
pnpm paperclipai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## 本地存储默认值

默认本地实例根目录为 `~/.paperclip/instances/default`：

- 配置：`~/.paperclip/instances/default/config.json`
- 嵌入式数据库：`~/.paperclip/instances/default/db`
- 日志：`~/.paperclip/instances/default/logs`
- 存储：`~/.paperclip/instances/default/data/storage`
- 密钥文件：`~/.paperclip/instances/default/secrets/master.key`

通过环境变量覆盖基础主目录或实例：

```sh
PAPERCLIP_HOME=/custom/home PAPERCLIP_INSTANCE_ID=dev pnpm paperclipai run
```

## 存储配置

配置存储提供程序和设置：

```sh
pnpm paperclipai configure --section storage
```

支持的提供程序：

- `local_disk`（默认；本地单用户安装）
- `s3`（S3 兼容对象存储）
