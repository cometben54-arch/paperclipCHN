# 发布到 npm

关于 Paperclip 包如何准备和发布到 npm 的底层参考。

维护者工作流请使用 [doc/RELEASING.md](RELEASING.md)。本文档专注于打包内部细节。

## 当前发布入口点

使用以下脚本：

- [`scripts/release.sh`](../scripts/release.sh) 用于 canary 和稳定版发布流程
- [`scripts/create-github-release.sh`](../scripts/create-github-release.sh) 推送稳定版标签后使用
- [`scripts/rollback-latest.sh`](../scripts/rollback-latest.sh) 用于重新指向 `latest`
- [`scripts/build-npm.sh`](../scripts/build-npm.sh) 用于 CLI 打包构建

Paperclip 不再使用发布分支或 Changesets 进行发布。

## 为什么 CLI 需要特殊打包

CLI 包 `paperclipai` 从工作区包导入代码，例如：

- `@paperclipai/server`
- `@paperclipai/db`
- `@paperclipai/shared`
- `packages/adapters/` 下的适配器包

这些工作区引用在开发中有效，但在可发布的 npm 包中无效。发布流程会临时重写版本，然后构建可发布的 CLI 包。

## `build-npm.sh`

运行：

```bash
./scripts/build-npm.sh
```

此脚本：

1. 运行禁止 token 检查（除非提供 `--skip-checks`）
2. 运行 `pnpm -r typecheck`
3. 使用 esbuild 将 CLI 入口点打包到 `cli/dist/index.js`
4. 使用 `node --check` 验证打包的入口点
5. 将 `cli/package.json` 重写为可发布的 npm 清单，并将开发副本存储为 `cli/package.dev.json`
6. 将仓库 `README.md` 复制到 `cli/README.md` 用于 npm 元数据

发布脚本退出后，开发清单和临时文件会自动恢复。

## 包发现和版本管理

公共包从以下位置发现：

- `packages/`
- `server/`
- `ui/`
- `cli/`

版本重写步骤现在使用 [`scripts/release-package-map.mjs`](../scripts/release-package-map.mjs)，它：

- 查找所有公共包
- 按内部依赖关系进行拓扑排序
- 将每个包版本重写为目标发布版本
- 将内部 `workspace:*` 依赖引用重写为精确的目标版本
- 更新 CLI 的显示版本字符串

这些重写是临时的。工作树在发布或试运行后恢复。

## `@paperclipai/ui` 打包

UI 包发布预构建的静态资源，而非源工作区。

`ui` 包在 `prepack` 期间使用 [`scripts/generate-ui-package-json.mjs`](../scripts/generate-ui-package-json.mjs) 替换为一个精简的发布清单，该清单：

- 保留发布管理的 `name` 和 `version`
- 仅发布 `dist/`
- 从下游安装中省略仅用于源码的依赖图

打包或发布后，`postpack` 自动恢复开发清单。

## 版本格式

Paperclip 使用日历版本：

- 稳定版：`YYYY.MDD.P`
- canary 版：`YYYY.MDD.P-canary.N`

示例：

- 稳定版：`2026.318.0`
- canary 版：`2026.318.1-canary.2`

## 发布模型

### Canary

canary 在 npm dist-tag `canary` 下发布。

示例：

- `paperclipai@2026.318.1-canary.2`

这保持默认安装路径不变，同时允许通过以下方式显式安装：

```bash
npx paperclipai@canary onboard
```

### 稳定版

稳定版使用 npm dist-tag `latest` 发布。

示例：

- `paperclipai@2026.318.0`

稳定版发布不创建发布提交。而是：

- 包版本被临时重写
- 包从选定的源提交发布
- git 标签 `vYYYY.MDD.P` 指向该原始提交

## 可信发布

预期的 CI 模型是通过 GitHub OIDC 的 npm 可信发布。

这意味着：

- 仓库密钥中没有长期有效的 `NPM_TOKEN`
- GitHub Actions 获取短期发布凭据
- 可信发布规则按工作流文件配置

GitHub/npm 设置步骤参见 [doc/RELEASE-AUTOMATION-SETUP.md](RELEASE-AUTOMATION-SETUP.md)。

## 回滚模型

回滚不会取消发布任何内容。

它将 `latest` dist-tag 重新指向先前的稳定版：

```bash
./scripts/rollback-latest.sh 2026.318.0
```

如果稳定版有问题，这是恢复默认安装路径的最快方式。

## 相关文件

- [`scripts/build-npm.sh`](../scripts/build-npm.sh)
- [`scripts/generate-npm-package-json.mjs`](../scripts/generate-npm-package-json.mjs)
- [`scripts/generate-ui-package-json.mjs`](../scripts/generate-ui-package-json.mjs)
- [`scripts/release-package-map.mjs`](../scripts/release-package-map.mjs)
- [`cli/esbuild.config.mjs`](../cli/esbuild.config.mjs)
- [`doc/RELEASING.md`](RELEASING.md)
