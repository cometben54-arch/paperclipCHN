# 工作区技术实现规范

## 本文档的作用

本文档将 [workspace-product-model-and-work-product.md](/Users/dotta/paperclip-subissues/doc/plans/workspace-product-model-and-work-product.md) 转化为可直接执行的工程实施计划。

本文档有意保持具体性，涵盖以下内容：

- schema 与迁移结构
- 共享契约更新
- 路由与服务变更
- UI 变更
- 发布与兼容性规则

这是第一个具备 workspace 感知能力的交付切片的实施目标。

## 已锁定决策

以下决策在本次实施中视为已确定：

1. 现在新增一张持久化的 `execution_workspaces` 表。
2. 每个 issue 同一时刻最多关联一个当前执行 workspace。
3. `issues` 表新增显式字段 `project_workspace_id` 和 `execution_workspace_id`。
4. Workspace 复用在 V1 范围之内。
5. 该功能通过 UI 路径 `/instance/settings > Experimental > Workspaces` 进行开关控制。
6. 开关仅限 UI 层。后端模型变更和迁移始终随版本发布。
7. 现有用户升级后将自动获得保持兼容性的默认值。
8. `project_workspaces` 原地演进，不做替换。
9. 工作产物以 issue 为核心，可选地与执行 workspace 和运行时服务关联。
10. 第一个切片中 GitHub 是唯一的 PR 提供方。
11. `adapter_managed` 和 `cloud_sandbox` 两种执行模式均在范围之内。
12. Workspace 控件优先集成到现有项目属性中发布，不在新的全局导航区域中发布。
13. 子 issue 不在本实施切片范围之内。

## 非目标

- 构建完整的代码审查系统
- 在本切片中解决子 issue 的用户体验
- 在本切片中实现跨项目的可复用共享 workspace 定义
- 在引入执行 workspace 之前重构所有现有运行时服务行为

## 现有基线

该代码库已包含：

- `project_workspaces`
- `projects.execution_workspace_policy`
- `issues.execution_workspace_settings`
- `workspace_runtime_services` 中的运行时服务持久化
- `workspace-runtime.ts` 中的本地 git-worktree 实现

本次实施应在现有基线之上构建，而非另起炉灶。

## 术语

- `Project workspace`：为项目持久配置的代码库/根目录
- `Execution workspace`：供一个或多个 issue 使用的实际运行时 workspace
- `Work product`：面向用户的输出物，例如 PR、预览、分支、提交、构件、文档
- `Runtime service`：workspace 所拥有或追踪的进程或服务
- `Compatibility mode`：为升级后尚未显式启用 workspace 的安装实例保留的现有行为

## 架构概述

第一个切片应引入三个明确的层次：

1. `Project workspace`
   - 现有的、项目范围内的持久化代码库记录
   - 扩展以支持本地、git、非 git 及远程托管等形态

2. `Execution workspace`
   - 新的持久化运行时记录
   - 代表共享、隔离、operator 分支或远程托管的执行上下文

3. `Issue work product`
   - 新的持久化输出记录
   - 存储 PR、预览、分支、提交、构件和文档

issue 仍然是规划和所有权单元。
执行 workspace 仍然是运行时单元。
工作产物仍然是可交付/输出单元。

## 配置与部署拓扑

## 重要更正

该代码库已使用 `PAPERCLIP_DEPLOYMENT_MODE` 来处理认证/部署行为（`local_trusted | authenticated`）。

请勿将该变量复用于 workspace 执行拓扑。

## 新增环境变量

新增一个独立的执行主机提示变量：

- `PAPERCLIP_EXECUTION_TOPOLOGY=local|cloud|hybrid`

默认值：

- 若未设置，视为 `local`

用途：

- 影响 workspace 配置的默认值和校验逻辑
- 不改变当前的认证/部署语义
- 不破坏现有安装实例

### 语义说明

- `local`
  - Paperclip 可在宿主机上创建 worktree、进程和路径
- `cloud`
  - Paperclip 应假设没有持久化的宿主机本地执行 workspace 管理
  - adapter 托管流程和 cloud sandbox 流程应作为一等公民对待
- `hybrid`
  - 本地和远程执行策略可以并存

这是第一个切片中的护栏和默认值辅助机制，而非严格的策略引擎。

## 实例设置

在 `/instance/settings` 下新增 `Experimental`（实验性功能）分区。

