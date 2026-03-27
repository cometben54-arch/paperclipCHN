# 部署模式

状态：规范的部署和认证模式模型
日期：2026-02-23

## 1. 目的

Paperclip 支持两种运行时模式：

1. `local_trusted`
2. `authenticated`

`authenticated` 支持两种暴露策略：

1. `private`
2. `public`

这保持了统一的认证栈，同时仍然将低摩擦的私有网络默认设置与面向互联网的加固需求分开。

## 2. 规范模型

| 运行时模式 | 暴露方式 | 人工认证 | 主要用途 |
|---|---|---|---|
| `local_trusted` | 不适用 | 无需登录 | 单操作员本地机器工作流 |
| `authenticated` | `private` | 需要登录 | 私有网络访问（例如 Tailscale/VPN/LAN） |
| `authenticated` | `public` | 需要登录 | 面向互联网/云部署 |

## 3. 安全策略

## `local_trusted`

- 仅绑定回环地址
- 无人工登录流程
- 针对最快本地启动优化

## `authenticated + private`

- 需要登录
- 低摩擦 URL 处理（`auto` 基础 URL 模式）
- 需要私有主机信任策略

## `authenticated + public`

- 需要登录
- 需要显式公开 URL
- doctor 中更严格的部署检查和故障报告

## 4. 入门 UX 约定

默认入门流程保持交互式且无需标志：

```sh
pnpm paperclipai onboard
```

服务器提示行为：

1. 询问模式，默认 `local_trusted`
2. 选项说明：
- `local_trusted`："最简单的本地设置（无需登录，仅限 localhost）"
- `authenticated`："需要登录；用于私有网络或公开托管"
3. 如果选择 `authenticated`，询问暴露方式：
- `private`："私有网络访问（例如 Tailscale），较低的设置摩擦"
- `public`："面向互联网的部署，更严格的安全要求"
4. 仅在 `authenticated + public` 时询问显式公开 URL

`configure --section server` 遵循相同的交互行为。

## 5. Doctor UX 约定

默认 doctor 保持无需标志：

```sh
pnpm paperclipai doctor
```

Doctor 读取已配置的模式/暴露方式并应用模式感知检查。可选的覆盖标志是次要的。

## 6. 董事会/用户集成约定

董事会身份必须由真实的数据库用户主体表示，以使基于用户的功能一致工作。

所需集成点：

- `authUsers` 中董事会身份的真实用户行
- `instance_user_roles` 中董事会管理员权限的条目
- `company_memberships` 集成用于用户级别的任务分配和访问

这是必需的，因为用户分配路径会验证 `assigneeUserId` 的活跃成员身份。

## 7. 本地受信 -> 认证模式声明流程

当运行 `authenticated` 模式时，如果唯一的实例管理员是 `local-board`，Paperclip 会在启动时发出警告，包含一个一次性高熵声明 URL。

- URL 格式：`/board-claim/<token>?code=<code>`
- 预期用途：已登录的人工用户声明董事会所有权
- 声明操作：
  - 将当前已登录用户提升为 `instance_admin`
  - 降级 `local-board` 管理员角色
  - 确保声明用户在现有公司中拥有活跃的所有者成员身份

这防止了用户从长期运行的本地受信使用迁移到认证模式时被锁定。

## 8. 当前代码实际情况（截至 2026-02-23）

- 运行时值为 `local_trusted | authenticated`
- `authenticated` 使用 Better Auth 会话和引导邀请流程
- `local_trusted` 确保 `authUsers` 中存在真实的本地董事会用户主体，并在 `instance_user_roles` 中拥有管理员访问权限
- 公司创建确保创建者在 `company_memberships` 中拥有成员身份，以便用户分配/访问流程保持一致

## 9. 命名和兼容性策略

- 规范命名为 `local_trusted` 和 `authenticated`，配合 `private/public` 暴露方式
- 不为已弃用的命名变体提供长期兼容性别名层

## 10. 与其他文档的关系

- 实施计划：`doc/plans/deployment-auth-mode-consolidation.md`
- V1 约定：`doc/SPEC-implementation.md`
- 操作员工作流：`doc/DEVELOPING.md` 和 `doc/CLI.md`
