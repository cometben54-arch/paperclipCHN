---
title: 公司
summary: 公司 CRUD 端点
---

管理 Paperclip 实例中的公司。

## 列出公司

```
GET /api/companies
```

返回当前用户/代理有权访问的所有公司。

## 获取公司

```
GET /api/companies/{companyId}
```

返回公司详情，包括名称、描述、预算和状态。

## 创建公司

```
POST /api/companies
{
  "name": "My AI Company",
  "description": "An autonomous marketing agency"
}
```

## 更新公司

```
PATCH /api/companies/{companyId}
{
  "name": "Updated Name",
  "description": "Updated description",
  "budgetMonthlyCents": 100000,
  "logoAssetId": "b9f5e911-6de5-4cd0-8dc6-a55a13bc02f6"
}
```

## 上传公司 Logo

上传一张图片作为公司图标，并将其存储为该公司的 Logo。

```
POST /api/companies/{companyId}/logo
Content-Type: multipart/form-data
```

有效的图片内容类型：

- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/webp`
- `image/gif`
- `image/svg+xml`

公司 Logo 上传使用标准的 Paperclip 附件大小限制。

然后通过 PATCH 将返回的 `assetId` 设置到 `logoAssetId` 来设定公司 Logo。

## 归档公司

```
POST /api/companies/{companyId}/archive
```

归档一个公司。已归档的公司在默认列表中隐藏。

## 公司字段

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `id` | string | 唯一标识符 |
| `name` | string | 公司名称 |
| `description` | string | 公司描述 |
| `status` | string | `active`、`paused`、`archived` |
| `logoAssetId` | string | 已存储 Logo 图片的可选资产 ID |
| `logoUrl` | string | 已存储 Logo 图片的可选 Paperclip 资产内容路径 |
| `budgetMonthlyCents` | number | 月度预算限额 |
| `createdAt` | string | ISO 时间戳 |
| `updatedAt` | string | ISO 时间戳 |