### 新增设置项

- `experimental.workspaces: boolean`

规则：

- 默认值为 `false`
- 仅为 UI 层开关
- 存储在实例配置或实例设置 API 响应中
- 即使该值为 false，后端路由和迁移仍保持可用

### 关闭时的 UI 行为

- 隐藏 workspace 专属的 issue 控件
- 隐藏 workspace 专属的项目配置
- 若 issue 的 `Work Product` 标签页内容为空，则将其隐藏
- 不删除或使任何已存储的 workspace 数据失效

## 数据模型

## 1. 扩展 `project_workspaces`

该表已存在，应原地演进。

### 新增字段

- `source_type text not null default 'local_path'`
  - `local_path | git_repo | non_git_path | remote_managed`
- `default_ref text null`
- `visibility text not null default 'default'`
  - `default | advanced`
- `setup_command text null`
- `cleanup_command text null`
- `remote_provider text null`
  - examples: `github`, `openai`, `anthropic`, `custom`
- `remote_workspace_ref text null`
- `shared_workspace_key text null`
  - 为未来跨项目共享 workspace 定义预留

### 回填规则

- 若已有行包含 `repo_url`，则回填 `source_type='git_repo'`
- 否则若已有行包含 `cwd`，则回填 `source_type='local_path'`
- 否则回填 `source_type='remote_managed'`
- 将现有 `repo_ref` 复制到 `default_ref`

### 索引

- 保留现有索引
- 新增 `(project_id, source_type)`
- 新增非唯一索引 `(company_id, shared_workspace_key)`，供未来使用

## 2. 新增 `execution_workspaces`

创建一张新的持久化表。

### 字段

- `id uuid pk`
- `company_id uuid not null`
- `project_id uuid not null`
- `project_workspace_id uuid null`
- `source_issue_id uuid null`
- `mode text not null`
  - `shared_workspace | isolated_workspace | operator_branch | adapter_managed | cloud_sandbox`
- `strategy_type text not null`
  - `project_primary | git_worktree | adapter_managed | cloud_sandbox`
- `name text not null`
- `status text not null default 'active'`
  - `active | idle | in_review | archived | cleanup_failed`
- `cwd text null`
- `repo_url text null`
- `base_ref text null`
- `branch_name text null`
- `provider_type text not null default 'local_fs'`
  - `local_fs | git_worktree | adapter_managed | cloud_sandbox`
- `provider_ref text null`
- `derived_from_execution_workspace_id uuid null`
- `last_used_at timestamptz not null default now()`
- `opened_at timestamptz not null default now()`
- `closed_at timestamptz null`
- `cleanup_eligible_at timestamptz null`
- `cleanup_reason text null`
- `metadata jsonb null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 外键

- `company_id -> companies.id`
- `project_id -> projects.id`
- `project_workspace_id -> project_workspaces.id on delete set null`
- `source_issue_id -> issues.id on delete set null`
- `derived_from_execution_workspace_id -> execution_workspaces.id on delete set null`

### 索引

- `(company_id, project_id, status)`
- `(company_id, project_workspace_id, status)`
- `(company_id, source_issue_id)`
- `(company_id, last_used_at desc)`
- `(company_id, branch_name)` 非唯一索引

## 3. 扩展 `issues`

新增显式的 workspace 关联字段。

### 新增字段

- `project_workspace_id uuid null`
- `execution_workspace_id uuid null`
- `execution_workspace_preference text null`
  - `inherit | shared_workspace | isolated_workspace | operator_branch | reuse_existing`

### 外键

- `project_workspace_id -> project_workspaces.id on delete set null`
- `execution_workspace_id -> execution_workspaces.id on delete set null`

### 回填规则

- 所有现有 issue 的新增字段赋值为 null
- null 应被解读为兼容性/继承行为

### 不变式约束

- 若设置了 `project_workspace_id`，则其所属项目和公司必须与该 issue 一致
- 若设置了 `execution_workspace_id`，则其所属公司必须与该 issue 一致
- 若设置了 `execution_workspace_id`，则所引用 workspace 的 `project_id` 必须与该 issue 的 `project_id` 一致

## 4. 新增 `issue_work_products`

创建一张新的持久化输出记录表。

### 字段

- `id uuid pk`
- `company_id uuid not null`
- `project_id uuid null`
- `issue_id uuid not null`
- `execution_workspace_id uuid null`
- `runtime_service_id uuid null`
- `type text not null`
  - `preview_url | runtime_service | pull_request | branch | commit | artifact | document`
- `provider text not null`
  - `paperclip | github | vercel | s3 | custom`
- `external_id text null`
- `title text not null`
- `url text null`
- `status text not null`
  - `active | ready_for_review | approved | changes_requested | merged | closed | failed | archived`
- `review_state text not null default 'none'`
  - `none | needs_board_review | approved | changes_requested`
- `is_primary boolean not null default false`
- `health_status text not null default 'unknown'`
  - `unknown | healthy | unhealthy`
- `summary text null`
- `metadata jsonb null`
- `created_by_run_id uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 外键

