# 2026-03-14 技能 UI 产品计划

Status: Proposed
Date: 2026-03-14
Audience: 产品与工程
Related:
- `doc/plans/2026-03-13-company-import-export-v2.md`
- `doc/plans/2026-03-14-adapter-skill-sync-rollout.md`
- `docs/companies/companies-spec.md`
- `ui/src/pages/AgentDetail.tsx`

## 1. 目的

本文档定义了 Paperclip 中技能管理的产品与 UI 计划。

目标是让技能在网站上易于理解和管理，而不是假装所有适配器的行为都相同。

本计划的前提假设：

- `SKILL.md` 保持与 Agent Skills 兼容
- `skills.sh` 兼容性是 V1 的必要条件
- Paperclip 公司导入/导出可以将技能作为软件包内容包含在内
- 适配器可能支持持久技能同步、临时技能挂载、只读技能发现，或完全不集成技能

## 2. 现状

`AgentDetail` 上已经有一个初步的 Agent 级技能同步 UI。

目前支持：

- 加载适配器技能同步状态
- 清晰显示不受支持的适配器
- 以复选框形式显示已托管技能
- 单独显示外部技能
- 为实现新 API 的适配器同步期望技能

当前限制：

1. 没有公司级技能库 UI。
2. 网站上没有技能的软件包导入流程。
3. 技能软件包管理与按 Agent 技能附加之间没有区分。
4. 没有多 Agent 的期望状态与实际状态对比视图。
5. 当前 UI 以适配器同步为导向，而非以软件包为导向。
6. 不受支持的适配器会安全降级，但不够优雅。

## 2.1 V1 决策

对于 V1，本计划假设以下产品决策已经确定：

1. 必须支持 `skills.sh` 兼容性。
2. `AGENTS.md` 中 Agent 与技能的关联通过 shortname 或 slug 表示。
3. 公司技能与 Agent 技能附加是独立的概念。
4. Agent 技能应移至独立标签页，而不是嵌套在配置中。
5. 公司导入/导出最终应能完整往返传递技能软件包和 Agent 技能附加信息。

## 3. 产品原则

1. 技能首先是公司资产，其次才是 Agent 的附加项。
2. 软件包管理与适配器同步是不同的关注点，不应在同一个界面中混为一谈。
3. UI 必须始终如实展示 Paperclip 所知道的内容：
   - Paperclip 中的期望状态
   - 适配器上报的实际状态
   - 适配器是否能够协调两者之间的差异
4. Agent Skills 兼容性必须在产品模型中保持可见。
5. Agent 与技能的关联应尽可能以人类可读的 shortname 为基础。
6. 不受支持的适配器也应有可用的 UI，而不是仅仅显示死胡同。

## 4. 用户模型

Paperclip 应在两个范围内处理技能：

### 4.1 公司技能

这些是公司已知的可复用技能。

示例：

- 从 GitHub 仓库导入
- 从本地文件夹添加
- 从兼容 `skills.sh` 的仓库安装
- 日后在 Paperclip 内部本地创建

这些技能应包含：

- 名称
- 描述
- slug 或软件包标识
- 来源/溯源信息
- 信任级别
- 兼容性状态

### 4.2 Agent 技能

这些是针对特定 Agent 的技能附加项。

每个附加项应包含：

- shortname
- Paperclip 中的期望状态
- 适配器中可读取到的实际状态
- 同步状态
- 来源

Agent 附加项通常应通过 shortname 或 slug 引用技能，例如：

- `review`
- `react-best-practices`

而不是使用冗长的相对文件路径。

## 4.3 主要用户任务

UI 应清晰支持以下任务：

1. “显示这家公司拥有哪些技能。”
2. “从 GitHub 或本地文件夹导入技能。”
3. “查看某项技能是否安全、是否兼容，以及谁在使用它。”
4. “将技能附加到 Agent。”
5. “查看适配器是否实际拥有这些技能。”
6. “协调期望技能状态与实际技能状态之间的差异。”
7. “了解 Paperclip 所知道的内容与适配器所知道的内容之间的区别。”

## 5. 核心 UI 界面

产品应有两个主要的技能界面。

### 5.1 公司技能页面

添加一个公司级页面，建议路径为：

- `/companies/:companyId/skills`

目的：

- 管理公司技能库
- 导入和检查技能软件包
- 了解溯源信息和信任状态
- 查看哪些 Agent 使用了哪些技能

