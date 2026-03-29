# Agent Evals 框架计划

日期：2026-03-13

## 背景

我们需要针对 Paperclip 实际交付内容的评估（evals）：

- 由 adapter 配置产生的 agent 行为
- prompt 模板和 bootstrap prompts
- 技能集与技能指令
- 模型选择
- 影响结果和成本的运行时策略选择

我们**并不**主要需要微调流水线。
我们需要一个能回答以下问题的回归测试框架：

- 如果我们修改 prompts 或技能，agents 是否仍然做正确的事情？
- 如果我们切换模型，哪些方面变好了、变差了，或者变贵了？
- 如果我们优化 token 用量，是否保留了任务结果？
- 我们能否随时间从真实的 Paperclip 使用情况中扩充测试套件？

本计划基于：

- `doc/GOAL.md`
- `doc/PRODUCT.md`
- `doc/SPEC-implementation.md`
- `docs/agents-runtime.md`
- `doc/plans/2026-03-13-TOKEN-OPTIMIZATION-PLAN.md`
- Discussion #449: <https://github.com/paperclipai/paperclip/discussions/449>
- OpenAI eval best practices: <https://developers.openai.com/api/docs/guides/evaluation-best-practices>
- Promptfoo docs: <https://www.promptfoo.dev/docs/configuration/test-cases/> and <https://www.promptfoo.dev/docs/providers/custom-api/>
- LangSmith complex agent eval docs: <https://docs.langchain.com/langsmith/evaluate-complex-agent>
- Braintrust dataset/scorer docs: <https://www.braintrust.dev/docs/annotate/datasets> and <https://www.braintrust.dev/docs/evaluate/write-scorers>

## 建议

Paperclip 应采取**两阶段方法**：

1. **现在先使用 Promptfoo**，针对跨模型的 prompt 和技能行为进行有针对性的评估。
2. **逐步发展为 TypeScript 实现的、存储在 repo 内的第一方评估框架**，用于完整的 Paperclip 场景评估。

因此，建议不再是”跳过 Promptfoo”，而是：

- 将 Promptfoo 作为最快的引导层
- 将评估用例和 fixtures 保留在本 repo 中
- 避免将 Promptfoo 配置作为最深层的长期抽象

更具体地说：

1. 规范的评估定义应放在本 repo 的顶层 `evals/` 目录下。
2. `v0` 应使用 Promptfoo 跨模型和 provider 运行有针对性的测试用例。
3. 长期框架应针对预置的 companies/issues/agents 运行**真实的 Paperclip 场景**，而不仅仅是原始的 prompt completions。
4. 评分模型应结合：
   - 确定性检查
   - 结构化评分标准（rubric scoring）
   - 候选方案与基线的两两对比评判
   - 来自标准化使用量/成本遥测的效率指标
5. 框架应比较 **bundles**，而不仅仅是模型。

一个 bundle 包括：

- adapter 类型
- model id
- prompt 模板
- bootstrap prompt 模板
- 技能白名单 / 技能内容版本
- 相关运行时标志

这是正确的比较单元，因为它才是真正改变 Paperclip 行为的内容。

## 为什么这是正确的方向

### 1. 我们需要评估系统行为，而不仅仅是 prompt 输出

仅针对 prompt 的工具有其价值，但 Paperclip 真正的失败模式通常是：

- 选择了错误的 issue
- 错误的 API 调用顺序
- 错误的委派
- 未能遵守审批边界
- 过时的 session 行为
- 过度读取上下文
- 在未产出 artifacts 或评论的情况下声称已完成

这些都是控制面行为，需要场景设置、执行以及 trace 检查。

### 2. Repo 已经是 TypeScript 优先

现有的 monorepo 已经使用：

- `pnpm`
- `tsx`
- `vitest`
- 跨 server、UI、共享合约和 adapters 的 TypeScript

相比引入 Python 优先的测试子系统作为默认路径，TypeScript 优先的框架将更好地适配 repo 和 CI。

Python 可在之后作为特殊评分器或研究实验的可选项保留。

### 3. 我们需要不依赖特定厂商的 provider/模型对比

OpenAI 的指导方向是正确的：

