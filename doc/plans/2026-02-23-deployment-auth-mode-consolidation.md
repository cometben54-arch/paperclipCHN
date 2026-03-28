# 部署/认证模式整合方案

状态：提案
负责方：Server + CLI + UI
日期：2026-02-23

## 目标

保持 Paperclip 的低摩擦体验，同时使模式模型更简洁、更安全：

1. `local_trusted` 仍然是默认且最简单的路径。
2. 一种认证运行时模式同时支持私有网络本地使用和公有云使用。
3. onboarding/configure/doctor 主要保持交互式且无需标志位。
4. 面板身份由数据库中的真实用户行表示，具备明确的角色/成员关系集成点。

## 产品约束（来自评审）

1. `onboard` 默认流程是交互式的（不需要标志位）。
2. 首次模式选择默认为 `local_trusted`，并提供清晰的 UX 文案。
3. 认证流程为私有部署与公共暴露提供指导。
4. `doctor` 默认也应无需标志位（读取配置并评估所选模式/配置文件）。
5. 不为已废弃的模式名称添加向后兼容的别名层。
6. 方案必须明确说明用户/面板在数据库中的表示方式，以及这如何影响任务分配和权限。

## 当前实现审计（截至 2026-02-23）

## 运行时/认证

- 运行时部署模式当前为 `local_trusted | cloud_hosted`（`packages/shared/src/constants.ts`）。
- `local_trusted` 的 actor 当前是合成的：
  - `req.actor = { type: "board", userId: "local-board", source: "local_implicit" }`（`server/src/middleware/auth.ts`）。
  - 默认情况下这不是一个真实的认证用户行。
- `cloud_hosted` 使用 Better Auth 会话和 `authUsers` 行（`server/src/auth/better-auth.ts`、`packages/db/src/schema/auth.ts`）。

## 引导/管理员

- `cloud_hosted` 需要 `BETTER_AUTH_SECRET` 并从 `instance_user_roles` 报告引导状态（`server/src/index.ts`、`server/src/routes/health.ts`）。
- 引导邀请接受会将已登录用户提升为 `instance_admin`（`server/src/routes/access.ts`、`server/src/services/access.ts`）。

## 成员/分配集成

- 用户任务分配要求该用户具有活跃的 `company_memberships` 条目（`server/src/services/issues.ts`）。
- 本地隐式面板身份不会自动成为真实的成员主体；这对"面板作为可分配用户"的语义来说是一个缺口。

## 提议的运行时模型

## 模式

1. `local_trusted`
- 不需要登录
- 仅限 localhost/回环地址
- 针对单操作员本地安装优化

2. `authenticated`
- 人工操作需要登录
- 私有部署和公共部署使用相同的认证栈

## 暴露策略（在 `authenticated` 模式下）

1. `private`
- 私有网络部署（局域网、VPN、Tailscale）
- 低摩擦 URL 处理（`auto` 基础 URL）
- 针对私有目标的严格主机允许策略

2. `public`
- 面向互联网的部署
- 需要明确的公共基础 URL
- doctor 中有更严格的部署检查

这是一种具有两种安全策略的认证模式，而非两个不同的认证系统。

## UX 契约

## Onboard（主要路径：交互式）

默认命令保持不变：

```sh
pnpm paperclipai onboard
```

交互式服务器步骤：

1. 询问模式，默认选择 `local_trusted`
2. 选项文案：
- `local_trusted`："本地安装最简单（无需登录，仅限 localhost）"
- `authenticated`："需要登录；用于私有网络或公共托管"
3. 如果选择 `authenticated`，询问暴露方式：
- `private`："私有网络访问（例如 Tailscale），较低的安装摩擦"
- `public`："面向互联网的部署，更严格的安全要求"
4. 仅在 `authenticated + public` 时，要求提供明确的公共 URL

标志位是可选的高级用户覆盖项，正常安装不需要。

## Configure

默认命令保持交互式：

```sh
pnpm paperclipai configure --section server
```

与 onboarding 相同的模式/暴露问题和默认值。

## Doctor

默认命令保持无需标志位：

```sh
pnpm paperclipai doctor
```

Doctor 读取已配置的模式/暴露设置并应用相关检查。
可选标志位可用于覆盖/测试，但正常操作不需要。

## 面板/用户数据模型集成（必需）

