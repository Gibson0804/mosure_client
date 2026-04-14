<template>
  <view class="session-page">
    <AppHeader :placeholder="true" bordered>
      <template #left>
        <view class="back-btn" @click="goBack"><text>←</text></view>
      </template>
      <template #right>
        <view class="more-btn" @click="showActions = true"><text>⋯</text></view>
      </template>
      <view class="session-info">
        <text class="session-title">{{ sessionTitle }}</text>
        <text class="session-subtitle">{{ sessionTypeLabel }}</text>
      </view>
    </AppHeader>

    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollIntoView" scroll-with-animation @scrolltoupper="loadMore">
      <view v-if="chatStore.state.loadingMore" class="list-tip"><text>加载更多消息中...</text></view>
      <view v-for="message in messages" :key="message.id" class="message-row" :class="message.sender_type">
        <view class="message-bubble">
          <text v-if="message.sender_type !== 'user'" class="sender-name">{{ message.sender_name }}</text>
          <text class="message-content">{{ message.content }}</text>
          <view v-if="message.mentions.length" class="mention-row">
            <text v-for="mention in message.mentions" :key="mention.identifier || mention.id" class="mention-tag">
              @{{ mention.name || mention.identifier }}
            </text>
          </view>
        </view>
      </view>
      <view id="message-bottom" class="bottom-space"></view>
    </scroll-view>

    <view class="composer">
      <view v-if="sessionTypeLabel === '群聊'" class="mention-trigger" @click="showMembers = true">
        <text>@成员</text>
      </view>
      <textarea
        v-model="draft"
        class="composer-input"
        maxlength="10000"
        :placeholder="sessionTypeLabel === '群聊' ? '输入消息，使用 @ 提及成员' : '输入消息'"
      />
      <view class="send-btn" @click="handleSend"><text>{{ chatStore.state.sending ? '发送中' : '发送' }}</text></view>
    </view>

    <view v-if="showMembers" class="mask" @click="showMembers = false">
      <view class="sheet" @click.stop>
        <text class="sheet-title">成员列表</text>
        <view v-for="agent in agents" :key="agent.id" class="sheet-item" @click="mentionAgent(agent)">
          <text>{{ agent.name }}</text>
          <text class="sheet-meta">{{ agent.type }}</text>
        </view>
      </view>
    </view>

    <view v-if="showActions" class="mask" @click="showActions = false">
      <view class="sheet" @click.stop>
        <text class="sheet-title">会话操作</text>
        <view class="sheet-item" @click="clearMessages"><text>清空会话</text></view>
        <view class="sheet-item danger" @click="deleteSession"><text>删除会话</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useChat } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import AppHeader from '@/components/AppHeader.vue'

const chatStore = useChat()
const projectStore = useProjectStore()
const draft = ref('')
const projectId = ref(0)
const sessionId = ref(0)
const showMembers = ref(false)
const showActions = ref(false)
const selectedMentions = ref([])
const scrollIntoView = ref('')

const messages = computed(() => chatStore.state.messages)
const agents = computed(() => chatStore.state.agents)
const session = computed(() => chatStore.state.currentSession || {})
const sessionTitle = computed(() => session.value.title || '会话')
const sessionTypeLabel = computed(() => session.value.session_type === 'group' ? '群聊' : '私聊')

const readPageNumberParam = (options, camelKey, fallback = 0) => {
  const direct = options?.[camelKey]
  if (direct !== undefined && direct !== null && direct !== '') {
    return Number(direct || 0)
  }

  const lowerKey = camelKey.toLowerCase()
  const lowerValue = options?.[lowerKey]
  if (lowerValue !== undefined && lowerValue !== null && lowerValue !== '') {
    return Number(lowerValue || 0)
  }

  return Number(fallback || 0)
}