- 尽早且频繁地评估
- 使用任务特定的评估
- 记录所有内容
- 比起开放式评分，优先使用两两对比式评判

但 OpenAI 的 Evals API 并不适合作为 Paperclip 的主要控制面，因为我们明确的目标是多模型和多 provider。

### 4. 托管评估产品有其价值，Promptfoo 是正确的引导工具

当前的权衡：

- Promptfoo 非常适合本地、基于 repo 的 prompt/provider 矩阵测试以及 CI 集成。
- LangSmith 在轨迹式 agent 评估方面很强。
- Braintrust 拥有简洁的 dataset + scorer + experiment 模型，以及强大的 TypeScript 支持。

社区的建议方向是正确的：

- Promptfoo 让我们可以从小处着手
- 它支持简单的断言，如 contains / not-contains / regex / custom JS
- 它可以跨多个模型运行相同的用例
- 它支持 OpenRouter
- 之后可以接入 CI

这使它成为”这次 prompt/技能/模型变更是否有明显的回归？”这类问题的最佳 `v0` 工具。

但 Paperclip 仍应避免在拥有自己稳定的评估模型之前，将托管平台或第三方配置格式作为核心抽象。

正确的做法是：

- 先使用 Promptfoo 获取快速成果
- 保持数据的可移植性并归属于 repo
- 随着系统增长，围绕 Paperclip 概念构建一个轻量的第一方框架
- 之后视需要选择性地导出至其他工具或与其集成

## 我们应该评估什么

我们应将评估分为四个层次。

### 第一层：确定性合约评估

这些评估不需要评判模型。

示例：

- agent 对已分配的 issue 发表评论
- 不在 agent 所属 company 之外进行任何变更
- 需要审批的操作不绕过审批流程
- 任务状态转换是合法的
- 输出包含所需的结构化字段
- 当任务需要 artifact 时，artifact 链接存在
- 一旦 API 支持，仅有增量变化的用例不触发全线程重新获取

这些检查成本低、可靠性高，应作为第一道防线。

### 第二层：单步行为评估

这些测试在隔离环境中测试具体的行为。

示例：

- 从收件箱中选择正确的 issue
- 撰写合理的首条状态评论
- 决定请求审批而非直接行动
- 委派给正确的下属
- 识别被阻塞状态并清晰地上报

这些最接近 prompt 评估，但仍以 Paperclip 术语进行描述。

### 第三层：端到端场景评估

这些针对预置场景运行完整的 heartbeat 或一组短序列 heartbeats。

示例：

- 新任务分配接收
- 长线程的持续跟进
- 由 @提及 触发的澄清
- 需要审批把关的招聘请求
- 向上级经理升级
- 必须留下有意义的 issue 更新的工作区编码任务

这些评估应同时评估最终状态和 trace 质量。

### 第四层：效率与回归评估

这些不是”答案看起来好不好？”的评估，而是”在改善成本/延迟的同时是否保持了质量？”的评估。

示例：

- 每次成功 heartbeat 的标准化输入 token 数
- 每个已完成 issue 的标准化 token 数
- session 复用率
- 全线程重载率
- 实际耗时
- 每个成功场景的成本

这一层对于 token 优化工作尤为重要。

## 核心设计

## 1. 规范对象：`EvalCase`

每个评估用例应定义：

- 场景设置
- 目标 bundle(s)
- 执行模式
- 预期不变量
- 评分标准（scoring rubric）
- 标签/元数据

建议的数据结构：

```ts
type EvalCase = {
  id: string;
  description: string;
  tags: string[];
  setup: {
    fixture: string;
    agentId: string;
    trigger: "assignment" | "timer" | "on_demand" | "comment" | "approval";
  };
  inputs?: Record<string, unknown>;
  checks: {
    hard: HardCheck[];
    rubric?: RubricCheck[];
    pairwise?: PairwiseCheck[];
  };
  metrics: MetricSpec[];
};
```

重要的是，用例关于的是一个 Paperclip 场景，而不是一个独立的 prompt 字符串。

## 2. 规范对象：`EvalBundle`

建议的数据结构：

```ts
type EvalBundle = {
  id: string;
  adapter: string;
  model: string;
  promptTemplate: string;
  bootstrapPromptTemplate?: string;
  skills: string[];
  flags?: Record<string, string | number | boolean>;
};
```

