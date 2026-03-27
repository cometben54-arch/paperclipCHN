---
title: 创建适配器
summary: 构建自定义适配器的指南
---

构建自定义适配器以将 Paperclip 连接到任何代理运行时。

<Tip>
如果你使用 Claude Code，`.agents/skills/create-agent-adapter` 技能可以交互式地引导你完成整个适配器创建过程。只需让 Claude 创建一个新适配器，它会逐步引导你完成每个步骤。
</Tip>

## 包结构

```
packages/adapters/<name>/
  package.json
  tsconfig.json
  src/
    index.ts            # Shared metadata
    server/
      index.ts          # Server exports
      execute.ts        # Core execution logic
      parse.ts          # Output parsing
      test.ts           # Environment diagnostics
    ui/
      index.ts          # UI exports
      parse-stdout.ts   # Transcript parser
      build-config.ts   # Config builder
    cli/
      index.ts          # CLI exports
      format-event.ts   # Terminal formatter
```

## 第 1 步：根元数据

`src/index.ts` 被所有三个消费者导入。保持它无依赖。

```ts
export const type = "my_agent";        // snake_case, globally unique
export const label = "My Agent (local)";
export const models = [
  { id: "model-a", label: "Model A" },
];
export const agentConfigurationDoc = `# my_agent configuration
Use when: ...
Don't use when: ...
Core fields: ...
`;
```

## 第 2 步：服务器执行

`src/server/execute.ts` 是核心。它接收一个 `AdapterExecutionContext` 并返回一个 `AdapterExecutionResult`。

关键职责：

1. 使用安全辅助函数读取配置（`asString`、`asNumber` 等）
2. 使用 `buildPaperclipEnv(agent)` 加上下文变量构建环境
3. 从 `runtime.sessionParams` 解析会话状态
4. 使用 `renderTemplate(template, data)` 渲染提示词
5. 使用 `runChildProcess()` 生成进程或通过 `fetch()` 调用
6. 解析输出中的使用量、成本、会话状态和错误
7. 处理未知会话错误（使用全新会话重试，设置 `clearSession: true`）

## 第 3 步：环境测试

`src/server/test.ts` 在运行前验证适配器配置。

返回结构化的诊断信息：

- `error` 表示无效/不可用的设置
- `warn` 表示非阻塞性问题
- `info` 表示成功的检查

## 第 4 步：UI 模块

- `parse-stdout.ts` — 将 stdout 行转换为 `TranscriptEntry[]` 供运行查看器使用
- `build-config.ts` — 将表单值转换为 `adapterConfig` JSON
- 配置字段 React 组件位于 `ui/src/adapters/<name>/config-fields.tsx`

## 第 5 步：CLI 模块

`format-event.ts` — 使用 `picocolors` 为 `paperclipai run --watch` 美化打印 stdout。

## 第 6 步：注册

将适配器添加到所有三个注册中心：

1. `server/src/adapters/registry.ts`
2. `ui/src/adapters/registry.ts`
3. `cli/src/adapters/registry.ts`

## 技能注入

使你的代理运行时能够发现 Paperclip 技能，而无需写入代理的工作目录：

1. **最佳方式：tmpdir + 标志** — 创建 tmpdir，符号链接技能，通过 CLI 标志传递，完成后清理
2. **可接受：全局配置目录** — 符号链接到运行时的全局插件目录
3. **可接受：环境变量** — 将技能路径环境变量指向仓库的 `skills/` 目录
4. **最后手段：提示词注入** — 在提示词模板中包含技能内容

## 安全性

- 将代理输出视为不可信的（防御性解析，永不执行）
- 通过环境变量注入密钥，而非通过提示词
- 如果运行时支持，配置网络访问控制
- 始终强制执行超时和宽限期
