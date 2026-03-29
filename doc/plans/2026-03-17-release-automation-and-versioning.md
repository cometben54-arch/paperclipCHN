# 发布自动化与版本管理简化方案

## 背景

Paperclip 当前的发布流程记录于 `doc/RELEASING.md`，并通过以下文件实现：

- `.github/workflows/release.yml`
- `scripts/release-lib.sh`
- `scripts/release-start.sh`
- `scripts/release-preflight.sh`
- `scripts/release.sh`
- `scripts/create-github-release.sh`

当前的工作模型是：

1. 选择 `patch`、`minor` 或 `major`
2. 创建 `release/X.Y.Z`
3. 起草 `releases/vX.Y.Z.md`
4. 从该发布分支发布一个或多个 canary 版本
5. 从同一分支发布稳定版
6. 推送标签并创建 GitHub Release
7. 将发布分支合并回 `master`

这套流程虽然可行，但在本应低成本的环节引入了不必要的摩擦：

- 决定用 `patch`、`minor` 还是 `major`
- 创建并维护发布分支
- 手动发布 canary 版本
- 为 canary 版本考虑变更日志生成
- 在公开仓库中安全管理 npm 凭证

本次讨论所期望达到的目标状态更为简洁：

- 每次推送到 `master` 都自动发布 canary 版本
- 稳定版从经过验证的提交中有意识地晋升
- 版本号以日期为驱动，而非语义化驱动
- 即使在公开的开源仓库中，稳定版发布也是安全的
- 变更日志生成仅针对真正的稳定版发布

## 一句话建议

将 Paperclip 迁移到与 semver 兼容的日历版本格式，从 `master` 自动发布 canary 版本，从选定的已测试提交中晋升稳定版，并使用 npm 可信发布与 GitHub 环境，从而无需在 Actions 中存储长期有效的 npm 或 LLM 令牌。

## 核心决策

### 1. 使用日历版本，但保留 semver 语法

仓库和 npm 工具链在许多地方仍假定版本字符串具有 semver 形式。这并不意味着 Paperclip 必须将 semver 作为产品策略，但版本格式应保持 semver 合法性。

推荐格式：

- stable: `YYYY.MDD.P`
- canary: `YYYY.MDD.P-canary.N`

示例：

- 2026 年 3 月 17 日的首个稳定版：`2026.317.0`
- `2026.317.0` 系列的第三个 canary 版本：`2026.317.0-canary.2`

选用此格式的原因：

- 消除了 `patch/minor/major` 的决策负担
- 符合 semver 语法规范
- 与 npm、dist-tags 及现有 semver 校验器保持兼容
- 接近你实际期望的格式

重要约束：

- 中间数字段应为 `MDD`，其中 `M` 是月份，`DD` 是零填充的日期
- 不应使用 `2026.03.17` 这种格式
  - semver 数字标识符不允许前导零
- 不应使用 `2026.3.17.1` 这种格式
  - semver 只有三个数字部分，不是四个
- 实际符合 semver 规范的等效写法为 `2026.317.0-canary.8`

这实际上是在 semver 轨道上运行的 CalVer。

### 2. 接受 CalVer 改变了兼容性契约这一事实

这在精神层面上不再是 semver，只是在语法上保留了 semver 的形式。

这种权衡对 Paperclip 而言可能是可以接受的，但应当明确说明：

- 消费者不能再从 `major/minor/patch` 推断兼容性
- 发布说明成为兼容性信号
- 下游用户应优先使用精确版本锁定或有意识的升级

这对 `@paperclipai/shared`、`@paperclipai/db` 及各适配器等公开库包尤为重要。

### 3. 常规发布不再使用发布分支

如果每次合并到 `master` 都会发布 canary，当前的 `release/X.Y.Z` 列车模型就变成了形式大于实质的繁文缛节。

建议的替代方案：

- `master` 是唯一的 canary 发布轨道
- 每次推送到 `master` 都可以发布 canary 版本
- 稳定版从 `master` 上选定的提交或 canary 标签发布

这与你实际期望的工作流相符：