- `company_id -> companies.id`
- `project_id -> projects.id on delete set null`
- `issue_id -> issues.id on delete cascade`
- `execution_workspace_id -> execution_workspaces.id on delete set null`
- `runtime_service_id -> workspace_runtime_services.id on delete set null`
- `created_by_run_id -> heartbeat_runs.id on delete set null`

### 索引

- `(company_id, issue_id, type)`
- `(company_id, execution_workspace_id, type)`
- `(company_id, provider, external_id)`
- `(company_id, updated_at desc)`

## 5. 扩展 `workspace_runtime_services`

该表已存在，应继续作为已拥有/已追踪服务的权威记录。

### 新增字段

- `execution_workspace_id uuid null`

### 外键

- `execution_workspace_id -> execution_workspaces.id on delete set null`

### 行为规范

- 运行时服务仍以 workspace 为优先
- issue UI 应通过关联的执行 workspace 和工作产物来展示运行时服务

## 共享契约

## 1. `packages/shared`

### 更新项目 workspace 类型与校验器

新增字段：

- `sourceType`
- `defaultRef`
- `visibility`
- `setupCommand`
- `cleanupCommand`
- `remoteProvider`
- `remoteWorkspaceRef`
- `sharedWorkspaceKey`

### 新增执行 workspace 类型与校验器

新增共享类型：

- `ExecutionWorkspace`
- `ExecutionWorkspaceMode`
- `ExecutionWorkspaceStatus`
- `ExecutionWorkspaceProviderType`

### 新增工作产物类型与校验器

新增共享类型：

- `IssueWorkProduct`
- `IssueWorkProductType`
- `IssueWorkProductStatus`
- `IssueWorkProductReviewState`

### 更新 issue 类型与校验器

新增：

- `projectWorkspaceId`
- `executionWorkspaceId`
- `executionWorkspacePreference`
- `workProducts?: IssueWorkProduct[]`

### 扩展项目执行策略契约

将现有的精简策略替换为更明确的结构：

- `enabled`
- `defaultMode`
  - `shared_workspace | isolated_workspace | operator_branch | adapter_default`
- `allowIssueOverride`
- `defaultProjectWorkspaceId`
- `workspaceStrategy`
- `branchPolicy`
- `pullRequestPolicy`
- `runtimePolicy`
- `cleanupPolicy`

V1 中不应尝试编码每个可能的 provider 专属字段。在需要时，将 provider 专属的扩展性保留在嵌套 JSON 中。

## 服务层变更

## 1. 项目服务

更新项目 workspace 的 CRUD 逻辑以处理扩展后的 schema。

### 必要规则

- 设置主 workspace 时，清除同级记录的 `is_primary` 标记
- `source_type=remote_managed` 的记录 `cwd` 可为 null
- 本地/git 支持的 workspace 仍应要求 `cwd` 或 `repo_url` 其中之一
- 保留仅发送 `cwd/repoUrl/repoRef` 的现有调用方的当前行为

## 2. Issue 服务

更新 issue 的创建/更新流程，以处理显式的 workspace 绑定。

### 创建行为

按以下顺序解析默认值：

1. explicit `projectWorkspaceId` from request
2. `project.executionWorkspacePolicy.defaultProjectWorkspaceId`
3. project's primary workspace
4. null

解析 `executionWorkspacePreference`：

1. 请求中的显式字段
2. 项目策略默认值
3. 兼容性回退值 `inherit`

不应在 issue 创建时即创建执行 workspace，除非：

- 显式选择了 `reuse_existing` 且提供了 `executionWorkspaceId`

