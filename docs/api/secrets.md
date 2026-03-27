---
title: 密钥
summary: 密钥 CRUD
---

管理代理在其环境配置中引用的加密密钥。

## 列出密钥

```
GET /api/companies/{companyId}/secrets
```

返回密钥元数据（不包含解密后的值）。

## 创建密钥

```
POST /api/companies/{companyId}/secrets
{
  "name": "anthropic-api-key",
  "value": "sk-ant-..."
}
```

值在存储时加密。只返回密钥 ID 和元数据。

## 更新密钥

```
PATCH /api/secrets/{secretId}
{
  "value": "sk-ant-new-value..."
}
```

创建密钥的新版本。引用 `"version": "latest"` 的代理会在下次心跳时自动获取新值。

## 在代理配置中使用密钥

在代理适配器配置中引用密钥，而非内联值：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": {
      "type": "secret_ref",
      "secretId": "{secretId}",
      "version": "latest"
    }
  }
}
```

服务器在运行时解析并解密密钥引用，将实际值注入代理进程环境。
