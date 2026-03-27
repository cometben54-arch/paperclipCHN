# 发布自动化设置

本文档涵盖了当前 Paperclip 发布模型所需的 GitHub 和 npm 设置：

- 从 `master` 自动发布 canary
- 从选定源引用手动提升稳定版
- 通过 GitHub OIDC 的 npm 可信发布
- 公共仓库中受保护的发布基础设施

依赖于此设置的仓库文件：

- `.github/workflows/release.yml`
- `.github/CODEOWNERS`

注意：

- 发布工作流有意使用 `pnpm install --no-frozen-lockfile`
- 这与仓库当前的策略一致，即 `pnpm-lock.yaml` 在清单变更合并到 `master` 后由 GitHub 自动化刷新
- 发布作业然后在运行 `scripts/release.sh` 之前恢复 `pnpm-lock.yaml`，因此发布脚本仍然看到干净的工作树

## 1. 先合并仓库变更

在修改 GitHub 或 npm 设置之前，先合并发布自动化代码，使引用的工作流文件名已存在于默认分支上。

必需文件：

- `.github/workflows/release.yml`
- `.github/CODEOWNERS`

## 2. 配置 npm 可信发布

对 Paperclip 发布的每个公共包执行此操作。

至少包括：

- `paperclipai`
- `@paperclipai/server`
- `@paperclipai/ui`
- `packages/` 下的公共包

### 2.1. 在 npm 中打开每个包的设置页面

对于每个包：

1. 以包所有者身份打开 npm
2. 进入包设置/发布访问区域
3. 为 GitHub 仓库 `paperclipai/paperclip` 添加可信发布者

### 2.2. 为每个包添加一个可信发布者条目

npm 目前允许每个包一个可信发布者配置。

配置：

- 工作流：`.github/workflows/release.yml`

仓库：

- `paperclipai/paperclip`

环境名称：

- 将 npm 可信发布者环境字段留空

原因：

- 单个 `release.yml` 工作流同时处理 canary 和稳定版发布
- GitHub 环境 `npm-canary` 和 `npm-stable` 仍在 GitHub 端实施不同的审批规则

### 2.3. 在移除旧认证之前验证可信发布

工作流上线后：

1. 运行一次 canary 发布
2. 确认 npm 发布成功，无需任何 `NPM_TOKEN`
3. 运行稳定版试运行
4. 运行一次真实的稳定版发布

只有在此之后才应移除旧的基于 token 的访问。

## 3. 移除遗留 npm Token

可信发布正常工作后：

1. 撤销任何用于发布的仓库或组织 `NPM_TOKEN` 密钥
2. 撤销任何曾用于发布 Paperclip 的个人自动化 token
3. 如果 npm 提供了限制仅通过可信发布者发布的包级设置，请启用它

目标：

- GitHub Actions 中不应残留长期有效的 npm 发布 token

## 4. 创建 GitHub 环境

在 GitHub 仓库中创建两个环境：

- `npm-canary`
- `npm-stable`

路径：

1. GitHub 仓库
2. `Settings`
3. `Environments`
4. `New environment`

## 5. 配置 `npm-canary`

`npm-canary` 的推荐设置：

- 环境名称：`npm-canary`
- 必需审查者：无
- 等待计时器：无
- 部署分支和标签：
  - 仅选定分支
  - 允许 `master`

原因：

- 每次推送到 `master` 都应该能自动发布 canary
- canary 不应需要人工审批

## 6. 配置 `npm-stable`

`npm-stable` 的推荐设置：

- 环境名称：`npm-stable`
- 必需审查者：尽可能至少一名非触发工作流本人的维护者
- 防止自我审查：启用
- 管理员绕过：如果你的团队能接受，则禁用
- 等待计时器：可选
- 部署分支和标签：
  - 仅选定分支
  - 允许 `master`

原因：

- 稳定版发布应需要明确的人工审批门控
- 工作流是手动的，但环境仍应是真正的控制点

## 7. 保护 `master`

打开 `master` 的分支保护设置。

推荐规则：

1. 合并前需要拉取请求
2. 合并前需要状态检查通过
3. 需要代码所有者审查
4. 新提交推送时取消过期审批
5. 限制谁可以直接推送到 `master`

至少确保工作流和发布脚本的变更在没有审查的情况下无法合并。

## 8. 强制 CODEOWNERS 审查