否则，workspace 的实例化应在执行启动时进行。

### 更新行为

- 仅当 workspace 属于同一项目时，允许修改 `projectWorkspaceId`
- 仅当 `executionWorkspaceId` 属于同一公司和项目时，允许设置该字段
- 当 workspace 关联变更时，不自动销毁或重新关联历史工作产物

## 3. Workspace 实例化服务

重构 `workspace-runtime.ts`，使实例化过程能够创建或复用一条 `execution_workspaces` 记录。

### 新流程

输入：

- issue
- 项目 workspace
- 项目执行策略
- 执行拓扑提示
- adapter/运行时配置

输出：

- 已实例化的执行 workspace 记录
- 运行时 cwd/provider 元数据

### 必须支持的模式

- `shared_workspace`
  - 复用代表项目主/共享 workspace 的稳定执行 workspace
- `isolated_workspace`
  - 创建或复用派生的隔离执行 workspace
- `operator_branch`
  - 创建或复用长期存活的分支 workspace
- `adapter_managed`
  - 创建带有 provider 引用的执行 workspace，`cwd` 可选为 null
- `cloud_sandbox`
  - 与 adapter-managed 相同，但明确采用远程沙箱语义

### 复用规则

当请求 `reuse_existing` 时：

- 仅列出活跃或近期使用过的执行 workspace
- 仅限同一项目
- 若指定了项目 workspace，则仅限同一项目 workspace
- 排除已归档及清理失败的 workspace

### 共享 workspace 实例化

针对兼容性模式和共享 workspace 项目：

- 在首次需要时，为每个项目 workspace 创建一个稳定的执行 workspace
- 后续运行时复用该 workspace

这可避免在后续工作产物关联中引入特殊分支逻辑。

## 4. 运行时服务集成

当运行时服务启动或被复用时：

- 填充 `execution_workspace_id`
- 继续填充 `project_workspace_id`、`project_id` 和 `issue_id`

当运行时服务产出 URL 时：

- 可选地创建或更新一条类型为 `runtime_service` 或 `preview_url` 的关联 `issue_work_products` 记录

## 5. PR 与预览报告

新增用于创建/更新 `issue_work_products` 的服务。

### V1 支持的工作产物类型

- `pull_request`
- `preview_url`
- `runtime_service`
- `branch`
- `commit`
- `artifact`
- `document`

### GitHub PR 报告

V1 中，GitHub 是唯一具有更丰富语义的 provider。

支持的状态：

- `draft`
- `ready_for_review`
- `approved`
- `changes_requested`
- `merged`
- `closed`

在 V1 中，通过 `status` 和 `review_state` 字段表示上述状态，而不另建独立的 PR 表。

## 路由与 API

## 1. 项目 workspace 路由

扩展现有路由：

- `GET /projects/:id/workspaces`
- `POST /projects/:id/workspaces`
- `PATCH /projects/:id/workspaces/:workspaceId`
- `DELETE /projects/:id/workspaces/:workspaceId`

### 新增接受/返回字段

- `sourceType`
- `defaultRef`
- `visibility`
- `setupCommand`
- `cleanupCommand`
- `remoteProvider`
- `remoteWorkspaceRef`

## 2. 执行 workspace 路由

新增：

- `GET /companies/:companyId/execution-workspaces`
  - 过滤条件：
    - `projectId`
    - `projectWorkspaceId`
    - `status`
    - `issueId`
    - `reuseEligible=true`
- `GET /execution-workspaces/:id`
- `PATCH /execution-workspaces/:id`
  - V1 中仅更新 status/metadata/cleanup 相关字段

暂不为这些路由添加顶层导航入口。

## 3. 工作产物路由

新增：

- `GET /issues/:id/work-products`
- `POST /issues/:id/work-products`
- `PATCH /work-products/:id`
- `DELETE /work-products/:id`

### V1 变更权限

- board 可对所有记录进行创建/更新/删除
- agent 可对其被分配或正在执行的 issue 进行创建/更新
- 一旦与历史输出关联，删除操作通常应归档而非硬删除

## 4. Issue 路由

扩展现有的创建/更新请求体，新增接受字段：

- `projectWorkspaceId`
- `executionWorkspacePreference`
- `executionWorkspaceId`

扩展 `GET /issues/:id` 的返回字段：

