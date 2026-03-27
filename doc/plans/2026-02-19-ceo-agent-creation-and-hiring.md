# CEO 代理创建与招聘治理计划（V1.1）

状态：提议
日期：2026-02-19
负责人：产品 + 服务器 + UI + 技能

## 1. 目标

使 CEO 代理能够直接创建新代理，配以轻量但明确的治理机制：

- 公司级别开关：新招聘需要 board 审批（默认开启）。
- 代理级别权限：`can_create_agents`（CEO 默认开启，其他人默认关闭）。
- 清晰的招聘工作流，具有草稿/待审核状态直到获得审批。
- 配置反射，使招聘代理可以检查可用的适配器配置并比较现有代理配置（包括自身）。
- 审批协作流程，包含评论、修订请求和审计追踪。

## 2. 当前状态（仓库实际情况）

- 代理创建仅限 board，位于 `POST /api/companies/:companyId/agents`（`server/src/routes/agents.ts`）。
- 审批支持 `pending/approved/rejected/cancelled` 和 `hire_agent` + `approve_ceo_strategy`（`packages/shared/src/constants.ts`、`server/src/services/approvals.ts`）。
- `hire_agent` 审批目前仅在批准时创建代理；不存在预创建的待审核代理。
- 目前没有代理权限系统。
- 没有"新招聘需要 board 审批"的公司设置。
- 审批没有评论线程或修订请求状态。
- 收件箱和审批 UI 仅支持批准/拒绝；应用路由中不存在审批详情路由。
- 代理适配器配置是自由格式 JSON；不存在用于机器可读或文本发现的运行时反射端点。

## 3. 产品决策

## 3.1 公司设置

添加公司设置：

- `requireBoardApprovalForNewAgents: boolean`
- 默认值：`true`
- 仅在公司高级设置中可编辑（不在引导/公司创建流程 UI 中）

## 3.2 代理权限

引入轻量级权限模型，目前只有一个显式权限：

- `can_create_agents: boolean`

默认值：

- CEO：`true`
- 其他人：`false`

管理权限：

- Board 可以编辑任何代理的权限。
- CEO 可以编辑同公司代理的权限。

此阶段不引入更广泛的 RBAC 系统。

## 3.3 招聘的待审核状态

引入专用的非运行状态：

- `pending_approval`

含义：

- 代理记录存在于组织树中，可以被审核。
- 代理在获得批准之前不能运行、接收分配、创建密钥或恢复到活动状态。

## 4. 数据模型变更

## 4.1 `companies`

添加列：

- `require_board_approval_for_new_agents` boolean not null default `true`

需要同步：

- `packages/db/src/schema/companies.ts`
- `packages/shared/src/types/company.ts`
- `packages/shared/src/validators/company.ts`
- UI 公司 API 类型用法和公司高级设置表单

## 4.2 `agents`

添加列：

- `permissions` jsonb not null default `{}`
- 状态值扩展以包含 `pending_approval`

需要同步：

- `packages/db/src/schema/agents.ts`
- `packages/shared/src/constants.ts`（`AGENT_STATUSES`）
- `packages/shared/src/types/agent.ts`
- `packages/shared/src/validators/agent.ts`
- UI 中的状态徽章、筛选器和生命周期控制

## 4.3 `approvals`

保持审批作为中央治理记录；扩展工作流支持：

- 添加状态 `revision_requested`
- 确保招聘审批的负载包含：
  - `agentId`
  - `requestedByAgentId`
  - `requestedConfigurationSnapshot`

## 4.4 新表 `approval_comments`

为审批添加讨论线程：

- `id`、`company_id`、`approval_id`、`author_agent_id`、`author_user_id`、`body`、时间戳

用途：

- 审核评论
- 修订请求
- 批准/拒绝的理由
- 永久审计追踪

## 5. API 和授权计划

## 5.1 权限辅助函数

添加服务器端授权辅助函数：

- `assertCanCreateAgents(req, companyId)`
- `assertCanManageAgentPermissions(req, companyId)`

规则：

- Board 始终通过。
- 代理在自身权限为 true 且同公司时通过 `can_create_agents` 检查。
- 权限管理由 CEO 或 board 执行。

## 5.2 招聘创建流程

添加路由：

- `POST /api/companies/:companyId/agent-hires`

行为：

- 需要 `can_create_agents`（或 board）。
- 首先创建代理行。
- 如果公司设置要求审批：
  - 以 `status=pending_approval` 创建代理
  - 创建 `approvals(type=hire_agent,status=pending,payload.agentId=...)`
  - 返回代理 + 审批
- 如果设置禁用：
  - 以 `idle` 状态创建代理
  - 不需要审批记录

Board 可以继续使用直接创建路由，但此路由成为 CEO/代理主导招聘的规范路由。

## 5.3 审批工作流端点

添加/扩展：

- `GET /api/approvals/:id`
- `POST /api/approvals/:id/request-revision`
- `POST /api/approvals/:id/resubmit`
- `GET /api/approvals/:id/comments`
- `POST /api/approvals/:id/comments`

更新现有的批准/拒绝语义：

- 批准招聘将关联代理从 `pending_approval -> idle` 转换
- 拒绝使关联代理保持非活动状态（`pending_approval` 或稍后 `terminated`/清除）

## 5.4 代理权限管理端点

添加：

- `PATCH /api/agents/:id/permissions`

仅支持初始键：

- `{ "canCreateAgents": boolean }`

## 5.5 读取配置端点（受保护）

添加受权限门控的配置读取端点：

- `GET /api/companies/:companyId/agent-configurations`
- `GET /api/agents/:id/configuration`

访问权限：

- board
- CEO
- 任何拥有 `can_create_agents` 的代理

