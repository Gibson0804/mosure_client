/**
 * 网络请求封装
 */
import { storage, STORAGE_KEYS } from './storage'

class Request {
  constructor() {
    this.baseUrl = ''
    this.token = ''
    this.clientType = ''
    this.clientSessionKey = ''
  }

  init() {
    this.baseUrl = storage.get(STORAGE_KEYS.SERVER_URL, '')
    this.token = storage.get(STORAGE_KEYS.TOKEN, '')
    this.clientType = storage.get(STORAGE_KEYS.CLIENT_TYPE, '')
    this.clientSessionKey = storage.get(STORAGE_KEYS.CLIENT_SESSION_KEY, '')
  }

  setBaseUrl(url) {
    this.baseUrl = url
    storage.set(STORAGE_KEYS.SERVER_URL, url)
  }

  setToken(token) {
    this.token = token
    storage.set(STORAGE_KEYS.TOKEN, token)
  }

  setClientSession(clientType, sessionKey) {
    this.clientType = clientType || ''
    this.clientSessionKey = sessionKey || ''
    storage.set(STORAGE_KEYS.CLIENT_TYPE, this.clientType)
    storage.set(STORAGE_KEYS.CLIENT_SESSION_KEY, this.clientSessionKey)
  }

  clearToken() {
    this.token = ''
    storage.remove(STORAGE_KEYS.TOKEN)
  }

  clearClientSession() {
    this.clientType = ''
    this.clientSessionKey = ''
    storage.remove(STORAGE_KEYS.CLIENT_TYPE)
    storage.remove(STORAGE_KEYS.CLIENT_SESSION_KEY)
  }

  getFullUrl(url) {
    if (url.startsWith('http')) {
      return url
    }
    return this.baseUrl + url
  }

  async request(options) {
    const { url, method = 'GET', data, headers = {}, showLoading = false } = options

    if (!this.baseUrl) {
      return Promise.reject(new Error('请先配置服务器地址'))
    }

    // 从存储中获取当前项目的 prefix
    const currentProject = storage.get(STORAGE_KEYS.CURRENT_PROJECT, null)
    const projectPrefix = currentProject?.prefix || ''

    if (showLoading) {
      uni.showLoading({ title: '加载中...', mask: true })
    }

    return new Promise((resolve, reject) => {
      const finalHeaders = {
        'Content-Type': 'application/json',
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        'X-Project-Prefix': projectPrefix,
        'X-Client-Type': this.clientType,
        'X-Client-Session': this.clientSessionKey,
        ...headers
      }

      uni.request({
        url: this.getFullUrl(url),
        method,
        data,
        header: finalHeaders,
        success: (res) => {
          if (showLoading) {
            uni.hideLoading()
          }

          if (res.statusCode === 401) {
            this.handleUnauthorized()
            reject(new Error('登录已过期，请重新登录'))
            return
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (res.data.code === 200) {
              resolve(res.data.data)
            } else {
              reject(new Error(res.data.message || '请求失败'))
            }
          } else {
            reject(new Error(res.data?.message || `请求失败: ${res.statusCode}`))
          }
        },
        fail: (err) => {
          if (showLoading) {
            uni.hideLoading()
          }
          console.error('Request failed:', err)
          reject(new Error('网络连接失败，请检查网络'))
        }
      })
    })
  }

  handleUnauthorized() {
    this.clearToken()
    this.clearClientSession()
    storage.remove(STORAGE_KEYS.USER)
    uni.reLaunch({ url: '/pages/login/login' })
  }

  get(url, params, options = {}) {
    return this.request({ url, method: 'GET', data: params, ...options })
  }

  post(url, data, options = {}) {
    return this.request({ url, method: 'POST', data, ...options })
  }

  delete(url, data, options = {}) {
    return this.request({ url, method: 'DELETE', data, ...options })
  }
}

const request = new Request()
export default request