const initPage = async (options = {}) => {
  const cachedContext = storage.get(STORAGE_KEYS.CHAT_SESSION_CONTEXT, null)
  projectId.value = readPageNumberParam(options, 'projectId', cachedContext?.projectId || projectId.value)
  sessionId.value = readPageNumberParam(options, 'sessionId', cachedContext?.sessionId || sessionId.value)

  if (!projectId.value || !sessionId.value) {
    uni.showToast({
      title: '会话参数丢失，请重新进入',
      icon: 'none',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 400)
    return
  }

  projectStore.init()

  if (projectId.value) {
    let currentProject = projectStore.state.currentProject

    if (Number(currentProject?.id || 0) !== projectId.value) {
      currentProject =
        projectStore.state.projects.find(item => Number(item.id) === projectId.value) ||
        chatStore.state.sessions.find(item => Number(item.project_id) === projectId.value)

      if (currentProject?.project_id) {
        currentProject = null
      }

      if (!currentProject) {
        const projects = await projectStore.fetchProjects().catch(() => [])
        currentProject = (projects || []).find(item => Number(item.id) === projectId.value) || null
      }

      if (currentProject) {
        projectStore.setCurrentProject(currentProject)
        chatStore.setProjectContext(currentProject)
      }
    } else if (currentProject) {
      chatStore.setProjectContext(currentProject)
    }
  }

  if (projectId.value) {
    await chatStore.loadAgents(projectId.value)
    await chatStore.loadSessions(projectId.value)
  }

  if (sessionId.value) {
    try {
      await chatStore.openSession(sessionId.value)
      draft.value = chatStore.getDraft(sessionId.value)
      storage.set(STORAGE_KEYS.CHAT_SESSION_CONTEXT, {
        projectId: Number(projectId.value || 0),
        sessionId: Number(sessionId.value || 0),
        savedAt: Date.now(),
      })
      scrollToBottom()
    } catch (error) {
      uni.showToast({
        title: error.message || '会话不存在',
        icon: 'none',
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 400)
    }
  }
}

onLoad(async (options) => {
  await initPage(options || {})
})

onUnmounted(() => {
  chatStore.leaveSession(sessionId.value, draft.value)
})

watch(draft, (value) => {
  if (sessionId.value) {
    chatStore.saveDraft(sessionId.value, value)
  }
})

watch(
  () => messages.value.length,
  (current, previous) => {
    if (current > previous) {
      scrollToBottom()
    }
  }
)

const mentionAgent = (agent) => {
  if (!selectedMentions.value.find(item => item.id === agent.id)) {
    selectedMentions.value.push({
      id: agent.id,
      type: agent.type,
      identifier: agent.identifier,
      name: agent.name
    })
    draft.value = `${draft.value}${draft.value ? ' ' : ''}@${agent.name} `
  }
  showMembers.value = false
}

const handleSend = async () => {
  if (!draft.value.trim()) {
    return
  }
  const activeSessionId = Number(sessionId.value || chatStore.state.currentSession?.id || 0)
  if (!activeSessionId) {
    uni.showToast({
      title: '会话参数丢失，请重新进入',
      icon: 'none',
    })
    return
  }
  try {
    await chatStore.sendMessage(activeSessionId, draft.value, selectedMentions.value)
    draft.value = ''
    selectedMentions.value = []
    scrollToBottom()
  } catch (error) {
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none',
    })
  }
}

const loadMore = async () => {
  const activeSessionId = Number(sessionId.value || chatStore.state.currentSession?.id || 0)
  if (!activeSessionId) {
    return
  }
  await chatStore.loadMoreMessages(activeSessionId)
}

const clearMessages = async () => {
  const activeSessionId = Number(sessionId.value || chatStore.state.currentSession?.id || 0)
  if (!activeSessionId) {
    return
  }
  await chatStore.clearSession(activeSessionId)
  showActions.value = false
}

const deleteSession = async () => {
  const activeSessionId = Number(sessionId.value || chatStore.state.currentSession?.id || 0)
  if (!activeSessionId) {
    return
  }
  await chatStore.deleteSession(activeSessionId)
  showActions.value = false
  goBack()
}

const goBack = () => {
  uni.navigateBack()
}

const scrollToBottom = async () => {
  await nextTick()
  scrollIntoView.value = ''
  await nextTick()
  scrollIntoView.value = 'message-bottom'
}
</script>

<style lang="scss" scoped>
.session-page {
  min-height: 100vh;
  background: #eef2f7;
  padding-bottom: calc(156rpx + var(--safe-bottom));
}

.composer,
.sheet-item {
  display: flex;
  align-items: center;
}

.back-btn,
.more-btn,
.mention-trigger,
.send-btn {
  flex-shrink: 0;
}

.back-btn,
.more-btn {
  width: 72rpx;
  text-align: center;
  font-size: 42rpx;
}

.session-info {
  flex: 1;
  text-align: center;
}

.session-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #0f172a;
}

.session-subtitle,
.sender-name,
.sheet-meta,
.list-tip text {
  font-size: 24rpx;
  color: #64748b;
}

.message-list {
  height: calc(100vh - var(--status-bar-height) - var(--toolbar-height) - 128rpx - var(--safe-bottom));
  margin-top: 0;
  padding: 24rpx 24rpx 40rpx;
  width: auto;
  box-sizing: border-box;
}

.message-row {
  display: flex;
  margin-bottom: 18rpx;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 76%;
  background: #fff;
  border-radius: 22rpx;
  padding: 18rpx 22rpx;
}

.message-row.user .message-bubble {
  background: #0f766e;
}

.message-content {
  color: #0f172a;
  white-space: pre-wrap;
}

.message-row.user .message-content {
  color: #fff;
}

.mention-row {
  margin-top: 12rpx;
}

.mention-tag {
  display: inline-block;
  margin-right: 10rpx;
  color: #0f766e;
  font-size: 22rpx;
}

.composer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  padding-top: 14rpx;
  padding-right: 20rpx;
  padding-bottom: calc(14rpx + var(--safe-bottom));
  padding-left: 20rpx;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  border-top: 1rpx solid rgba(148, 163, 184, 0.18);
}

.composer > view + view,
.composer > textarea + view {
  margin-left: 16rpx;
}

.mention-trigger,
.send-btn {
  min-height: 84rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: #dff7f3;
  color: #115e59;
  display: flex;
  align-items: center;
  justify-content: center;
}

.composer-input {
  flex: 1;
  min-height: 84rpx;
  max-height: 132rpx;
  background: #f8fafc;
  border-radius: 18rpx;
  padding: 18rpx 20rpx;
  line-height: 1.45;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding-top: 28rpx;
  padding-right: 24rpx;
  padding-bottom: calc(28rpx + var(--safe-bottom));
  padding-left: 24rpx;
}

.sheet-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.sheet-item {
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 2rpx solid #eef2f7;
}

.sheet-item.danger {
  color: #b91c1c;
}

.list-tip,
.bottom-space {
  text-align: center;
  padding: 12rpx 0;
}
</style>
