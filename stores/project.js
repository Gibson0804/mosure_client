/**
 * 项目状态管理
 */
import { reactive } from 'vue'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import { projectApi } from '@/api/index'

const state = reactive({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  lastFetched: null
})

export const useProjectStore = () => {
  // 初始化
  const init = () => {
    state.currentProject = storage.get(STORAGE_KEYS.CURRENT_PROJECT, null)
  }

  // 获取项目列表
  const fetchProjects = async () => {
    state.loading = true
    state.error = null
    
    try {
      const data = await projectApi.getList()
      state.projects = (data || []).map(project => ({
        ...project,
        unread_count: Number(project.unread_count || 0)
      }))
      state.lastFetched = new Date().toISOString()
      return state.projects
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 设置当前项目
  const setCurrentProject = (project) => {
    state.currentProject = project
    storage.set(STORAGE_KEYS.CURRENT_PROJECT, project)
  }

  // 清除当前项目
  const clearCurrentProject = () => {
    state.currentProject = null
    storage.remove(STORAGE_KEYS.CURRENT_PROJECT)
  }

  // 搜索项目
  const searchProjects = (keyword) => {
    if (!keyword) return state.projects
    
    const lowerKeyword = keyword.toLowerCase()
    return state.projects.filter(project => 
      project.name.toLowerCase().includes(lowerKeyword) ||
      project.prefix.toLowerCase().includes(lowerKeyword) ||
      (project.description && project.description.toLowerCase().includes(lowerKeyword))
    )
  }

  // 判断项目是否有前端插件
  const hasFrontendPlugin = (project) => {
    return !!project.template
  }

  // 获取前端页面 URL
  const getFrontendUrl = (project, serverUrl) => {
    if (!project.template) return ''
    return `${serverUrl}/web/${project.prefix}`
  }

  return {
    state,
    init,
    fetchProjects,
    setCurrentProject,
    clearCurrentProject,
    searchProjects,
    hasFrontendPlugin,
    getFrontendUrl
  }
}
