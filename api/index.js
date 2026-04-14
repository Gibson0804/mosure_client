/**
 * API 接口封装
 */
import request from '@/utils/request'

// 认证相关
export const authApi = {
  login(email, password, clientType = 'app') {
    return request.post('/client/auth/login', { email, password, client_type: clientType })
  },
  
  qrLogin(token, clientType = 'app') {
    return request.post('/client/auth/qr_login', { token, client_type: clientType })
  },
  
  logout() {
    return request.post('/client/auth/logout')
  },
  
  getMe() {
    return request.get('/client/me')
  },
}

// 项目相关
export const projectApi = {
  getList() {
    return request.get('/client/projects')
  }
}

export const chatAgentApi = {
  list(projectId) {
    return request.get('/client/ai/agents', { project_id: projectId })
  }
}

export const chatSessionApi = {
  list(projectId, projectPrefix = '') {
    const options = projectPrefix
      ? { headers: { 'X-Project-Prefix': projectPrefix } }
      : {}
    return request.get('/client/ai/sessions', { project_id: projectId }, options)
  },

  ensureProjectGroup(projectId) {
    return request.post('/client/ai/sessions/project-group', { project_id: projectId })
  },

  startPrivateChat(projectId, type, identifier) {
    return request.post(`/client/ai/agents/${type}/${identifier}/private-chat`, { project_id: projectId })
  },

  getMessages(sessionId, lastId = 0, limit = 20, projectPrefix = '') {
    const options = projectPrefix
      ? { headers: { 'X-Project-Prefix': projectPrefix } }
      : {}
    return request.get(`/client/ai/sessions/${sessionId}/messages`, { last_id: lastId, limit, mark_read: 1 }, options)
  },

  poll(sessionId, lastId = 0, projectPrefix = '') {
    const options = projectPrefix
      ? { headers: { 'X-Project-Prefix': projectPrefix } }
      : {}
    return request.get(`/client/ai/sessions/${sessionId}/poll`, { last_id: lastId, mark_read: 1 }, options)
  },

  sendMessage(sessionId, content, mentions = [], projectPrefix = '') {
    const options = projectPrefix
      ? { headers: { 'X-Project-Prefix': projectPrefix } }
      : {}
    return request.post(`/client/ai/sessions/${sessionId}/messages`, { content, mentions }, options)
  },

  delete(sessionId, projectPrefix = '') {
    const options = projectPrefix
      ? { headers: { 'X-Project-Prefix': projectPrefix } }
      : {}
    return request.delete(`/client/ai/sessions/${sessionId}`, null, options)
  },

  clearMessages(sessionId, projectPrefix = '') {
    const options = projectPrefix
      ? { headers: { 'X-Project-Prefix': projectPrefix } }
      : {}
    return request.delete(`/client/ai/sessions/${sessionId}/messages`, null, options)
  }
}

// 内容相关
export const contentApi = {
  getList(params) {
    return request.get('/client/content/list', params)
  },
  
  getDetail(params) {
    return request.get('/client/content/detail', params)
  },
  
  getSubject(projectPrefix, tableName) {
    return request.get('/client/content/subject', { project_prefix: projectPrefix, table_name: tableName })
  }
}

// 模型相关
export const moldApi = {
  getList(projectPrefix) {
    return request.get('/client/molds', { project_prefix: projectPrefix })
  }
}

// 云函数相关
export const functionApi = {
  getWebList(params) {
    return request.get('/client/web_functions', params)
  }
}

// 定时任务相关
export const cronApi = {
  getList(params) {
    return request.get('/client/crons', params)
  }
}

// 知识库相关
export const kbApi = {
  getCategoryTree() {
    return request.get('/client/kb/categories/tree')
  },

  createCategory(data) {
    return request.post('/client/kb/categories/create', data)
  },

  updateCategory(id, data) {
    return request.post(`/client/kb/categories/update/${id}`, data)
  },

  deleteCategory(id) {
    return request.post(`/client/kb/categories/delete/${id}`)
  },

  getArticleList(params) {
    return request.get('/client/kb/articles/list', params)
  },

  getArticleDetail(id) {
    return request.get(`/client/kb/articles/detail/${id}`)
  },

  createArticle(data) {
    return request.post('/client/kb/articles/create', data)
  },

  updateArticle(id, data) {
    return request.post(`/client/kb/articles/update/${id}`, data)
  },

  deleteArticle(id) {
    return request.post(`/client/kb/articles/delete/${id}`)
  },

  toggleArticle(id) {
    return request.post(`/client/kb/articles/toggle/${id}`)
  },

  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      const baseUrl = request.baseUrl
      const token = request.token
      uni.uploadFile({
        url: `${baseUrl}/client/kb/upload-image`,
        filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data.data)
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        },
        fail: (err) => {
          reject(new Error('上传失败，请检查网络'))
        }
      })
    })
  }
}
