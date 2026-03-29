# Kitchen Sink 插件计划

## 目标

新增一个官方示例插件 `Kitchen Sink (Example)`，在一个地方集中演示当前已实现的所有 Paperclip 插件 API 表面。

该插件的定位是：

- 为贡献者提供持续维护的参考实现
- 作为插件运行时的手动测试工具
- 直观地展示插件目前能做到的所有功能

它并非面向最终用户的成熟产品插件。

## 背景

当前插件系统已有真实的 API 表面，但这些内容分散在：

- SDK 文档
- SDK 类型定义
- 插件规范文档
- 两个示例插件（各自只展示了一小部分功能）

这使得以下基本问题难以得到解答：

- 插件能渲染什么？
- 插件 worker 实际上能做什么？
- 哪些表面是真实可用的，哪些仅是规划中的？
- 新插件在本仓库中应如何组织结构？

kitchen-sink 插件应通过实例来回答这些问题。

## 成功标准

如果贡献者无需事先阅读 SDK，就能在 Paperclip 内安装插件并探索、体验当前插件运行时的完整功能范围，则视为成功。

具体而言：

- 可从内置示例列表安装
- 针对每个已实现的 worker API 表面至少提供一个演示
- 针对每个宿主挂载的 UI 表面至少提供一个演示
- 清晰标注仅限本地 / 仅限受信任环境的演示
- 默认情况下对本地开发足够安全
- 同时兼作插件运行时变更的回归测试工具

## 约束条件

- 保持实例级安装，而非公司级安装。
- 将其视为受信任的本地示例插件。
- 不依赖云安全运行时假设。
- 避免破坏性的默认行为。
- 避免不可逆的数据变更，除非已清晰标注且易于撤销。

## 本计划的依据来源

本计划基于当前已实现的 SDK/类型/运行时，而非仅参考长期规划文档。

主要参考文件：

- `packages/plugins/sdk/README.md`
- `packages/plugins/sdk/src/types.ts`
- `packages/plugins/sdk/src/ui/types.ts`
- `packages/shared/src/constants.ts`
- `packages/shared/src/types/plugin.ts`

## 当前表面功能清单

### 需要演示的 Worker/运行时 API

以下是 SDK 当前暴露的具体 `ctx` 客户端：

- `ctx.config`
- `ctx.events`
- `ctx.jobs`
- `ctx.launchers`
- `ctx.http`
- `ctx.secrets`
- `ctx.assets`
- `ctx.activity`
- `ctx.state`
- `ctx.entities`
- `ctx.projects`
- `ctx.companies`
- `ctx.issues`
- `ctx.agents`
- `ctx.goals`
- `ctx.data`
- `ctx.actions`
- `ctx.streams`
- `ctx.tools`
- `ctx.metrics`
- `ctx.logger`

### 需要演示的 UI 表面

SDK 中定义的表面：

- `page`
- `settingsPage`
- `dashboardWidget`
- `sidebar`
- `sidebarPanel`
- `detailTab`
- `taskDetailView`
- `projectSidebarItem`
- `toolbarButton`
- `contextMenuItem`
- `commentAnnotation`
- `commentContextMenuItem`

### 当前宿主可信度

已确认或强烈指示在当前应用中已挂载：

- `page`
- `settingsPage`
- `dashboardWidget`
- `detailTab`
- `projectSidebarItem`
- 评论相关表面
- launcher 基础设施

在声称完整演示覆盖之前，需要明确验证：

- `sidebar`
- `sidebarPanel`
- `taskDetailView`
- `toolbarButton` 作为直接插槽，有别于 launcher 位置
- `contextMenuItem` 作为直接插槽，有别于评论菜单和 launcher 位置

在宣布插件"完成"之前，实现中应保留一个针对上述项的小型验证清单。

## 插件概念

插件命名：

- 显示名称：`Kitchen Sink (Example)`
- 包名：`@paperclipai/plugin-kitchen-sink-example`
- 插件 ID：`paperclip.kitchen-sink-example` 或 `paperclip-kitchen-sink-example`

建议：使用 `paperclip-kitchen-sink-example`，以匹配当前仓库中示例插件的命名风格。

分类组合：

- `ui`
- `automation`
- `workspace`
- `connector`

覆盖范围有意设置较宽，因为重点在于全面覆盖。

## 用户体验形态

插件应有一个主要的全页演示控制台，以及在其他表面上的若干小型附属组件。

### 1. 插件页面

主路由：插件的 `page` 表面应作为所有演示的中央控制台。

建议的页面分区：

