---
title: 密钥管理
summary: 主密钥、加密和严格模式
---

Paperclip 使用本地主密钥对密钥进行静态加密。包含敏感值（API 密钥、令牌）的代理环境变量以加密的密钥引用形式存储。

## 默认提供者：`local_encrypted`

密钥使用存储在以下位置的本地主密钥加密：

```
~/.paperclip/instances/default/secrets/master.key
```

此密钥在引导过程中自动创建。密钥永远不会离开您的机器。

## 配置

### CLI 设置

引导过程会写入默认的密钥配置：

```sh
pnpm paperclipai onboard
```

更新密钥设置：

```sh
pnpm paperclipai configure --section secrets
```

验证密钥配置：

```sh
pnpm paperclipai doctor
```

### 环境变量覆盖

| 变量 | 描述 |
|----------|-------------|
| `PAPERCLIP_SECRETS_MASTER_KEY` | 32 字节密钥，支持 base64、hex 或原始字符串格式 |
| `PAPERCLIP_SECRETS_MASTER_KEY_FILE` | 自定义密钥文件路径 |
| `PAPERCLIP_SECRETS_STRICT_MODE` | 设置为 `true` 以强制使用密钥引用 |

## 严格模式

启用严格模式后，敏感环境变量键名（匹配 `*_API_KEY`、`*_TOKEN`、`*_SECRET`）必须使用密钥引用，而非内联明文值。

```sh
PAPERCLIP_SECRETS_STRICT_MODE=true
```

建议在本地信任模式以外的任何部署中使用。

## 迁移内联密钥

如果您有现有代理在其配置中使用内联 API 密钥，请将它们迁移为加密的密钥引用：

```sh
pnpm secrets:migrate-inline-env         # 演练运行
pnpm secrets:migrate-inline-env --apply # 执行迁移
```

## 代理配置中的密钥引用

代理环境变量使用密钥引用：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": {
      "type": "secret_ref",
      "secretId": "8f884973-c29b-44e4-8ea3-6413437f8081",
      "version": "latest"
    }
  }
}
```

服务器在运行时解析并解密这些引用，将实际值注入代理进程环境。
