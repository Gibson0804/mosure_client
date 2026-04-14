# HCMS Client 数据结构设计

## 1. 本地存储结构

### 1.1 存储 Key 定义

| Key | 类型 | 说明 | 过期策略 |
|-----|------|------|----------|
| `hcms_token` | string | 认证 Token | 登出时清除 |
| `hcms_user` | object | 用户信息 | 登出时清除 |
| `hcms_server_url` | string | 当前服务器地址 | 永久保存 |
| `hcms_server_history` | array | 服务器历史记录 | 永久保存，最多 10 条 |
| `hcms_current_project` | object | 当前选中项目 | 切换项目时更新 |
| `hcms_chat_draft` | object | 聊天草稿 | 发送后清除 |

### 1.2 数据结构详情

#### Token 存储

```typescript
// hcms_token
type Token = string

// 示例
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

#### 用户信息存储

```typescript
// hcms_user
interface User {
  id: number
  username: string
  email: string
  is_admin: boolean
  is_active: boolean
}

// 示例
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "is_admin": true,
  "is_active": true
}
```

#### 服务器历史记录

```typescript
// hcms_server_history
interface ServerHistoryItem {
  url: string
  name: string        // 可选，用户自定义名称
  lastUsed: string    // ISO 时间字符串
  username: string    // 上次登录的用户名
}

type ServerHistory = ServerHistoryItem[]

// 示例
[
  {
    "url": "https://hcms.example.com",
    "name": "生产环境",
    "lastUsed": "2025-01-15T10:30:00.000Z",
    "username": "admin"
  },
  {
    "url": "https://test.hcms.example.com",
    "name": "测试环境",
    "lastUsed": "2025-01-14T08:20:00.000Z",
    "username": "test"
  }
]
```

#### 当前项目存储

```typescript
// hcms_current_project
interface CurrentProject {
  id: number
  name: string
  prefix: string
  description: string
  template: string
}

// 示例
{
  "id": 1,
  "name": "示例项目",
  "prefix": "demo_project",
  "description": "这是一个示例项目",
  "template": "default"
}
```

#### 聊天草稿存储

```typescript
// hcms_chat_draft
interface ChatDraft {
  projectPrefix: string
  content: string
  savedAt: string
}

