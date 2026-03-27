---
title: 适配器概览
summary: 什么是适配器以及它们如何将代理连接到 Paperclip
---

适配器是 Paperclip 编排层与代理运行时之间的桥梁。每个适配器知道如何调用特定类型的 AI 代理并捕获其结果。

## 适配器工作原理

当心跳触发时，Paperclip：

1. 查找代理的 `adapterType` 和 `adapterConfig`
2. 使用执行上下文调用适配器的 `execute()` 函数
3. 适配器生成或调用代理运行时
4. 适配器捕获 stdout，解析使用量/成本数据，并返回结构化结果

## 内置适配器

| 适配器 | 类型键 | 描述 |
|---------|----------|-------------|
| [Claude Local](/adapters/claude-local) | `claude_local` | 在本地运行 Claude Code CLI |
| [Codex Local](/adapters/codex-local) | `codex_local` | 在本地运行 OpenAI Codex CLI |
| [Gemini Local](/adapters/gemini-local) | `gemini_local` | 在本地运行 Gemini CLI |
| OpenCode Local | `opencode_local` | 在本地运行 OpenCode CLI（多提供商 `provider/model`） |
| OpenClaw | `openclaw` | 向 OpenClaw webhook 发送唤醒负载 |
| [Process](/adapters/process) | `process` | 执行任意 shell 命令 |
| [HTTP](/adapters/http) | `http` | 向外部代理发送 webhook |

## 适配器架构

每个适配器是一个包含三个模块的包：

```
packages/adapters/<name>/
  src/
    index.ts            # Shared metadata (type, label, models)
    server/
      execute.ts        # Core execution logic
      parse.ts          # Output parsing
      test.ts           # Environment diagnostics
    ui/
      parse-stdout.ts   # Stdout -> transcript entries for run viewer
      build-config.ts   # Form values -> adapterConfig JSON
    cli/
      format-event.ts   # Terminal output for `paperclipai run --watch`
```

三个注册中心使用这些模块：

| 注册中心 | 功能 |
|----------|-------------|
| **服务器** | 执行代理，捕获结果 |
| **UI** | 渲染运行记录，提供配置表单 |
| **CLI** | 格式化终端输出以便实时查看 |

## 选择适配器

- **需要编码代理？** 使用 `claude_local`、`codex_local`、`gemini_local` 或 `opencode_local`
- **需要运行脚本或命令？** 使用 `process`
- **需要调用外部服务？** 使用 `http`
- **需要自定义的？** [创建你自己的适配器](/adapters/creating-an-adapter)
