# Mosure Client 接口文档

## 1. 基础约定

- 基础路径：`{serverUrl}/client`
- 鉴权：`Authorization: Bearer {token}`
- 传输：JSON

## 2. 认证接口

- `POST /client/auth/login`
- `POST /client/auth/qr_login`
- `POST /client/auth/logout`
- `GET /client/me`

## 3. 项目接口

- `GET /client/projects`

## 4. AI 会话接口

- `GET /client/ai/agents`
- `GET /client/ai/sessions`
- `POST /client/ai/sessions/project-group`
- `POST /client/ai/agents/{type}/{identifier}/private-chat`
- `GET /client/ai/sessions/{id}/messages`
- `GET /client/ai/sessions/{id}/poll`
- `POST /client/ai/sessions/{id}/messages`
- `DELETE /client/ai/sessions/{id}`
- `DELETE /client/ai/sessions/{id}/messages`

## 5. 内容接口

- `GET /client/molds`
- `GET /client/content/list`
- `GET /client/content/detail`
- `GET /client/content/subject`

## 6. 监控接口

- `GET /client/web_functions`
- `GET /client/crons`

## 7. 知识库接口

分类：
- `GET /client/kb/categories/tree`
- `POST /client/kb/categories/create`
- `POST /client/kb/categories/update/{id}`
- `POST /client/kb/categories/delete/{id}`

文章：
- `GET /client/kb/articles/list`
- `GET /client/kb/articles/detail/{id}`
- `POST /client/kb/articles/create`
- `POST /client/kb/articles/update/{id}`
- `POST /client/kb/articles/delete/{id}`
- `POST /client/kb/articles/toggle/{id}`

上传：
- `POST /client/kb/upload-image`

## 8. 通用响应建议

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```
