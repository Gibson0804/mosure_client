# HCMS Client 接口文档

## 1. 接口概述

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `{serverUrl}/client` |
| 请求格式 | JSON |
| 响应格式 | JSON |
| 认证方式 | Bearer Token |

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 1.3 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 1.4 请求头

```http
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 2. 认证接口

### 2.1 登录

**POST** `/client/auth/login`

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**：

```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "is_admin": true,
      "is_active": true
    }
  }
}
```

---

### 2.2 退出登录

**POST** `/client/auth/logout`

**请求头**：需要认证

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

### 2.3 获取当前用户信息

**GET** `/client/me`

**请求头**：需要认证

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "is_admin": true,
    "is_active": true
  }
}
```

---

## 3. 项目接口

### 3.1 获取项目列表

**GET** `/client/projects`

**请求头**：需要认证

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "示例项目",
      "prefix": "demo_project",
      "description": "这是一个示例项目",
      "template": "default",
      "created_at": "2025-01-15T10:30:00.000000Z"
    },
    {
      "id": 2,
      "name": "博客项目",
      "prefix": "blog",
      "description": "个人博客内容管理",
      "template": "",
      "created_at": "2025-01-10T08:20:00.000000Z"
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 项目 ID |
| name | string | 项目名称 |
| prefix | string | 项目前缀（唯一标识） |
| description | string | 项目描述 |
| template | string | 前端模板标识，非空表示有前端插件 |
| created_at | string | 创建时间 |

---

## 4. AI 会话接口

客户端 Chat 已切换为项目作用域的会话流模型，不再使用旧的 `/client/ai_query`、`/client/ai_history`、`/client/ai_tasks*`。

### 4.1 获取成员列表

**GET** `/client/ai/agents`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | int | 是 | 当前项目 ID |

### 4.2 获取会话列表

**GET** `/client/ai/sessions`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | int | 是 | 当前项目 ID |

### 4.3 确保项目协作群

**POST** `/client/ai/sessions/project-group`

### 4.4 创建或复用私聊

**POST** `/client/ai/agents/{type}/{identifier}/private-chat`

### 4.5 获取消息

**GET** `/client/ai/sessions/{id}/messages`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| last_id | int | 否 | 增量起点 ID |
| limit | int | 否 | 返回数量 |

### 4.6 轮询消息

**GET** `/client/ai/sessions/{id}/poll`

### 4.7 发送消息

**POST** `/client/ai/sessions/{id}/messages`

### 4.8 删除会话

**DELETE** `/client/ai/sessions/{id}`

### 4.9 清空会话消息

**DELETE** `/client/ai/sessions/{id}/messages`

---

## 6. 内容接口

### 6.1 获取内容列表

**GET** `/client/content/list`

**请求头**：需要认证

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_prefix | string | 是 | 项目前缀 |
| model_id | int | 否 | 模型 ID（与 table_name 二选一） |
| table_name | string | 否 | 表名（与 model_id 二选一） |
| page | int | 否 | 页码，默认 1 |
| per_page | int | 否 | 每页数量，默认 20，最大 100 |
| fields | string/array | 否 | 返回字段，逗号分隔或数组，默认 * |
| filters | array | 否 | 筛选条件 |

**请求示例**：

```
GET /client/content/list?project_prefix=demo&table_name=articles&page=1&per_page=10&fields=id,title,created_at
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "文章标题一",
        "created_at": "2025-01-15T10:30:00.000000Z"
      },
      {
        "id": 2,
        "title": "文章标题二",
        "created_at": "2025-01-15T09:20:00.000000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "total": 100,
      "per_page": 10,
      "last_page": 10
    }
  }
}
```

---

### 6.2 获取内容详情

**GET** `/client/content/detail`

**请求头**：需要认证

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_prefix | string | 是 | 项目前缀 |
| model_id | int | 否 | 模型 ID（与 table_name 二选一） |
| table_name | string | 否 | 表名（与 model_id 二选一） |
| id | int | 是 | 内容 ID |

**请求示例**：

```
GET /client/content/detail?project_prefix=demo&table_name=articles&id=1
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "文章标题一",
    "content": "文章内容...",
    "author": "作者",
    "category_id": 1,
    "status": "published",
    "created_at": "2025-01-15T10:30:00.000000Z",
    "updated_at": "2025-01-15T10:30:00.000000Z"
  }
}
```

---

### 6.3 获取单页内容

**GET** `/client/content/subject`

**请求头**：需要认证

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_prefix | string | 是 | 项目前缀 |
| table_name | string | 是 | 表名 |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "关于我们",
    "description": "单页描述",
    "table_name": "about_us",
    "subject_content": {
      "title": "关于我们",
      "content": "公司简介内容...",
      "contact": "联系方式..."
    }
  }
}
```

---

## 7. 模型接口

### 7.1 获取模型列表

**GET** `/client/molds`

**请求头**：需要认证

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_prefix | string | 是 | 项目前缀 |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content_list": [
      {
        "id": 1,
        "name": "文章",
        "description": "文章内容模型",
        "table_name": "articles",
        "mold_type": "list",
        "fields": [
          {"name": "title", "type": "string", "label": "标题"},
          {"name": "content", "type": "text", "label": "内容"},
          {"name": "author", "type": "string", "label": "作者"}
        ],
        "updated_at": "2025-01-15T10:30:00.000000Z"
      }
    ],
    "content_single": [
      {
        "id": 2,
        "name": "关于我们",
        "description": "关于我们单页",
        "table_name": "about_us",
        "mold_type": "single",
        "fields": [
          {"name": "title", "type": "string", "label": "标题"},
          {"name": "content", "type": "text", "label": "内容"}
        ],
        "updated_at": "2025-01-14T08:20:00.000000Z"
      }
    ]
  }
}
```

