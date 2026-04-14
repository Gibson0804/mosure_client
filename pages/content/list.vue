<template>
  <view class="content-list-page">
    <!-- 内容列表 -->
    <scroll-view 
      class="content-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 加载中 -->
      <view v-if="loading && contentList.length === 0" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-else-if="contentList.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无内容</text>
      </view>
      
      <!-- 内容列表 -->
      <view v-else class="content-items">
        <view 
          v-for="item in contentList" 
          :key="item.id"
          class="content-item"
          @click="openDetail(item)"
        >
          <view class="item-header">
            <text class="item-id">#{{ item.id }}</text>
            <text class="item-title">{{ getItemTitle(item) }}</text>
          </view>
          <view class="item-preview">
            <text>{{ getItemPreview(item) }}</text>
          </view>
          <view class="item-footer">
            <text class="item-time">{{ formatDate(item.updated_at || item.created_at) }}</text>
            <text class="arrow">→</text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore && contentList.length > 0" class="load-more">
        <text v-if="loadingMore">加载中...</text>
        <text v-else>上拉加载更多</text>
      </view>
      
      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { formatDate as formatDateUtil } from '@/utils/date'

const contentStore = useContentStore()

const projectPrefix = ref('')
const tableName = ref('')
const moldId = ref('')
const moldName = ref('')

const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)

const contentList = computed(() => contentStore.state.contents.items)
const hasMore = computed(() => contentStore.hasMore())
const fieldLabels = computed(() => contentStore.state.contents.field_labels || {})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  projectPrefix.value = options.projectPrefix || ''
  tableName.value = options.tableName || ''
  moldId.value = options.moldId || ''
  moldName.value = decodeURIComponent(options.moldName || '')
  
  if (moldName.value) {
    uni.setNavigationBarTitle({ title: moldName.value })
  }
  
  loadContents(true)
})

const loadContents = async (isRefresh = false) => {
  if (!projectPrefix.value || !tableName.value) return
  
  if (isRefresh) {
    contentStore.clearContents()
  }
  
  loading.value = true
  
  try {
    await contentStore.fetchContents({
      project_prefix: projectPrefix.value,
      table_name: tableName.value,
      page: 1,
      per_page: 20
    })
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await loadContents(true)
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  
  loadingMore.value = true
  
  try {
    await contentStore.loadMore({
      project_prefix: projectPrefix.value,
      table_name: tableName.value,
      per_page: 20
    })
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loadingMore.value = false
  }
}

const getItemTitle = (item) => {
  return item.title || item.name || item.label || `记录 ${item.id}`
}

const getItemPreview = (item) => {
  const excludeKeys = ['id', 'title', 'name', 'label', 'created_by', 'updated_by', 'content_status', 'created_at', 'updated_at', 'deleted_at']
  const previewFields = Object.keys(item)
    .filter(key => !excludeKeys.includes(key))
    .slice(0, 3)
  
  return previewFields
    .map(key => {
      let value = item[key]
      if (typeof value === 'object') value = JSON.stringify(value)
      if (typeof value === 'string' && value.length > 30) {
        value = value.substring(0, 30) + '...'
      }
      const label = fieldLabels.value[key] || key
      return `${label}: ${value}`
    })
    .join(' | ')
}

const openDetail = (item) => {
  uni.navigateTo({
    url: `/pages/content/detail?projectPrefix=${projectPrefix.value}&tableName=${tableName.value}&contentId=${item.id}&moldName=${encodeURIComponent(moldName.value)}`
  })
}

const formatDate = (dateStr) => {
  return formatDateUtil(dateStr, 'YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.content-list-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: calc(var(--safe-top) + var(--app-top-offset));
}

.content-list {
  height: 100vh;
  padding: 24rpx 32rpx;
  width: auto;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  
  .loading-spinner {
    width: 64rpx;
    height: 64rpx;
    border: 4rpx solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 24rpx;
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #64748b;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  
  .empty-icon {
    font-size: 96rpx;
    margin-bottom: 24rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #64748b;
  }
}

// 内容项
.content-items {
  padding-top: 8rpx;
}

.content-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  
  .item-header {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
    
    .item-id {
      font-size: 22rpx;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 4rpx 12rpx;
      border-radius: 6rpx;
      margin-right: 16rpx;
    }
    
    .item-title {
      flex: 1;
      font-size: 30rpx;
      font-weight: 500;
      color: #1e293b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .item-preview {
    margin-bottom: 16rpx;
    
    text {
      font-size: 26rpx;
      color: #64748b;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16rpx;
    border-top: 2rpx solid #f1f5f9;
    
    .item-time {
      font-size: 22rpx;
      color: #94a3b8;
    }
    
    .arrow {
      font-size: 28rpx;
      color: #94a3b8;
    }
  }
}

// 加载更多
.load-more {
  text-align: center;
  padding: 32rpx 0;
  
  text {
    font-size: 26rpx;
    color: #94a3b8;
  }
}

// 底部安全区
.safe-bottom {
  height: calc(var(--safe-bottom) + 20rpx);
}
</style>