每次对比运行都应说明测试了哪个 bundle。

这避免了一个常见错误：说”模型 X 更好”，而实际上真正的变化是模型 + prompt + 技能 + 运行时行为的组合。

## 3. 规范输出：`EvalTrace`

我们应捕获用于评分的标准化 trace：

- run ids
- 实际发送的 prompts
- session 复用元数据
- issue 变更
- 已创建的评论
- 已请求的审批
- 已创建的 artifacts
- token/成本遥测
- 时序
- 原始输出

评分层不应需要从临时日志中抓取数据。

## 评分框架

## 1. 硬性检查优先

每个评估都应首先进行可以立即使运行失效的通过/失败检查。

示例：

- 访问了错误的 company
- 跳过了必要的审批
- 没有产生 issue 更新
- 返回了格式错误的结构化输出
- 在没有所需 artifact 的情况下将任务标记为完成

如果硬性检查失败，则无论风格或评判得分如何，场景均视为失败。

## 2. 其次是评分标准（rubric）评分

评分标准应使用具体明确的标准，而不是模糊的”这有多好？”类 prompts。

良好的评分维度：

- 任务理解
- 治理合规
- 有效的进度沟通
- 正确的委派
- 完成证据
- 简洁性 / 不必要的冗长

每个评分标准应是小范围的 0-1 或 0-2 判断，而不是模糊的 1-10 分制。

## 3. 候选方案与基线的两两对比评判

OpenAI 的评估指导是正确的：LLM 在区分判断方面比开放式生成更强。

因此，对于非确定性的质量检查，默认模式应为：

- 在用例上运行基线 bundle
- 在相同用例上运行候选 bundle
- 要求评判模型根据明确标准判断哪个更好
- 允许 `baseline`、`candidate` 或 `tie`

这优于要求评判者给出一个没有参照物的绝对质量分数。

## 4. 效率评分单独处理

不要将效率埋入单一的综合质量分数中。

单独记录：

- 质量得分
- 成本得分
- 延迟得分

然后计算汇总决策，例如：

- 仅当质量不低于基线且效率有所提升时，候选方案才可接受

这比一个神奇的综合数字更容易推理。

## 建议的决策规则

用于 PR 门控：

1. 无硬性检查回归。
2. 所需场景通过率无显著回归。
3. 关键评分维度无显著回归。
4. 如果变更以 token 优化为导向，则要求目标场景的效率有所提升。

对于更深入的对比报告，应展示：

- 通过率
- 两两对比的胜/负/平
- 标准化 token 的中位数
- 实际耗时的中位数
- 成本增减情况

## 数据集策略

我们应明确从三个来源构建数据集。

### 1. 手工编写的种子用例

从这里开始。

这些用例应覆盖核心产品不变量：

- 任务分配接收
- 状态更新
- 阻塞上报
- 委派
- 审批请求
- 跨 company 访问拒绝
- issue 评论跟进

这些用例小巧、明确且稳定。

### 2. 来自生产的用例

按照 OpenAI 的指导，我们应记录所有内容，并从真实使用情况中挖掘评估用例。

Paperclip 应通过将真实运行提升为用例来扩展评估覆盖范围，当我们发现以下情况时：

- 回归
- 有趣的失败
- 边界情况
- 值得保留的高价值成功模式

初始版本可以是手动的：

- 获取一次真实运行
- 对其进行脱敏/标准化
- 将其转换为 `EvalCase`

之后我们可以自动化 trace 到用例的生成。

### 3. 对抗性和防护用例

这些用例应有意探测失败模式：

- 尝试绕过审批
- 引用错误的 company
- 过时上下文陷阱
- 无关的长线程
- 评论中的误导性指令
- 冗长性陷阱

这是 promptfoo 风格的红队想法之后可以发挥作用的地方，但不是第一个切片。

## Repo 目录结构

推荐的初始目录结构：

