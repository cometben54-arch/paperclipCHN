# Docker 发布浏览器端到端测试计划

## 背景

目前，针对已发布 Paperclip 包的发布冒烟测试是手动且依赖 shell 脚本的：

```sh
HOST_PORT=3232 DATA_DIR=./data/release-smoke-canary PAPERCLIPAI_VERSION=canary ./scripts/docker-onboard-smoke.sh
HOST_PORT=3233 DATA_DIR=./data/release-smoke-stable PAPERCLIPAI_VERSION=latest ./scripts/docker-onboard-smoke.sh
```

这种方式的价值在于，它与用户实际使用的公开安装路径完全一致：

- Docker
- `npx paperclipai@canary`
- `npx paperclipai@latest`
- 已认证的引导流程

但最关键的发布问题仍然需要人工在浏览器中验证：

- 能否使用冒烟凭据登录？
- 是否进入了引导流程页面？
- 能否完成引导流程？
- 初始 CEO 智能体是否真正被创建并运行？

代码仓库中已有两个相关组件：

- `tests/e2e/onboarding.spec.ts` 负责针对本地源代码树验证引导向导
- `scripts/docker-onboard-smoke.sh` 启动已发布的 Docker 安装并自动引导已认证模式，但仅验证 API/会话层

目前缺失的是一个能将这两条路径衔接起来的确定性浏览器测试。

## 目标

添加一套以 Docker 为后端的发布级浏览器端到端测试，全面验证已发布的 `canary` 和 `latest` 安装：

1. 在 Docker 中启动已发布的包
2. 使用已知冒烟凭据登录
3. 验证用户被正确路由至引导流程页面
4. 在浏览器中完成引导流程
5. 验证首个 CEO 智能体已存在
6. 验证初始 CEO 运行已触发，并达到终态或活跃状态

然后将该测试接入 GitHub Actions，使发布验证不再只是手动操作。

## 一句话建议

将现有 Docker 冒烟脚本改造为机器友好的测试框架，添加专用的 Playwright 发布冒烟规范，驱动已认证的浏览器流程针对已发布的 Docker 安装运行，并在 GitHub Actions 中分别对 `canary` 和 `latest` 执行该测试。

## 现有基础

### 现有本地浏览器覆盖

`tests/e2e/onboarding.spec.ts` 已经验证引导向导能够：

- 创建公司
- 创建 CEO 智能体
- 创建初始问题
- 可选地观察任务进度

这是一个良好的基础，但它不能验证公开 npm 包、Docker 路径、已认证登录流程或发布 dist-tag。

### 现有 Docker 冒烟覆盖

`scripts/docker-onboard-smoke.sh` 已经完成了有价值的设置工作：

- 构建 `Dockerfile.onboard-smoke`
- 在 Docker 内运行 `paperclipai@${PAPERCLIPAI_VERSION}`
- 等待健康检查通过
- 注册或登录冒烟管理员用户
- 在已认证模式下生成并接受引导 CEO 邀请
- 验证 board 会话以及 `/api/companies`

这意味着困难的引导问题已基本解决。主要缺口在于该脚本面向人工操作，从未将控制权移交给浏览器测试。

### 现有 CI 结构

代码仓库已有：

- `.github/workflows/e2e.yml`：用于针对本地源代码手动运行 Playwright
- `.github/workflows/release.yml`：用于在 `master` 上发布 canary 以及手动晋升稳定版

因此，正确的做法是扩展现有的测试/发布体系，而非另起炉灶。

## Product Decision

### 1. The release smoke should stay deterministic and token-free

The first version should not require OpenAI, Anthropic, or external agent credentials.

Use the onboarding flow with a deterministic adapter that can run on a stock GitHub runner and inside the published Docker install. The existing `process` adapter with a trivial command is the right base path for this release gate.

That keeps this test focused on:

- release packaging
- auth/bootstrap
- UI routing
- onboarding contract
- agent creation
- heartbeat invocation plumbing

Later we can add a second credentialed smoke lane for real model-backed agents.

### 2. Smoke credentials become an explicit test contract

The current defaults in `scripts/docker-onboard-smoke.sh` should be treated as stable test fixtures:

- email: `smoke-admin@paperclip.local`
- password: `paperclip-smoke-password`

The browser test should log in with those exact values unless overridden by env vars.

### 3. Published-package smoke and source-tree E2E stay separate

Keep two lanes:

- source-tree E2E for feature development
- published Docker release smoke for release confidence

