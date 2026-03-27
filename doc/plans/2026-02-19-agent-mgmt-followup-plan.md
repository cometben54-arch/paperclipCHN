# 代理管理后续计划（CEO 补丁 + 配置回滚 + Issue↔审批关联）

状态：提议
日期：2026-02-19
上下文：来自运行 `faeab00e-7857-4acc-b2b2-86f6d078adb4` 的后续

## 1. 调查发现

## 1.1 CEO PATCH 失败的原因

根本原因是显式的路由逻辑：

- `server/src/routes/agents.ts` 当前阻止任何代理修改另一个代理：
  - `if (req.actor.type === "agent" && req.actor.agentId !== id) { ... "Agent can only modify itself" }`

因此，即使 CEO 拥有招聘权限，路由仍然执行旧的仅限自身修改行为。

## 1.2 评论质量不佳的原因

- `skills/paperclip/SKILL.md` 和 `skills/paperclip/references/api-reference.md` 目前不要求状态评论具备 markdown 格式化质量（链接、结构、可读的更新）。
- 因此代理生成的评论是包含原始 ID 的纯文本，而非链接实体。

## 1.3 Issue↔审批关联缺失

- 目前 issue 和审批之间没有直接的数据库关系。
- 审批负载可能包含上下文 ID，但这不是规范化的关联。
- UI 页面在没有手动复制粘贴 ID 的情况下无法可靠地交叉链接 issue/审批。

## 1.4 配置回滚缺失

- 代理配置更新当前直接覆盖状态，没有专用的版本历史表。
- 存在活动日志，但没有一等公民的配置版本账本或回滚端点。

## 2. 产品/行为变更

## 2.1 允许 CEO 修改同公司的其他代理

目标行为：

- Board：完全修改权限。
- CEO：可以修改同公司的代理。
- 其他代理：仅限自身修改，除非未来明确授予权限。

注意：

- 保持公司边界检查严格。
- 保持特权字段的单独管理。

## 2.2 添加一等公民的代理配置版本日志 + 回滚

每个影响配置的变更必须创建一个版本记录，包含：

- 变更前快照
- 变更后快照
- 操作者信息（用户/代理）
- 可选的原因/评论
- 来源运行 ID（如有）

回滚必须是一次 API 调用即可原子性地恢复先前版本。

## 2.3 在技能中强制 issue 评论使用 markdown 和链接

技能指导应要求：

- 简短的 markdown 结构（`Summary`、`Actions`、`Next`）
- 在相关时包含已创建/更新实体的链接
- 避免不带链接的原始 ID

## 2.4 添加显式的 Issue↔审批关联（多对多）

实现规范化的关联模型，使一个 issue 可以关联多个审批，一个审批可以关联多个 issue。

## 3. 数据模型计划

## 3.1 新表：`agent_config_revisions`

列：

- `id` uuid pk
- `company_id` uuid fk
- `agent_id` uuid fk
- `revision_number` int（每个代理单调递增）
- `reason` text null
- `changed_by_agent_id` uuid null
- `changed_by_user_id` text null
- `run_id` uuid null
- `before_snapshot` jsonb not null
- `after_snapshot` jsonb not null
- 时间戳

索引：

- `(company_id, agent_id, revision_number desc)`
- `(agent_id, created_at desc)`

## 3.2 新表：`issue_approvals`

列：

- `id` uuid pk
- `company_id` uuid fk
- `issue_id` uuid fk
- `approval_id` uuid fk
- `relationship` text default `context`
- `linked_by_agent_id` uuid null
- `linked_by_user_id` text null
- 时间戳

约束：

- unique `(company_id, issue_id, approval_id)`

索引：

- `(company_id, issue_id)`
- `(company_id, approval_id)`

## 4. API 计划

## 4.1 代理 PATCH 授权修复

更新 `PATCH /api/agents/:id` 授权矩阵：

- board：允许
- 同公司角色为 `ceo` 的代理：允许
- 其他：仅限自身

## 4.2 分离特权修改字段

保护以下字段不受非 board/非 CEO 的通用 PATCH 修改：

- `permissions`
- 超出允许范围的 `status` 转换

（权限编辑继续使用专用权限路由。）

## 4.3 配置版本 API

添加：

- `GET /api/agents/:id/config-revisions`
- `GET /api/agents/:id/config-revisions/:revisionId`
- `POST /api/agents/:id/config-revisions/:revisionId/rollback`

行为：

- 回滚写入一条新的版本记录（不修改历史）
- 回滚响应包含结果活动配置

## 4.4 Issue↔审批关联 API

添加：

- `GET /api/issues/:id/approvals`
- `POST /api/issues/:id/approvals`（关联已有审批）
- `DELETE /api/issues/:id/approvals/:approvalId`
- `GET /api/approvals/:id/issues`

## 4.5 审批创建时自动关联

扩展创建负载以可选地包含 issue 上下文：

- `POST /api/companies/:companyId/approvals` 支持 `issueId` 或 `issueIds`
- `POST /api/companies/:companyId/agent-hires` 支持 `sourceIssueId` 或 `sourceIssueIds`

服务器行为：

- 先创建审批
- 在 `issue_approvals` 中插入关联行

## 5. UI 计划

## 5.1 代理页面

在 `AgentDetail` 上添加配置历史面板：

- 版本列表
- 差异预览
- 带确认的回滚按钮

## 5.2 审批页面和 Issue 页面交叉链接

- 在审批详情上：显示带链接的关联 issue
- 在 issue 详情上：显示带链接的关联审批
- board 上下文中的关联/取消关联操作

## 5.3 改善评论 UX 提示

初始阶段不做硬编辑器强制；更新帮助文本和模板以鼓励使用带链接的 markdown 更新。

## 6. 技能更新

## 6.1 `skills/paperclip/SKILL.md`

添加评论标准：

- 使用 markdown 章节
- 包含相关实体的链接：
  - 审批：`/approvals/{id}`
  - 代理：`/agents/{id}`
  - issue：`/issues/{id}`

## 6.2 `skills/paperclip-create-agent/SKILL.md`

要求：

- 从 issue 创建招聘时包含 `sourceIssueId`
- 在 issue 中回复评论，使用 markdown + 审批和待处理代理的链接

## 7. 实施阶段

## 阶段 A：授权 + 安全加固

- 修复代理路由中的 CEO 修改授权
- 限制特权通用修改字段
- 添加授权矩阵测试

## 阶段 B：配置版本账本

- 添加 `agent_config_revisions`
- 对所有相关代理变更执行变更时写入
- 回滚端点 + 测试

## 阶段 C：Issue↔审批关联

- 添加 `issue_approvals`
- 添加关联 API + 自动关联行为
- 更新审批/issue UI 交叉链接

## 阶段 D：技能指导

- 更新技能中的 markdown/链接期望和 sourceIssue 关联

## 8. 验收标准

- CEO 可以成功修改 CTO（同公司）。
- 每次配置变更创建可检索的版本记录。
- 回滚在一次操作中恢复先前配置并创建新的版本记录。
- Issue 和审批页面显示来自规范化数据库关系的稳定双向链接。
- 招聘工作流中的代理评论使用 markdown 并包含实体链接。

## 9. 风险和缓解措施

- 风险：通过通用 PATCH 进行权限升级。
  - 缓解：隔离特权字段并验证操作者范围。
- 风险：回滚损坏。
  - 缓解：变更前快照/变更后快照 + 事务 + 测试。
- 风险：关联语义不明确。
  - 缓解：显式关联表 + 唯一约束 + 类型化关系字段。