```text
evals/
  README.md
  promptfoo/
    promptfooconfig.yaml
    prompts/
    cases/
  cases/
    core/
    approvals/
    delegation/
    efficiency/
  fixtures/
    companies/
    issues/
  bundles/
    baseline/
    experiments/
  runners/
    scenario-runner.ts
    compare-runner.ts
  scorers/
    hard/
    rubric/
    pairwise/
  judges/
    rubric-judge.ts
    pairwise-judge.ts
  lib/
    types.ts
    traces.ts
    metrics.ts
  reports/
    .gitignore
```

为什么选择顶层 `evals/` 目录：

- 使评估成为第一优先级
- 避免将其隐藏在 `server/` 内部，尽管它们跨越了 adapters 和运行时行为
- 为之后的 TS 和可选的 Python 辅助工具留有空间
- 为 Promptfoo `v0` 配置以及之后的第一方运行器提供一个清晰的位置

## 执行模型

框架应支持三种模式。

### 模式 A：低成本本地冒烟测试

目的：

- 在 PR 上运行
- 控制成本
- 捕获明显的回归

特点：

- 5 到 20 个用例
- 1 或 2 个 bundles
- 主要是硬性检查和具体的评分标准

### 模式 B：候选方案与基线对比

目的：

- 在合并前评估 prompt/技能/模型变更

特点：

- 配对运行
- 启用两两对比评判
- 质量 + 效率差异报告

### 模式 C：夜间更广泛的矩阵测试

目的：

- 对比多个模型和 bundles
- 积累历史基准数据

特点：

- 更大的用例集
- 多个模型
- 更高成本的 rubric/两两对比评判

## CI 与开发者工作流

建议的命令：

```sh
pnpm evals:smoke
pnpm evals:compare --baseline baseline/codex-default --candidate experiments/codex-lean-skillset
pnpm evals:nightly
```

PR 行为：

- 在 prompt/技能/adapter/运行时变更时运行 `evals:smoke`
- 对于带标签的 PR 或手动运行，可选触发 `evals:compare`

夜间行为：

- 运行更大的矩阵
- 保存报告产物
- 呈现通过率、两两对比胜出次数和效率的趋势线

## Framework Comparison

## Promptfoo

Best use for Paperclip:

- prompt-level micro-evals
- provider/model comparison
- quick local CI integration
- custom JS assertions and custom providers
- bootstrap-layer evals for one skill or one agent workflow

What changed in this recommendation:

- Promptfoo is now the recommended **starting point**
- especially for “one skill, a handful of cases, compare across models”

Why it still should not be the only long-term system:

- its primary abstraction is still prompt/provider/test-case oriented
- Paperclip needs scenario setup, control-plane state inspection, and multi-step traces as first-class concepts

Recommendation:

- use Promptfoo first
- store Promptfoo config and cases in-repo under `evals/promptfoo/`
- use custom JS/TS assertions and, if needed later, a custom provider that calls Paperclip scenario runners
- do not make Promptfoo YAML the only canonical Paperclip eval format once we outgrow prompt-level evals

## LangSmith

What it gets right:

- final response evals
- trajectory evals
- single-step evals

Why not the primary system today:

- stronger fit for teams already centered on LangChain/LangGraph
- introduces hosted/external workflow gravity before our own eval model is stable

Recommendation:

- copy the trajectory/final/single-step taxonomy
- do not adopt the platform as the default requirement

## Braintrust

What it gets right:

- TypeScript support
- clean dataset/task/scorer model
- production logging to datasets
- experiment comparison over time

Why not the primary system today:

- still externalizes the canonical dataset and review workflow
- we are not yet at the maturity where hosted experiment management should define the shape of the system

Recommendation:

- borrow its dataset/scorer/experiment mental model
- revisit once we want hosted review and experiment history at scale

## OpenAI Evals / Evals API

What it gets right:

- strong eval principles
- emphasis on task-specific evals
- continuous evaluation mindset

Why not the primary system:

- Paperclip must compare across models/providers
- we do not want our primary eval runner coupled to one model vendor

Recommendation:

- use the guidance
- do not use it as the core Paperclip eval runtime

## First Implementation Slice

The first version should be intentionally small.

## Phase 0: Promptfoo bootstrap

Build:

- `evals/promptfoo/promptfooconfig.yaml`
- 5 to 10 focused cases for one skill or one agent workflow
- model matrix using the providers we care about most
- mostly deterministic assertions:
  - contains
  - not-contains
  - regex
  - custom JS assertions