- `Overview`（概览）
  - 本插件演示的功能
  - 当前已授予的能力
  - 当前宿主上下文
- `UI Surfaces`（UI 表面）
  - 说明每个其他表面应出现位置的链接
- `Data + Actions`（数据与操作）
  - 用于桥接驱动 worker 演示的按钮和表单
- `Events + Streams`（事件与流）
  - 发送事件
  - 查看事件日志
  - 流式演示输出
- `Paperclip Domain APIs`（Paperclip 领域 API）
  - companies（公司）
  - projects/workspaces（项目/工作区）
  - issues（工单）
  - goals（目标）
  - agents（智能体）
- `Local Workspace + Process`（本地工作区与进程）
  - 文件列表
  - 文件读/写草稿区
  - 子进程演示
- `Jobs + Webhooks + Tools`（任务、Webhook 与工具）
  - 任务状态
  - Webhook URL 及最近推送记录
  - 已声明的工具
- `State + Entities + Assets`（状态、实体与资产）
  - 作用域状态编辑器
  - 插件实体检查器
  - 上传/生成资产演示
- `Observability`（可观测性）
  - 已写入的指标
  - 活动日志样本
  - 最新 worker 日志

### 2. 仪表盘组件

主仪表盘上的紧凑型组件应展示：

- 插件健康状态
- 已执行的演示数量
- 最近的事件/流活动
- 跳转至完整插件页面的快捷方式

### 3. 项目侧边栏条目

在每个项目下添加一个 `Kitchen Sink` 链接，深链接到项目作用域的插件标签页。

### 4. 详情标签页

使用详情标签页演示在以下实体上的上下文渲染：

- `project`（项目）
- `issue`（工单）
- `agent`（智能体）
- `goal`（目标）

每个标签页应展示：

- 收到的宿主上下文
- 通过 worker 桥接获取的相关实体
- 一个作用于该实体的小型操作

### 5. 评论表面

使用工单评论演示来验证评论专属扩展点：

- `commentAnnotation`
  - 在每条评论下方渲染解析后的元数据
  - 显示评论 ID、工单 ID 以及一个小型派生状态
- `commentContextMenuItem`
  - 添加一个菜单操作，如 `Copy Context To Kitchen Sink`
  - 该操作写入一条插件实体或状态记录，以供后续检查

### 6. 设置页面

自定义 `settingsPage` 应保持简洁且实用：

- `About`（关于）
- `Danger / Trust Model`（危险操作/信任模型）
- 演示开关
- 本地进程默认配置
- 工作区草稿路径行为
- 密钥引用输入项
- 事件/任务/webhook 示例配置

该插件还应通过写入健康状态、日志和指标，使通用插件设置中的 `Status` 标签页保持有价值的展示内容。

## 功能矩阵

每个已实现的 worker API 都应有一个可见的演示。

### `ctx.config`

演示内容：

- 读取实时配置
- 显示配置 JSON
- 在可能的情况下，无需重启即可响应配置变更

### `ctx.events`

演示内容：

- 发送插件事件
- 订阅插件事件
- 订阅核心 Paperclip 事件，例如 `issue.created`
- 以时间线形式展示最近收到的事件

### `ctx.jobs`

演示内容：

- 一个定时的心跳式演示任务
- 如果宿主支持手动触发任务，则在 UI 上提供一个手动运行按钮
- 显示最近一次的运行结果和时间戳

### `ctx.launchers`

演示内容：

- 在 manifest 中声明 launcher
- 可选：从 worker 中注册一个运行时 launcher
- 在插件页面显示 launcher 元数据

### `ctx.http`

演示内容：

- 向安全端点发出一个简单的出站 GET 请求
- 显示状态码、延迟和 JSON 结果

建议：默认使用 Paperclip 本地端点或稳定的公共 echo 端点，以避免不稳定的文档示例。

### `ctx.secrets`

演示内容：

- 操作员在配置中输入一个密钥引用
- 插件按需解析该密钥
- UI 仅显示掩码后的结果长度/成功状态，绝不显示原始密钥

### `ctx.assets`

演示内容：

- 从 UI 生成一个文本资产
- 可选：上传一个小型 JSON blob 或类截图的文本文件
- 显示返回的资产 URL

### `ctx.activity`

演示内容：

- 一个按钮，用于针对当前公司/实体写入一条插件活动日志记录

### `ctx.state`

演示内容：

- 实例作用域状态
- 公司作用域状态
- 项目作用域状态
- 工单作用域状态
- 删除/重置控件

在插件页面使用一个小型状态检查器/编辑器。

### `ctx.entities`

演示内容：

