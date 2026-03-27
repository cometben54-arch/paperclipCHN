# 插件开发指南

本指南描述了在此仓库中创建 Paperclip 插件的当前已实现方式。

它有意比 [PLUGIN_SPEC.md](./PLUGIN_SPEC.md) 范围更窄。规范包含未来的构想；本指南仅涵盖当前已存在的 alpha 版本接口。

## 当前现状

- 将插件 worker 和插件 UI 视为可信代码。
- 插件 UI 作为同源 JavaScript 在 Paperclip 主应用内运行。
- Worker 端宿主 API 受能力门控。
- 插件 UI 不受清单能力的沙箱限制。
- 目前还没有为插件提供宿主共享的 React 组件工具包。
- 当前运行时不支持 `ctx.assets`。

## 创建插件脚手架

使用脚手架包：

```bash
pnpm --filter @paperclipai/create-paperclip-plugin build
node packages/plugins/create-paperclip-plugin/dist/index.js @yourscope/plugin-name --output ./packages/plugins/examples
```

对于位于 Paperclip 仓库外部的插件：

```bash
pnpm --filter @paperclipai/create-paperclip-plugin build
node packages/plugins/create-paperclip-plugin/dist/index.js @yourscope/plugin-name \
  --output /absolute/path/to/plugin-repos \
  --sdk-path /absolute/path/to/paperclip/packages/plugins/sdk
```

这将创建一个包含以下内容的包：

- `src/manifest.ts`
- `src/worker.ts`
- `src/ui/index.tsx`
- `tests/plugin.spec.ts`
- `esbuild.config.mjs`
- `rollup.config.mjs`

在此 monorepo 内，脚手架使用 `workspace:*` 引用 `@paperclipai/plugin-sdk`。

在此 monorepo 外部，脚手架会从本地 Paperclip 检出中快照 `@paperclipai/plugin-sdk` 到 `.paperclip-sdk/` tarball，这样您无需先发布到 npm 即可构建和测试插件。

## 推荐的本地工作流

从生成的插件文件夹中：

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

对于本地开发，通过插件管理器或 API 从绝对本地路径安装插件。服务器支持本地文件系统安装，并会监视本地路径插件的文件变更，因此重建后 worker 会自动重启。

示例：

```bash
curl -X POST http://127.0.0.1:3100/api/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"packageName":"/absolute/path/to/your-plugin","isLocalPath":true}'
```

## 支持的 alpha 版本接口

Worker：

- config
- events
- jobs
- launchers
- http
- secrets
- activity
- state
- entities
- projects and project workspaces
- companies
- issues and comments
- agents and agent sessions
- goals
- data/actions
- streams
- tools
- metrics
- logger

UI：

- `usePluginData`
- `usePluginAction`
- `usePluginStream`
- `usePluginToast`
- `useHostContext`
- 来自 `@paperclipai/plugin-sdk/ui` 的类型化插槽属性

当前在宿主中已连接的挂载界面包括：

- `page`
- `settingsPage`
- `dashboardWidget`
- `sidebar`
- `sidebarPanel`
- `detailTab`
- `taskDetailView`
- `projectSidebarItem`
- `globalToolbarButton`
- `toolbarButton`
- `contextMenuItem`
- `commentAnnotation`
- `commentContextMenuItem`

## 公司路由

插件可以声明带有 `routePath` 的 `page` 插槽来拥有一个公司路由，例如：

```text
/:companyPrefix/<routePath>
```

规则：

- `routePath` 必须是单个小写短横线分隔的标识符
- 不能与保留的宿主路由冲突
- 不能与其他已安装插件的页面路由重复

## 发布指南

- 使用 npm 包作为部署产物。
- 将仓库本地示例安装仅视为开发工作流。
- 优先将插件 UI 自包含在包内。
- 不要依赖宿主设计系统组件或未文档化的应用内部实现。
- GitHub 仓库安装目前不是一等公民的工作流。对于本地开发，使用已检出的本地路径。对于生产环境，发布到 npm 或私有的 npm 兼容注册中心。

## 交付前验证

至少执行以下操作：

```bash
pnpm --filter <your-plugin-package> typecheck
pnpm --filter <your-plugin-package> test
pnpm --filter <your-plugin-package> build
```

如果您同时更改了宿主集成，还需运行：

```bash
pnpm -r typecheck
pnpm test:run
pnpm build
```
