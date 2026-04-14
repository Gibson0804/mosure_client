/**
 * 认证状态管理
 */
import { reactive } from 'vue'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import request from '@/utils/request'
import { authApi } from '@/api/index'
import { useChat } from '@/stores/chat'

const state = reactive({
  serverUrl: '',
  serverHistory: [],
  token: '',
  clientType: '',
  clientSessionKey: '',
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null
})

const detectClientType = () => {
  const platform = uni.getSystemInfoSync().platform
  return platform === 'web' ? 'h5' : 'app'
}

export const useAuthStore = () => {
  // 初始化
  const init = () => {
    state.serverUrl = storage.get(STORAGE_KEYS.SERVER_URL, '')
    state.serverHistory = storage.get(STORAGE_KEYS.SERVER_HISTORY, [])
    state.token = storage.get(STORAGE_KEYS.TOKEN, '')
    state.clientType = storage.get(STORAGE_KEYS.CLIENT_TYPE, detectClientType())
    state.clientSessionKey = storage.get(STORAGE_KEYS.CLIENT_SESSION_KEY, '')
    state.user = storage.get(STORAGE_KEYS.USER, null)
    state.isLoggedIn = !!(state.token && state.clientSessionKey)
    
    request.init()
  }

  // 设置服务器地址
  const setServerUrl = (url) => {
    url = normalizeUrl(url)
    state.serverUrl = url
    request.setBaseUrl(url)
  }

  // 规范化 URL
  const normalizeUrl = (url) => {
    url = url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    return url.replace(/\/+$/, '')
  }

  // 添加服务器历史
  const addServerHistory = (url, username) => {
    url = normalizeUrl(url)
    const history = state.serverHistory.filter(item => item.url !== url)
    const existing = state.serverHistory.find(item => item.url === url)
    history.unshift({
      url,
      username: username || existing?.username || '',
      lastUsed: new Date().toISOString()
    })
    state.serverHistory = history.slice(0, 10)
    storage.set(STORAGE_KEYS.SERVER_HISTORY, state.serverHistory)
  }

  // 删除服务器历史
  const removeServerHistory = (url) => {
    state.serverHistory = state.serverHistory.filter(item => item.url !== url)
    storage.set(STORAGE_KEYS.SERVER_HISTORY, state.serverHistory)
  }

  // 切换服务器并清理当前登录态
  const switchServer = async (url) => {
    setServerUrl(url)
    addServerHistory(url)
    await logout()
  }

  // 登录
  const login = async (email, password, clientType = detectClientType()) => {
    state.loading = true
    state.error = null
    
    try {
      const data = await authApi.login(email, password, clientType)
      
      state.token = data.token
      state.clientType = data.client_type
      state.clientSessionKey = data.session_key
      state.user = data.user
      state.isLoggedIn = true
      
      request.setToken(data.token)
      request.setClientSession(data.client_type, data.session_key)
      storage.set(STORAGE_KEYS.TOKEN, data.token)
      storage.set(STORAGE_KEYS.CLIENT_TYPE, data.client_type)
      storage.set(STORAGE_KEYS.CLIENT_SESSION_KEY, data.session_key)
      storage.set(STORAGE_KEYS.USER, data.user)
      
      addServerHistory(state.serverUrl, email)
      
      return data
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 二维码登录
  const qrLogin = async (token, clientType = detectClientType()) => {
    state.loading = true
    state.error = null
    
    try {
      const data = await authApi.qrLogin(token, clientType)
      
      state.token = data.token
      state.clientType = data.client_type
      state.clientSessionKey = data.session_key
      state.user = data.user
      state.isLoggedIn = true
      
      request.setToken(data.token)
      request.setClientSession(data.client_type, data.session_key)
      storage.set(STORAGE_KEYS.TOKEN, data.token)
      storage.set(STORAGE_KEYS.CLIENT_TYPE, data.client_type)
      storage.set(STORAGE_KEYS.CLIENT_SESSION_KEY, data.session_key)
      storage.set(STORAGE_KEYS.USER, data.user)
      
      return data
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    
    state.token = ''
    state.clientType = detectClientType()
    state.clientSessionKey = ''
    state.user = null
    state.isLoggedIn = false
    
    request.clearToken()
    request.clearClientSession()
    storage.remove(STORAGE_KEYS.USER)
    storage.remove(STORAGE_KEYS.CURRENT_PROJECT)
    useChat().disconnectRealtime()
  }

  // 检查登录状态
  const checkAuth = async () => {
    if (!state.token || !state.clientSessionKey) {
      return false
    }
    
    try {
      const user = await authApi.getMe()
      state.user = user
      storage.set(STORAGE_KEYS.USER, user)
      return true
    } catch (e) {
      state.isLoggedIn = false
      return false
    }
  }

  return {
    state,
    init,
    setServerUrl,
    normalizeUrl,
    addServerHistory,
    removeServerHistory,
    switchServer,
    detectClientType,
    login,
    qrLogin,
    logout,
    checkAuth
  }
}
