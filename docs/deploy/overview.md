---
title: 部署概览
summary: 部署模式一览
---

Paperclip 支持三种部署配置，从零摩擦的本地部署到面向互联网的生产部署。

## 部署模式

| 模式 | 认证 | 适用场景 |
|------|------|----------|
| `local_trusted` | 无需登录 | 单操作员本地机器 |
| `authenticated` + `private` | 需要登录 | 私有网络（Tailscale、VPN、LAN） |
| `authenticated` + `public` | 需要登录 | 面向互联网的云部署 |

## 快速对比

### 本地信任模式（默认）

- 仅绑定回环地址（localhost）
- 无人工登录流程
- 最快的本地启动速度
- 适用于：独立开发和实验

### 认证 + 私有模式

- 需要通过 Better Auth 登录
- 绑定所有接口以实现网络访问
- 自动基础 URL 模式（低摩擦）
- 适用于：通过 Tailscale 或本地网络的团队访问

### 认证 + 公开模式

- 需要登录
- 需要显式的公开 URL
- 更严格的安全检查
- 适用于：云托管、面向互联网的部署

## 选择模式

- **只是试用 Paperclip？** 使用 `local_trusted`（默认）
- **在私有网络上与团队共享？** 使用 `authenticated` + `private`
- **部署到云端？** 使用 `authenticated` + `public`

在引导过程中设置模式：

```sh
pnpm paperclipai onboard
```

或稍后更新：

```sh
pnpm paperclipai configure --section server
```