#### 路由

- `/companies/:companyId/skills`

#### 主要操作

- 导入技能
- 检查技能
- 附加到 Agent
- 从 Agent 分离
- 日后导出所选技能

#### 空状态

当公司没有已托管技能时：

- 解释技能是什么
- 解释 `skills.sh` / Agent Skills 兼容性
- 提供 `Import from GitHub` 和 `Import from folder` 入口
- 可选地将适配器发现的技能作为次级”尚未托管”区块显示

#### A. 技能库列表

每行技能应显示：

- 名称
- 简短描述
- 来源徽标
- 信任徽标
- 兼容性徽标
- 已附加 Agent 数量

建议的来源状态：

- local
- github
- imported package
- external reference
- adapter-discovered only

建议的兼容性状态：

- compatible
- paperclip-extension
- unknown
- invalid

建议的信任状态：

- markdown-only
- assets
- scripts/executables

建议的列表操作功能：

- 按名称或 slug 搜索
- 按来源筛选
- 按信任级别筛选
- 按使用情况筛选
- 按名称、最近导入时间、使用次数排序

#### B. 导入操作

允许：

- 从本地文件夹导入
- 从 GitHub URL 导入
- 从直接 URL 导入

未来计划：

- 从 `companies.sh` 安装
- 从 `skills.sh` 安装

V1 要求：

- 从兼容 `skills.sh` 的来源导入时，无需要求 Paperclip 特定的软件包布局

#### C. 技能详情抽屉或页面

每个技能应有详情视图，显示：

- 渲染后的 `SKILL.md`
- 软件包来源与版本固定信息
- 包含的文件
- 信任与许可证警告
- 使用者信息
- 适配器兼容性说明

推荐路由：

- `/companies/:companyId/skills/:skillId`

推荐章节：

- Overview（概览）
- Contents（内容）
- Usage（使用情况）
- Source（来源）
- Trust / licensing（信任与许可证）

#### D. 使用情况视图

每个公司技能应显示哪些 Agent 在使用它。

建议的列：

- agent（Agent）
- desired state（期望状态）
- actual state（实际状态）
- adapter（适配器）
- sync mode（同步模式）
- last sync status（最近同步状态）

### 5.2 Agent 技能标签页

保留并演进现有的 `AgentDetail` 技能同步 UI，但将其从配置中移出。

目的：

- 为单个 Agent 附加/分离公司技能
- 检查该 Agent 的适配器实际状态
- 协调期望状态与实际状态
- 保持关联格式可读，并与 `AGENTS.md` 保持一致

#### 路由

- `/agents/:agentId/skills`

#### Agent 标签页

预期的 Agent 级标签页模型变为：

- `dashboard`
- `configuration`
- `skills`
- `runs`

这比将技能隐藏在配置中更好，原因是：

- 技能不仅仅是适配器配置
- 技能需要独立的同步/状态语言
- 技能是可复用的公司资产，不仅仅是 Agent 的一个字段
- 该界面需要空间来展示期望状态与实际状态的差异、警告以及外部技能采纳功能

#### 标签页布局

`Skills` 标签页应包含三个堆叠区块：

1. 摘要
2. 已托管技能
3. 外部/已发现技能

摘要应显示：

- 适配器同步支持情况
- 同步模式
- 已托管技能数量
- 外部技能数量
- 漂移或警告数量

#### A. 期望技能

显示附加到该 Agent 的公司托管技能。

每行应显示：

- 技能名称
- shortname
- 同步状态
- 来源
- 最近适配器观测结果（如可获取）

每行应支持：

- 启用/禁用
- 打开技能详情
- 查看来源徽标
- 查看同步徽标

#### B. 外部或已发现技能

显示适配器上报的、非公司托管的技能。

这一点很重要，因为 Codex 等适配器可能已有 Paperclip 未安装的本地技能。

这些技能应清晰标注为：

- external（外部）
- not managed by Paperclip（未被 Paperclip 托管）

每个外部技能行应支持：

- 检查
- 日后采纳进公司库
- 日后在适当情况下作为已托管技能附加

#### C. 同步控制

支持：

- sync（同步）
- reset draft（重置草稿）
- detach（分离）

未来计划：

- 将外部技能导入公司库
- 将临时本地技能升级为公司托管技能

推荐的底部操作按钮：