They overlap on onboarding assertions, but they guard different failure classes.

## Proposed Design

## 1. Add a CI-friendly Docker smoke harness

Refactor `scripts/docker-onboard-smoke.sh` so it can run in two modes:

- interactive mode
  - current behavior
  - streams logs and waits in foreground for manual inspection
- CI mode
  - starts the container
  - waits for health and authenticated bootstrap
  - prints machine-readable metadata
  - exits while leaving the container running for Playwright

Recommended shape:

- keep `scripts/docker-onboard-smoke.sh` as the public entry point
- add a `SMOKE_DETACH=true` or `--detach` mode
- emit a JSON blob or `.env` file containing:
  - `SMOKE_BASE_URL`
  - `SMOKE_ADMIN_EMAIL`
  - `SMOKE_ADMIN_PASSWORD`
  - `SMOKE_CONTAINER_NAME`
  - `SMOKE_DATA_DIR`

The workflow and Playwright tests can then consume the emitted metadata instead of scraping logs.

### Why this matters

The current script always tails logs and then blocks on `wait "$LOG_PID"`. That is convenient for manual smoke testing, but it is the wrong shape for CI orchestration.

## 2. Add a dedicated Playwright release-smoke spec

Create a second Playwright entry point specifically for published Docker installs, for example:

- `tests/release-smoke/playwright.config.ts`
- `tests/release-smoke/docker-auth-onboarding.spec.ts`

This suite should not use Playwright `webServer`, because the app server will already be running inside Docker.

### Browser scenario

The first release-smoke scenario should validate:

1. open `/`
2. unauthenticated user is redirected to `/auth`
3. sign in using the smoke credentials
4. authenticated user lands on onboarding when no companies exist
5. onboarding wizard appears with the expected step labels
6. create a company
7. create the first agent using `process`
8. create the initial issue
9. finish onboarding and open the created issue
10. verify via API:
    - company exists
    - CEO agent exists
    - issue exists and is assigned to the CEO
11. verify the first heartbeat run was triggered:
    - either by checking issue status changed from initial state, or
    - by checking agent/runs API shows a run for the CEO, or
    - both

The test should tolerate the run completing quickly. For this reason, the assertion should accept:

- `queued`
- `running`
- `succeeded`

and similarly for issue progression if the issue status changes before the assertion runs.

### Why a separate spec instead of reusing `tests/e2e/onboarding.spec.ts`

The local-source test and release-smoke test have different assumptions:

- different server lifecycle
- different auth path
- different deployment mode
- published npm package instead of local workspace code

Trying to force both through one spec will make both worse.

## 3. Add a release-smoke workflow in GitHub Actions

Add a workflow dedicated to this surface, ideally reusable:

- `.github/workflows/release-smoke.yml`

Recommended triggers:

- `workflow_dispatch`
- `workflow_call`

Recommended inputs:

- `paperclip_version`
  - `canary` or `latest`
- `host_port`
  - optional, default runner-safe port
- `artifact_name`
  - optional for clearer uploads

### Job outline

1. checkout repo
2. install Node/pnpm
3. install Playwright browser dependencies
4. launch Docker smoke harness in detached mode with the chosen dist-tag
5. run the release-smoke Playwright suite against the returned base URL
6. always collect diagnostics:
   - Playwright report
   - screenshots
   - trace
   - `docker logs`
   - harness metadata file
7. stop and remove container

### Why a reusable workflow

This lets us:

- run the smoke manually on demand
- call it from `release.yml`
- reuse the same job for both `canary` and `latest`

## 4. Integrate it into release automation incrementally

### Phase A: Manual workflow only

First ship the workflow as manual-only so the harness and test can be stabilized without blocking releases.

### Phase B: Run automatically after canary publish

After `publish_canary` succeeds in `.github/workflows/release.yml`, call the reusable release-smoke workflow with:

- `paperclip_version=canary`

This proves the just-published public canary really boots and onboards.

### Phase C: Run automatically after stable publish

After `publish_stable` succeeds, call the same workflow with:

- `paperclip_version=latest`

This gives us post-publish confirmation that the stable dist-tag is healthy.

### Important nuance

Testing `latest` from npm cannot happen before stable publish, because the package under test does not exist under `latest` yet. So the `latest` smoke is a post-publish verification, not a pre-publish gate.

If we later want a true pre-publish stable gate, that should be a separate source-ref or locally built package smoke job.