// 示例
{
  "projectPrefix": "demo_project",
  "content": "查看最新的",
  "savedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## 2. 状态管理结构

### 2.1 Auth Store

```typescript
// stores/auth.ts
interface AuthState {
  // 服务器配置
  serverUrl: string
  serverHistory: ServerHistoryItem[]
  
  // 认证状态
  token: string
  isLoggedIn: boolean
  
  // 用户信息
  user: User | null
  
  // 加载状态
  loading: boolean
  error: string | null
}

interface AuthActions {
  // 服务器管理
  setServerUrl(url: string): void
  addServerHistory(item: ServerHistoryItem): void
  removeServerHistory(url: string): void
  
  // 认证操作
  login(username: string, password: string): Promise<void>
  logout(): Promise<void>
  checkAuth(): Promise<boolean>
  
  // 初始化
  init(): Promise<void>
}
```

### 2.2 Project Store

```typescript
// stores/project.ts
interface ProjectState {
  // 项目列表
  projects: Project[]
  
  // 当前项目
  currentProject: Project | null
  
  // 加载状态
  loading: boolean
  error: string | null
  lastFetched: string | null
}

interface Project {
  id: number
  name: string
  prefix: string
  description: string
  template: string
  created_at: string
}

interface ProjectActions {
  fetchProjects(): Promise<void>
  setCurrentProject(project: Project): void
  clearCurrentProject(): void
  searchProjects(keyword: string): Project[]
}
```

### 2.3 Chat Store

```typescript
// stores/chat.ts
interface ChatState {
  // 消息列表
  messages: Message[]
  
  // 当前任务
  currentTask: Task | null
  
  // 轮询状态
  isPolling: boolean
  
  // 快捷指令
  quickCommands: QuickCommand[]
  
  // 输入草稿
  inputDraft: string
}

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: string
  taskId?: number
  taskStatus?: TaskStatus
}

interface Task {
  id: number
  question: string
  status: TaskStatus
  answer: string | null
  error: string | null
  steps: TaskStep[]
  currentStep: number
  stepCount: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

interface TaskStep {
  index: number
  name: string
  status: TaskStatus
  output: string | null
  error: string | null
  startedAt: string | null
  completedAt: string | null
}

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

interface QuickCommand {
  id: string
  label: string
  command: string
  icon: string
}

interface ChatActions {
  setProjectContext(project: Project): void
  loadAgents(projectId: number): Promise<Agent[]>
  loadSessions(projectId: number): Promise<Session[]>
  ensureProjectGroupSession(projectId: number): Promise<Session>
  ensurePrivateSession(projectId: number, agent: Agent): Promise<Session>
  openSession(sessionId: number): Promise<void>
  loadMessages(sessionId: number, lastId?: number, limit?: number): Promise<Message[]>
  loadMoreMessages(sessionId: number, limit?: number): Promise<Message[]>
  pollMessages(sessionId: number): Promise<Message[]>
  stopPolling(): void
  sendMessage(sessionId: number, content: string, mentions?: Mention[]): Promise<void>
  sendToProjectGroup(projectId: number, content: string): Promise<Session>
  deleteSession(sessionId: number): Promise<void>
  clearSession(sessionId: number): Promise<void>
  saveDraft(sessionId: number, content: string): void
  getDraft(sessionId: number): string
}
```

### 2.4 Content Store

```typescript
// stores/content.ts
interface ContentState {
  // 模型
  molds: {
    list: Mold[]
    single: Mold[]
  }
  currentMold: Mold | null
  
  // 内容列表
  contents: {
    items: ContentItem[]
    meta: PaginationMeta
  }
  
  // 内容详情
  currentContent: ContentItem | null
  
  // 加载状态
  loading: boolean
  error: string | null
}

interface Mold {
  id: number
  name: string
  description: string
  table_name: string
  mold_type: 'list' | 'single'
  fields: MoldField[]
  updated_at: string
}

interface MoldField {
  name: string
  type: string
  label: string
  required?: boolean
  options?: any
}

interface ContentItem {
  id: number
  [key: string]: any
}

interface PaginationMeta {
  current_page: number
  total: number
  per_page: number
  last_page: number
}

interface ContentActions {
  // 模型操作
  fetchMolds(projectPrefix: string): Promise<void>
  setCurrentMold(mold: Mold): void
  
  // 内容操作
  fetchContents(params: FetchContentsParams): Promise<void>
  fetchContentDetail(params: FetchContentDetailParams): Promise<void>
  fetchSubject(projectPrefix: string, tableName: string): Promise<void>
  
  // 分页
  loadMoreContents(): Promise<void>
  
  // 清理
  clearContents(): void
  clearCurrentContent(): void
}

interface FetchContentsParams {
  projectPrefix: string
  tableName?: string
  moldId?: number
  page?: number
  perPage?: number
  fields?: string[]
  filters?: Record<string, any>
}

interface FetchContentDetailParams {
  projectPrefix: string
  tableName?: string
  moldId?: number
  id: number
}
```

### 2.5 Monitor Store

```typescript
// stores/monitor.ts
interface MonitorState {
  // 云函数
  functions: {
    items: WebFunction[]
    meta: PaginationMeta
  }
  
  // 定时任务
  crons: {
    items: CronJob[]
    meta: PaginationMeta
  }
  
  // 筛选条件
  filters: MonitorFilters
  
  // 加载状态
  loading: boolean
  error: string | null
}

interface WebFunction {
  id: number
  name: string
  slug: string
  enabled: boolean
  http_method: string
  remark: string
  updated_at: string
}

interface CronJob {
  id: number
  name: string
  enabled: boolean
  schedule_type: 'cron' | 'once'
  run_at: string | null
  cron_expr: string | null
  timezone: string
  function_id: number
  remark: string
  next_run_at: string | null
  updated_at: string
}

interface MonitorFilters {
  keyword: string
  enabled: boolean | null
}

interface MonitorActions {
  // 云函数
  fetchFunctions(projectPrefix: string, page?: number): Promise<void>
  
  // 定时任务
  fetchCrons(projectPrefix: string, page?: number): Promise<void>
  
  // 筛选
  setFilters(filters: Partial<MonitorFilters>): void
  clearFilters(): void
  
  // 分页
  loadMoreFunctions(): Promise<void>
  loadMoreCrons(): Promise<void>
}
```

---

## 3. API 响应数据结构

### 3.1 通用响应结构

```typescript
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}
```

### 3.2 登录响应

```typescript
interface LoginResponse {
  token: string
  user: User
}
```

### 3.3 项目列表响应

```typescript
type ProjectsResponse = Project[]
```

### 3.4 AI 任务响应

```typescript
interface CreateTaskResponse {
  task_id: number
}

interface TaskResponse {
  id: number
  question: string
  status: TaskStatus
  answer: string | null
  error: string | null
  step_count: number
  current_step: number
  created_at: string
  started_at: string | null
  completed_at: string | null
}

interface TaskStepsResponse {
  index: number
  name: string
  status: TaskStatus
  output: string | null
  error: string | null
  started_at: string | null
  completed_at: string | null
}[]
```

### 3.5 模型列表响应

```typescript
interface MoldsResponse {
  content_list: Mold[]
  content_single: Mold[]
}
```

---

## 4. 工具类型定义

### 4.1 请求配置

```typescript
interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
}

interface RequestError {
  code: number
  message: string
  originalError?: any
}
```

### 4.2 页面参数

```typescript
// 项目详情页参数
interface ProjectDetailParams {
  projectId: number
  projectName: string
  projectPrefix: string
}

// Chat 页面参数
interface ChatPageParams {
  projectId: number
  projectName: string
  projectPrefix: string
}

// 内容列表页参数
interface ContentListParams {
  projectPrefix: string
  moldId: number
  tableName: string
  moldName: string
}

// 内容详情页参数
interface ContentDetailParams {
  projectPrefix: string
  tableName: string
  contentId: number
}
```

### 4.3 事件类型

```typescript
// 全局事件
type GlobalEvents = {
  'auth:logout': void
  'auth:tokenExpired': void
  'project:changed': Project
  'chat:newMessage': Message
  'task:statusChanged': { taskId: number; status: TaskStatus }
}

// 事件发射器类型
interface EventEmitter {
  on<K extends keyof GlobalEvents>(event: K, callback: (data: GlobalEvents[K]) => void): void
  off<K extends keyof GlobalEvents>(event: K, callback: (data: GlobalEvents[K]) => void): void
  emit<K extends keyof GlobalEvents>(event: K, data: GlobalEvents[K]): void
}
```

---

## 5. 常量定义

### 5.1 任务状态

```typescript
const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const

const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '执行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  pending: '#FF9500',
  running: '#007AFF',
  completed: '#34C759',
  failed: '#FF3B30',
  cancelled: '#8E8E93'
}
```

### 5.2 模型类型

```typescript
const MOLD_TYPE = {
  LIST: 'list',
  SINGLE: 'single'
} as const

const MOLD_TYPE_TEXT: Record<string, string> = {
  list: '列表模型',
  single: '单页模型'
}
```

### 5.3 HTTP 方法

```typescript
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const

const HTTP_METHOD_COLOR: Record<string, string> = {
  GET: '#34C759',
  POST: '#007AFF',
  PUT: '#FF9500',
  DELETE: '#FF3B30',
  PATCH: '#AF52DE'
}
```

### 5.4 快捷指令预设

```typescript
const DEFAULT_QUICK_COMMANDS: QuickCommand[] = [
  {
    id: 'latest-content',
    label: '最新内容',
    command: '查看最新 10 条内容',
    icon: 'document'
  },
  {
    id: 'model-stats',
    label: '模型统计',
    command: '项目有多少个内容模型？',
    icon: 'stats'
  },
  {
    id: 'today-tasks',
    label: '今日任务',
    command: '今天执行了哪些定时任务？',
    icon: 'clock'
  },
  {
    id: 'function-list',
    label: '云函数',
    command: '列出所有启用的云函数',
    icon: 'code'
  }
]
```

---

## 6. 数据验证规则

### 6.1 登录表单验证

```typescript
const LOGIN_VALIDATION = {
  serverUrl: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: '请输入有效的服务器地址'
  },
  username: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: '用户名长度 2-50 个字符'
  },
  password: {
    required: true,
    minLength: 6,
    message: '密码至少 6 个字符'
  }
}
```

### 6.2 AI 查询验证

```typescript
const AI_QUERY_VALIDATION = {
  question: {
    required: true,
    maxLength: 2000,
    message: '问题不能为空，最多 2000 个字符'
  }
}
```

---

## 7. 缓存策略

### 7.1 数据缓存时间

| 数据类型 | 缓存时间 | 刷新策略 |
|----------|----------|----------|
| 项目列表 | 5 分钟 | 下拉刷新、切换服务器 |
| 模型列表 | 10 分钟 | 切换项目时刷新 |
| 内容列表 | 不缓存 | 每次进入页面重新获取 |
| 任务列表 | 不缓存 | 实时轮询 |
| 用户信息 | 会话期间 | 登录时获取 |

### 7.2 缓存清理时机

```typescript
// 需要清理缓存的场景
const CACHE_CLEAR_SCENARIOS = {
  // 退出登录：清理所有缓存
  logout: ['token', 'user', 'currentProject', 'chatDraft'],
  
  // 切换服务器：清理项目相关缓存
  switchServer: ['currentProject', 'chatDraft'],
  
  // 切换项目：清理内容相关缓存
  switchProject: ['chatDraft']
}
```
