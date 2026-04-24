# Mosure Client 功能模块设计

## 1. 认证模块（`stores/auth.js`）

职责：
- 登录/退出/登录态检查
- 服务器地址规范化与切换
- 服务器历史记录管理

关键状态：
- `serverUrl`
- `serverHistory`
- `token`
- `user`
- `isLoggedIn`

## 2. 项目模块（`stores/project.js`）

职责：
- 拉取项目列表
- 维护当前项目上下文
- 提供项目搜索与展示辅助数据

关键状态：
- `projects`
- `currentProject`
- `loading` / `error`

## 3. AI 会话模块（`stores/chat.js`）

职责：
- 获取 AI 成员、会话与消息
- 发送消息、增量轮询
- 会话删除与清空

关键状态：
- `sessions`
- `messages`
- `activeSessionId`
- `isPolling`

## 4. 内容模块（`stores/content.js`）

职责：
- 获取模型（列表型/单页型）
- 获取内容列表与详情
- 获取单页内容

关键状态：
- `molds`
- `contentList`
- `contentDetail`
- `subjectContent`

## 5. 监控模块（页面级）

职责：
- 展示云函数列表
- 展示定时任务列表
- 按条件筛选

主要页面：
- `pages/monitor/functions.vue`
- `pages/monitor/crons.vue`

## 6. 知识库模块（页面 + API）

职责：
- 分类树管理
- 文章 CRUD
- 文章状态切换
- 图片上传

主要页面：
- `pages/kb/index.vue`
- `pages/kb/editor.vue`
- `pages/kb/detail.vue`

## 7. 公共基础设施

- `utils/request.js`：请求封装、鉴权头、401 处理
- `utils/storage.js`：统一存储读写
- `utils/date.js`：时间格式化
- `api/index.js`：接口统一出口

## 8. 命名规范（改名后）

品牌命名统一：
- 文案：`Mosure`
- 存储前缀建议：`mosure_*`

示例：

```js
const STORAGE_KEYS = {
  TOKEN: 'mosure_token',
  USER: 'mosure_user',
  SERVER_URL: 'mosure_server_url',
  SERVER_HISTORY: 'mosure_server_history'
}
```