---

## 8. 云函数接口

### 8.1 获取 Web 函数列表

**GET** `/client/web_functions`

**请求头**：需要认证

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_prefix | string | 是 | 项目前缀 |
| keyword | string | 否 | 搜索关键词 |
| enabled | boolean | 否 | 启用状态筛选 |
| page | int | 否 | 页码，默认 1 |
| per_page | int | 否 | 每页数量，默认 20，最大 100 |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "获取文章列表",
        "slug": "get-articles",
        "enabled": true,
        "http_method": "GET",
        "remark": "公开接口，获取文章列表",
        "updated_at": "2025-01-15T10:30:00.000000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "total": 5,
      "per_page": 20,
      "last_page": 1
    }
  }
}
```

---

## 9. 定时任务接口

### 9.1 获取定时任务列表

**GET** `/client/crons`

**请求头**：需要认证

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_prefix | string | 是 | 项目前缀 |
| keyword | string | 否 | 搜索关键词 |
| enabled | boolean | 否 | 启用状态筛选 |
| page | int | 否 | 页码，默认 1 |
| per_page | int | 否 | 每页数量，默认 20，最大 100 |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "每日数据统计",
        "enabled": true,
        "schedule_type": "cron",
        "run_at": null,
        "cron_expr": "0 0 * * *",
        "timezone": "Asia/Shanghai",
        "function_id": 1,
        "remark": "每天凌晨执行数据统计",
        "next_run_at": "2025-01-16T00:00:00.000000Z",
        "updated_at": "2025-01-15T10:30:00.000000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "total": 3,
      "per_page": 20,
      "last_page": 1
    }
  }
}
```

**schedule_type 说明**：

| 类型 | 说明 |
|------|------|
| cron | Cron 表达式定时 |
| once | 一次性定时（使用 run_at） |

---

## 10. 接口调用示例

### 10.1 完整登录流程

```javascript
// 1. 登录
const loginRes = await request.post('/client/auth/login', {
  username: 'admin',
  password: 'password123'
})

// 2. 保存 Token
request.setToken(loginRes.token)
storage.set('token', loginRes.token)
storage.set('user', loginRes.user)

// 3. 获取项目列表
const projects = await request.get('/client/projects')
```

### 10.2 AI 会话流程

```javascript
// 1. 获取项目协作群
const { item: session } = await request.post('/client/ai/sessions/project-group', {
  project_id: 1
})

// 2. 发送消息
await request.post(`/client/ai/sessions/${session.id}/messages`, {
  content: '查看最新的10条文章',
  mentions: []
})

// 3. 轮询新消息
const pollRes = await request.get(`/client/ai/sessions/${session.id}/poll`, {
  last_id: 0
})

console.log(pollRes.messages)
```

### 10.3 内容浏览流程

```javascript
// 1. 获取模型列表
const molds = await request.get('/client/molds', {
  project_prefix: 'demo'
})

// 2. 获取内容列表
const contents = await request.get('/client/content/list', {
  project_prefix: 'demo',
  table_name: 'articles',
  page: 1,
  per_page: 20
})

// 3. 获取内容详情
const detail = await request.get('/client/content/detail', {
  project_prefix: 'demo',
  table_name: 'articles',
  id: 1
})
```
