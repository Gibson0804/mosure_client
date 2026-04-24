# Mosure Client 页面设计与路由

## 1. 页面清单（与当前 `pages.json` 对齐）

```text
pages/
├── login/login.vue
├── index/index.vue
├── chat/index.vue
├── chat/session.vue
├── content/molds.vue
├── content/list.vue
├── content/detail.vue
├── content/subject.vue
├── monitor/functions.vue
├── monitor/crons.vue
├── user/index.vue
├── user/servers.vue
├── webview/webview.vue
├── kb/index.vue
├── kb/editor.vue
└── kb/detail.vue
```

## 2. TabBar 结构

- 项目：`pages/index/index`
- 知识库：`pages/kb/index`
- 我的：`pages/user/index`

## 3. 关键页面职责

- 登录页：账号登录、扫码登录、服务器历史快速填充
- 项目页：项目检索、未读统计、进入 AI 或前端页面
- 会话页：会话切换、消息展示、消息发送与轮询
- 内容页：按模型查看内容列表/详情/单页内容
- 监控页：云函数和定时任务列表
- 知识库：分类、文章列表、编辑器、详情

## 4. 典型跳转

- `login -> index`
- `index -> chat/index`
- `chat/index -> chat/session`
- `chat/index -> content/molds`
- `content/molds -> content/list | content/subject`
- `content/list -> content/detail`
- `index -> webview/webview`（前端页面）
- `tab -> kb/index -> kb/editor | kb/detail`

## 5. 全局展示文案

项目改名后，导航栏与默认标题统一为 `Mosure`。