安全性：

- 从适配器配置中脱敏明显的秘密值（`env`、API 密钥、令牌、看起来像 JWT 的值）
- 在响应中包含脱敏标记

## 5.6 适配器配置反射端点

添加纯文本反射路由：

- `GET /llms/agent-configuration.txt`
- `GET /llms/agent-configuration/:adapterType.txt`

索引文件包含：

- 此 Paperclip 实例已安装的适配器列表
- 每个适配器的文档 URL
- 简要的"如何招聘"API 序列链接

每个适配器文件包含：

- 必需/可选配置键
- 默认值
- 字段描述
- 安全注意事项
- 示例负载

认证：

- 与配置读取端点相同的门控（board/CEO/`can_create_agents`）。

## 6. 适配器协议扩展

扩展 `ServerAdapterModule` 合约以暴露配置文档：

- `agentConfigurationDoc`（字符串）或 `getAgentConfigurationDoc()`

在以下位置实现：

- `packages/adapters/claude-local`
- `packages/adapters/codex-local`
- `server/src/adapters/registry.ts`

这是必需的，以便反射从已安装的适配器生成，而不是硬编码。

## 7. UI 计划

## 7.1 公司高级设置

在公司 UI 中，添加高级设置面板/模态框，包含：

- 开关："新代理招聘需要 board 审批"（默认开启）

不在引导流程中显示。

## 7.2 代理权限 UI

在代理详情中（board/CEO 上下文）：

- 权限区域
- "可以创建新代理"开关

## 7.3 招聘 UX

添加"招聘代理"流程（用于 CEO/授权代理）：

- 选择角色/名称/职称/汇报对象
- 编写初始提示/能力
- 检查适配器反射文档
- 检查现有相关代理配置
- 提交招聘

状态消息：

- 如果需要审批：显示"等待 board 审批"
- 如果不需要：显示活动就绪状态

## 7.4 审批 UX

添加审批详情页面并扩展收件箱集成：

- `/approvals/:approvalId`
- 线程化评论
- 修订请求操作
- 带决策备注的批准/拒绝
- 活动时间线（创建、修订、决策）

## 7.5 不通过审批的代理清理

在审批详情中提供仅限 board 的销毁操作：

- "删除未通过审批的代理"
- 明确的确认对话框
- 保留审批 + 评论历史（审计）

## 8. 新技能：`paperclip-create-agent`

创建新技能目录：

- `skills/paperclip-create-agent/SKILL.md`
- `skills/paperclip-create-agent/references/api-reference.md`

技能职责：

- 通过 `/llms/agent-configuration*.txt` 发现可用的适配器配置
- 读取现有代理配置（包括自身和相关角色）
- 为当前环境提议最佳配置
- 为新代理草拟高质量的初始提示
- 设置管理者/汇报关系
- 执行招聘 API 流程
- 处理与 board 评论的修订循环

同时更新 `skills/paperclip/SKILL.md` 以引用此技能用于招聘工作流。

## 9. 强制规则和不变量

新增/更新的不变量：

- `pending_approval` 代理不能：
  - 被调用/唤醒
  - 被分配 issue
  - 创建或使用 API 密钥
  - 转换到活动生命周期状态（除非通过招聘审批）
- 审批转换：
  - `pending -> revision_requested | approved | rejected | cancelled`
  - `revision_requested -> pending | rejected | cancelled`
- 每个变更写入 `activity_log` 记录。

## 10. 实施阶段

## 阶段 1：合约和迁移

- 数据库架构更新（`companies`、`agents`、审批状态扩展、`approval_comments`）
- 共享常量/类型/验证器更新
- 迁移生成和类型检查

## 阶段 2：服务器授权 + 招聘流程

- 权限解析器和授权守卫
- `agent-hires` 路由
- 在心跳/issue/密钥流程中执行待审核状态
- 审批修订/评论端点

## 阶段 3：反射和配置读取 API

- 适配器协议文档支持
- `/llms/agent-configuration*.txt` 路由
- 带脱敏的受保护配置读取端点

## 阶段 4：UI 和技能

- 公司高级设置 UI
- 权限控制
- 收件箱/审批中的审批详情 + 评论/修订流程
- 未通过审批代理的删除流程
- `paperclip-create-agent` 技能 + 文档更新

## 11. 测试计划

服务器测试：

- 招聘/配置读取/权限更新端点的权限门控测试
- 公司设置开启/关闭时的招聘创建行为
- 包括修订循环在内的审批转换
- 唤醒/调用/分配/密钥中的 pending_approval 强制执行
- 配置脱敏测试

UI 测试：

- 高级设置开关持久化
- 审批详情评论/修订交互
- 招聘流程状态（待审核 vs 即时）

合并前仓库验证：

- `pnpm -r typecheck`
- `pnpm test:run`
- `pnpm build`

## 12. 风险和缓解措施

- 风险：通过代理配置读取泄露秘密。
  - 缓解：严格的脱敏处理 + 允许列表/拒绝列表测试。
- 风险：状态膨胀复杂性。
  - 缓解：仅添加一个状态（`pending_approval`），配合明确的转换守卫。
- 风险：审批流程回归。
  - 缓解：在审批服务中集中转换逻辑并用测试支撑。

## 13. 待定决策（默认建议）

1. Board 直接创建是否应绕过审批设置？
建议：是，board 是明确的治理覆盖。

2. 未授权的代理是否仍应看到基本代理元数据？
建议：是（名称/角色/状态），但配置字段保持受限。

3. 拒绝后，待审核代理应保持 `pending_approval` 还是转为 `terminated`？
建议：最终拒绝时转为 `terminated`；保留可选的硬删除操作用于清理。