## 5. Make diagnostics first-class

This workflow is only valuable if failures are fast to debug.

Always capture:

- Playwright HTML report
- Playwright trace on failure
- final screenshot on failure
- full `docker logs` output
- emitted smoke metadata
- optional `curl /api/health` snapshot

Without that, the test will become a flaky black box and people will stop trusting it.

## Implementation Plan

## Phase 1: Harness refactor

Files:

- `scripts/docker-onboard-smoke.sh`
- optionally `scripts/lib/docker-onboard-smoke.sh` or similar helper
- `doc/DOCKER.md`
- `doc/RELEASING.md`

Tasks:

1. Add detached/CI mode to the Docker smoke script.
2. Make the script emit machine-readable connection metadata.
3. Keep the current interactive manual mode intact.
4. Add reliable cleanup commands for CI.

Acceptance:

- a script invocation can start the published Docker app, auto-bootstrap it, and return control to the caller with enough metadata for browser automation

## Phase 2: Browser release-smoke suite

Files:

- `tests/release-smoke/playwright.config.ts`
- `tests/release-smoke/docker-auth-onboarding.spec.ts`
- root `package.json`

Tasks:

1. Add a dedicated Playwright config for external server testing.
2. Implement login + onboarding + CEO creation flow.
3. Assert a CEO run was created or completed.
4. Add a root script such as:
   - `test:release-smoke`

Acceptance:

- the suite passes locally against both:
  - `PAPERCLIPAI_VERSION=canary`
  - `PAPERCLIPAI_VERSION=latest`

## Phase 3: GitHub Actions workflow

Files:

- `.github/workflows/release-smoke.yml`

Tasks:

1. Add manual and reusable workflow entry points.
2. Install Chromium and runner dependencies.
3. Start Docker smoke in detached mode.
4. Run the release-smoke Playwright suite.
5. Upload diagnostics artifacts.

Acceptance:

- a maintainer can run the workflow manually for either `canary` or `latest`

## Phase 4: Release workflow integration

Files:

- `.github/workflows/release.yml`
- `doc/RELEASING.md`

Tasks:

1. Trigger release smoke automatically after canary publish.
2. Trigger release smoke automatically after stable publish.
3. Document expected behavior and failure handling.

Acceptance:

- canary releases automatically produce a published-package browser smoke result
- stable releases automatically produce a `latest` browser smoke result

## Phase 5: Future extension for real model-backed agent validation

Not part of the first implementation, but this should be the next layer after the deterministic lane is stable.

Possible additions:

- a second Playwright project gated on repo secrets
- real `claude_local` or `codex_local` adapter validation in Docker-capable environments
- assertion that the CEO posts a real task/comment artifact
- stable release holdback until the credentialed lane passes

This should stay optional until the token-free lane is trustworthy.

## Acceptance Criteria

The plan is complete when the implemented system can demonstrate all of the following:

1. A published `paperclipai@canary` Docker install can be smoke-tested by Playwright in CI.
2. A published `paperclipai@latest` Docker install can be smoke-tested by Playwright in CI.
3. The test logs into authenticated mode with the smoke credentials.
4. The test sees onboarding for a fresh instance.
5. The test completes onboarding in the browser.
6. The test verifies the initial CEO agent was created.
7. The test verifies at least one CEO heartbeat run was triggered.
8. Failures produce actionable artifacts rather than just a red job.

## Risks And Decisions To Make

### 1. Fast process runs may finish before the UI visibly updates

That is expected. The assertions should prefer API polling for run existence/status rather than only visual indicators.

### 2. `latest` smoke is post-publish, not preventive

This is a real limitation of testing the published dist-tag itself. It is still valuable, but it should not be confused with a pre-publish gate.

### 3. We should not overcouple the test to cosmetic onboarding text

The important contract is flow success, created entities, and run creation. Use visible labels sparingly and prefer stable semantic selectors where possible.

### 4. Keep the smoke adapter path boring

For release safety, the first test should use the most boring runnable adapter possible. This is not the place to validate every adapter.

## Recommended First Slice

If we want the fastest path to value, ship this in order:

1. add detached mode to `scripts/docker-onboard-smoke.sh`
2. add one Playwright spec for authenticated login + onboarding + CEO run verification
3. add manual `release-smoke.yml`
4. once stable, wire canary into `release.yml`
5. after that, wire stable `latest` smoke into `release.yml`

That gives release confidence quickly without turning the first version into a large CI redesign.