- 创建插件自有的示例记录
- 列表/过滤这些记录
- 展示一个实际用例，例如"复制的评论"或"演示同步记录"

### `ctx.projects`

演示内容：

- 列出项目
- 列出项目工作区
- 解析主工作区
- 解析工单对应的工作区

### `ctx.companies`

演示内容：

- 列出公司并显示当前选中的公司

### `ctx.issues`

演示内容：

- 列出当前公司的工单
- 创建工单
- 更新工单状态/标题
- 列出评论
- 创建评论

### `ctx.agents`

演示内容：

- 列出智能体
- 使用测试提示调用一个智能体
- 在安全的情况下执行暂停/恢复操作

智能体变更控件应置于明确的警告提示之后。

### `ctx.agents.sessions`

演示内容：

- 创建智能体聊天会话
- 发送消息
- 将事件流式传回 UI
- 关闭会话

这是插件页面上"震撼"演示效果的最佳候选。

### `ctx.goals`

演示内容：

- 列出目标
- 创建目标
- 更新状态/标题

### `ctx.data`

在整个插件中用于所有读取侧桥接演示。

### `ctx.actions`

在整个插件中用于所有变更侧桥接演示。

### `ctx.streams`

演示内容：

- 实时事件日志流
- 来自智能体会话中继的 token 风格流
- 用于长时间运行操作的模拟进度流

### `ctx.tools`

演示内容：

- 声明 2-3 个简单的智能体工具
- 工具 1：echo/诊断
- 工具 2：项目/工作区摘要
- 工具 3：创建工单或写入插件状态

插件页面应列出已声明的工具，并显示示例输入载荷。

### `ctx.metrics`

演示内容：

- 在每个主要演示操作时写入一条示例指标
- 在插件页面展示一个小型近期指标表格

### `ctx.logger`

演示内容：

- 每个操作均记录结构化日志条目
- 插件设置中的 `Status` 页面同时作为日志查看器

## 本地工作区与进程演示

插件 SDK 有意将文件/进程操作留给插件自身处理，前提是插件已获取工作区元数据。

kitchen-sink 插件应明确演示这一点。

### 工作区演示

- 列出所选工作区的文件
- 读取一个文件
- 向插件自有的草稿文件写入内容
- 可选：如果 `rg` 可用，则演示文件搜索

### 进程演示

- 运行一个短生命周期命令，如 `pwd`、`ls` 或 `git status`
- 将 stdout/stderr 流式传回 UI
- 显示退出码和耗时

重要的安全保障措施：

- 默认命令必须是只读的
- v1 中不支持来自任意自由输入的 shell 插值
- 提供一个精选命令列表或经过强验证的命令表单
- 明确将此区域标注为仅限本地和仅限受信任环境

## 建议的 Manifest 覆盖范围

插件应声明以下内容：

- `page`
- `settingsPage`
- `dashboardWidget`
- `detailTab`，用于 `project`、`issue`、`agent`、`goal`
- `projectSidebarItem`
- `commentAnnotation`
- `commentContextMenuItem`

在宿主验证通过后，若支持则添加：

- `sidebar`
- `sidebarPanel`
- `taskDetailView`
- `toolbarButton`
- `contextMenuItem`

此外，还应声明一个或多个 `ui.launchers` 条目，以独立于插槽渲染来验证 launcher 行为。

## 建议的包目录结构

新建包路径：

- `packages/plugins/examples/plugin-kitchen-sink-example/`

预期文件：

- `package.json`
- `README.md`
- `tsconfig.json`
- `src/index.ts`
- `src/manifest.ts`
- `src/worker.ts`
- `src/ui/index.tsx`
- `src/ui/components/...`
- `src/ui/hooks/...`
- `src/lib/...`
- 可选：`scripts/build-ui.mjs`（如果 UI 打包需要 esbuild）

## 建议的内部架构

### Worker 模块

建议拆分如下：

- `src/worker.ts`
  - 插件定义与连接
- `src/worker/data.ts`
  - `ctx.data.register(...)`
- `src/worker/actions.ts`
  - `ctx.actions.register(...)`
- `src/worker/events.ts`
  - 事件订阅和事件日志缓冲区
- `src/worker/jobs.ts`
  - 定时任务处理器
- `src/worker/tools.ts`
  - 工具声明和处理器
- `src/worker/local-runtime.ts`
  - 文件/进程演示
- `src/worker/demo-store.ts`
  - state/entities/assets/metrics 的辅助工具

### UI 模块

建议拆分如下：

- `src/ui/index.tsx`
  - 导出的插槽组件