- `projectWorkspaceId`
- `executionWorkspaceId`
- `executionWorkspacePreference`
- `currentExecutionWorkspace`
- `workProducts[]`

## 5. 实例设置路由

新增对以下操作的支持：

- 读取/写入 `experimental.workspaces`

此为纯 UI 开关。

若尚无通用的实例设置存储机制，第一个切片可将其存储在 `/instance/settings` 已使用的现有配置/实例设置机制中。

## UI 变更

## 1. `/instance/settings`

新增分区：

- `Experimental`（实验性功能）
  - `Enable Workspaces`（启用 Workspaces）

关闭时：

- 隐藏新的 workspace 专属交互控件
- 不改变现有的项目或 issue 行为

## 2. 项目属性

暂不新建独立的 `Code` 标签页，优先在现有项目属性中发布。

### 新增或重新启用的分区

- `Project Workspaces`（项目 Workspace）
- `Execution Defaults`（执行默认值）
- `Provisioning`（资源供给）
- `Pull Requests`（拉取请求）
- `Previews and Runtime`（预览与运行时）
- `Cleanup`（清理）

### 显示规则

- 仅在 `experimental.workspaces=true` 时显示
- 措辞应足够通用，同时适用于本地和远程配置
- 仅在 `sourceType=git_repo` 时显示 git 专属字段
- 仅在非 `remote_managed` 时显示本地路径专属字段

## 3. Issue 创建对话框

当 workspace 实验性功能开关开启，且所选项目具有 workspace 自动化或 workspace 时：

### 基本字段

- `Codebase`（代码库）
  - 从项目 workspace 中选择
  - 默认为策略默认值或主 workspace
- `Execution mode`（执行模式）
  - `Project default`（项目默认）
  - `Shared workspace`（共享 workspace）
  - `Isolated workspace`（隔离 workspace）
  - `Operator branch`（operator 分支）

### 高级选项区

- `Reuse existing execution workspace`（复用现有执行 workspace）

该控件的查询范围仅限于：

- 同一项目
- 若已选择代码库，则限同一代码库
- 活跃或近期使用过的 workspace
- 以分支名或 workspace 名为简洁标签

不应以未经过滤的冗长列表展示所有执行 workspace。

## 4. Issue 详情

在以下情况下显示 `Work Product`（工作产物）标签页：

- 实验性功能开关开启，或
- 该 issue 已有工作产物

### 展示内容

- 当前执行 workspace 摘要
- PR 卡片
- 预览卡片
- 分支/提交行
- 构件/文档

新增头部紧凑标签（chip）：

- 代码库
- workspace
- PR 数量/状态
- 预览状态

## 5. 执行 workspace 详情页

新增详情路由，但不添加导航入口。

从以下位置链接跳转：

- issue 工作产物标签页
- 项目 workspace/执行面板

### 展示内容

- 身份标识与状态
- 来源项目 workspace
- 来源 issue
- 关联 issue
- 分支/ref/provider 信息
- 运行时服务
- 工作产物
- 清理状态

## 运行时与 Adapter 行为

## 1. 本地 Adapter

对于本地 adapter：

- 继续使用现有的 cwd/worktree 实例化路径
- 将结果持久化为执行 workspace
- 将运行时服务和工作产物挂载到执行 workspace 和 issue

## 2. 远程或云端 Adapter

对于远程 adapter：

- 允许执行 workspace 的 `cwd` 为 null
- 要求提供足以标识远程 workspace/会话的 provider 元数据
- 允许在不持有宿主机本地进程的情况下创建工作产物

示例：

- 云端编码 agent 在 GitHub 上创建分支和 PR
- Vercel 预览 URL 作为预览工作产物上报
- 远程沙箱产出构件 URL

## 3. 支持审批的 PR 工作流

V1 应支持更丰富的 PR 状态追踪，但不构建完整的审查引擎。

### 必须支持的操作

- `open_pr`
- `mark_ready`

### 必须支持的审查状态

- `draft`
- `ready_for_review`
- `approved`
- `changes_requested`
- `merged`
- `closed`

### 存储方案

- 以 `type='pull_request'` 的 `issue_work_products` 记录来表示上述状态
- 使用 `status` 和 `review_state` 字段
- 将 provider 专属详情存储在 `metadata` 中

## 迁移计划

## 1. 现有安装实例

迁移的基本立场是默认向后兼容。

### 保证事项