- `Sync skills`
- `Reset`
- `Refresh adapter state`

## 6. UI 中的技能状态模型

每个技能附加项应有面向用户的状态。

建议的状态：

- `in_sync`
- `desired_only`
- `external`
- `drifted`
- `unmanaged`
- `unknown`

定义：

- `in_sync`：期望状态与实际状态一致
- `desired_only`：Paperclip 期望存在，但适配器尚未显示
- `external`：适配器已有，但 Paperclip 未托管
- `drifted`：适配器存在版本或位置冲突或异常
- `unmanaged`：适配器不支持同步，Paperclip 仅跟踪期望状态
- `unknown`：适配器读取失败或状态不可信

建议的徽标文案：

- `In sync`
- `Needs sync`
- `External`
- `Drifted`
- `Unmanaged`
- `Unknown`

## 7. 适配器展示规则

UI 不应对所有适配器使用相同的描述方式。

### 7.1 持久化适配器

示例：

- Codex local

语言表述：

- installed（已安装）
- synced into adapter home（已同步到适配器主目录）
- external skills detected（检测到外部技能）

### 7.2 临时适配器

示例：

- Claude local

语言表述：

- will be mounted on next run（将在下次运行时挂载）
- effective runtime skills（运行时生效的技能）
- not globally installed（未全局安装）

### 7.3 不受支持的适配器

语言表述：

- this adapter does not implement skill sync yet（该适配器尚未实现技能同步）
- Paperclip can still track desired skills（Paperclip 仍可跟踪期望技能）
- actual adapter state is unavailable（适配器实际状态不可用）

该状态仍应允许：

- 将公司技能作为期望状态附加到 Agent
- 导出/导入这些期望附加项

## 7.4 只读适配器

某些适配器可能能够列出技能，但无法修改它们。

语言表述：

- Paperclip can see adapter skills（Paperclip 可以查看适配器技能）
- this adapter does not support applying changes（该适配器不支持应用变更）
- desired state can be tracked, but reconciliation is manual（期望状态可被跟踪，但协调需手动完成）

## 8. 信息架构

推荐的导航结构：

- 公司导航添加 `Skills`
- Agent 详情添加 `Skills` 作为独立标签页
- 公司技能详情在公司库上线时获得独立路由

推荐的功能分离：

- 公司技能页面回答：”我们拥有哪些技能？”
- Agent 技能标签页回答：”该 Agent 使用了哪些技能，是否已同步？”

## 8.1 路由规划

- `/companies/:companyId/skills`
- `/companies/:companyId/skills/:skillId`
- `/agents/:agentId/skills`

## 8.2 导航与发现

推荐的入口点：

- 公司侧边栏：`Skills`
- Agent 页面标签页：`Skills`
- 公司导入预览：日后将导入的技能链接到公司技能页面
- Agent 技能行：链接到公司技能详情

## 9. 导入/导出集成

技能 UI 与软件包可移植性应在公司技能库中交汇。

导入行为：

- 导入包含 `SKILL.md` 内容的公司软件包时，应创建或更新公司技能
- Agent 附加项应主要来自 `AGENTS.md` 中的 shortname 关联
- `.paperclip.yaml` 可以增加 Paperclip 特定的保真度，但不应替代基础的 shortname 关联模型
- 引用的第三方技能应保持溯源可见

导出行为：

- 导出公司时，若勾选，应包含公司托管技能
- `AGENTS.md` 应以 shortname 或 slug 输出技能关联
- 如有需要，`.paperclip.yaml` 日后可以添加 Paperclip 特定的技能保真度，但对于普通的 Agent 与技能关联不应作为必要条件
- 仅适配器持有的外部技能不应被静默地导出为托管公司技能

## 9.1 导入工作流

V1 工作流应支持：

1. 从本地文件夹导入一个或多个技能
2. 从 GitHub 仓库导入一个或多个技能
3. 导入包含技能的公司软件包
4. 将导入的技能附加到一个或多个 Agent

技能导入预览应显示：

- 已发现的技能
- 来源与版本固定信息
- 信任级别
- 许可证警告
- 现有公司技能将被创建、更新还是跳过

## 9.2 导出工作流

V1 应支持：

1. 导出公司时，若勾选，包含托管技能
2. 导出 `AGENTS.md` 中包含 shortname 技能关联的 Agent
3. 为每个 `SKILL.md` 保留 Agent Skills 兼容性

