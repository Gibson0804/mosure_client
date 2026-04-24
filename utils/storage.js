/**
 * 本地存储工具
 */

const STORAGE_KEYS = {
  TOKEN: 'mosure_token',
  CLIENT_TYPE: 'mosure_client_type',
  CLIENT_SESSION_KEY: 'mosure_client_session_key',
  USER: 'mosure_user',
  SERVER_URL: 'mosure_server_url',
  SERVER_HISTORY: 'mosure_server_history',
  CURRENT_PROJECT: 'mosure_current_project',
  CHAT_DRAFT: 'mosure_chat_draft',
  CHAT_SESSION_CONTEXT: 'mosure_chat_session_context'
}

export const storage = {
  set(key, value) {
    try {
      uni.setStorageSync(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage set error:', e)
    }
  },

  get(key, defaultValue = null) {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  remove(key) {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      console.error('Storage remove error:', e)
    }
  },

  clear() {
    Object.values(STORAGE_KEYS).forEach(key => {
      uni.removeStorageSync(key)
    })
  }
}

export { STORAGE_KEYS }
export default storage