- `src/ui/page/KitchenSinkPage.tsx`
- `src/ui/settings/KitchenSinkSettingsPage.tsx`
- `src/ui/widgets/KitchenSinkDashboardWidget.tsx`
- `src/ui/tabs/ProjectKitchenSinkTab.tsx`
- `src/ui/tabs/IssueKitchenSinkTab.tsx`
- `src/ui/tabs/AgentKitchenSinkTab.tsx`
- `src/ui/tabs/GoalKitchenSinkTab.tsx`
- `src/ui/comments/KitchenSinkCommentAnnotation.tsx`
- `src/ui/comments/KitchenSinkCommentMenuItem.tsx`
- `src/ui/shared/...`

## 配置 Schema

插件应有一个内容充实但易于理解的 `instanceConfigSchema`。

建议的配置字段：

- `enableDangerousDemos`
- `enableWorkspaceDemos`
- `enableProcessDemos`
- `showSidebarEntry`
- `showSidebarPanel`
- `showProjectSidebarItem`
- `showCommentAnnotation`
- `showCommentContextMenuItem`
- `showToolbarLauncher`
- `defaultDemoCompanyId`（可选）
- `secretRefExample`
- `httpDemoUrl`
- `processAllowedCommands`
- `workspaceScratchSubdir`

默认值应关闭所有高风险行为。

## 安全默认值

默认策略：

- UI 和只读演示默认开启
- 数据变更类演示默认开启，但需明确标注
- 进程演示默认关闭
- 默认不允许任意 shell 输入
- 永远不渲染原始密钥

## 分阶段构建计划

### 第一阶段：核心插件骨架

- 脚手架搭建包结构
- 添加 manifest、worker、UI 入口点
- 添加 README
- 使其出现在内置示例列表中

### 第二阶段：核心已确认 UI 表面

- 插件页面
- 设置页面
- 仪表盘组件
- 项目侧边栏条目
- 详情标签页

### 第三阶段：核心 Worker API

- config（配置）
- state（状态）
- entities（实体）
- companies/projects/issues/goals（公司/项目/工单/目标）
- data/actions（数据/操作）
- metrics/logger/activity（指标/日志/活动）

### 第四阶段：实时与自动化 API

- streams（流）
- events（事件）
- jobs（任务）
- webhooks
- agent sessions（智能体会话）
- tools（工具）

### 第五阶段：本地受信任运行时演示

- 工作区文件演示
- 子进程演示
- 由配置项控制开关

### 第六阶段：次要 UI 表面

- comment annotation（评论注释）
- comment context menu item（评论上下文菜单项）
- launcher

### 第七阶段：仅需验证的表面

验证当前宿主是否真正挂载：

- `sidebar`
- `sidebarPanel`
- `taskDetailView`
- 直接插槽 `toolbarButton`
- 直接插槽 `contextMenuItem`

若已挂载，则添加演示。
若未挂载，则将其记录为 SDK 已定义但宿主侧待实现。

## 文档交付物

插件应附带一份 README，内容包括：

- 本插件演示的功能
- 哪些表面仅限本地环境
- 安装方式
- 每个 UI 表面应出现的位置
- 演示卡片与 SDK API 的对应映射

此外，还应在插件文档中将其作为"覆盖所有功能的参考插件"加以引用。

## Testing And Verification

Minimum verification:

- package typecheck/build
- install from bundled example list
- page loads
- widget appears
- project tab appears
- comment surfaces render
- settings page loads
- key actions succeed

Recommended manual checklist:

- create issue from plugin
- create goal from plugin
- emit and receive plugin event
- stream action output
- open agent session and receive streamed reply
- upload an asset
- write plugin activity log
- run a safe local process demo

## Open Questions

1. Should the process demo remain curated-command-only in the first pass?
   Recommendation: yes.

2. Should the plugin create throwaway "kitchen sink demo" issues/goals automatically?
   Recommendation: no. Make creation explicit.

3. Should we expose unsupported-but-typed surfaces in the UI even if host mounting is not wired?
   Recommendation: yes, but label them as `SDK-defined / host validation pending`.

4. Should agent mutation demos include pause/resume by default?
   Recommendation: probably yes, but behind a warning block.

5. Should this plugin be treated as a supported regression harness in CI later?
   Recommendation: yes. Long term, this should be the plugin-runtime smoke test package.

## Recommended Next Step

If this plan looks right, the next implementation pass should start by building only:

- package skeleton
- page
- settings page
- dashboard widget
- one project detail tab
- one issue detail tab
- the basic worker/action/data/state/event scaffolding

That is enough to lock the architecture before filling in every demo surface.
