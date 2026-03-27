---
title: 编写技能
summary: SKILL.md 格式与最佳实践
---

技能是代理在心跳期间可以调用的可复用指令。它们是教代理如何执行特定任务的 markdown 文件。

## 技能结构

技能是一个包含 `SKILL.md` 文件的目录，带有 YAML 前置元数据：

```
skills/
└── my-skill/
    ├── SKILL.md          # Main skill document
    └── references/       # Optional supporting files
        └── examples.md
```

## SKILL.md 格式

```markdown
---
name: my-skill
description: >
  Short description of what this skill does and when to use it.
  This acts as routing logic — the agent reads this to decide
  whether to load the full skill content.
---

# My Skill

Detailed instructions for the agent...
```

### 前置元数据字段

- **name** — 技能的唯一标识符（kebab-case 格式）
- **description** — 路由描述，告诉代理何时使用此技能。将其写成决策逻辑，而非营销文案。

## 技能在运行时的工作原理

1. 代理在其上下文中看到技能元数据（名称 + 描述）
2. 代理判断该技能是否与其当前任务相关
3. 如果相关，代理加载完整的 SKILL.md 内容
4. 代理按照技能中的指令执行

这使得基础提示保持精简 — 完整的技能内容仅在需要时才加载。

## 最佳实践

- **将描述写成路由逻辑** — 包含"在何时使用"和"在何时不使用"的指导
- **具体且可操作** — 代理应能毫无歧义地遵循技能指令
- **包含代码示例** — 具体的 API 调用和命令示例比纯文字描述更可靠
- **保持技能专注** — 一个技能对应一个关注点；不要将不相关的流程组合在一起
- **谨慎使用参考文件** — 将补充细节放在 `references/` 中，而非使主 SKILL.md 膨胀

## 技能注入

适配器负责使技能对其代理运行时可发现。`claude_local` 适配器使用带有符号链接的临时目录和 `--add-dir`。`codex_local` 适配器使用全局技能目录。详情请参阅[创建适配器](/adapters/creating-an-adapter)指南。
