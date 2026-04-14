<template>
  <view class="chat-home">
    <AppHeader :placeholder="true">
      <template #left>
        <view class="topbar-back" @click="goBack"><text>‹</text></view>
      </template>
      <template #right>
        <view class="topbar-badge">
          <text>{{ sessions.length }}</text>
          <text class="badge-label">会话</text>
        </view>
      </template>
    </AppHeader>
    <view class="chat-shell">
      <view class="page-intro">
        <text class="topbar-label">Project Console</text>
        <text class="topbar-title">{{ projectName }}</text>
        <text class="topbar-subtitle">AI 协作工作台</text>
      </view>
      <view class="hero-panel">
        <view class="hero-copy">
          <text class="hero-title">默认发送到项目协作群，也可以直接进入已有会话。</text>
          <text class="hero-desc">保留原有消息流与路由逻辑，只重构工作台结构和触达效率。</text>
        </view>
        <textarea
          v-model="inputText"
          class="hero-input"
          name="groupMessage"
          maxlength="10000"
          confirm-type="send"
          placeholder="输入消息后直接发送到项目协作群"
        />
        <view class="hero-actions">
          <text class="hero-tip">发送目标：项目协作群</text>
          <view class="primary-btn" @click="handleSendToGroup">
            <text>{{ chatStore.state.sending ? '发送中...' : '发送消息' }}</text>
          </view>
        </view>
      </view>

      <view class="section-panel quick-panel">
        <view class="section-head">
          <text class="section-title">快捷入口</text>
          <text class="section-desc">常用协作场景一跳进入</text>
        </view>
        <view class="entry-grid">
          <view class="entry-item" @click="openProjectGroup">
            <text class="entry-kicker">Group</text>
            <text class="entry-title">项目协作群</text>
            <text class="entry-desc">多人 Agent 协同回复的默认场景</text>
          </view>
          <view class="entry-item" @click="openSecretary">
            <text class="entry-kicker">Assistant</text>
            <text class="entry-title">问秘书</text>
            <text class="entry-desc">泛问题、任务拆解和协调请求</text>
          </view>
        </view>
      </view>

      <view class="section-panel">
        <view class="section-head">
          <text class="section-title">项目工具</text>
          <text class="section-desc">内容和运行能力的辅助入口</text>
        </view>
        <view class="tool-grid">
          <view class="tool-item" @click="goMolds">
            <text class="tool-title">内容模型</text>
            <text class="tool-desc">查看当前项目的内容模型定义</text>
          </view>
          <view class="tool-item" @click="goFunctions">
            <text class="tool-title">云函数</text>
            <text class="tool-desc">查看项目可用的云函数接口</text>
          </view>
          <view class="tool-item" @click="goCrons">
            <text class="tool-title">定时任务</text>
            <text class="tool-desc">查看项目定时任务执行配置</text>
          </view>
        </view>
      </view>

      <view class="section-panel">
        <view class="section-head">
          <text class="section-title">成员</text>
          <text class="section-desc">点击可直接发起私聊</text>
        </view>
        <scroll-view scroll-x class="members-scroll" :show-scrollbar="false">
          <view class="members-row">
            <view v-for="agent in agents" :key="agent.id" class="member-chip" @click="openPrivate(agent)">
              <view class="member-avatar">
                <text>{{ agent.name.slice(0, 1) }}</text>
              </view>
              <text class="member-name">{{ agent.name }}</text>
              <text class="member-type">{{ agent.type }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="section-panel">
        <view class="section-head">
          <text class="section-title">最近会话</text>
          <text class="section-desc">按最新消息排序</text>
        </view>
        <view v-if="sessions.length" class="session-list">
          <view v-for="session in sessions" :key="session.id" class="session-item" @click="goSession(session.id)">
            <view class="session-main">
              <view class="session-title-row">
                <text class="session-title">{{ session.title }}</text>
                <view v-if="session.unread_count > 0" class="session-unread-badge">
                  <text>{{ formatUnread(session.unread_count) }}</text>
                </view>
              </view>
              <text class="session-preview">{{ session.last_message_preview || '暂无消息' }}</text>
            </view>
            <view class="session-meta">
              <text class="session-type">{{ session.session_type === 'group' ? '群聊' : '私聊' }}</text>
              <text class="session-time">{{ formatTime(session.last_message_at) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-block">
          <text class="empty-title">当前项目还没有会话</text>
          <text class="empty-desc">从上方入口发起第一条对话</text>
        </view>
      </view>

      <view class="bottom-safe"></view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useChat } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import AppHeader from '@/components/AppHeader.vue'

const chatStore = useChat()
const projectStore = useProjectStore()

const inputText = ref('')
const projectId = ref(0)
const projectName = ref('')

const agents = computed(() => chatStore.state.agents)
const sessions = computed(() =>
  chatStore.state.sessions.filter(item => Number(item.project_id) === Number(projectId.value))
)

onMounted(async () => {
  const pages = getCurrentPages()
  const options = pages[pages.length - 1]?.options || {}
  projectStore.init()
  const currentProject = projectStore.state.currentProject

  projectId.value = Number(options.projectId || currentProject?.id || 0)
  projectName.value = decodeURIComponent(options.projectName || currentProject?.name || '项目 AI')

  if (!projectId.value && currentProject?.id) {
    projectId.value = currentProject.id
  }

  if (currentProject?.id) {
    chatStore.setProjectContext(currentProject)
  }

  await Promise.all([
    chatStore.loadAgents(projectId.value),
    chatStore.loadSessions(projectId.value)
  ])
})

const goSession = (sessionId) => {
  storage.set(STORAGE_KEYS.CHAT_SESSION_CONTEXT, {
    projectId: Number(projectId.value || 0),
    sessionId: Number(sessionId || 0),
    savedAt: Date.now(),
  })
  uni.navigateTo({
    url: `/pages/chat/session?projectId=${projectId.value}&sessionId=${sessionId}`
  })
}

const openProjectGroup = async () => {
  const session = await chatStore.ensureProjectGroupSession(projectId.value)
  goSession(session.id)
}

const openSecretary = async () => {
  const secretary = agents.value.find(item => item.type === 'secretary')
  if (!secretary) {
    uni.showToast({ title: '秘书未配置', icon: 'none' })
    return
  }
  const session = await chatStore.ensurePrivateSession(projectId.value, secretary)
  goSession(session.id)
}

const openPrivate = async (agent) => {
  const session = await chatStore.ensurePrivateSession(projectId.value, agent)
  goSession(session.id)
}

const handleSendToGroup = async () => {
  if (!inputText.value.trim()) {
    return
  }
  const session = await chatStore.sendToProjectGroup(projectId.value, inputText.value)
  inputText.value = ''
  goSession(session.id)
}

const goBack = () => {
  uni.navigateBack()
}

const formatTime = (value) => {
  if (!value) return ''
  return String(value).slice(5, 16).replace('T', ' ')
}

const formatUnread = (count) => {
  return count > 99 ? '99+' : String(count)
}

const goMolds = () => {
  uni.navigateTo({
    url: `/pages/content/molds?projectPrefix=${encodeURIComponent(currentProjectPrefix())}&projectName=${encodeURIComponent(projectName.value)}`
  })
}

const goFunctions = () => {
  uni.navigateTo({
    url: `/pages/monitor/functions?projectPrefix=${encodeURIComponent(currentProjectPrefix())}&projectName=${encodeURIComponent(projectName.value)}`
  })
}

const goCrons = () => {
  uni.navigateTo({
    url: `/pages/monitor/crons?projectPrefix=${encodeURIComponent(currentProjectPrefix())}&projectName=${encodeURIComponent(projectName.value)}`
  })
}

const currentProjectPrefix = () => {
  return projectStore.state.currentProject?.prefix || ''
}
</script>

<style lang="scss" scoped>
.chat-home {
  min-height: 100vh;
}

.chat-shell {
  padding-top: 24rpx;
  padding-right: var(--page-gutter);
  padding-bottom: 0;
  padding-left: var(--page-gutter);
}

.page-intro {
  margin-bottom: 18rpx;
}

.hero-panel,
.section-panel {
  background: var(--surface-1);
  backdrop-filter: blur(18px);
  border: 1rpx solid var(--line-soft);
  box-shadow: var(--shadow-soft);
  border-radius: 30rpx;
  margin-bottom: 22rpx;
}

.topbar-back {
  width: 84rpx;
  height: 84rpx;
  border-radius: 24rpx;
  background: rgba(16, 32, 51, 0.05);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
}

.topbar-main {
  flex: 1;
  min-width: 0;
  padding-top: 6rpx;
}

.topbar-label,
.topbar-subtitle,
.hero-desc,
.hero-tip,
.section-desc,
.entry-desc,
.tool-desc,
.member-type,
.session-preview,
.session-time,
.session-type,
.empty-desc {
  color: var(--text-secondary);
}

.topbar-label,
.entry-kicker {
  display: block;
  font-size: 20rpx;
  letter-spacing: 2rpx;
  text-transform: uppercase;
}

.topbar-title,
.hero-title,
.section-title,
.entry-title,
.tool-title,
.member-name,
.session-title,
.empty-title {
  color: var(--text-main);
  font-weight: 700;
}

.topbar-title {
  display: block;
  font-size: 34rpx;
}

.topbar-subtitle {
  display: block;
  margin-top: 4rpx;
  font-size: 23rpx;
}

.topbar-badge {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.topbar-badge text {
  font-size: 28rpx;
  font-weight: 700;
}

.topbar-badge .badge-label {
  font-size: 18rpx;
  opacity: 0.76;
}

.hero-panel,
.section-panel {
  padding: var(--panel-padding);
}

.hero-panel {
  background:
    radial-gradient(circle at top right, rgba(15, 118, 110, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(243, 248, 250, 0.98));
}

.hero-title {
  display: block;
  font-size: 38rpx;
  line-height: 1.25;
}

.hero-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
}

.hero-input {
  width: 100%;
  min-height: 180rpx;
  margin: 24rpx 0 18rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.88);
  font-size: 28rpx;
  color: var(--text-main);
  box-sizing: border-box;
}

.hero-actions,
.session-item,
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-actions > view + view,
.section-head > view + view,
.session-item > view + view {
  margin-left: 18rpx;
}

.hero-tip,
.section-desc,
.session-preview,
.session-time,
.session-type,
.empty-desc {
  font-size: 24rpx;
}

.primary-btn {
  min-width: 208rpx;
  height: 78rpx;
  padding: 0 28rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  box-shadow: 0 14rpx 28rpx rgba(15, 118, 110, 0.18);
  font-size: 26rpx;
  font-weight: 700;
}

.section-head {
  margin-bottom: 18rpx;
}

.section-title {
  font-size: 30rpx;
}

.entry-grid,
.tool-grid,
.session-list {
  display: flex;
  flex-wrap: wrap;
  margin-left: -16rpx;
  margin-top: -16rpx;
}

.entry-grid > view,
.tool-grid > view,
.session-list > view {
  margin-left: 16rpx;
  margin-top: 16rpx;
}

.entry-grid > view,
.tool-grid > view {
  width: calc((100% - 32rpx) / 2);
}

.session-list > view {
  width: calc(100% - 16rpx);
}

.entry-item,
.tool-item,
.member-chip,
.session-item {
  background: rgba(16, 32, 51, 0.04);
  border-radius: 24rpx;
}

.entry-item,
.tool-item {
  padding: 24rpx;
}

.entry-title,
.tool-title,
.member-name {
  display: block;
  font-size: 28rpx;
}

.entry-desc,
.tool-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 1.55;
}

.members-scroll {
  white-space: nowrap;
}

.members-row {
  display: flex;
  padding-bottom: 6rpx;
}

.members-row > view + view {
  margin-left: 16rpx;
}

.member-chip {
  width: 190rpx;
  padding: 22rpx;
}

.member-avatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #1d4ed8, #60a5fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 14rpx;
}

.member-name {
  font-size: 26rpx;
}

.member-type {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
}

.session-item {
  padding: 22rpx;
}

.session-main {
  flex: 1;
  min-width: 0;
}

.session-title-row {
  display: flex;
  align-items: center;
  margin-left: -12rpx;
}

.session-title-row > view,
.session-title-row > text {
  margin-left: 12rpx;
}

.session-title {
  font-size: 28rpx;
}

.session-preview {
  display: block;
  margin-top: 8rpx;
  line-height: 1.5;
}

.session-meta {
  text-align: right;
  flex-shrink: 0;
}

.session-unread-badge {
  min-width: 38rpx;
  height: 38rpx;
  border-radius: 999rpx;
  padding: 0 10rpx;
  background: #fff;
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
}

.empty-block {
  padding: 40rpx 12rpx 12rpx;
  text-align: center;
}

.empty-title {
  display: block;
  font-size: 28rpx;
}

.empty-desc {
  display: block;
  margin-top: 10rpx;
}

.bottom-safe {
  height: calc(36rpx + var(--safe-bottom));
}
</style>
