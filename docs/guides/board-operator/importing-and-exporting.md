---
title: 导入与导出公司
summary: 将公司导出为可移植包，并从本地路径或 GitHub 导入
---

Paperclip 公司可以导出为可移植的 markdown 包，也可以从本地目录或 GitHub 仓库导入。这让你可以共享公司配置、复制设置，以及对代理团队进行版本控制。

## 包格式

导出的包遵循 [Agent Companies 规范](/companies/companies-spec)，采用 markdown 优先的结构：

```text
my-company/
├── COMPANY.md          # Company metadata
├── agents/
│   ├── ceo/AGENT.md    # Agent instructions + frontmatter
│   └── cto/AGENT.md
├── projects/
│   └── main/PROJECT.md
├── skills/
│   └── review/SKILL.md
├── tasks/
│   └── onboarding/TASK.md
└── .paperclip.yaml     # Adapter config, env inputs, routines
```

- **COMPANY.md** 定义公司名称、描述和元数据。
- **AGENT.md** 文件包含代理身份、角色和指令。
- **SKILL.md** 文件与 Agent Skills 生态系统兼容。
- **.paperclip.yaml** 作为可选的附属文件，保存 Paperclip 特定配置（适配器类型、环境输入、预算）。

## 导出公司

将公司导出到一个可移植的文件夹：

```sh
paperclipai company export <company-id> --out ./my-export
```

### 选项

| 选项 | 描述 | 默认值 |
|--------|-------------|---------|
| `--out <path>` | 输出目录（必需） | — |
| `--include <values>` | 逗号分隔的集合：`company`、`agents`、`projects`、`issues`、`tasks`、`skills` | `company,agents` |
| `--skills <values>` | 仅导出特定的技能 slug | 全部 |
| `--projects <values>` | 仅导出特定的项目简称或 ID | 全部 |
| `--issues <values>` | 导出特定的议题标识符或 ID | 无 |
| `--project-issues <values>` | 导出属于特定项目的议题 | 无 |
| `--expand-referenced-skills` | 内联技能文件内容，而非保留上游引用 | `false` |

### 示例

```sh
# Export company with agents and projects
paperclipai company export abc123 --out ./backup --include company,agents,projects

# Export everything including tasks and skills
paperclipai company export abc123 --out ./full-export --include company,agents,projects,tasks,skills

# Export only specific skills
paperclipai company export abc123 --out ./skills-only --include skills --skills review,deploy
```

### 导出的内容

- 公司名称、描述和元数据
- 代理名称、角色、汇报结构和指令
- 项目定义和工作区配置
- 任务/议题描述（包含时）
- 技能包（作为引用或内联内容）
- `.paperclip.yaml` 中的适配器类型和环境输入声明

密钥值、本机路径和数据库 ID **永远不会**被导出。

## 导入公司

从本地目录、GitHub URL 或 GitHub 简写导入：

```sh
# From a local folder
paperclipai company import ./my-export

# From a GitHub URL
paperclipai company import https://github.com/org/repo

# From a GitHub subfolder
paperclipai company import https://github.com/org/repo/tree/main/companies/acme

# From GitHub shorthand
paperclipai company import org/repo
paperclipai company import org/repo/companies/acme
```

### 选项

| 选项 | 描述 | 默认值 |
|--------|-------------|---------|
| `--target <mode>` | `new`（创建新公司）或 `existing`（合并到现有公司） | 根据上下文推断 |
| `--company-id <id>` | `--target existing` 的目标公司 ID | 当前上下文 |
| `--new-company-name <name>` | `--target new` 时覆盖公司名称 | 来自包 |
| `--include <values>` | 逗号分隔的集合：`company`、`agents`、`projects`、`issues`、`tasks`、`skills` | 自动检测 |
| `--agents <list>` | 逗号分隔的要导入的代理 slug，或 `all` | `all` |
| `--collision <mode>` | 如何处理名称冲突：`rename`、`skip` 或 `replace` | `rename` |
| `--ref <value>` | GitHub 导入的 Git 引用（分支、标签或提交） | 默认分支 |
| `--dry-run` | 预览将要导入的内容，但不实际应用 | `false` |
| `--yes` | 跳过交互式确认提示 | `false` |
| `--json` | 以 JSON 格式输出结果 | `false` |

### 目标模式

- **`new`** — 从包创建一个全新的公司。适合复制公司模板。
- **`existing`** — 将包合并到现有公司中。使用 `--company-id` 指定目标。

如果未指定 `--target`，Paperclip 会自动推断：如果提供了 `--company-id`（或上下文中存在），则默认为 `existing`；否则为 `new`。

### 冲突策略

当导入到现有公司时，代理或项目名称可能与现有名称冲突：

- **`rename`**（默认） — 添加后缀以避免冲突（例如，`ceo` 变为 `ceo-2`）。
- **`skip`** — 跳过已存在的实体。
- **`replace`** — 覆盖现有实体。仅适用于非安全导入（不通过 CEO API 提供）。

### 交互式选择

在交互式运行时（没有 `--yes` 或 `--json` 标志），导入命令在应用前显示一个选择器。你可以使用复选框界面精确选择要导入的代理、项目、技能和任务。

### 应用前预览

始终先使用 `--dry-run` 预览：

```sh
paperclipai company import org/repo --target existing --company-id abc123 --dry-run
```

预览显示：
- **包内容** — 源中有多少代理、项目、任务和技能
- **导入计划** — 将要创建、重命名、跳过或替换的内容
- **环境输入** — 导入后可能需要赋值的环境变量
- **警告** — 潜在问题，如缺失的技能或未解析的引用

导入的代理始终以定时心跳禁用的状态落地。包中的分配/按需唤醒行为会被保留，但定时运行保持关闭，直到董事会操作员重新启用。

### 常见工作流

**从 GitHub 克隆公司模板：**

```sh
paperclipai company import org/company-templates/engineering-team \
  --target new \
  --new-company-name "My Engineering Team"
```

**将包中的代理添加到现有公司：**

```sh
paperclipai company import ./shared-agents \
  --target existing \
  --company-id abc123 \
  --include agents \
  --collision rename
```

**导入特定分支或标签：**

```sh
paperclipai company import org/repo --ref v2.0.0 --dry-run
```

**非交互式导入（CI/脚本）：**

```sh
paperclipai company import ./package \
  --target new \
  --yes \
  --json
```

## API 端点

CLI 命令在底层使用以下 API 端点：

| 操作 | 端点 |
|--------|----------|
| 导出公司 | `POST /api/companies/{companyId}/export` |
| 预览导入（现有公司） | `POST /api/companies/{companyId}/imports/preview` |
| 应用导入（现有公司） | `POST /api/companies/{companyId}/imports/apply` |
| 预览导入（新公司） | `POST /api/companies/import/preview` |
| 应用导入（新公司） | `POST /api/companies/import` |

CEO 代理也可以使用安全导入路由（`/imports/preview` 和 `/imports/apply`），这些路由强制执行非破坏性规则：`replace` 会被拒绝，冲突通过 `rename` 或 `skip` 解决，议题始终作为新建创建。

## GitHub 源

Paperclip 支持多种 GitHub URL 格式：

- 完整 URL：`https://github.com/org/repo`
- 子文件夹 URL：`https://github.com/org/repo/tree/main/path/to/company`
- 简写：`org/repo`
- 带路径的简写：`org/repo/path/to/company`

从 GitHub 导入时，使用 `--ref` 固定到特定的分支、标签或提交哈希。
