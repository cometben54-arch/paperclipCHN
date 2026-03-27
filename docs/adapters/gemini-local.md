---
title: Gemini Local
summary: Gemini CLI 本地适配器的设置和配置
---

`gemini_local` 适配器在本地运行 Google 的 Gemini CLI。它支持使用 `--resume` 的会话持久化、技能注入和结构化 `stream-json` 输出解析。

## 前提条件

- 已安装 Gemini CLI（`gemini` 命令可用）
- 已设置 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，或已配置本地 Gemini CLI 认证

## 配置字段

| 字段 | 类型 | 必需 | 描述 |
|-------|------|----------|-------------|
| `cwd` | string | 是 | 代理进程的工作目录（绝对路径；如果权限允许，缺失时会自动创建） |
| `model` | string | 否 | 使用的 Gemini 模型。默认为 `auto`。 |
| `promptTemplate` | string | 否 | 用于所有运行的提示词 |
| `instructionsFilePath` | string | 否 | 前置到提示词的 Markdown 指令文件 |
| `env` | object | 否 | 环境变量（支持密钥引用） |
| `timeoutSec` | number | 否 | 进程超时时间（0 = 无超时） |
| `graceSec` | number | 否 | 强制终止前的宽限期 |
| `yolo` | boolean | 否 | 传递 `--approval-mode yolo` 以进行无人值守操作 |

## 会话持久化

适配器在心跳之间持久化 Gemini 会话 ID。下次唤醒时，它使用 `--resume` 恢复现有对话，使代理保留上下文。

会话恢复是感知工作目录的：如果工作目录自上次运行以来发生了变化，则会启动一个新的会话。

如果恢复因未知会话错误而失败，适配器会自动使用新会话重试。

## 技能注入

适配器将 Paperclip 技能符号链接到 Gemini 全局技能目录（`~/.gemini/skills`）。现有的用户技能不会被覆盖。

## 环境测试

使用 UI 中的"测试环境"按钮来验证适配器配置。它会检查：

- Gemini CLI 已安装且可访问
- 工作目录是绝对路径且可用（如果缺失且有权限则自动创建）
- API 密钥/认证提示（`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`）
- 实时 hello 探测（`gemini --output-format json "Respond with hello."`）以验证 CLI 就绪状态
