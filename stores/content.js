/**
 * 内容状态管理
 */
import { reactive } from 'vue'
import { contentApi, moldApi } from '@/api/index'

const state = reactive({
  molds: {
    list: [],
    single: []
  },
  currentMold: null,
  contents: {
    items: [],
    meta: {
      current_page: 1,
      total: 0,
      per_page: 20,
      last_page: 1
    }
  },
  currentContent: null,
  loading: false,
  error: null
})

export const useContentStore = () => {
  // 获取模型列表
  const fetchMolds = async (projectPrefix) => {
    state.loading = true
    state.error = null
    
    try {
      const data = await moldApi.getList(projectPrefix)
      state.molds.list = data.content_list || []
      state.molds.single = data.content_single || []
      return state.molds
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 设置当前模型
  const setCurrentMold = (mold) => {
    state.currentMold = mold
  }

  // 获取内容列表
  const fetchContents = async (params) => {
    state.loading = true
    state.error = null

    try {
      const data = await contentApi.getList(params)

      if (params.page === 1) {
        state.contents.items = data.items || data || []
      } else {
        state.contents.items = [...state.contents.items, ...(data.items || data || [])]
      }

      if (data.meta) {
        state.contents.meta = data.meta
      }

      if (data.field_labels) {
        state.contents.field_labels = data.field_labels
      }

      return state.contents
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 获取内容详情
  const fetchContentDetail = async (params) => {
    state.loading = true
    state.error = null
    
    try {
      const data = await contentApi.getDetail(params)
      state.currentContent = data
      return data
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 获取单页内容
  const fetchSubject = async (projectPrefix, tableName) => {
    state.loading = true
    state.error = null
    
    try {
      const data = await contentApi.getSubject(projectPrefix, tableName)
      state.currentContent = data
      return data
    } catch (e) {
      state.error = e.message
      throw e
    } finally {
      state.loading = false
    }
  }

  // 加载更多
  const loadMore = async (params) => {
    if (state.contents.meta.current_page >= state.contents.meta.last_page) {
      return false
    }
    
    await fetchContents({
      ...params,
      page: state.contents.meta.current_page + 1
    })
    
    return true
  }

  // 是否有更多
  const hasMore = () => {
    return state.contents.meta.current_page < state.contents.meta.last_page
  }

  // 清空内容
  const clearContents = () => {
    state.contents.items = []
    state.contents.meta = {
      current_page: 1,
      total: 0,
      per_page: 20,
      last_page: 1
    }
  }

  // 清空当前内容
  const clearCurrentContent = () => {
    state.currentContent = null
  }

  return {
    state,
    fetchMolds,
    setCurrentMold,
    fetchContents,
    fetchContentDetail,
    fetchSubject,
    loadMore,
    hasMore,
    clearContents,
    clearCurrentContent
  }
}