- 持续合并代码
- 让 npm 始终拥有最新的 canary 版本
- 稍后选择一个已知可靠的 canary 版本，并将该提交晋升为稳定版

### 4. 通过源引用晋升，而不是"重命名" canary 版本

这是最重要的机制约束。

npm 可以移动 dist-tags，但不允许重命名已发布的版本。这意味着：

- 可以将 `latest` 指向 `paperclipai@1.2.3`
- 无法将 `paperclipai@2026.317.0-canary.8` 改名为 `paperclipai@2026.317.0`

因此，"将 canary 晋升为稳定版"实际上意味着：

1. 选择你信任的提交或 canary 标签
2. 从该精确提交重新构建
3. 使用稳定版版本字符串重新发布

基于此，稳定版工作流应接受源引用作为输入，而不仅仅是一个升级类型。

推荐的稳定版输入：

- `source_ref`
  - 提交 SHA，或
  - 形如 `canary/v2026.317.1-canary.8` 的 canary git 标签

### 5. 只有稳定版才生成发布说明、标签和 GitHub Release

Canary 版本应保持轻量：

- 以 `canary` dist-tag 发布到 npm
- 可选地创建轻量或注释型 git 标签
- 不创建 GitHub Release
- 不要求 `releases/v*.md`
- 不消耗 LLM token

稳定版应继续作为公开叙述的呈现面：

- git 标签 `v2026.317.0`
- GitHub Release `v2026.317.0`
- 稳定版变更日志文件 `releases/v2026.317.0.md`

## 安全模型

### 建议

使用带 GitHub Actions OIDC 的 npm 可信发布，然后禁用各包基于令牌的发布访问权限。

原因：

- 仓库或组织 secrets 中无需存储长期有效的 `NPM_TOKEN`
- Actions 中无需个人 npm 令牌
- 短期凭证仅在授权工作流执行时生成
- 在公开仓库中自动为公开包提供 npm 来源证明

这是应对开放仓库安全顾虑最简洁的答案。

### 具体控制措施

#### 1. 使用单一发布工作流文件

canary 和稳定版发布统一使用同一个工作流文件：

- `.github/workflows/release.yml`

原因：

- npm 可信发布按工作流文件名进行配置
- npm 目前每个包只允许一个可信发布者配置
- GitHub 环境仍可在同一工作流内提供独立的 canary/稳定版审批规则

#### 2. 使用独立的 GitHub 环境

推荐的环境：

- `npm-canary`
- `npm-stable`

推荐策略：

- `npm-canary`
  - 允许分支：`master`
  - 无需人工审查
- `npm-stable`
  - 允许分支：`master`
  - 启用必要审查人
  - 启用禁止自我审查
  - 禁用管理员绕过

即使工作流是手动触发的，稳定版也应要求明确的第二道人工关卡。

#### 3. 锁定工作流编辑权限

为以下路径添加或收紧 `CODEOWNERS` 覆盖范围：

- `.github/workflows/*`
- `scripts/release*`
- `doc/RELEASING.md`

这一点很重要，因为可信发布授权的是工作流文件。最大的剩余风险不是 fork 中的 secret 泄露，而是经维护者批准对发布工作流本身的修改。

#### 4. OIDC 验证通过后移除传统 npm 令牌访问权限

可信发布验证完成后：

- 将包发布访问设置为要求 2FA，并禁止令牌访问
- 撤销所有旧的自动化令牌

这消除了"有人窃取 npm 令牌"这类故障的可能性。

### 不应做的事

- 不要将个人 Claude 或 npm 令牌放入 GitHub Actions
- 不要从 `pull_request_target` 运行发布逻辑
- 如果 OIDC 可以处理，就不要让稳定版发布依赖仓库 secret
- 不要为 canary 版本创建 GitHub Release

## 变更日志策略

### 建议

仅为稳定版生成变更日志，暂时将 LLM 辅助变更日志生成排除在 CI 之外。

理由：

