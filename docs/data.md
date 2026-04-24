# Mosure Client 数据结构设计

## 1. 本地存储

推荐命名（改名后）：

| Key | 类型 | 说明 |
|---|---|---|
| `mosure_token` | string | 登录 Token |
| `mosure_client_type` | string | 客户端类型 |
| `mosure_client_session_key` | string | 客户端会话键 |
| `mosure_user` | object | 当前用户 |
| `mosure_server_url` | string | 当前服务器地址 |
| `mosure_server_history` | array | 服务器历史 |
| `mosure_current_project` | object | 当前项目 |
| `mosure_chat_draft` | object | 会话草稿 |
| `mosure_chat_session_context` | object | 会话上下文 |

## 2. 关键实体

```ts
interface User {
  id: number
  username: string
  email: string
  is_admin: boolean
  is_active: boolean
}

interface Project {
  id: number
  name: string
  prefix: string
  description: string
  template: string
  created_at: string
}

interface ServerHistoryItem {
  url: string
  username?: string
  lastUsed?: string
}
```

## 3. 状态结构（Pinia）

- `auth`: 登录态、用户信息、服务器配置
- `project`: 项目列表、当前项目
- `chat`: 会话列表、会话消息、轮询状态
- `content`: 模型列表、内容列表、详情与单页内容