Target scope:

- one skill, or one narrow workflow such as assignment pickup / first status update
- compare a small set of bundles across several models

Success criteria:

- we can run one command and compare outputs across models
- prompt/skill regressions become visible quickly
- the team gets signal before building heavier infrastructure

## Phase 1: Skeleton and core cases

Build:

- `evals/` scaffold
- `EvalCase`, `EvalBundle`, `EvalTrace` types
- scenario runner for seeded local cases
- 10 hand-authored core cases
- hard checks only

Target cases:

- assigned issue pickup
- write progress comment
- ask for approval when required
- respect company boundary
- report blocked state
- avoid marking done without artifact/comment evidence

Success criteria:

- a developer can run a local smoke suite
- prompt/skill changes can fail the suite deterministically
- Promptfoo `v0` cases either migrate into or coexist with this layer cleanly

## Phase 2: Pairwise and rubric layer

Build:

- rubric scorer interface
- pairwise judge runner
- candidate vs baseline compare command
- markdown/html report output

Success criteria:

- model/prompt bundle changes produce a readable diff report
- we can tell “better”, “worse”, or “same” on curated scenarios

## Phase 3: Efficiency integration

Build:

- normalized token/cost metrics into eval traces
- cost and latency comparisons
- efficiency gates for token optimization work

Dependency:

- this should align with the telemetry normalization work in `2026-03-13-TOKEN-OPTIMIZATION-PLAN.md`

Success criteria:

- quality and efficiency can be judged together
- token-reduction work no longer relies on anecdotal improvements

## Phase 4: Production-case ingestion

Build:

- tooling to promote real runs into new eval cases
- metadata tagging
- failure corpus growth process

Success criteria:

- the eval suite grows from real product behavior instead of staying synthetic

## Initial Case Categories

We should start with these categories:

1. `core.assignment_pickup`
2. `core.progress_update`
3. `core.blocked_reporting`
4. `governance.approval_required`
5. `governance.company_boundary`
6. `delegation.correct_report`
7. `threads.long_context_followup`
8. `efficiency.no_unnecessary_reloads`

That is enough to start catching the classes of regressions we actually care about.

## Important Guardrails

### 1. Do not rely on judge models alone

Every important scenario needs deterministic checks first.

### 2. Do not gate PRs on a single noisy score

Use pass/fail invariants plus a small number of stable rubric or pairwise checks.

### 3. Do not confuse benchmark score with product quality

The suite must keep growing from real runs, otherwise it will become a toy benchmark.

### 4. Do not evaluate only final output

Trajectory matters for agents:

- did they call the right Paperclip APIs?
- did they ask for approval?
- did they communicate progress?
- did they choose the right issue?

### 5. Do not make the framework vendor-shaped

Our eval model should survive changes in:

- judge provider
- candidate provider
- adapter implementation
- hosted tooling choices

## Open Questions

1. Should the first scenario runner invoke the real server over HTTP, or call services directly in-process?
   My recommendation: start in-process for speed, then add HTTP-mode coverage once the model stabilizes.

2. Should we support Python scorers in v1?
   My recommendation: no. Keep v1 all-TypeScript.

3. Should we commit baseline outputs?
   My recommendation: commit case definitions and bundle definitions, but keep run artifacts out of git.

4. Should we add hosted experiment tracking immediately?
   My recommendation: no. Revisit after the local harness proves useful.

## Final Recommendation

Start with Promptfoo for immediate, narrow model-and-prompt comparisons, then grow into a first-party `evals/` framework in TypeScript that evaluates **Paperclip scenarios and bundles**, not just prompts.

Use this structure:

- Promptfoo for `v0` bootstrap
- deterministic hard checks as the foundation
- rubric and pairwise judging for non-deterministic quality
- normalized efficiency metrics as a separate axis
- repo-local datasets that grow from real runs

Use external tools selectively:

- Promptfoo as the initial path for narrow prompt/provider tests
- Braintrust or LangSmith later if we want hosted experiment management

But keep the canonical eval model inside the Paperclip repo and aligned to Paperclip’s actual control-plane behaviors.
