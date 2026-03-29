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

## 10. 数据与 API 结构

本计划意味着后端概念需要清晰拆分。

### 10.1 公司技能记录

Paperclip 应有一个公司范围的技能模型或托管软件包模型，包含：

- 标识信息
- 来源
- 文件
- 溯源信息
- 信任与许可证元数据

### 10.2 Agent 技能附加记录

Paperclip 应单独存储：

- agent id
- 技能标识
- 期望启用状态
- 日后可选的排序或元数据

### 10.3 适配器同步快照

适配器读取应返回：

- supported flag（支持标志）
- sync mode（同步模式）
- entries（条目）
- warnings（警告）
- desired skills（期望技能）

这部分已有雏形，应作为 UI 的基础。

### 10.4 UI 侧 API 需求

完整的 UI 意味着需要以下 API 接口：

- 列出公司托管技能
- 从路径/URL/GitHub 导入公司技能
- 获取单个公司技能详情
- 列出使用某技能的 Agent
- 为 Agent 附加/分离公司技能
- 获取 Agent 的适配器同步快照列表
- 为 Agent 应用期望技能

现有的 Agent 级技能同步 API 可作为 Agent 标签页的基础。
公司级库 API 仍需进行设计和实现。

## 11. 逐页 UX 说明

### 11.1 公司技能列表页

页头：

- 标题
- 关于与 Agent Skills / `skills.sh` 兼容性的简短说明
- 导入按钮

页面主体：

- 筛选器
- 技能表格或卡片
- 无内容时的空状态

次级内容：

- 不受信任或不兼容技能的警告面板

### 11.2 公司技能详情页

页头：

- 技能名称
- shortname
- 来源徽标
- 信任徽标
- 兼容性徽标

章节：

- 渲染后的 `SKILL.md`
- 文件与引用
- Agent 使用情况
- 来源/溯源信息
- 信任与许可证警告

操作：

- 附加到 Agent
- 日后从公司库中移除
- 日后导出

### 11.3 Agent 技能标签页

页头：

- 适配器支持摘要
- 同步模式
- 刷新和同步操作

页面主体：

- 已托管技能列表
- 外部/已发现技能列表
- 警告/不受支持状态区块

## 12. 状态与空状态处理

### 12.1 公司技能页面

状态：

- empty（空）
- loading（加载中）
- loaded（已加载）
- import in progress（导入中）
- import failed（导入失败）

### 12.2 公司技能详情

状态：

- loading（加载中）
- not found（未找到）
- incompatible（不兼容）
- loaded（已加载）

### 12.3 Agent 技能标签页

状态：

- loading snapshot（加载快照中）
- unsupported adapter（不受支持的适配器）
- read-only adapter（只读适配器）
- sync-capable adapter（支持同步的适配器）
- sync failed（同步失败）
- stale draft（草稿已过期）

## 13. 权限与治理

建议的 V1 策略：

- 管理员用户可以管理公司技能
- 管理员用户可以将技能附加到 Agent
- Agent 本身默认不修改公司技能库
- 日后，某些 Agent 可能会获得技能附加或同步的范围权限

## 14. UI 阶段规划

### 阶段 A：稳定当前 Agent 技能同步 UI

目标：

- 将技能移至 `AgentDetail` 标签页
- 改进状态语言表述
- 在不受支持的适配器上也支持仅期望状态
- 优化持久化适配器与临时适配器的文案

### 阶段 B：添加公司技能页面

目标：

- 公司级技能库
- 从 GitHub/本地文件夹导入
- 基础详情视图
- 按 Agent 统计使用次数
- 兼容 `skills.sh` 的导入路径

### 阶段 C：将技能与可移植性连接

目标：

- 导入公司软件包时创建公司技能
- 导出所选技能时流程顺畅
- Agent 附加项主要通过 `AGENTS.md` 中的 shortname 实现往返传递

### 阶段 D：外部技能采纳流程

目标：

- 检测适配器外部技能
- 允许在适当情况下将其导入为公司托管状态
- 使溯源信息明确可见

### 阶段 E：高级同步与漂移 UX

目标：

- 期望状态与实际状态的差异对比
- 漂移解决操作
- 多 Agent 技能使用与同步报告

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
