import { reactive } from 'vue'
import { chatAgentApi, chatSessionApi } from '@/api/index'
import { storage, STORAGE_KEYS } from '@/utils/storage'

const POLLING_INTERVAL = 2000

const state = reactive({
  project: null,
  agents: [],
  sessions: [],
  currentSession: null,
  messages: [],
  loadingAgents: false,
  loadingSessions: false,
  loadingMessages: false,
  loadingMore: false,
  sending: false,
  hasMoreMessages: true,
  lastMessageId: 0,
  oldestMessageId: 0,
  drafts: {},
})

let pollingTimer = null
let activeSessionId = 0

const sessionDraftKey = (sessionId) => `chat_draft_${sessionId}`

const normalizeAgent = (agent = {}) => ({
  id: agent.id,
  type: agent.type,
  identifier: agent.identifier,
  name: agent.name || '未命名成员',
  avatar: agent.avatar || '',
  description: agent.description || '',
  enabled: agent.enabled !== false,
  project_id: agent.project_id || null
})

const normalizeSession = (session = {}) => ({
  id: session.id,
  project_id: session.project_id || null,
  title: session.title || '未命名会话',
  avatar: session.avatar || '',
  session_type: session.session_type || 'private',
  member_ids: Array.isArray(session.member_ids) ? session.member_ids : [],
  is_default: !!session.is_default,
  last_message_at: session.last_message_at || '',
  message_count: Number(session.message_count || 0),
  unread_count: Number(session.unread_count || 0),
  last_read_message_id: Number(session.last_read_message_id || 0),
  last_message_preview: session.last_message_preview || '',
  agent_type: session.agent_type || '',
  agent_identifier: session.agent_identifier || '',
  agent_name: session.agent_name || ''
})

const normalizeMessage = (message = {}) => ({
  id: Number(message.id || 0),
  session_id: Number(message.session_id || 0),
  role: message.role || (message.sender_type === 'user' ? 'user' : 'assistant'),
  sender_type: message.sender_type || 'user',
  sender_name: message.sender_name || (message.sender_type === 'user' ? '我' : 'AI'),
  content: message.content || '',
  mentions: Array.isArray(message.mentions) ? message.mentions : [],
  created_at: message.created_at || '',
  status: typeof message.status === 'number' ? message.status : null
})

const replaceSession = (session) => {
  const normalized = normalizeSession(session)
  const index = state.sessions.findIndex(item => item.id === normalized.id)
  if (index === -1) {
    state.sessions.unshift(normalized)
  } else {
    state.sessions.splice(index, 1, normalized)
  }
  state.sessions.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
  if (state.currentSession && state.currentSession.id === normalized.id) {
    state.currentSession = normalized
  }
  return normalized
}

const replaceProjectSessions = (projectId, sessions) => {
  const otherSessions = state.sessions.filter(item => Number(item.project_id) !== Number(projectId))
  state.sessions = [
    ...otherSessions,
    ...(sessions || []).map(normalizeSession),
  ].sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))

  if (state.currentSession) {
    state.currentSession = state.sessions.find(item => item.id === state.currentSession.id) || state.currentSession
  }
}

const upsertMessage = (message) => {
  const normalized = normalizeMessage(message)
  if (!normalized.id) {
    return null
  }

  const index = state.messages.findIndex(item => item.id === normalized.id)
  if (index === -1) {
    state.messages.push(normalized)
    state.messages.sort((a, b) => a.id - b.id)
  } else {
    state.messages.splice(index, 1, {
      ...state.messages[index],
      ...normalized,
    })
  }

  state.lastMessageId = Math.max(state.lastMessageId, normalized.id)
  state.oldestMessageId = state.messages[0]?.id || 0
  return normalized
}

const clearActiveSession = () => {
  activeSessionId = 0
  stopPolling()
  state.currentSession = null
  state.messages = []
  state.hasMoreMessages = true
  state.lastMessageId = 0
  state.oldestMessageId = 0
}

const resolveProjectPrefix = (projectId = 0) => {
  const numericProjectId = Number(projectId || 0)
  if (!numericProjectId) {
    return state.project?.prefix || storage.get(STORAGE_KEYS.CURRENT_PROJECT, null)?.prefix || ''
  }

  if (Number(state.project?.id || 0) === numericProjectId && state.project?.prefix) {
    return state.project.prefix
  }

  const storedProject = storage.get(STORAGE_KEYS.CURRENT_PROJECT, null)
  if (Number(storedProject?.id || 0) === numericProjectId && storedProject?.prefix) {
    return storedProject.prefix
  }

  return ''
}

const resolveSessionProjectPrefix = (sessionId = 0) => {
  const session = state.sessions.find(item => Number(item.id) === Number(sessionId))
  return resolveProjectPrefix(session?.project_id || state.project?.id || 0)
}

