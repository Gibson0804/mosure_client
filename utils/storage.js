/**
 * 本地存储工具
 */

const STORAGE_KEYS = {
  TOKEN: 'hcms_token',
  CLIENT_TYPE: 'hcms_client_type',
  CLIENT_SESSION_KEY: 'hcms_client_session_key',
  USER: 'hcms_user',
  SERVER_URL: 'hcms_server_url',
  SERVER_HISTORY: 'hcms_server_history',
  CURRENT_PROJECT: 'hcms_current_project',
  CHAT_DRAFT: 'hcms_chat_draft',
  CHAT_SESSION_CONTEXT: 'hcms_chat_session_context'
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
