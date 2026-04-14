# HCMS Client 功能模块设计

## 1. 登录模块

### 1.1 模块职责

- 服务器地址管理
- 用户身份认证
- Token 存储与刷新

### 1.2 状态管理

```javascript
// stores/auth.js
{
  // 当前服务器
  serverUrl: '',
  
  // 用户信息
  user: {
    id: null,
    username: '',
    email: '',
    is_admin: false
  },
  
  // 认证状态
  token: '',
  isLoggedIn: false,
  
  // 服务器历史
  serverHistory: []
}
```

### 1.3 核心方法

| 方法 | 说明 |
|------|------|
| `setServer(url)` | 设置当前服务器地址 |
| `login(username, password)` | 执行登录 |
| `logout()` | 退出登录 |
| `checkAuth()` | 检查登录状态 |
| `refreshToken()` | 刷新 Token |

### 1.4 服务器地址处理

```javascript
// 自动补全协议
function normalizeUrl(url) {
  url = url.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  // 移除末尾斜杠
  return url.replace(/\/+$/, '')
}
```

---

## 2. 项目模块

### 2.1 模块职责

- 获取项目列表
- 管理当前选中项目
- 处理前端插件跳转

### 2.2 状态管理

```javascript
// stores/project.js
{
  // 项目列表
  projects: [],
  
  // 当前项目
  currentProject: {
    id: null,
    name: '',
    prefix: '',
    description: '',
    template: '',      // 前端插件标识
    created_at: ''
  },
  
  // 加载状态
  loading: false,
  error: null
}
```

### 2.3 前端插件判断

```javascript
// 判断项目是否有前端插件
function hasFrontendPlugin(project) {
  // template 字段不为空表示配置了前端模板
  return !!project.template
}

// 获取前端页面 URL
function getFrontendUrl(project, serverUrl) {
  // 根据 template 类型构建跳转地址
  // 具体规则根据 HCMS11 前端插件配置确定
  return `${serverUrl}/web/${project.prefix}`
}
```

### 2.4 项目卡片组件

```vue
<!-- ProjectCard.vue -->
<template>
  <view class="project-card">
    <view class="header">
      <text class="name">{{ project.name }}</text>
      <view v-if="hasFrontend" class="frontend-btn" @click="openFrontend">
        前端
      </view>
    </view>
    <text class="description">{{ project.description }}</text>
    <text class="prefix">prefix: {{ project.prefix }}</text>
    <text class="time">{{ formatDate(project.created_at) }}</text>
    <view class="enter-btn" @click="enterProject">
      进入项目 →
    </view>
  </view>
</template>
```

---

## 3. AI 对话模块

### 3.1 模块职责

- 管理对话消息
- 处理 AI 任务状态轮询
- 支持任务重试/取消

### 3.2 状态管理

```javascript
// stores/chat.js
{
  // 当前对话消息
  messages: [
    {
      id: 'msg_1',
      type: 'user',       // user | ai | system
      content: '',
      timestamp: '',
      taskId: null        // AI 消息关联的任务 ID
    }
  ],
  
  // 当前任务
  currentTask: {
    id: null,
    status: '',           // pending | running | completed | failed | cancelled
    question: '',
    answer: '',
    steps: []
  },
  
  // 轮询控制
  polling: false,
  pollingTimer: null
}
```

### 3.3 任务状态流转

```
┌─────────┐     create      ┌─────────┐
│  idle   │ ───────────────→│ pending │
└─────────┘                 └────┬────┘
                                 │
                          queue process
                                 ↓
                           ┌─────────┐
                           │ running │
                           └────┬────┘
                                │
           ┌────────────────────┼────────────────────┐
           ↓                    ↓                    ↓
    ┌───────────┐       ┌────────────┐       ┌───────────┐
    │ completed │       │   failed   │       │ cancelled │
    └───────────┘       └────────────┘       └───────────┘
```

### 3.4 任务轮询策略

```javascript
// 轮询配置
const POLLING_CONFIG = {
  interval: 2000,        // 轮询间隔 2s
  maxAttempts: 150,      // 最大轮询次数 (5分钟)
  backoffMultiplier: 1.5 // 退避系数
}

// 轮询逻辑
async function pollTaskStatus(taskId) {
  let attempts = 0
  let interval = POLLING_CONFIG.interval
  
  while (attempts < POLLING_CONFIG.maxAttempts) {
    const task = await api.getTask(taskId)
    
    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return task
    }
    
    await sleep(interval)
    attempts++
    
    // 指数退避
    if (attempts > 10) {
      interval = Math.min(interval * POLLING_CONFIG.backoffMultiplier, 10000)
    }
  }
  
  throw new Error('Task polling timeout')
}
```

### 3.5 快捷指令

```javascript
const QUICK_COMMANDS = [
  { label: '查看最新内容', command: '查看最新 10 条内容' },
  { label: '模型统计', command: '项目有多少个内容模型？' },
  { label: '今日任务', command: '今天执行了哪些定时任务？' },
  { label: '云函数列表', command: '列出所有启用的云函数' }
]
```

---

## 4. 内容浏览模块

### 4.1 模块职责

- 获取模型列表
- 获取内容列表
- 获取内容详情
- 获取单页内容

### 4.2 状态管理