const startPolling = (sessionId) => {
  stopPolling()
  pollingTimer = setInterval(async () => {
    try {
      await pollMessages(sessionId)
    } catch (error) {
      console.error('poll messages failed', error)
    }
  }, POLLING_INTERVAL)
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

const pollMessages = async (sessionId) => {
  const data = await chatSessionApi.poll(sessionId, state.lastMessageId, resolveSessionProjectPrefix(sessionId))
  const items = (data.items || data.messages || []).map(normalizeMessage)
  if (!items.length) {
    return []
  }

  items.forEach(item => {
    upsertMessage(item)
  })

  if (state.currentSession) {
    replaceSession({
      ...state.currentSession,
      unread_count: 0,
      last_read_message_id: state.lastMessageId
    })
  }

  return items
}

export const useChat = () => {
  const setProjectContext = (project) => {
    state.project = project || null
    clearActiveSession()
  }

  const loadAgents = async (projectId) => {
    state.loadingAgents = true
    try {
      const data = await chatAgentApi.list(projectId)
      state.agents = (data.items || []).map(normalizeAgent)
      return state.agents
    } finally {
      state.loadingAgents = false
    }
  }

  const loadSessions = async (projectId) => {
    state.loadingSessions = true
    try {
      const data = await chatSessionApi.list(projectId, resolveProjectPrefix(projectId))
      replaceProjectSessions(projectId, data.items || [])
      return state.sessions
    } finally {
      state.loadingSessions = false
    }
  }

  const ensureProjectGroupSession = async (projectId) => {
    const data = await chatSessionApi.ensureProjectGroup(projectId)
    const session = replaceSession(data.item)
    return session
  }

  const ensurePrivateSession = async (projectId, agent) => {
    const data = await chatSessionApi.startPrivateChat(projectId, agent.type, agent.identifier)
    const session = replaceSession(data.item)
    return session
  }

  const loadMessages = async (sessionId, lastId = 0, limit = 20) => {
    state.loadingMessages = true
    try {
      const data = await chatSessionApi.getMessages(sessionId, lastId, limit, resolveSessionProjectPrefix(sessionId))
      const items = (data.items || []).map(normalizeMessage)
      state.messages = items
      state.lastMessageId = data.last_id || (items.length ? items[items.length - 1].id : 0)
      state.oldestMessageId = items[0]?.id || 0
      state.hasMoreMessages = items.length >= limit
      return items
    } finally {
      state.loadingMessages = false
    }
  }

  const openSession = async (sessionId) => {
    stopPolling()
    activeSessionId = Number(sessionId)
    const existing = state.sessions.find(item => item.id === activeSessionId)
    state.currentSession = existing || null
    try {
      await loadMessages(activeSessionId, 0, 20)
    } catch (error) {
      state.currentSession = null
      state.messages = []
      state.lastMessageId = 0
      state.oldestMessageId = 0
      state.hasMoreMessages = false
      throw error
    }
    if (state.currentSession) {
      replaceSession({
        ...state.currentSession,
        unread_count: 0,
        last_read_message_id: state.lastMessageId
      })
    }

    startPolling(activeSessionId)
  }

  const loadMoreMessages = async (sessionId, limit = 20) => {
    if (!state.oldestMessageId || state.loadingMore || !state.hasMoreMessages) {
      return []
    }
    state.loadingMore = true
    try {
      const data = await chatSessionApi.getMessages(
        sessionId,
        0,
        Math.max(limit, state.messages.length + limit),
        resolveSessionProjectPrefix(sessionId)
      )
      const items = (data.items || []).map(normalizeMessage)
      state.hasMoreMessages = items.length > state.messages.length
      state.messages = items
      state.oldestMessageId = items[0]?.id || 0
      state.lastMessageId = data.last_id || (items.length ? items[items.length - 1].id : state.lastMessageId)
      return items
    } finally {
      state.loadingMore = false
    }
  }

  const sendMessage = async (sessionId, content, mentions = []) => {
    const value = (content || '').trim()
    if (!value) {
      return null
    }

    state.sending = true
    try {
      const result = await chatSessionApi.sendMessage(sessionId, value, mentions, resolveSessionProjectPrefix(sessionId))
      await pollMessages(sessionId)

      const session = state.sessions.find(item => item.id === Number(sessionId))
      if (session) {
        replaceSession({
          ...session,
          last_message_at: result.created_at,
          last_message_preview: value,
          message_count: session.message_count + 1
        })
      }
      saveDraft(sessionId, '')
      return result
    } finally {
      state.sending = false
    }
  }

  const sendToProjectGroup = async (projectId, content) => {
    const session = await ensureProjectGroupSession(projectId)
    await sendMessage(session.id, content, [])
    return session
  }

  const deleteSession = async (sessionId) => {
    await chatSessionApi.delete(sessionId, resolveSessionProjectPrefix(sessionId))
    state.sessions = state.sessions.filter(item => item.id !== Number(sessionId))
    if (state.currentSession?.id === Number(sessionId)) {
      state.currentSession = null
      state.messages = []
      activeSessionId = 0
      stopPolling()
    }
  }

  const clearSession = async (sessionId) => {
    await chatSessionApi.clearMessages(sessionId, resolveSessionProjectPrefix(sessionId))
    if (state.currentSession?.id === Number(sessionId)) {
      state.messages = []
      state.lastMessageId = 0
      state.oldestMessageId = 0
      state.hasMoreMessages = false
    }
    const session = state.sessions.find(item => item.id === Number(sessionId))
    if (session) {
      replaceSession({
        ...session,
        last_message_preview: '',
        message_count: 0
      })
    }
  }

  const saveDraft = (sessionId, content) => {
    const key = String(sessionId)
    state.drafts[key] = content
    storage.set(sessionDraftKey(sessionId), content)
  }

  const getDraft = (sessionId) => {
    const key = String(sessionId)
    if (typeof state.drafts[key] === 'string') {
      return state.drafts[key]
    }
    const stored = storage.get(sessionDraftKey(sessionId), '')
    state.drafts[key] = stored
    return stored
  }

  const disconnectRealtime = () => {
    clearActiveSession()
  }

  const leaveSession = (sessionId = 0, draft = '') => {
    if (sessionId) {
      saveDraft(sessionId, draft)
    }
    clearActiveSession()
  }

  return {
    state,
    setProjectContext,
    loadAgents,
    loadSessions,
    ensureProjectGroupSession,
    ensurePrivateSession,
    openSession,
    loadMessages,
    loadMoreMessages,
    pollMessages,
    stopPolling,
    sendMessage,
    sendToProjectGroup,
    deleteSession,
    clearSession,
    saveDraft,
    getDraft,
    leaveSession,
    disconnectRealtime,
  }
}