- 现有项目无需编辑即可继续正常运行
- 现有 issue 流程不应开始强制要求 workspace 输入
- 所有新增的可空字段在缺失时必须保留当前行为

## 2. 项目 workspace 迁移

原地迁移 `project_workspaces`。

### 回填

- 推导 `source_type`
- 将 `repo_ref` 复制到 `default_ref`
- 新增可选字段留空为 null

## 3. Issue 迁移

不对所有现有 issue 回填 `project_workspace_id` 或 `execution_workspace_id`。

原因：

- 最安全的迁移方式是保留当前运行时行为，仅在使用新的 workspace 感知流程时才进行显式绑定

将旧 issue 解读为：

- `executionWorkspacePreference = inherit`
- 兼容性/共享行为

## 4. 运行时历史迁移

迁移本身不应尝试对执行 workspace 进行完整的历史重建。

替代方案：

- 从第一次新运行起向前创建执行 workspace 记录
- 若事后证明有价值，可选地为近期运行时服务添加补充回填工具

## 发布顺序

## 阶段一：Schema 与共享契约

1. 扩展 `project_workspaces`
2. 新增 `execution_workspaces`
3. 新增 `issue_work_products`
4. 扩展 `issues`
5. 扩展 `workspace_runtime_services`
6. 更新共享类型与校验器

## 阶段二：服务层串联

1. 更新项目 workspace 的 CRUD
2. 更新 issue 创建/更新的解析逻辑
3. 重构 workspace 实例化以持久化执行 workspace
4. 将运行时服务挂载到执行 workspace
5. 新增工作产物服务与持久化

## 阶段三：API 与 UI

1. 新增执行 workspace 路由
2. 新增工作产物路由
3. 新增实例实验性功能设置开关
4. 在功能开关后重新启用并修订项目 workspace UI
5. 在功能开关后新增 issue 创建/更新控件
6. 新增 issue 工作产物标签页
7. 新增执行 workspace 详情页

## 阶段四：Provider 集成

1. GitHub PR 报告
2. 预览 URL 报告
3. 运行时服务到工作产物的关联
4. 远程/云端 provider 引用

## 验收标准

1. 现有安装实例在无需重新配置的情况下继续可预期地运行。
2. 项目可定义本地、git、非 git 及远程托管等类型的项目 workspace。
3. Issue 可显式选择项目 workspace 和执行偏好。
4. 每个 issue 可关联一个当前执行 workspace。
5. 多个 issue 可有意地复用同一执行 workspace。
6. 执行 workspace 在本地和远程执行流程中均可持久化。
7. 工作产物可挂载到 issue，并可选择关联执行 workspace。
8. GitHub PR 可使用更丰富的生命周期状态来表示。
9. 当实验性功能开关关闭时，主 UI 保持简洁。
10. 第一个切片无需顶层 workspace 导航入口。

## 风险与缓解措施

## 风险：workspace 概念过多且相互重叠

缓解措施：

- 将 issue UI 限定于 `Codebase`（代码库）和 `Execution mode`（执行模式）
- 将执行 workspace 详情保留在高级页面中

## 风险：升级后破坏现有项目

缓解措施：

- 新增字段均为可空
- 对 `project_workspaces` 进行原地迁移
- 设置兼容性默认值

## 风险：本地专属假设泄漏到云端模式

缓解措施：

- 使执行 workspace 的 `cwd` 为可选
- 使用 `provider_type` 和 `provider_ref`
- 使用 `PAPERCLIP_EXECUTION_TOPOLOGY` 作为默认值护栏

## 风险：过早将 PR 构建为定制子系统

缓解措施：

- V1 中将 PR 表示为工作产物
- 将 provider 专属详情保留在 metadata 中
- 推迟独立 PR 表的建设，除非实际使用证明有必要

## 推荐的首个工程切片

若追求最小可用实现：

1. 扩展 `project_workspaces`
2. 新增 `execution_workspaces`
3. 为 `issues` 新增显式 workspace 字段
4. 从现有本地 workspace 实例化中持久化执行 workspace
5. 新增 `issue_work_products`
6. 在实验性功能开关后展示项目 workspace 控件和 issue workspace 控件
7. 新增 issue `Work Product` 标签页，展示 PR/预览/运行时服务

该切片已足以验证模型，无需在此阶段构建所有 provider 集成或清理工作流。