- canary 版本发布过于频繁
- canary 版本不需要精心打磨的公开说明
- 将个人 Claude 令牌放入 Actions 所带来的风险不值得冒
- 稳定版发布频率较低，人工介入的步骤是可以接受的

推荐的稳定版流程：

1. 选取一个 canary 提交或标签
2. 在可信机器上本地运行变更日志生成
3. 提交 `releases/vYYYY.MDD.P.md`
4. 执行稳定版晋升

如果说明文档尚未就绪，可采用备用方案：

- 发布稳定版
- 创建一个最简 GitHub Release
- 随后立即更新 `releases/vYYYY.MDD.P.md`

但更理想的常态是在发布稳定版之前就已提交稳定版说明文档。

### 未来选项

如果日后需要 CI 辅助起草变更日志，可通过以下方式实现：

- 专用服务账户
- 仅限变更日志生成范围的令牌
- 手动触发的工作流
- 配有必要审查人的专用环境

这是第二阶段的加固工作，不是第一阶段的必要条件。

## 拟定的未来工作流

### Canary 工作流

触发条件：

- `master` 分支上的 `push` 事件

步骤：

1. 检出已合并的 `master` 提交
2. 对该精确提交运行验证
3. 根据当前 UTC 日期计算 canary 版本号
4. 将公开包版本设为 `YYYY.MDD.P-canary.N`
5. 以 dist-tag `canary` 发布到 npm
6. 创建 canary git 标签以便追溯

推荐的 canary 标签格式：

- `canary/v2026.317.1-canary.4`

产出：

- npm canary 版本已发布
- git 标签已创建
- 无 GitHub Release
- 无需变更日志文件

### 稳定版工作流

触发条件：

- `workflow_dispatch`（手动触发）

输入参数：

- `source_ref`
- 可选的 `stable_date`
- `dry_run`

步骤：

1. 检出 `source_ref`
2. 对该精确提交运行验证
3. 根据 UTC 日期或提供的覆盖值计算下一个稳定版 patch 槽位
4. 如果 `vYYYY.MDD.P` 已存在则失败
5. 要求存在 `releases/vYYYY.MDD.P.md`
6. 将公开包版本设为 `YYYY.MDD.P`
7. 以 `latest` 标签发布到 npm
8. 创建 git 标签 `vYYYY.MDD.P`
9. 推送标签
10. 基于 `releases/vYYYY.MDD.P.md` 创建 GitHub Release

产出：

- 稳定版 npm 发布
- 稳定版 git 标签
- GitHub Release
- 整洁的公开变更日志呈现面

## 实施指导

### 1. 用显式版本计算替换基于升级类型的版本数学

当前发布脚本依赖于：

- `patch`
- `minor`
- `major`

这些逻辑应替换为：

- `compute_canary_version_for_date`
- `compute_stable_version_for_date`

例如：

- `next_stable_version(2026-03-17) -> 2026.317.0`
- `next_canary_for_utc_date(2026-03-17) -> 2026.317.0-canary.0`

### 2. 不再要求 `release/X.Y.Z`

以下当前不变式应从正常流程中移除：

- "必须从分支 `release/X.Y.Z` 运行"
- "`X.Y.Z` 的稳定版和 canary 版来自同一发布分支"
- `release-start.sh`

替换为：

- canary 必须从 `master` 运行
- 稳定版可从固定的 `source_ref` 运行

### 3. 仅在 Changesets 仍有帮助时才保留它

当前系统使用 Changesets 来：

- 重写包版本
- 维护包级别的 `CHANGELOG.md` 文件
- 发布包

使用 CalVer 后，Changesets 在发布编排方面可能仍然有用，但不应再由它主导版本选择。

推荐的实施顺序：

1. 如果 `changeset publish` 能与显式设置的版本配合使用，则保留它
2. 用一个小型的显式版本脚本替换版本计算逻辑
3. 如果 Changesets 持续与该模型产生冲突，则将其从发布流程中完全移除

Paperclip 的发布问题现在是"以一个显式版本发布整个固定包集合"，而不是"从人类意图推导出下一个语义升级"。

### 4. 添加专用版本设置脚本