V1 范围外：

- 自动将仅适配器持有的外部技能作为托管软件包导出

## 10. Data And API Shape

This plan implies a clean split in backend concepts.

### 10.1 Company skill records

Paperclip should have a company-scoped skill model or managed package model representing:

- identity
- source
- files
- provenance
- trust and licensing metadata

### 10.2 Agent skill attachments

Paperclip should separately store:

- agent id
- skill identity
- desired enabled state
- optional ordering or metadata later

### 10.3 Adapter sync snapshot

Adapter reads should return:

- supported flag
- sync mode
- entries
- warnings
- desired skills

This already exists in rough form and should be the basis for the UI.

### 10.4 UI-facing API needs

The complete UI implies these API surfaces:

- list company-managed skills
- import company skills from path/URL/GitHub
- get one company skill detail
- list agents using a given skill
- attach/detach company skills for an agent
- list adapter sync snapshot for an agent
- apply desired skills for an agent

Existing agent-level skill sync APIs can remain the base for the agent tab.
The company-level library APIs still need to be designed and implemented.

## 11. Page-by-page UX

### 11.1 Company Skills list page

Header:

- title
- short explanation of compatibility with Agent Skills / `skills.sh`
- import button

Body:

- filters
- skill table or cards
- empty state when none

Secondary content:

- warnings panel for untrusted or incompatible skills

### 11.2 Company Skill detail page

Header:

- skill name
- shortname
- source badge
- trust badge
- compatibility badge

Sections:

- rendered `SKILL.md`
- files and references
- usage by agents
- source / provenance
- trust and licensing warnings

Actions:

- attach to agent
- remove from company library later
- export later

### 11.3 Agent Skills tab

Header:

- adapter support summary
- sync mode
- refresh and sync actions

Body:

- managed skills list
- external/discovered skills list
- warnings / unsupported state block

## 12. States And Empty Cases

### 12.1 Company Skills page

States:

- empty
- loading
- loaded
- import in progress
- import failed

### 12.2 Company Skill detail

States:

- loading
- not found
- incompatible
- loaded

### 12.3 Agent Skills tab

States:

- loading snapshot
- unsupported adapter
- read-only adapter
- sync-capable adapter
- sync failed
- stale draft

## 13. Permissions And Governance

Suggested V1 policy:

- board users can manage company skills
- board users can attach skills to agents
- agents themselves do not mutate company skill library by default
- later, certain agents may get scoped permissions for skill attachment or sync

## 14. UI Phases

### Phase A: Stabilize current agent skill sync UI

Goals:

- move skills to an `AgentDetail` tab
- improve status language
- support desired-only state even on unsupported adapters
- polish copy for persistent vs ephemeral adapters

### Phase B: Add Company Skills page

Goals:

- company-level skill library
- import from GitHub/local folder
- basic detail view
- usage counts by agent
- `skills.sh`-compatible import path

### Phase C: Connect skills to portability

Goals:

- importing company packages creates company skills
- exporting selected skills works cleanly
- agent attachments round-trip primarily through `AGENTS.md` shortnames

### Phase D: External skill adoption flow

Goals:

- detect adapter external skills
- allow importing them into company-managed state where possible
- make provenance explicit

### Phase E: Advanced sync and drift UX

Goals:

- desired-vs-actual diffing
- drift resolution actions
- multi-agent skill usage and sync reporting

## 15. Design Risks

1. Overloading the agent page with package management will make the feature confusing.
2. Treating unsupported adapters as broken rather than unmanaged will make the product feel inconsistent.
3. Mixing external adapter-discovered skills with company-managed skills without clear labels will erode trust.
4. If company skill records do not exist, import/export and UI will remain loosely coupled and round-trip fidelity will stay weak.
5. If agent skill associations are path-based instead of shortname-based, the format will feel too technical and too Paperclip-specific.

## 16. Recommendation

The next product step should be:

1. move skills out of agent configuration and into a dedicated `Skills` tab
2. add a dedicated company-level `Skills` page as the library and package-management surface
3. make company import/export target that company skill library, not the agent page directly
4. preserve adapter-aware truth in the UI by clearly separating:
   - desired
   - actual
   - external
   - unmanaged
5. keep agent-to-skill associations shortname-based in `AGENTS.md`

That gives Paperclip one coherent skill story instead of forcing package management, adapter sync, and agent configuration into the same screen.