## 需求

面板必须是一个真实的数据库用户主体，这样以用户为中心的功能（任务分配、成员关系、审计身份）才能一致地工作。

## 目标行为

1. `local_trusted`
- 在安装/启动期间种子化/确保一个确定性的本地面板用户行存在于 `authUsers` 中。
- actor 中间件使用该真实用户 ID，而非仅使用合成身份。
- 确保：
  - `instance_user_roles` 包含该用户的 `instance_admin`。
  - 可以在需要时为该用户创建/维护 company 成员关系。

2. `authenticated`
- Better Auth 注册创建用户行。
- 引导/管理员流程将该真实用户提升为 `instance_admin`。
- 首次 company 创建流程应确保创建者的成员关系处于活跃状态。

## 为何重要

- `assigneeUserId` 验证检查 company 成员关系。
- 没有真实的面板用户 + 成员关系路径，向面板用户分配任务就是不一致的。

## 配置契约（目标）

- `server.mode`：`local_trusted | authenticated`
- `server.exposure`：`private | public`（当模式为 `authenticated` 时必需）
- `auth.baseUrlMode`：`auto | explicit`
- `auth.publicBaseUrl`：当 `authenticated + public` 时必需

不为已废弃的命名变体设置兼容性别名。

## 无向后兼容层

此变更是一次干净的切换：

- 移除代码和提示中旧的拆分术语。
- 配置模式仅使用上述规范字段/值。
- 现有开发实例可以重新运行 onboarding 或一次性更新配置。

## 实施阶段

## 阶段 1：共享模式 + 配置表面

- `packages/shared/src/constants.ts`：定义规范的模式/暴露常量。
- `packages/shared/src/config-schema.ts`：添加模式/暴露/认证 URL 字段。
- `server/src/config.ts` 和 CLI 配置类型：仅消费规范字段。

## 阶段 2：CLI 交互式 UX

- `cli/src/prompts/server.ts`：实现带默认值的模式提示和认证暴露指导文案。
- `cli/src/commands/onboard.ts`：保持交互优先流程；仅可选覆盖。
- `cli/src/commands/configure.ts`：服务器部分相同行为。
- `cli/src/commands/doctor.ts`：基于配置的模式感知检查，默认无需标志位。

## 阶段 3：运行时/认证策略

- `server/src/index.ts`：强制执行模式特定的启动约束。
- `server/src/auth/better-auth.ts`：实现 `auto` 与 `explicit` 基础 URL 行为。
- 用于 `authenticated + private` 的主机/来源信任辅助工具。

## 阶段 4：面板主体集成

- 添加确保面板用户的启动/安装步骤：
  - 真实的本地面板用户行
  - 实例管理员角色行
- 确保首次 company 创建路径授予创建者成员关系。
- 移除在破坏用户分配/成员关系语义处的仅合成假设。

## 阶段 5：UI + 文档

- 更新围绕模式和暴露指导的 UI 标签/帮助文本。
- 更新文档：
  - `doc/DEPLOYMENT-MODES.md`
  - `doc/DEVELOPING.md`
  - `doc/CLI.md`
  - `doc/SPEC-implementation.md`

## 测试计划

- 规范模式/暴露/认证字段的配置模式测试。
- 默认交互式选择和文案的 CLI 提示测试。
- 按模式/暴露的 doctor 测试。
- 运行时测试：
  - authenticated/private 无需显式 URL 即可工作
  - authenticated/public 需要显式 URL
  - private 主机策略拒绝不可信主机
- 面板主体测试：
  - local_trusted 面板用户作为真实数据库用户存在
  - 面板在成员关系设置后可通过 `assigneeUserId` 被分配任务
  - authenticated 流程的创建者成员关系行为

## 验收标准

1. `pnpm paperclipai onboard` 以交互式为先且默认为 `local_trusted`。
2. 认证模式是一个运行时模式，带有 `private/public` 暴露指导。
3. `pnpm paperclipai doctor` 无需标志位即可工作，具有模式感知检查。
4. 无额外的兼容性别名用于已废弃的命名变体。
5. 面板身份由真实的数据库用户/角色/成员关系集成点表示，支持一致的任务分配和权限行为。

## 验证关卡

合并前：

```sh
pnpm -r typecheck
pnpm test:run
pnpm build
```