推荐的新脚本：

- `scripts/set-release-version.mjs`

职责：

- 为所有公开可发布的包设置版本号
- 更新发布所需的内部精确版本引用
- 更新 CLI 版本字符串
- 避免在无关文件中进行宽泛的字符串替换

这比保留以升级为导向的 changeset 流程再强行将其纳入日期方案更为安全。

### 5. 保留基于 dist-tags 的回滚机制

`rollback-latest.sh` 应保留，但应不再假定 semver 语法之外的语义含义。

它应继续：

- 将 `latest` 重新指向先前的稳定版
- 从不取消发布

## 权衡与风险

### 1. 稳定版 patch 槽位现在是版本契约的一部分

使用 `YYYY.MDD.P` 后，同日热修复仍受支持，但稳定版 patch 槽位现已成为可见版本格式的一部分。

这是正确的权衡，因为：

1. npm 仍能获得符合 semver 的版本
2. 同日热修复依然可行
3. 只要在 `MDD` 内对日期进行零填充，时间顺序排列仍然有效

### 2. 公开包消费者失去了 semver 意图信号

这是 CalVer 的主要缺点。

如果这成为问题，一种替代方案是：

- 仅对 CLI 包使用 CalVer
- 库包继续使用 semver

这在操作上更为复杂，因此除非包消费者确实有此需求，否则不建议从这里开始。

### 3. 自动 canary 意味着更多发布流量

每次合并到 `master` 都发布意味着：

- 更多 npm 版本
- 更多 git 标签
- 更多注册表噪声

如果 canary 版本保持清晰分离，这是可以接受的：

- npm dist-tag `canary`
- 无 GitHub Release
- 无外部公告

## 推进计划

### 第一阶段：安全基础

1. 创建 `release.yml`
2. 为所有公开包配置 npm 可信发布者
3. 创建 `npm-canary` 和 `npm-stable` 环境
4. 为发布文件添加 `CODEOWNERS` 保护
5. 验证 OIDC 发布是否正常工作
6. 禁用基于令牌的发布访问权限并撤销旧令牌

### 第二阶段：Canary 自动化

1. 添加在 `master` 上 `push` 时触发的 canary 工作流
2. 添加显式日历版本计算
3. 添加 canary git 标签创建
4. 移除 canary 版本的变更日志要求
5. 更新 `doc/RELEASING.md`

### 第三阶段：稳定版晋升

1. 添加带 `source_ref` 参数的手动稳定版工作流
2. 要求存在稳定版说明文件
3. 发布稳定版 + 标签 + GitHub Release
4. 更新回滚文档和脚本
5. 废弃发布分支相关假设

### 第四阶段：清理

1. 从主流程中移除 `release-start.sh`
2. 从维护者文档中移除 `patch/minor/major`
3. 决定是否在发布流程中保留或移除 Changesets
4. 公开记录 CalVer 兼容性契约

## 具体建议

Paperclip 应采用以下模型：

- 稳定版格式：`YYYY.MDD.P`
- canary 版格式：`YYYY.MDD.P-canary.N`
- 每次推送到 `master` 自动发布 canary 版本
- 稳定版从选定的已测试提交或 canary 标签手动晋升
- 默认流程中不使用发布分支
- 无 canary 变更日志文件
- 无 canary GitHub Release
- GitHub Actions 中无 Claude 令牌
- GitHub Actions 中无 npm 自动化令牌
- 使用 npm 可信发布与 GitHub 环境保障发布安全

这在不与 npm 对抗的前提下消除了 semver 中令人烦恼的部分，使 canary 版本轻量化，保持稳定版发布的审慎性，并从实质上改善了公开仓库的安全态势。

## 外部参考

- npm 可信发布：https://docs.npmjs.com/trusted-publishers/
- npm dist-tags：https://docs.npmjs.com/adding-dist-tags-to-packages/
- npm 语义化版本指导：https://docs.npmjs.com/about-semantic-versioning/
- GitHub 环境与部署保护规则：https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- fork 中的 GitHub secrets 行为：https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