此仓库现在包含 `.github/CODEOWNERS`，但 GitHub 只有在分支保护要求代码所有者审查时才会强制执行。

在 `master` 的分支保护中启用：

- `Require review from Code Owners`

然后验证所有者条目对你的实际维护者团队是正确的。

当前文件：

- `.github/CODEOWNERS`

如果 `@cryppadotta` 不是公共仓库中正确的审查者身份，在启用强制执行之前更改它。

## 9. 专门保护发布基础设施

以下文件应始终触发代码所有者审查：

- `.github/workflows/release.yml`
- `scripts/release.sh`
- `scripts/release-lib.sh`
- `scripts/release-package-map.mjs`
- `scripts/create-github-release.sh`
- `scripts/rollback-latest.sh`
- `doc/RELEASING.md`
- `doc/PUBLISHING.md`

如果你想要更强的控制，添加仓库规则集，明确阻止对以下路径的直接推送：

- `.github/workflows/**`
- `scripts/release*`

## 10. 不要在 GitHub Actions 中存储 Claude Token

不要添加个人 Claude 或 Anthropic token 用于自动变更日志生成。

推荐策略：

- 稳定版变更日志生成在可信维护者机器上本地完成
- canary 永远不生成变更日志

这使 LLM 支出保持有意控制，并避免高价值 token 存放在 Actions 中。

## 11. 验证 Canary 工作流

设置完成后：

1. 将一个无害的提交合并到 `master`
2. 打开该推送触发的 `Release` 工作流运行
3. 确认验证通过
4. 确认在 `npm-canary` 环境下发布成功
5. 确认 npm 现在显示一个新的 `canary` 发布
6. 确认推送了名为 `canary/vYYYY.MDD.P-canary.N` 的 git 标签

安装路径检查：

```bash
npx paperclipai@canary onboard
```

## 12. 验证稳定版工作流

在至少一个好的 canary 存在之后：

1. 使用 `./scripts/release.sh stable --date YYYY-MM-DD --print-version` 解析目标稳定版本
2. 在你想要提升的源提交上准备 `releases/vYYYY.MDD.P.md`
3. 打开 `Actions` -> `Release`
4. 使用以下参数运行：
   - `source_ref`：已测试的提交 SHA 或 canary 标签的源提交
   - `stable_date`：留空或设置预期的 UTC 日期如 `2026-03-18`
     不要输入版本如 `2026.318.0`；工作流会从日期计算版本
   - `dry_run`：`true`
5. 确认试运行成功
6. 使用 `dry_run: false` 重新运行
7. 在提示时批准 `npm-stable` 环境
8. 确认 npm `latest` 指向新的稳定版本
9. 确认 git 标签 `vYYYY.MDD.P` 存在
10. 确认 GitHub Release 已创建

实现说明：

- GitHub Actions 稳定版工作流使用 `PUBLISH_REMOTE=origin` 调用 `create-github-release.sh`
- 本地维护者使用时仍可在需要时显式传递 `PUBLISH_REMOTE=public-gh`

## 13. 建议的维护者策略

今后使用此策略：

- canary 是自动的且成本低
- 稳定版是手动的且需审批
- 只有稳定版获得公开说明和公告
- 发布说明在稳定版发布前提交
- 回滚使用 `npm dist-tag`，而非取消发布

## 14. 故障排除

### 可信发布因认证错误失败

检查：

1. GitHub 上的工作流文件名与 npm 中配置的文件名完全匹配
2. 包具有正确仓库的可信发布者条目
3. 作业具有 `id-token: write`
4. 作业从预期的仓库运行，而非 fork

### 稳定版工作流运行但从不要求审批

检查：

1. `publish` 作业使用环境 `npm-stable`
2. 环境确实配置了必需审查者
3. 工作流在规范仓库中运行，而非 fork

### CODEOWNERS 不触发

检查：

1. `.github/CODEOWNERS` 在默认分支上
2. `master` 上的分支保护要求代码所有者审查
3. 文件中的所有者身份是具有仓库访问权限的有效审查者

## 相关文档

- [doc/RELEASING.md](RELEASING.md)
- [doc/PUBLISHING.md](PUBLISHING.md)
- [doc/plans/2026-03-17-release-automation-and-versioning.md](plans/2026-03-17-release-automation-and-versioning.md)