```javascript
// stores/content.js
{
  // 模型列表
  molds: {
    list: [],      // 列表型模型
    single: []     // 单页型模型
  },
  
  // 当前模型
  currentMold: null,
  
  // 内容列表
  contents: {
    items: [],
    meta: {
      current_page: 1,
      total: 0,
      per_page: 20,
      last_page: 1
    }
  },
  
  // 当前内容详情
  currentContent: null,
  
  // 加载状态
  loading: false
}
```

### 4.3 内容列表组件

```vue
<!-- ContentList.vue -->
<template>
  <view class="content-list">
    <!-- 模型选择器 -->
    <picker :range="moldOptions" @change="onMoldChange">
      <view class="mold-picker">{{ currentMold?.name || '选择模型' }}</view>
    </picker>
    
    <!-- 内容列表 -->
    <scroll-view scroll-y @scrolltolower="loadMore">
      <view v-for="item in contents" :key="item.id" class="content-item">
        <text class="title">{{ item.title || item.name || `ID: ${item.id}` }}</text>
        <text class="time">{{ item.updated_at }}</text>
      </view>
    </scroll-view>
    
    <!-- 加载更多 -->
    <view v-if="hasMore" class="load-more">加载中...</view>
  </view>
</template>
```

---

## 5. 系统监控模块

### 5.1 模块职责

- 获取云函数列表
- 获取定时任务列表
- 状态筛选

### 5.2 状态管理

```javascript
// stores/monitor.js
{
  // 云函数
  functions: {
    items: [],
    meta: {}
  },
  
  // 定时任务
  crons: {
    items: [],
    meta: {}
  },
  
  // 筛选条件
  filters: {
    keyword: '',
    enabled: null  // null: 全部, true: 启用, false: 禁用
  }
}
```

### 5.3 定时任务卡片

```vue
<!-- CronCard.vue -->
<template>
  <view class="cron-card" :class="{ disabled: !cron.enabled }">
    <view class="header">
      <text class="name">{{ cron.name }}</text>
      <text class="status">{{ cron.enabled ? '启用' : '禁用' }}</text>
    </view>
    <text class="schedule">
      {{ cron.schedule_type === 'cron' ? cron.cron_expr : cron.run_at }}
    </text>
    <text class="next-run" v-if="cron.next_run_at">
      下次执行: {{ formatDate(cron.next_run_at) }}
    </text>
    <text class="remark">{{ cron.remark }}</text>
  </view>
</template>
```

---

## 6. 通用组件

### 6.1 组件清单

| 组件 | 说明 |
|------|------|
| `HcNavbar` | 自定义导航栏 |
| `HcLoading` | 加载状态 |
| `HcEmpty` | 空状态 |
| `HcError` | 错误提示 |
| `HcCard` | 通用卡片 |
| `HcInput` | 输入框 |
| `HcButton` | 按钮 |
| `HcModal` | 弹窗 |
| `HcToast` | 轻提示 |

### 6.2 消息气泡组件

```vue
<!-- ChatBubble.vue -->
<template>
  <view class="chat-bubble" :class="[type]">
    <view class="avatar">
      <image :src="avatarSrc" />
    </view>
    <view class="content">
      <text class="text">{{ content }}</text>
      <!-- AI 任务状态 -->
      <view v-if="task" class="task-status">
        <text class="status">{{ taskStatusText }}</text>
        <view v-if="task.status === 'failed'" class="retry-btn">重试</view>
      </view>
    </view>
  </view>
</template>
```

---

## 7. 工具函数

### 7.1 请求封装

```javascript
// utils/request.js
class Request {
  constructor() {
    this.baseUrl = ''
    this.token = ''
  }
  
  setBaseUrl(url) {
    this.baseUrl = url
  }
  
  setToken(token) {
    this.token = token
  }
  
  async request(options) {
    const { url, method = 'GET', data, headers = {} } = options
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.baseUrl + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : '',
          ...headers
        },
        success: (res) => {
          if (res.statusCode === 401) {
            // Token 过期，跳转登录
            this.handleUnauthorized()
            reject(new Error('Unauthorized'))
            return
          }
          
          if (res.data.code === 200) {
            resolve(res.data.data)
          } else {
            reject(new Error(res.data.message || 'Request failed'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
  
  handleUnauthorized() {
    uni.reLaunch({ url: '/pages/login/login' })
  }
  
  get(url, params) {
    return this.request({ url, method: 'GET', data: params })
  }
  
  post(url, data) {
    return this.request({ url, method: 'POST', data })
  }
}

export default new Request()
```

### 7.2 存储封装

```javascript
// utils/storage.js
const STORAGE_KEYS = {
  TOKEN: 'hcms_token',
  USER: 'hcms_user',
  SERVER_URL: 'hcms_server_url',
  SERVER_HISTORY: 'hcms_server_history'
}

export const storage = {
  set(key, value) {
    uni.setStorageSync(key, JSON.stringify(value))
  },
  
  get(key, defaultValue = null) {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  remove(key) {
    uni.removeStorageSync(key)
  },
  
  clear() {
    Object.values(STORAGE_KEYS).forEach(key => {
      uni.removeStorageSync(key)
    })
  }
}

export { STORAGE_KEYS }
```

### 7.3 日期格式化

```javascript
// utils/date.js
export function formatDate(dateStr, format = 'YYYY-MM-DD HH:mm') {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

export function formatRelative(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  return formatDate(dateStr, 'YYYY-MM-DD')
}
```
