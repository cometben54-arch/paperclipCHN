# Issue worktree 支持

状态：实验性功能，仅限运行时，尚未作为面向用户的功能发布。

此分支包含 issue 级别 worktree 所需的运行时和初始化工作：

- 项目执行工作区策略支持
- issue 级别的执行工作区设置
- 用于隔离 issue 执行的 git worktree 实现
- 可选的基于命令的 worktree 配置
- 针对密钥兼容性的种子 worktree 修复
- 种子项目工作区重新绑定到当前 git worktree

我们有意暂不发布此功能的 UI。运行时代码保留，但主要 UI 入口目前被硬性关闭。

## 当前可用功能

- 项目可以在后端携带执行工作区策略
- issue 可以在后端携带执行工作区设置
- 心跳执行可以实现隔离的 git worktree
- 运行时可以在派生的 worktree 内运行项目定义的配置命令
- 种子 worktree 实例可以保持本地加密密钥正常工作
- 种子 worktree 实例可以将同仓库项目工作区路径重新绑定到当前 git worktree

## 隐藏的 UI 入口

以下是该功能当前面向用户的 UI 界面，现已有意禁用：

- 项目设置：
  - `ui/src/components/ProjectProperties.tsx`
  - 执行工作区策略控制
  - git worktree 基础引用 / 分支模板 / 父目录
  - 配置 / 清理命令输入

- issue 创建：
  - `ui/src/components/NewIssueDialog.tsx`
  - 隔离 issue 检出切换
  - 从项目策略默认 issue 执行工作区设置

- issue 编辑：
  - `ui/src/components/IssueProperties.tsx`
  - issue 级别工作区模式切换
  - 当项目变更时默认 issue 执行工作区设置

- 代理/运行时设置：
  - `ui/src/adapters/runtime-json-fields.tsx`
  - 运行时服务 JSON 字段，这是更广泛的工作区-运行时支持界面的一部分

## UI 隐藏的原因

- 运行时行为仍在验证中
- 工作流和操作人员的使用体验尚未最终确定
- 我们不希望在 issue、项目或设置中暴露一个尚未完善的面向用户的功能

## 重新启用计划

当此功能准备发布时：

- 重新启用上述文件中被关闭的 UI 部分
- 审查项目和 issue 控制的措辞和默认值
- 决定哪些代理/运行时设置应保持为高级选项
- 为完整 UI 工作流添加端到端产品级验证
